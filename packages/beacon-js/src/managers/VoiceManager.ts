import { EventEmitter } from 'events';
import { Gateway } from '../gateway';

export class VoiceManager extends EventEmitter {
    private gateway: Gateway;
    private voiceStates: Map<string, any> = new Map();

    constructor(gateway: Gateway) {
        super();
        this.gateway = gateway;
        this.setupListeners();
    }

    private setupListeners() {
        this.gateway.on('voiceStateUpdate', (data: any) => {
            this.voiceStates.set(data.userId, data);
            this.emit('stateUpdate', data);
        });
    }

    public joinChannel(guildId: string, channelId: string, selfMute = false, selfDeaf = false) {
        this.gateway.send({
            op: 4, // TRIM_VOICE_STATE_UPDATE
            d: {
                guild_id: guildId,
                channel_id: channelId,
                self_mute: selfMute,
                self_deaf: selfDeaf,
            },
        });
    }

    public leaveChannel(guildId: string) {
        this.joinChannel(guildId, null as any);
    }

    public getVoiceState(userId: string) {
        return this.voiceStates.get(userId);
    }
}
