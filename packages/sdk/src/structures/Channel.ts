import type { Client } from '../client';
import type { RawChannel } from './Message';

export class Channel {
    public readonly client: Client;
    public id: string;
    public guildId?: string;
    public name: string;
    public type: number;
    public position: number;
    public parentId?: string | null;
    public topic?: string | null;
    public nsfw: boolean;
    public slowmodeDelay: number;

    constructor(client: Client, data: RawChannel) {
        this.client = client;
        this.id = data.id;
        this.guildId = data.guild_id;
        this.name = data.name;
        this.type = data.type;
        this.position = data.position;
        this.parentId = data.parent_id;
        this.topic = data.topic;
        this.nsfw = !!data.nsfw;
        this.slowmodeDelay = data.slowmode_delay || 0;
    }

    async send(content: string | { content?: string; embeds?: any[] }) {
        return this.client.sendMessage(this.id, content);
    }
}
