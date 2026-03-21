import { Collector, CollectorOptions } from './Collector';
import { Client } from '../client';

export interface ReactionData {
    messageId: string;
    channelId: string;
    userId: string;
    emoji: string;
}

export class ReactionCollector extends Collector<ReactionData> {
    constructor(private client: Client, options: CollectorOptions<ReactionData> = {}) {
        super(options);
        this._setupListeners();
    }

    private _setupListeners() {
        const onAdd = (data: any) => this.collect(data);
        this.client.on('messageReactionAdd', onAdd);
        this.once('end', () => this.client.off('messageReactionAdd', onAdd));
    }
}
