import { prisma } from '../db';

export enum AuditLogAction {
  GUILD_UPDATE = 1,
  CHANNEL_CREATE = 10,
  CHANNEL_UPDATE = 11,
  CHANNEL_DELETE = 12,
  MEMBER_KICK = 20,
  MEMBER_BAN = 21,
  MEMBER_ROLE_UPDATE = 30,
  INVITE_CREATE = 40,
  WEBHOOK_CREATE = 50,
  WEBHOOK_UPDATE = 51,
  WEBHOOK_DELETE = 52,
}

export class AuditLogService {
  static async log(guildId: string, userId: string, action: AuditLogAction, changes?: any) {
    try {
      await (prisma as any).auditLog.create({
        data: {
          guildId,
          userId,
          action,
          changes: changes ? JSON.parse(JSON.stringify(changes)) : null,
        }
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }
}

