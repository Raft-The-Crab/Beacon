import EventEmitter from 'eventemitter3';
import { VoiceConnection } from './VoiceConnection';

export class VoiceInteraction extends EventEmitter {
    constructor(private connection: VoiceConnection) {
        super();
        this._setupListeners();
    }

    private _setupListeners() {
        // In a real implementation, we'd listen for Opcode 5 (Speaking) from the Voice Gateway
        // Or track the peer connection's audio levels if in the browser.
    }

    /**
     * Request to speak in a Stage channel (Beyond Discord: Simplified native API)
     */
    async requestToSpeak() {
        return this.connection.client.rest.patch(`/guilds/${this.connection.guildId}/voice-states/@me`, {
            request_to_speak_timestamp: new Date().toISOString()
        });
    }

    /**
     * Stop speaking or become a listener
     */
    async becomeListener() {
        return this.connection.client.rest.patch(`/guilds/${this.connection.guildId}/voice-states/@me`, {
            suppress: true,
            request_to_speak_timestamp: null
        });
    }

    /**
     * Set a member as speaker (Requires MANAGE_CHANNELS)
     */
    async setSpeaker(userId: string, speaker = true) {
        return this.connection.client.rest.patch(`/guilds/${this.connection.guildId}/voice-states/${userId}`, {
            suppress: !speaker
        });
    }
}
