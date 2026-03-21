import type { Client } from '../client';

export class AuditLogEntry {
  public id: string;
  public guildId: string;
  public userId: string;
  public targetId: string | null;
  public actionType: number;
  public reason: string | null;
  public changes: { key: string; old?: any; new?: any }[] | null;
  public createdAt: Date;

  constructor(public readonly client: Client, data: any) {
    this.id = data.id;
    this.guildId = data.guildId || data.guild_id;
    this.userId = data.userId || data.user_id;
    this.targetId = data.targetId || data.target_id || null;
    this.actionType = data.actionType || data.action_type;
    this.reason = data.reason || null;
    this.changes = data.changes || null;
    this.createdAt = new Date(data.createdAt || data.created_at);
  }
}

export class AuditLog {
  public entries: AuditLogEntry[];

  constructor(client: Client, data: any) {
    this.entries = (data.entries || []).map((e: any) => new AuditLogEntry(client, e));
  }
}
