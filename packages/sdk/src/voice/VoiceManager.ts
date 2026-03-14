import { EventEmitter } from 'events';
import type { Client } from '../client';
import { VoiceConnection } from './VoiceConnection';
// Explicit import from local file

export class VoiceManager extends EventEmitter {
    private client: Client;
    private connections: Map<string, VoiceConnection> = new Map();

    constructor(client: Client) {
        super();
        this.client = client;
    }

    /**
     * Join a voice channel
     * @param guildId The ID of the guild
     * @param channelId The ID of the voice channel
     */
    async join(guildId: string, channelId: string): Promise<VoiceConnection> {
        if (this.connections.has(guildId)) {
            const conn = this.connections.get(guildId)!;
            if (conn.channelId === channelId) return conn;
            await conn.destroy();
        }

        const connection = new VoiceConnection(this.client, guildId, channelId);
        this.connections.set(guildId, connection);

        connection.on('disconnect', () => {
            this.connections.delete(guildId);
            this.emit('disconnect', guildId, channelId);
        });

        await connection.connect();
        return connection;
    }

    /**
     * Leave a voice channel in a guild
     * @param guildId The ID of the guild
     */
    async leave(guildId: string) {
        const conn = this.connections.get(guildId);
        if (conn) {
            await conn.destroy();
            this.connections.delete(guildId);
        }
    }

    /**
     * Get an existing voice connection for a guild
     * @param guildId The ID of the guild
     */
    getConnection(guildId: string): VoiceConnection | undefined {
        return this.connections.get(guildId);
    }
}
