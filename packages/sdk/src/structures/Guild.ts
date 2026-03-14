import type { Client } from '../client';
import type { RawGuild } from './Message';

export class Guild {
    public readonly client: Client;
    public id: string;
    public name: string;
    public icon: string | null;
    public banner: string | null;
    public ownerId: string;
    public memberCount: number;

    constructor(client: Client, data: RawGuild) {
        this.client = client;
        this.id = data.id;
        this.name = data.name;
        this.icon = data.icon;
        this.banner = data.banner;
        this.ownerId = data.owner_id;
        this.memberCount = data.member_count || 0;
    }
}
