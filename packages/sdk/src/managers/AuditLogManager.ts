
import { AuditLog } from '../structures/AuditLog';
import { Client } from '../client';

export interface AuditLogFetchOptions {
  limit?: number;
  before?: string;
  userId?: string;
  actionType?: number;
}

export class AuditLogManager {
  constructor(private client: Client) {}

  /** Fetch audit logs for a guild */
  async fetch(guildId: string, options: AuditLogFetchOptions = {}): Promise<AuditLog> {
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', String(options.limit));
    if (options.before) params.set('before', options.before);
    if (options.userId) params.set('user_id', options.userId);
    if (options.actionType) params.set('action_type', String(options.actionType));

    const qs = params.toString();
    const data = await this.client.rest.get(`/guilds/${guildId}/audit-logs${qs ? '?' + qs : ''}`);
    return new AuditLog(this.client, data);
  }
}
