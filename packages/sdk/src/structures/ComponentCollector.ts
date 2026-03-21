import { Collector, CollectorOptions } from './Collector';
import type { Client } from '../client';
import type { InteractionContext } from './InteractionContext';

/**
 * Collects button and select menu interactions natively via awaitable promises.
 */
export class ComponentCollector extends Collector<InteractionContext> {
    constructor(private client: Client, options: CollectorOptions<InteractionContext> = {}) {
        super(options);
        this._setupListeners();
    }

    private _setupListeners() {
        const onInteraction = (ctx: InteractionContext) => {
            if ((ctx as any).raw?.type === 3) { // 3 = MESSAGE_COMPONENT
                this.collect(ctx);
            }
        };

        this.client.on('componentInteraction', onInteraction);
        this.once('end', () => this.client.off('componentInteraction', onInteraction));
    }
}
