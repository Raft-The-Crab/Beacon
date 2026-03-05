/**
 * Beacon Server Backup & Restore — Pillar VII: Omni-Nexus
 * Exports and imports server structure (roles, channels, settings) as JSON snapshots.
 */

import { prisma } from '../db';
import { CacheService } from './cache';
import { AuditLogService, AuditLogAction } from './auditLog';

// ── Types ────────────────────────────────────────────────────────────

export interface ServerBackup {
    id: string;
    guildId: string;
    createdBy: string;
    createdAt: Date;
    version: number;
    data: {
        name: string;
        description?: string;
        icon?: string;
        banner?: string;
        roles: BackupRole[];
        channels: BackupChannel[];
        settings: Record<string, any>;
    };
}

interface BackupRole {
    name: string;
    color: string | null;
    permissions: string;
    position: number;
}

interface BackupChannel {
    name: string;
    type: string;
    position: number;
    topic?: string;
    parentId?: string;
}

// ── Service ──────────────────────────────────────────────────────────

class ServerBackupService {
    /**
     * Create a full backup of a server's structure.
     */
    async createBackup(guildId: string, userId: string): Promise<ServerBackup> {
        const guild = await prisma.guild.findUnique({
            where: { id: guildId },
            include: {
                roles: { orderBy: { position: 'desc' } },
                channels: { orderBy: { position: 'asc' } },
            },
        });

        if (!guild) throw new Error('Guild not found');

        const backup: ServerBackup = {
            id: `bkp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            guildId,
            createdBy: userId,
            createdAt: new Date(),
            version: 1,
            data: {
                name: guild.name,
                description: guild.description || undefined,
                icon: guild.icon || undefined,
                banner: guild.banner || undefined,
                roles: guild.roles.map((r: any) => ({
                    name: r.name,
                    color: r.color,
                    permissions: r.permissions.toString(),
                    position: r.position,
                })),
                channels: guild.channels.map((c: any) => ({
                    name: c.name,
                    type: c.type,
                    position: c.position,
                    topic: c.topic || undefined,
                    parentId: c.parentId || undefined,
                })),
                settings: {},
            },
        };

        // Store backup in cache (max 5 per guild)
        const key = `backups:${guildId}`;
        const existing = ((await CacheService.get(key)) as ServerBackup[]) || [];
        existing.unshift(backup);
        if (existing.length > 5) existing.pop();
        await CacheService.set(key, existing, 86400 * 90); // 90 day retention

        await AuditLogService.log(guildId, userId, AuditLogAction.GUILD_UPDATE, {
            action: 'server_backup_created',
            backupId: backup.id,
        });

        return backup;
    }

    /**
     * List all backups for a guild.
     */
    async listBackups(guildId: string): Promise<ServerBackup[]> {
        const key = `backups:${guildId}`;
        return ((await CacheService.get(key)) as ServerBackup[]) || [];
    }

    /**
     * Restore a server from a backup. This recreates roles and channels.
     * NOTE: Does not delete existing data — it overwrites positions and adds missing items.
     */
    async restoreBackup(guildId: string, backupId: string, userId: string): Promise<{ rolesRestored: number; channelsRestored: number }> {
        const backups = await this.listBackups(guildId);
        const backup = backups.find(b => b.id === backupId);
        if (!backup) throw new Error('Backup not found');

        let rolesRestored = 0;
        let channelsRestored = 0;

        // Restore roles
        for (const role of backup.data.roles) {
            if (role.name === '@everyone') continue; // skip default role
            try {
                const existing = await prisma.role.findFirst({
                    where: { guildId, name: role.name },
                });

                if (existing) {
                    await prisma.role.update({
                        where: { id: existing.id },
                        data: {
                            color: role.color,
                            permissions: BigInt(role.permissions),
                            position: role.position,
                        },
                    });
                } else {
                    await prisma.role.create({
                        data: {
                            guildId,
                            name: role.name,
                            color: role.color,
                            permissions: BigInt(role.permissions),
                            position: role.position,
                        },
                    });
                }
                rolesRestored++;
            } catch (err) {
                console.warn(`[Backup] Failed to restore role ${role.name}:`, err);
            }
        }

        // Restore channels
        for (const channel of backup.data.channels) {
            try {
                const existing = await prisma.channel.findFirst({
                    where: { guildId, name: channel.name, type: channel.type as any },
                });

                if (existing) {
                    await prisma.channel.update({
                        where: { id: existing.id },
                        data: { position: channel.position },
                    });
                } else {
                    await prisma.channel.create({
                        data: {
                            guildId,
                            name: channel.name,
                            type: channel.type as any,
                            position: channel.position,
                        },
                    });
                }
                channelsRestored++;
            } catch (err) {
                console.warn(`[Backup] Failed to restore channel ${channel.name}:`, err);
            }
        }

        await AuditLogService.log(guildId, userId, AuditLogAction.GUILD_UPDATE, {
            action: 'server_backup_restored',
            backupId,
            rolesRestored,
            channelsRestored,
        });

        return { rolesRestored, channelsRestored };
    }
}

export const serverBackupService = new ServerBackupService();
