import { Request, Response } from 'express';
import { prisma } from '../db';
import { AuditLogService, AuditLogAction } from '../services/auditLog';
import { CacheService } from '../services/cache';
import { Permissions, hasPermission, computePermissions } from '../utils/permissions';
import { serializeBigInt } from '../utils/serializeBigInt';
import { z } from 'zod';

const CreateGuildSchema = z.object({
    name: z.string().min(2).max(100),
    icon: z.string().url().optional().nullable(),
    tags: z.array(z.string()).optional()
});

const CreateRoleSchema = z.object({
    name: z.string().min(1).max(100),
    color: z.string().optional().nullable(),
    permissions: z.union([z.string(), z.number()]).optional()
});

// Local stub — SocketService will be wired via gateway when available
const SocketService = { emitToRoom: (_room: string, _event: string, _data: unknown) => { } };

export class GuildController {
    static async createGuild(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            const { name, icon, tags } = CreateGuildSchema.parse(req.body);

            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            // Validate user exists in DB (prevents P2003 FK violation from orphaned tokens)
            const userExists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
            if (!userExists) {
                return res.status(400).json({ error: 'Your session has expired. Please log out and register again.' });
            }

            console.log(`[GUILD_CREATE] Starting guild creation for user: ${userId}`);
            const newGuild = await prisma.$transaction(async (tx: any) => {
                console.log(`[GUILD_CREATE] Step 1: Creating guild...`);
                const guild = await tx.guild.create({
                    data: {
                        name,
                        icon,
                        tags: tags || [],
                        ownerId: userId
                    }
                });
                console.log(`[GUILD_CREATE] Step 1: OK - Guild ID: ${guild.id}`);

                console.log(`[GUILD_CREATE] Step 2: Creating default channels...`);
                await tx.channel.createMany({
                    data: [
                        { name: 'general', type: 'TEXT', guildId: guild.id, position: 0 },
                        { name: 'General', type: 'VOICE', guildId: guild.id, position: 1 }
                    ]
                });
                console.log(`[GUILD_CREATE] Step 2: OK`);

                console.log(`[GUILD_CREATE] Step 3: Creating @everyone role...`);
                const everyoneRole = await tx.role.create({
                    data: {
                        name: '@everyone',
                        guildId: guild.id,
                        position: 0,
                        permissions: BigInt(0)
                    }
                });
                console.log(`[GUILD_CREATE] Step 3: OK - Role ID: ${everyoneRole.id}`);

                console.log(`[GUILD_CREATE] Step 4: Adding owner to guild...`);
                await tx.guildMember.create({
                    data: {
                        userId,
                        guildId: guild.id,
                        roles: {
                            connect: [{ id: everyoneRole.id }]
                        }
                    }
                });
                console.log(`[GUILD_CREATE] Step 4: OK`);

                const fullGuild = await tx.guild.findUnique({
                    where: { id: guild.id },
                    include: {
                        channels: true,
                        roles: true,
                        members: { include: { user: true } }
                    }
                });

                return fullGuild;
            }, { maxWait: 5000, timeout: 15000 });

            // BACKGROUND: Step 5: Auto-adding Official Beacon Bot (Outside transaction to prevent abortion)
            const SYSTEM_BOT_ID = 'BEACON_SYSTEM_BOT';
            prisma.user.findUnique({ where: { id: SYSTEM_BOT_ID } }).then(bot => {
                if (bot) {
                    const everyoneRole = (newGuild as any).roles.find((r: any) => r.name === '@everyone');
                    prisma.guildMember.create({
                        data: {
                            userId: SYSTEM_BOT_ID,
                            guildId: newGuild.id,
                            nickname: 'Beacon Bot',
                            roles: everyoneRole ? { connect: [{ id: everyoneRole.id }] } : undefined
                        }
                    }).catch(e => console.warn(`[GUILD_CREATE] Background bot add failed:`, e.message));
                }
            }).catch(() => { });

            await AuditLogService.log(newGuild.id, userId, AuditLogAction.GUILD_UPDATE, { name: 'Guild Created' });

            const serializedGuild = serializeBigInt(newGuild);

            res.status(201).json(serializedGuild);
        } catch (error) {
            console.error('Create Guild Error:', error);
            res.status(500).json({ error: 'Failed to create guild' });
        }
    }

    static async getMemberGuilds(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const memberships = await prisma.guildMember.findMany({
                where: { userId },
                include: {
                    guild: {
                        include: {
                            _count: {
                                select: { members: true }
                            }
                        }
                    },
                    roles: true
                }
            });

            const guilds = memberships.map((m: any) => ({
                ...m.guild,
                memberCount: m.guild._count.members,
                roles: m.roles
            }));

            const serializedGuilds = serializeBigInt(guilds);

            res.json(serializedGuilds);
        } catch (error) {
            console.error('[GET_MEMBER_GUILDS]', error);
            res.status(500).json({ error: 'Failed to fetch guilds' });
        }
    }

    static async updateGuild(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, icon, banner, description } = req.body;
            const userId = req.user?.id;

            const guild = await prisma.guild.update({
                where: { id: id as string },
                data: { name, icon, banner, description }
            });

            await CacheService.del(`guild:${id}`);
            await AuditLogService.log(id as string, userId as string, AuditLogAction.GUILD_UPDATE, { name });
            SocketService.emitToRoom(id as string, 'GUILD_UPDATE', { guild });
            res.json(guild);
        } catch (error) {
            res.status(500).json({ error: 'Failed to update guild' });
        }
    }

    static async discoverGuilds(req: Request, res: Response): Promise<void> {
        try {
            const { query, category } = req.query;

            // Build where clause based on tags/name and verified status
            const whereClause: any = {
                // In a real app we might only want public/verified servers in discovery
                // verified: true 
            };

            if (query) {
                whereClause.OR = [
                    { name: { contains: query as string, mode: 'insensitive' } },
                    { description: { contains: query as string, mode: 'insensitive' } },
                    { tags: { has: query as string } }
                ];
            }

            if (category && category !== 'all') {
                whereClause.tags = { has: category as string };
            }

            const guilds = await prisma.guild.findMany({
                where: whereClause,
                select: {
                    id: true,
                    name: true,
                    icon: true,
                    banner: true,
                    description: true,
                    tags: true,
                    verified: true,
                    _count: {
                        select: { members: true }
                    }
                },
                take: 50,
                orderBy: {
                    members: {
                        _count: 'desc'
                    }
                }
            });

            // Format for frontend
            const formattedGuilds = guilds.map(g => ({
                id: g.id,
                name: g.name,
                icon: g.icon,
                banner: g.banner,
                description: g.description,
                memberCount: g._count.members,
                onlineCount: Math.floor(g._count.members * (Math.random() * 0.4 + 0.1)), // Mock online count
                category: g.tags[0] || 'all',
                tags: g.tags,
                verified: g.verified,
                featured: g._count.members > 10
            }));

            res.json(formattedGuilds);
        } catch (error) {
            console.error('Discovery Error:', error);
            res.status(500).json({ error: 'Failed to fetch discovery guilds' });
        }
    }

    static async getGuild(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params as { id: string };

            // Try cache first
            const cached = await CacheService.get(`guild:${id}`);
            if (cached) {
                res.json(cached);
                return;
            }

            const guild = await prisma.guild.findUnique({
                where: { id },
                include: {
                    channels: {
                        orderBy: [
                            { position: 'asc' },
                            { createdAt: 'asc' }
                        ],
                        take: 200
                    },
                    roles: { orderBy: { position: 'desc' }, take: 100 },
                    members: {
                        take: 100,
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    username: true,
                                    avatar: true,
                                    status: true,
                                    customStatus: true
                                }
                            },
                            roles: true
                        }
                    }
                }
            });

            if (!guild) {
                res.status(404).json({ error: 'Guild not found' });
                return;
            }

            const serializedGuild = serializeBigInt(guild);

            await CacheService.set(`guild:${id}`, serializedGuild, 300); // 5 min cache
            res.json(serializedGuild);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    // -- ROLES --
    static async createRole(req: Request, res: Response) {
        try {
            const { guildId } = req.params as { guildId: string };
            const { name, color, permissions } = CreateRoleSchema.parse(req.body);

            const role = await prisma.role.create({
                data: {
                    guildId,
                    name,
                    color,
                    permissions: BigInt(typeof permissions === 'string' ? parseInt(permissions) : (permissions || 0))
                }
            });

            const serializedRole = serializeBigInt(role);

            SocketService.emitToRoom(guildId, 'GUILD_ROLE_CREATE', { guildId, role: serializedRole });
            res.json(serializedRole);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create role' });
        }
    }

    static async updateRole(req: Request, res: Response) {
        try {
            const { guildId, roleId } = req.params as { guildId: string, roleId: string };
            const { name, color, permissions, position } = req.body as { name?: string, color?: string, permissions?: string | number, position?: number };

            const role = await prisma.role.update({
                where: { id: roleId },
                data: {
                    name,
                    color,
                    permissions: permissions ? BigInt(typeof permissions === 'string' ? parseInt(permissions) : permissions) : undefined,
                    position
                }
            });

            const serializedRole = serializeBigInt(role);

            SocketService.emitToRoom(guildId, 'GUILD_ROLE_UPDATE', { guildId, role: serializedRole });
            res.json(serializedRole);
        } catch (error) {
            res.status(500).json({ error: 'Failed to update role' });
        }
    }

    static async batchReorderRoles(req: Request, res: Response) {
        try {
            const { guildId } = req.params as { guildId: string };
            const { roles } = req.body as { roles: { id: string, position: number }[] };

            // Run in transaction to enforce lean / efficient updating
            await prisma.$transaction(
                roles.map((r) =>
                    prisma.role.update({
                        where: { id: r.id },
                        data: { position: r.position }
                    })
                )
            );

            SocketService.emitToRoom(guildId, 'GUILD_ROLES_REORDER', { guildId, roles });
            res.json({ success: true, count: roles.length });
        } catch (error) {
            console.error('Batch reorder error:', error);
            res.status(500).json({ error: 'Failed to reorder roles' });
        }
    }

    static async deleteRole(req: Request, res: Response) {
        try {
            const { guildId, roleId } = req.params as { guildId: string, roleId: string };
            await prisma.role.delete({ where: { id: roleId } });

            SocketService.emitToRoom(guildId, 'GUILD_ROLE_DELETE', { guildId, roleId });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete role' });
        }
    }

    // -- INVITES --
    static async createInvite(req: Request, res: Response) {
        try {
            const { guildId } = req.params as { guildId: string };
            const userId = req.user?.id;

            // Validate inputs
            if (!guildId || typeof guildId !== 'string') {
                return res.status(400).json({ error: 'Invalid or missing guild ID' });
            }
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // Check if guild exists and user is a member
            const guild = await prisma.guild.findUnique({
                where: { id: guildId },
                include: { members: { where: { userId } } }
            });

            if (!guild) {
                return res.status(404).json({ error: 'Guild not found' });
            }

            if (guild.members.length === 0) {
                return res.status(403).json({ error: 'You must be a member of this guild to create invites' });
            }

            // Check permissions
            const member = guild.members[0];
            const hasPermission = member.roles?.includes('MANAGE_SERVER') || member.roles?.includes('ADMIN') || guild.ownerId === userId;
            
            if (!hasPermission) {
                return res.status(403).json({ error: 'You lack permission to create invites' });
            }

            // Create invite with unique code
            const code = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            const invite = await prisma.invite.create({
                data: {
                    code,
                    guildId,
                    expiresAt,
                    createdBy: userId
                } as any
            });

            // Clear cache
            await CacheService.del(`guild:${guildId}:invites`);

            res.json(invite);
        } catch (error) {
            console.error('Create invite error:', error);
            res.status(500).json({ error: 'Failed to create invite' });
        }
    }

    static async boostGuild(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            const BOOST_COST = 1000;

            const result = await prisma.$transaction(async (tx: any) => {
                // 1. Check wallet
                const wallet = await tx.beacoinWallet.findUnique({ where: { userId } });
                if (!wallet || wallet.balance < BOOST_COST) {
                    throw new Error('INSUFFICIENT_FUNDS');
                }

                // 2. Deduct coins
                await tx.beacoinWallet.update({
                    where: { userId },
                    data: { balance: { decrement: BOOST_COST } }
                });

                // 3. Create transaction
                await tx.beacoinTransaction.create({
                    data: {
                        walletId: wallet.id,
                        fromUserId: userId,
                        amount: BOOST_COST,
                        type: 'SPEND',
                        description: `Server Boost for Guild ${id}`,
                    } as any
                });

                // 4. Update Guild
                const guild = await tx.guild.update({
                    where: { id },
                    data: {
                        boostCount: { increment: 1 }
                    }
                });

                // 5. Calculate level (Simple: 1 boost = 1 level for prototyping, 10 boosts = Level 10 Max)
                const newLevel = Math.min(Math.floor(guild.boostCount), 10);
                await tx.guild.update({
                    where: { id },
                    data: { boostLevel: newLevel }
                });

                return { guild, newLevel };
            });

            await CacheService.del(`guild:${id}`);
            SocketService.emitToRoom(id as string, 'GUILD_BOOST', { guildId: id, ...result });
            res.json(result);
        } catch (error: any) {
            if (error.message === 'INSUFFICIENT_FUNDS') {
                res.status(400).json({ error: 'Insufficient Beacoins to boost' });
                return;
            }
            console.error('Boost Error:', error);
            res.status(500).json({ error: 'Failed to boost server' });
        }
    }

    static async updateVanityUrl(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { vanityUrl } = req.body;
            const userId = req.user?.id;

            // Check if user is owner
            const guild = await prisma.guild.findUnique({ where: { id } });
            if (!guild || guild.ownerId !== userId) {
                res.status(403).json({ error: 'Only server owners can set vanity URLs' });
                return;
            }

            // Check level
            // @ts-ignore
            if (guild.boostLevel < 10) {
                res.status(400).json({ error: 'Server must be Level 10 to unlock a Vanity URL' });
                return;
            }

            // Validate format: Beacon-*.inv
            if (!vanityUrl.startsWith('Beacon-') || !vanityUrl.endsWith('.inv')) {
                res.status(400).json({ error: 'Vanity URL must start with Beacon- and end with .inv' });
                return;
            }

            const updated = await prisma.guild.update({
                where: { id },
                data: {
                    // @ts-ignore
                    vanityUrl
                }
            });

            await CacheService.del(`guild:${id}`);
            res.json(updated);
        } catch (error) {
            res.status(500).json({ error: 'Failed to set vanity URL' });
        }
    }

    static async leaveGuild(req: Request, res: Response) {
        try {
            const { id: guildId } = req.params as { id: string };
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const guild = await prisma.guild.findUnique({ where: { id: guildId }, select: { id: true, ownerId: true } });
            if (!guild) {
                res.status(404).json({ error: 'Guild not found' });
                return;
            }

            if (guild.ownerId === userId) {
                res.status(400).json({ error: 'Server owners cannot leave without transferring ownership first' });
                return;
            }

            const membership = await prisma.guildMember.findUnique({
                where: { userId_guildId: { userId, guildId } },
                select: { userId: true }
            });

            if (!membership) {
                res.status(404).json({ error: 'You are not a member of this server' });
                return;
            }

            await prisma.guildMember.delete({
                where: { userId_guildId: { userId, guildId } }
            });

            await CacheService.del(`guild:${guildId}`);
            SocketService.emitToRoom(guildId, 'GUILD_MEMBER_REMOVE', { guildId, userId });

            res.json({ success: true });
        } catch (error) {
            console.error('[LEAVE_GUILD]', error);
            res.status(500).json({ error: 'Failed to leave server' });
        }
    }

    // -- SOUNDS --
    static async createSound(req: Request, res: Response) {
        try {
            const { guildId } = req.params;
            const { name, url, emoji } = req.body;
            const userId = req.user?.id;

            const sound = await prisma.sound.create({
                data: {
                    name,
                    url,
                    emoji,
                    guildId,
                    creatorId: userId
                }
            });

            SocketService.emitToRoom(guildId, 'GUILD_SOUND_CREATE', { guildId, sound });
            res.status(201).json(sound);
        } catch (error) {
            console.error('Create Sound Error:', error);
            res.status(500).json({ error: 'Failed to create sound' });
        }
    }

    static async getSounds(req: Request, res: Response) {
        try {
            const { guildId } = req.params;
            const sounds = await prisma.sound.findMany({
                where: { guildId }
            });
            res.json(sounds);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch sounds' });
        }
    }

    static async deleteSound(req: Request, res: Response) {
        try {
            const { guildId, soundId } = req.params;
            await prisma.sound.delete({ where: { id: soundId } });
            SocketService.emitToRoom(guildId, 'GUILD_SOUND_DELETE', { guildId, soundId });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete sound' });
        }
    }

    // -- MEMBERS & MODERATION --
    static async getMembers(req: Request, res: Response) {
        try {
            const { guildId } = req.params;
            const members = await prisma.guildMember.findMany({
                where: { guildId },
                include: { user: true, roles: true },
                take: 100
            });
            res.json(members);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch members' });
        }
    }

    static async updateMember(req: Request, res: Response) {
        try {
            const { guildId, userId } = req.params;
            const { nickname, roles } = req.body;

            const member = await prisma.guildMember.update({
                where: { userId_guildId: { userId, guildId } },
                data: {
                    nickname,
                    roles: roles ? { set: roles.map((id: string) => ({ id })) } : undefined
                },
                include: { user: true, roles: true }
            });

            SocketService.emitToRoom(guildId, 'GUILD_MEMBER_UPDATE', { guildId, member });
            res.json(member);
        } catch (error) {
            res.status(500).json({ error: 'Failed to update member' });
        }
    }

    static async kickMember(req: Request, res: Response) {
        try {
            const { guildId, userId } = req.params;
            const executerId = req.user?.id;

            await prisma.guildMember.delete({
                where: { userId_guildId: { userId, guildId } }
            });

            await AuditLogService.log(guildId, executerId, AuditLogAction.MEMBER_KICK, { targetId: userId });
            SocketService.emitToRoom(guildId, 'GUILD_MEMBER_REMOVE', { guildId, userId });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to kick member' });
        }
    }

    static async banMember(req: Request, res: Response) {
        try {
            const { guildId, userId } = req.params;
            const { reason } = req.body;
            const executerId = req.user?.id;

            // In a real Discord-like, this would add to a Banned table/model
            // For now we kick and log as ban
            await prisma.guildMember.delete({
                where: { userId_guildId: { userId, guildId } }
            });

            await AuditLogService.log(guildId, executerId, AuditLogAction.MEMBER_BAN, { targetId: userId, reason });
            SocketService.emitToRoom(guildId, 'GUILD_MEMBER_BAN', { guildId, userId, reason });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to ban member' });
        }
    }

    // -- AUDIT LOGS (Enhanced Search) --
    static async getAuditLogs(req: Request, res: Response) {
        try {
            const { guildId } = req.params;
            const { actorId, action, before, after, limit } = req.query;

            const where: any = { guildId };
            if (actorId) where.userId = actorId as string;
            if (action) where.action = action as string;
            if (before || after) {
                where.createdAt = {};
                if (before) where.createdAt.lt = new Date(before as string);
                if (after) where.createdAt.gt = new Date(after as string);
            }

            const logs = await prisma.auditLog.findMany({
                where,
                include: { user: { select: { id: true, username: true, avatar: true } } },
                orderBy: { createdAt: 'desc' },
                take: Math.min(parseInt(limit as string) || 50, 200)
            });
            res.json(logs);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch audit logs' });
        }
    }

    // -- AUTOMOD PRO --
    static async getAutoModRules(req: Request, res: Response) {
        try {
            const { autoModService } = await import('../services/automod');
            const { guildId } = req.params;
            const rules = await autoModService.getRules(guildId);
            res.json(rules);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch automod rules' });
        }
    }

    static async createAutoModRule(req: Request, res: Response) {
        try {
            const { autoModService } = await import('../services/automod');
            const { guildId } = req.params;
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const rule = await autoModService.createRule(guildId, userId, req.body);
            res.status(201).json(rule);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create automod rule' });
        }
    }

    static async updateAutoModRule(req: Request, res: Response) {
        try {
            const { autoModService } = await import('../services/automod');
            const { guildId, ruleId } = req.params;
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const rule = await autoModService.updateRule(guildId, ruleId, req.body, userId);
            if (!rule) return res.status(404).json({ error: 'Rule not found' });
            res.json(rule);
        } catch (error) {
            res.status(500).json({ error: 'Failed to update automod rule' });
        }
    }

    static async deleteAutoModRule(req: Request, res: Response) {
        try {
            const { autoModService } = await import('../services/automod');
            const { guildId, ruleId } = req.params;
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const deleted = await autoModService.deleteRule(guildId, ruleId, userId);
            if (!deleted) return res.status(404).json({ error: 'Rule not found' });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete automod rule' });
        }
    }

    // -- WEBHOOKS --
    static async getWebhooks(req: Request, res: Response) {
        try {
            const { guildId } = req.params;
            const webhooks = await prisma.webhook.findMany({
                where: { guildId },
                include: { channel: true },
                take: 50
            });
            res.json(webhooks);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch webhooks' });
        }
    }

    static async createWebhook(req: Request, res: Response) {
        try {
            const { guildId } = req.params;
            const { name, channelId, avatar } = req.body;
            const userId = req.user?.id;
            const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

            const webhook = await prisma.webhook.create({
                data: {
                    name,
                    channelId,
                    guildId,
                    token,
                    avatar,
                    createdBy: userId
                }
            });

            await AuditLogService.log(guildId, userId, AuditLogAction.WEBHOOK_CREATE, { name, channelId });
            res.status(201).json(webhook);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create webhook' });
        }
    }

    static async updateWebhook(req: Request, res: Response) {
        try {
            const { webhookId } = req.params;
            const { name, channelId, avatar } = req.body;
            const userId = req.user?.id;

            const webhook = await prisma.webhook.update({
                where: { id: webhookId },
                data: { name, channelId, avatar }
            });

            if (webhook.guildId) {
                await AuditLogService.log(webhook.guildId, userId, AuditLogAction.WEBHOOK_UPDATE, { name, channelId });
            }
            res.json(webhook);
        } catch (error) {
            res.status(500).json({ error: 'Failed to update webhook' });
        }
    }

    static async deleteWebhook(req: Request, res: Response) {
        try {
            const { webhookId } = req.params;
            const userId = req.user?.id;

            const webhook = await prisma.webhook.delete({
                where: { id: webhookId }
            });

            if (webhook.guildId) {
                await AuditLogService.log(webhook.guildId, userId, AuditLogAction.WEBHOOK_DELETE, { name: webhook.name });
            }
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete webhook' });
        }
    }

    // -- EMOJIS --
    static async getEmojis(req: Request, res: Response) {
        try {
            const { guildId } = req.params;
            const emojis = await prisma.customEmoji.findMany({
                where: { guildId },
                take: 100
            });
            res.json(emojis);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch emojis' });
        }
    }

    static async createEmoji(req: Request, res: Response) {
        try {
            const { guildId } = req.params;
            const { name, imageUrl, animated } = req.body;
            const userId = req.user?.id;

            const emoji = await prisma.customEmoji.create({
                data: {
                    name,
                    imageUrl,
                    animated: animated || false,
                    guildId,
                    creatorId: userId
                }
            });

            res.status(201).json(emoji);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create emoji' });
        }
    }

    static async deleteEmoji(req: Request, res: Response) {
        try {
            const { guildId, emojiId } = req.params;
            await prisma.customEmoji.delete({ where: { id: emojiId } });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete emoji' });
        }
    }
    static async getInvites(req: Request, res: Response) {
        try {
            const { id: guildId } = req.params;
            const invites = await prisma.invite.findMany({
                where: { guildId },
                include: { inviter: true }
            });
            // Serialize BigInt if needed or just return (roles/permissions might have BigInt)
            const serialized = serializeBigInt(invites);
            res.json(serialized);
        } catch (error) {
            console.error('[GET_INVITES]', error);
            res.status(500).json({ error: 'Failed to fetch invites' });
        }
    }

    static async deleteInvite(req: Request, res: Response) {
        try {
            const { guildId, inviteCode } = req.params;
            await prisma.invite.delete({
                where: { code: inviteCode }
            });
            // Optional: Audit log
            res.json({ success: true });
        } catch (error) {
            console.error('[DELETE_INVITE]', error);
            res.status(500).json({ error: 'Failed to delete invite' });
        }
    }

    // -- BANS --
    static async getBans(req: Request, res: Response) {
        try {
            const { id: guildId } = req.params;
            const bans = await prisma.guildBan.findMany({
                where: { guildId },
                include: { user: true }
            });
            res.json(bans);
        } catch (error) {
            console.warn('[GET_BANS] Error fetching bans:', error);
            res.json([]);
        }
    }

    static async unbanMember(req: Request, res: Response) {
        try {
            const { id: guildId, userId } = req.params;
            await prisma.guildBan.deleteMany({
                where: { guildId, userId }
            });
            res.json({ success: true });
        } catch (error) {
            console.error('[UNBAN_MEMBER]', error);
            res.status(500).json({ error: 'Failed to unban member' });
        }
    }
}
