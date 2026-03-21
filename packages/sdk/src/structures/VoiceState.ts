import { Client } from '../client';

export class VoiceState {
    public readonly client: Client;
    public userId: string;
    public guildId: string;
    public channelId: string | null;
    public session_id: string;
    public deaf: boolean;
    public mute: boolean;
    public self_deaf: boolean;
    public self_mute: boolean;
    public self_video: boolean;
    public suppress: boolean;
    public request_to_speak_timestamp: string | null;

    constructor(client: Client, data: any) {
        this.client = client;
        this.userId = data.userId || data.user_id;
        this.guildId = data.guildId || data.guild_id;
        this.channelId = data.channelId || data.channel_id;
        this.session_id = data.session_id;
        this.deaf = !!data.deaf;
        this.mute = !!data.mute;
        this.self_deaf = !!data.self_deaf;
        this.self_mute = !!data.self_mute;
        this.self_video = !!data.self_video;
        this.suppress = !!data.suppress;
        this.request_to_speak_timestamp = data.request_to_speak_timestamp;
    }

    get channel() {
        if (!this.channelId) return null;
        return this.client.channels.get(this.channelId) || null;
    }

    async setMute(mute: boolean) {
        return this.client.rest.patch(`/guilds/${this.guildId}/members/${this.userId}`, { mute });
    }

    async setDeaf(deaf: boolean) {
        return this.client.rest.patch(`/guilds/${this.guildId}/members/${this.userId}`, { deaf });
    }

    async disconnect() {
        return this.client.rest.patch(`/guilds/${this.guildId}/members/${this.userId}`, { channel_id: null });
    }
}
