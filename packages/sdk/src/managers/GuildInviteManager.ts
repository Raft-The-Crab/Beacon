import { Client } from '../client';
import { Invite } from '../structures/Invite';

export class GuildInviteManager {
  constructor(private client: Client, private guildId: string) {}

  /** Fetch all invites in a guild */
  async list(): Promise<Invite[]> {
    const data = await this.client.rest.request('GET', `/guilds/${this.guildId}/invites`);
    return (data.data || []).map((i: any) => new Invite(this.client, i));
  }

  /** Create a new invite for the guild */
  async create(options: { 
    maxAge?: number; 
    maxUses?: number; 
    temporary?: boolean; 
    unique?: boolean;
    channelId?: string;
  } = {}): Promise<Invite> {
    const data = await this.client.rest.request('POST', `/guilds/${this.guildId}/invites`, options);
    if (!data.success) throw new Error(data.error?.message || 'Failed to create invite');
    return new Invite(this.client, data.data);
  }
}
