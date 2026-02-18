import { Request, Response } from 'express';
import { prisma } from '../db';
import { SocketService } from '../services/socket';
import { AuditLogService, AuditLogAction } from '../services/auditLog';

export class GuildController {
    static async createGuild(req: Request, res: Response) {
        try {
            // @ts-ignore
            const userId = req.user?.id;
            const { name, icon } = req.body;

            // Transaction: Create Guild, Default Channels, Default Role, Add Member
            const guild = await prisma.$transaction(async (tx) => {
                const guild = await tx.guild.create({
                    data: {
                        name,
                        icon,
                        ownerId: userId
                    }
                });

                // Default Channels
                await tx.channel.createMany({
                    data: [
                        { name: 'general', type: 0, guildId: guild.id, position: 0 },
                        { name: 'General', type: 1, guildId: guild.id, position: 1 }
                    ]
                });

                // Default Role (@everyone)
                const everyoneRole = await tx.role.create({
                    data: {
                        name: '@everyone',
                        guildId: guild.id,
                        position: 0,
                        permissions: BigInt(0) // Default permissions
                    }
                });

                // Add Owner
                await tx.member.create({
                    data: {
                        userId,
                        guildId: guild.id,
                        roles: {
                            // @ts-ignore
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
            return;
        }
    }

    static async updateGuild(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, icon, banner, description } = req.body;
            // @ts-ignore
            const userId = req.user?.id;

            const guild = await prisma.guild.update({
                where: { id },
                data: { name, icon, banner, description }
            });

            await AuditLogService.log(id, userId, AuditLogAction.GUILD_UPDATE, { name });
            SocketService.emitToRoom(id, 'GUILD_UPDATE', { guild });
            res.json(guild);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to update guild' });
        }
    }

    static async getGuild(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const guild = await prisma.guild.findUnique({
                where: { id },
                include: {
                    channels: { orderBy: { position: 'asc' } },
                    roles: { orderBy: { position: 'desc' } },
                    members: { take: 100, include: { user: true } } // Cap members for now
                }
            });

            if (!guild) {
                res.status(404).json({ error: 'Guild not found' });
                return;
            }

            // Serialize BigInt permissions to string for JSON
            const serializedGuild = JSON.parse(JSON.stringify(guild, (_, value) =>
                typeof value === 'bigint' ? value.toString() : value
            ));

            res.json(serializedGuild);
            return;
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
            return;
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
