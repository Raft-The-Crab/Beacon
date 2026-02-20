import { Request, Response } from 'express';
import { prisma } from '../db';
import { AuditLogService, AuditLogAction } from '../services/auditLog';
import { CacheService } from '../services/cache';

// Local stub — SocketService will be wired via gateway when available
const SocketService = { emitToRoom: (_room: string, _event: string, _data: unknown) => { } };

export class GuildController {
    static async createGuild(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            const { name, icon } = req.body;

            const guild = await prisma.$transaction(async (tx: any) => {
                const guild = await tx.guild.create({
                    data: {
                        name,
                        icon,
                        ownerId: userId
                    }
                });

                await tx.channel.createMany({
                    data: [
                        { name: 'general', type: 0, guildId: guild.id, position: 0 },
                        { name: 'General', type: 1, guildId: guild.id, position: 1 }
                    ]
                });

                const everyoneRole = await tx.role.create({
                    data: {
                        name: '@everyone',
                        guildId: guild.id,
                        position: 0,
                        permissions: BigInt(0)
                    }
                });

                await tx.guildMember.create({
                    data: {
                        userId,
                        guildId: guild.id,
                        roles: {
                            connect: [{ id: everyoneRole.id }]
                        }
                    }
                });

                return guild;
            });

            await AuditLogService.log(guild.id, userId, AuditLogAction.GUILD_UPDATE, { name: 'Guild Created' });
            res.status(201).json(guild);
        } catch (error) {
            console.error('Create Guild Error:', error);
            res.status(500).json({ error: 'Failed to create guild' });
        }
    }

    static async updateGuild(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, icon, banner, description } = req.body;
            const userId = (req as any).user?.id;

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
                    channels: { orderBy: { position: 'asc' } },
                    roles: { orderBy: { position: 'desc' } },
                    members: { take: 100, include: { user: true } }
                }
            });

            if (!guild) {
                res.status(404).json({ error: 'Guild not found' });
                return;
            }

            const serializedGuild = JSON.parse(JSON.stringify(guild, (_, value) =>
                typeof value === 'bigint' ? value.toString() : value
            ));

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
            const { name, color, permissions } = req.body as { name: string, color?: string, permissions?: string | number };

            const role = await prisma.role.create({
                data: {
                    guildId,
                    name,
                    // @ts-ignore - color is string in schema
                    color,
                    permissions: BigInt(typeof permissions === 'string' ? parseInt(permissions) : (permissions || 0))
                }
            });

            const serializedRole = JSON.parse(JSON.stringify(role, (_, value) =>
                typeof value === 'bigint' ? value.toString() : value
            ));

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
                    // @ts-ignore - color is string in schema
                    color,
                    permissions: permissions ? BigInt(typeof permissions === 'string' ? parseInt(permissions) : permissions) : undefined,
                    position
                }
            });

            const serializedRole = JSON.parse(JSON.stringify(role, (_, value) =>
                typeof value === 'bigint' ? value.toString() : value
            ));

            SocketService.emitToRoom(guildId, 'GUILD_ROLE_UPDATE', { guildId, role: serializedRole });
            res.json(serializedRole);
        } catch (error) {
            res.status(500).json({ error: 'Failed to update role' });
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
            // Simple invite: 7 day expiry, infinite uses
            const code = Math.random().toString(36).substring(2, 10);
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            const invite = await prisma.invite.create({
                data: {
                    code,
                    guildId,
                    expiresAt
                } as any
            });

            res.json(invite);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create invite' });
        }
    }
}
