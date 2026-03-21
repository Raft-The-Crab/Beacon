import type { Client } from '../client';

export class Invite {
  public code: string;
  public guildId: string;
  public channelId: string;
  public inviterId?: string;
  public maxAge?: number;
  public maxUses?: number;
  public uses?: number;
  public temporary?: boolean;
  public createdAt: Date;
  public expiresAt: Date | null;

  constructor(public readonly client: Client, data: any) {
    this.code = data.code;
    this.guildId = data.guildId || data.guild_id;
    this.channelId = data.channelId || data.channel_id;
    this.inviterId = data.inviterId || data.inviter_id;
    this.maxAge = data.maxAge || data.max_age;
    this.maxUses = data.maxUses || data.max_uses;
    this.uses = data.uses || 0;
    this.temporary = !!(data.temporary);
    this.createdAt = new Date(data.createdAt || data.created_at);
    this.expiresAt = (data.expiresAt || data.expires_at) ? new Date(data.expiresAt || data.expires_at) : null;
  }

  async delete() {
    return this.client.rest.delete(`/invites/${this.code}`);
  }

  get url() {
    return `https://beacon.gg/invite/${this.code}`;
  }
}
