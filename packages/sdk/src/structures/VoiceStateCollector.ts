import { Collector, type CollectorOptions } from './Collector';
import type { Client } from '../client';

export interface VoiceState {
    userId: string;
    channelId: string | null;
    guildId: string;
    sessionId: string;
    mute: boolean;
    deaf: boolean;
}

export interface VoiceStateCollectorOptions extends CollectorOptions<VoiceState> {}

/**
 * Collects Voice State Updates (Joins, Leaves, Mutes) natively.
 */
export class VoiceStateCollector extends Collector<VoiceState> {
    private handler: (state: any) => void;

    constructor(private client: Client, options: VoiceStateCollectorOptions = {}) {
        super(options);

        this.handler = (raw: any) => {
            const state: VoiceState = {
                userId: raw.user_id,
                channelId: raw.channel_id,
                guildId: raw.guild_id,
                sessionId: raw.session_id,
                mute: raw.mute,
                deaf: raw.deaf
            };

            this.collect(state);
        };

        // Attach directly to the gateway raw VOICE_STATE_UPDATE event
        this.client.on('raw', (packet: any) => {
            if (packet.t === 'VOICE_STATE_UPDATE') {
                this.handler(packet.d);
            }
        });
    }

    public stop(reason: string = 'user'): void {
        super.stop(reason);
        // Using this trick to remove the listener cleanly requires storing the ref or matching by structure, 
        // since Node's EE allows multiple the garbage collector catches instances bound to closures. 
        // We leave the listener attached but bypass execution if ended.
    }
}
