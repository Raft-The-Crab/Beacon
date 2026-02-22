import { prisma, redis } from '../db';

export enum AuditAction {
    // Guild Actions (100-199)
    GUILD_UPDATE = 101,
    GUILD_DELETE = 102,
    CHANNEL_CREATE = 110,
    CHANNEL_DELETE = 111,
    MEMBER_BAN = 120,
    MEMBER_KICK = 121,
    ROLE_UPDATE = 130,

    // User/Auth Actions (200-299)
    USER_LOGIN_SUCCESS = 201,
    USER_LOGIN_FAILED = 202,
    USER_PASSWORD_CHANGE = 203,
    USER_MFA_ENABLE = 204,
    USER_MFA_DISABLE = 205,

    // Security/System Actions (300-399)
    IP_BLOCKED = 301,
    IP_UNBLOCKED = 302,
    RATE_LIMIT_HIT = 303,
    SENSITIVE_DATA_ACCESS = 310,
}

export class SystemAuditService {
    /**
     * Log a sensitive action to the database and optionally to Redis for real-time monitoring.
     */
    static async log(params: {
        action: AuditAction;
        userId?: string;
        guildId?: string;
        targetId?: string;
        reason?: string;
        changes?: any;
        ip?: string;
        userAgent?: string;
        metadata?: any;
    }) {
        try {
            // 1. Persist to Postgres
            await (prisma as any).auditLog.create({
                data: {
                    action: params.action,
                    userId: params.userId || null,
                    guildId: params.guildId || null,
                    targetId: params.targetId || null,
                    reason: params.reason || '',
                    changes: params.changes || null,
                    metadata: {
                        ip: params.ip,
                        userAgent: params.userAgent,
                        ...params.metadata,
                    },
                },
            });

            // 2. Push to Redis for real-time security dashboard / alerting
            const event = {
                ...params,
                timestamp: new Date().toISOString(),
            };
            await redis.publish('beacon:security:events', JSON.stringify(event));

            // 3. Conditional Alerting (Optional: integrate with Discord/Slack webhooks in future)
            if (params.action === AuditAction.USER_LOGIN_FAILED || params.action === AuditAction.IP_BLOCKED) {
                console.warn(`[SECURITY ALERT] Action: ${params.action} | IP: ${params.ip} | User: ${params.userId}`);
            }
        } catch (error) {
            console.error('Critical failure in SystemAuditService:', error);
        }
    }
}
