import { Client } from '../client';
import { Invite } from '../structures/Invite';

export class InviteManager {
  constructor(private client: Client) {}

  /** Fetch info about an invite */
  async fetch(code: string): Promise<Invite> {
    const data = await this.client.rest.get(`/invites/${code}`);
    return new Invite(this.client, data);
  }

  /** Delete an invite */
  async delete(code: string): Promise<void> {
    await this.client.rest.delete(`/invites/${code}`);
  }
}
