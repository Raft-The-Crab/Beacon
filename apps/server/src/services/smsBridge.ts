import { redis } from '../db'
import { SovereigntyService } from './sovereignty'

/**
 * Beacon SMS Bridge
 * Runs on the main Claw Cloud OS to bridge SMS to WebSocket events
 */
export class SMSBridge {
    private static readonly SMS_GATEWAY_CHANNEL = 'sms:incoming'

    static async init() {
        console.log('[SMS Bridge] Initializing on Claw Cloud OS...')

        // Subscribe to incoming SMS events from a hardware trigger or external service
        const sub = redis.duplicate()
        await sub.subscribe(this.SMS_GATEWAY_CHANNEL)

        sub.on('message', async (channel, message) => {
            if (channel === this.SMS_GATEWAY_CHANNEL) {
                await this.handleIncomingSMS(JSON.parse(message))
            }
        })
    }

    private static async handleIncomingSMS(payload: { from: string, body: string, timestamp: number }) {
        console.log(`[SMS Bridge] Received SMS from ${payload.from}: ${payload.body}`)

        // Convert SMS body to a Gateway event
        // Format: "CHANNEL_ID:MESSAGE_CONTENT"
        const parts = payload.body.split(':')
        if (parts.length < 2) return

        const channelId = parts[0]?.trim()
        const content = parts.slice(1).join(':').trim()

        if (!channelId || !content) return

        const gatewayEvent = {
            t: 'MESSAGE_CREATE',
            d: SovereigntyService.optimizePayload({
                id: `sms_${Date.now()}`,
                channel_id: channelId,
                author: { id: payload.from, username: `SMS_${payload.from.slice(-4)}` },
                content: content,
                timestamp: new Date(payload.timestamp),
                metadata: { source: 'sms-bridge' }
            }, true) // Always Zero-Data for SMS
        }

        // Publish to the main gateway bus
        await redis.publish('gateway:events', JSON.stringify(gatewayEvent))
    }
}
