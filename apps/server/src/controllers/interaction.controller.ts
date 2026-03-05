import { Request, Response } from 'express';
import { InteractionType, InteractionResponseType, Interaction } from '@beacon/types';
import { botFramework } from '../bots';
import crypto from 'crypto';

export class InteractionController {
    /**
     * Verify the signature of an incoming interaction from the Gateway
     */
    static verifySignature(req: Request): boolean {
        const signature = req.headers['x-signature-ed25519'] as string;
        const timestamp = req.headers['x-signature-timestamp'] as string;
        const body = JSON.stringify(req.body);

        if (!signature || !timestamp) return false;

        const publicKey = process.env.BEACON_PUBLIC_KEY;
        if (!publicKey) {
            console.error('[Security] BEACON_PUBLIC_KEY not set');
            return false;
        }

        try {
            // Ed25519 verification using Node.js crypto
            const isVerified = crypto.verify(
                undefined,
                Buffer.from(timestamp + body),
                {
                    key: crypto.createPublicKey({
                        key: Buffer.from(publicKey, 'hex'),
                        format: 'raw',
                        type: 'ed25519'
                    } as any),
                },
                Buffer.from(signature, 'hex')
            );
            return isVerified;
        } catch (err) {
            console.error('[Security] Signature verification failed:', err);
            return false;
        }
    }

    static async handleInteraction(req: Request, res: Response) {
        // 0. Security Verification (Sovereign Security)
        if (!InteractionController.verifySignature(req)) {
            return res.status(401).json({ error: 'Invalid interaction signature' });
        }

        const interaction = req.body as Interaction;

        // 1. Handle PING (Official Handshake)
        if (interaction.type === InteractionType.PING) {
            return res.json({ type: InteractionResponseType.PONG });
        }

        // 2. Lookup bot (Beacon Bot is default for system-level interactions)
        const bot = botFramework.getBotByAppId(interaction.applicationId) ||
            botFramework.getBotByName('Beacon Bot');

        if (!bot) {
            return res.status(404).json({ error: 'System Bot not authorized' });
        }

        try {
            // 3. Delegate to BotFramework
            const response = await botFramework.handleInteraction(interaction);

            if (response) {
                return res.json({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        content: response.content,
                        embeds: response.embeds,
                        flags: response.ephemeral ? 64 : 0,
                        components: response.actions?.map(a => ({
                            type: 1, // Action Row
                            components: [{
                                type: 2, // Button
                                label: a.label,
                                custom_id: typeof a.payload === 'string' ? a.payload : JSON.stringify(a.payload),
                                style: 1 // Primary
                            }]
                        }))
                    }
                });
            }

            // 4. Fallback if no response but handled
            if (!res.headersSent) {
                return res.json({ type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE });
            }
        } catch (error) {
            console.error('Interaction error:', error);
            if (!res.headersSent) {
                return res.status(500).json({ error: 'Interaction processing failed' });
            }
        }
    }

    static async getCommands(_req: Request, res: Response) {
        try {
            const commands = botFramework.getAllCommands();
            return res.json(commands);
        } catch (error) {
            console.error('Failed to get commands:', error);
            return res.status(500).json({ error: 'Failed to fetch slash commands' });
        }
    }
}
