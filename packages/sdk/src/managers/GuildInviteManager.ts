import { Client } from '../client';
import { Invite } from '../structures/Invite';

export class GuildInviteManager {
  constructor(private client: Client, private guildId: string) {}

  /** Fetch all invites in a guild */
  async list(): Promise<Invite[]> {
    const data = await this.client.rest.get(`/guilds/${this.guildId}/invites`);
    return (data || []).map((i: any) => new Invite(this.client, i));
  }
}
