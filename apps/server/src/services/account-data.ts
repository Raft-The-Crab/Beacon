import { prisma } from '../db';
import { logger } from './logger';

export class AccountDataService {
    /**
     * Aggregates all user-related data for a full account export.
     * Returns a structured object that can be converted to JSON.
     */
    static async exportUserData(userId: string) {
        logger.info(`[AccountExport] Starting data aggregation for user ${userId}`);

        try {
            const data = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    friends: {
                        include: {
                            friend: {
                                select: {
                                    id: true,
                                    username: true,
                                    discriminator: true,
                                    globalName: true
                                }
                            }
                        }
                    },
                    friendOf: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    username: true,
                                    discriminator: true,
                                    globalName: true
                                }
                            }
                        }
                    },
                    memberships: {
                        include: {
                            guild: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        }
                    },
                    messages: {
                        take: 1000, // Limit for now to prevent OOM
                        orderBy: { createdAt: 'desc' },
                        select: {
                            id: true,
                            content: true,
                            channelId: true,
                            createdAt: true,
                            embeds: true
                        }
                    },
                    folders: true,
                    quests: {
                        include: {
                            quest: true
                        }
                    },
                    cosmetics: true,
                    blocked: {
                        include: {
                            blocked: {
                                select: {
                                    id: true,
                                    username: true
                                }
                            }
                        }
                    }
                }
            });

            if (!data) return null;

            // Strip sensitive fields
            const { password, twoFactorSecret, lastIp, ...safeData } = data;
            
            return {
                exportMetadata: {
                    version: "1.0",
                    exportedAt: new Date().toISOString(),
                    userId: safeData.id
                },
                profile: {
                    username: safeData.username,
                    discriminator: safeData.discriminator,
                    globalName: safeData.globalName,
                    bio: safeData.bio,
                    avatar: safeData.avatar,
                    banner: safeData.banner,
                    createdAt: safeData.createdAt,
                    badges: safeData.badges,
                    theme: safeData.theme,
                    accentColor: safeData.accentColor
                },
                financials: {
                    beacoins: safeData.beacoins,
                    isBeaconPlus: safeData.isBeaconPlus,
                    accountTier: safeData.accountTier
                },
                social: {
                    friends: [...safeData.friends, ...safeData.friendOf].map(f => ({
                        friendId: (f as any).friend?.id || (f as any).user?.id,
                        username: (f as any).friend?.username || (f as any).user?.username,
                        status: f.status,
                        since: f.createdAt
                    })),
                    blockedUsers: safeData.blocked.map(b => ({
                        id: b.blocked.id,
                        username: b.blocked.username,
                        since: b.createdAt
                    }))
                },
                servers: safeData.memberships.map(m => ({
                    id: m.guild.id,
                    name: m.guild.name,
                    nickname: m.nickname,
                    joinedAt: m.joinedAt
                })),
                folders: safeData.folders.map(f => ({
                    name: f.name,
                    guildIds: f.guildIds,
                    position: f.position
                })),
                messages: safeData.messages,
                quests: safeData.quests.map(q => ({
                    title: q.quest.title,
                    progress: q.progress,
                    completed: q.completed
                }))
            };
        } catch (error) {
            logger.error(`[AccountExport] Failed to export data for user ${userId}: ${error}`);
            throw error;
        }
    }
}
