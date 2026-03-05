import { redis } from '../db';
import { WSEventType } from '@beacon/types';

/**
 * Utility to publish an event to the Redis gateway.
 * This decouples the API controllers from needing to integrate deeply
 * with the Websocket gateway classes.
 */
export async function publishGatewayEvent(eventType: WSEventType | string, data: any, guildId?: string | null, recipientIds?: string[]) {
    try {
        await redis.publish('gateway:events', JSON.stringify({ t: eventType, d: data, guild_id: guildId, recipientIds }));
    } catch (err) {
        console.warn(`[GatewayPublisher] Failed to publish ${eventType} to redis`, err);
    }
}
