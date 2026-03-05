import type { Client } from '../client';
import type { RawUser } from './Message';

export class User {
    public readonly client: Client;
    public id: string;
    public username: string;
    public discriminator: string;
    public avatar: string | null;
    public bot: boolean;

    constructor(client: Client, data: RawUser) {
        this.client = client;
        this.id = data.id;
        this.username = data.username;
        this.discriminator = data.discriminator;
        this.avatar = data.avatar;
        this.bot = !!data.bot;
    }

    get tag() {
        return `${this.username}#${this.discriminator}`;
    }

    avatarURL(options: { size?: number } = {}) {
        if (!this.avatar) return null;
        return this.avatar;
    }
}
