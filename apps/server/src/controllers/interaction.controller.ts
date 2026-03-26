import { Request, Response } from 'express';
import { InteractionType, InteractionResponseType, Interaction } from 'beacon-sdk';
import { botFramework } from '../bots';
import crypto from 'crypto';
import { prisma } from '../db';
import { publishGatewayEvent } from '../services/gatewayPublisher';

// ─── Pending Interaction Registry ────────────────────────────────────────────
// When a bot SDK responds via the callback endpoint, the response is stored here
// so the original REST request can pick it up and return it to the frontend.
const pendingInteractions = new Map<string, {
    resolve: (value: any) => void;
    timer: ReturnType<typeof setTimeout>;
}>();

const INTERACTION_TIMEOUT_MS = 15_000;

// ─── Normalizers ─────────────────────────────────────────────────────────────

const BUTTON_STYLE_MAP: Record<string, number> = {
    primary: 1, secondary: 2, success: 3, danger: 4, link: 5,
};

const SELECT_TYPE_MAP: Record<string, number> = {
    string: 3, select: 3, user: 5, role: 6, mentionable: 7, channel: 8,
};

function normalizeColor(color?: string | number | null): string | undefined {
    if (typeof color === 'number' && Number.isFinite(color)) return `#${color.toString(16).padStart(6, '0')}`;
    if (typeof color === 'string' && color.trim()) return color;
    return undefined;
}

function normalizeEmbeds(embeds?: any[]): any[] {
    if (!Array.isArray(embeds)) return [];
    return embeds.map((embed) => ({
        ...embed,
        color: normalizeColor(embed?.color),
        footer: typeof embed?.footer === 'string' ? embed.footer : embed?.footer?.text,
        thumbnail: typeof embed?.thumbnail === 'string' ? embed.thumbnail : embed?.thumbnail?.url,
        image: typeof embed?.image === 'string' ? embed.image : embed?.image?.url,
    }));
}

function normalizeCards(cards?: any[]): any[] {
    if (!Array.isArray(cards)) return [];
    return cards.map((card) => ({
        title: card?.title,
        description: card?.description,
        color: normalizeColor(card?.color),
        fields: Array.isArray(card?.fields) ? card.fields : [],
        footer: [card?.footer, card?.author?.name].filter(Boolean).join(' • ') || undefined,
        thumbnail: card?.thumbnail,
        image: card?.image,
    }));
}

function normalizeComponent(component: any): any | null {
    if (!component || typeof component !== 'object') return null;
    const rawType = String(component.type || '').toLowerCase();
    const customId = component.custom_id || component.customId;

    if ('style' in component || rawType === 'button' || component.url) {
        return {
            type: 2,
            label: component.label,
            custom_id: customId,
            style: BUTTON_STYLE_MAP[String(component.style || 'primary').toLowerCase()] || Number(component.style) || 1,
            emoji: component.emoji,
            url: component.url,
            disabled: Boolean(component.disabled),
        };
    }

    if ('options' in component || customId) {
        const mappedType = SELECT_TYPE_MAP[rawType] || Number(component.componentType) || 3;
        const options = Array.isArray(component.options)
            ? component.options.map((option: any) => ({
                label: option.label,
                value: option.value,
                description: option.description,
                emoji: option.emoji,
                default: option.default,
            }))
            : [];
        return {
            type: mappedType,
            custom_id: customId,
            placeholder: component.placeholder,
            min_values: component.min_values ?? component.minValues,
            max_values: component.max_values ?? component.maxValues,
            disabled: Boolean(component.disabled),
            options,
        };
    }

    return null;
}

function normalizeComponents(response: any): any[] {
    const rows: any[] = [];
    if (Array.isArray(response?.components)) {
        for (const row of response.components) {
            const sourceComponents = Array.isArray(row?.components) ? row.components : [row];
            const normalized = sourceComponents.map(normalizeComponent).filter(Boolean);
            if (normalized.length > 0) rows.push({ type: 1, components: normalized });
        }
    }
    if (Array.isArray(response?.actions)) {
        for (const action of response.actions) {
            rows.push({
                type: 1,
                components: [{
                    type: 2,
                    label: action.label,
                    custom_id: typeof action.payload === 'string' ? action.payload : JSON.stringify(action.payload),
                    style: 1,
                }],
            });
        }
    }
    return rows;
}

// Normalize modal components (text inputs) for the frontend
function normalizeModalComponents(components?: any[]): any[] {
    if (!Array.isArray(components)) return [];
    return components.map((row) => {
        // Already wrapped in ActionRow
        if (row.type === 1 && Array.isArray(row.components)) {
            return {
                type: 1,
                components: row.components.map((c: any) => ({
                    type: c.type || 4, // 4 = TextInput
                    custom_id: c.custom_id || c.customId,
                    label: c.label,
                    style: c.style || 1, // 1=short, 2=paragraph
                    placeholder: c.placeholder,
                    value: c.value,
                    required: c.required !== false,
                    min_length: c.min_length ?? c.minLength,
                    max_length: c.max_length ?? c.maxLength,
                })),
            };
        }
        // Unwrapped single component — wrap it
        return {
            type: 1,
            components: [{
                type: row.type || 4,
                custom_id: row.custom_id || row.customId,
                label: row.label,
                style: row.style || 1,
                placeholder: row.placeholder,
                value: row.value,
                required: row.required !== false,
                min_length: row.min_length ?? row.minLength,
                max_length: row.max_length ?? row.maxLength,
            }],
        };
    });
}

// ─── Build Response Data ─────────────────────────────────────────────────────

function buildResponsePayload(response: any): { type: number; data: any } {
    // Modal response (type 9)
    if (response._responseType === InteractionResponseType.MODAL || response._modal) {
        const modal = response._modal || response;
        return {
            type: InteractionResponseType.MODAL,
            data: {
                custom_id: modal.customId || modal.custom_id,
                title: modal.title,
                components: normalizeModalComponents(modal.components),
            },
        };
    }

    // Autocomplete response (type 8)
    if (response._responseType === InteractionResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT || response._choices) {
        return {
            type: InteractionResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
            data: { choices: response._choices || response.choices || [] },
        };
    }

    // Deferred response (type 5)
    if (response._responseType === InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE || response._deferred) {
        return {
            type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
            data: { flags: response.ephemeral ? 64 : 0 },
        };
    }

    // Deferred update (type 6) — for components
    if (response._responseType === InteractionResponseType.DEFERRED_UPDATE_MESSAGE) {
        return {
            type: InteractionResponseType.DEFERRED_UPDATE_MESSAGE,
            data: {},
        };
    }

    // Update message (type 7) — edit the message the component is attached to
    if (response._responseType === InteractionResponseType.UPDATE_MESSAGE) {
        const embeds = [...normalizeEmbeds(response.embeds), ...normalizeCards(response.cards)];
        const components = normalizeComponents(response);
        return {
            type: InteractionResponseType.UPDATE_MESSAGE,
            data: {
                content: response.content,
                embeds: embeds.length > 0 ? embeds : undefined,
                components: components.length > 0 ? components : undefined,
            },
        };
    }

    // Default: Channel message with source (type 4)
    const embeds = [...normalizeEmbeds(response.embeds), ...normalizeCards(response.cards)];
    const components = normalizeComponents(response);
    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: response.content,
            embeds: embeds.length > 0 ? embeds : undefined,
            flags: response.ephemeral ? 64 : 0,
            components: components.length > 0 ? components : undefined,
        },
    };
}

// ─── Controller ──────────────────────────────────────────────────────────────

export class InteractionController {
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

    // ─── Main Interaction Handler ────────────────────────────────────────────
    static async handleInteraction(req: Request, res: Response) {
        const hasSignatureHeaders = Boolean(
            req.headers['x-signature-ed25519'] && req.headers['x-signature-timestamp']
        );

        if (hasSignatureHeaders && !InteractionController.verifySignature(req)) {
            return res.status(401).json({ error: 'Invalid interaction signature' });
        }

        if (!hasSignatureHeaders && !(req as any).user?.id) {
            return res.status(401).json({ error: 'Unauthorized interaction request' });
        }

        const interaction = req.body as Interaction;

        // 1. PING
        if (interaction.type === InteractionType.PING) {
            return res.json({ type: InteractionResponseType.PONG });
        }

        // 2. Lookup bot
        const bot = botFramework.getBotByAppId(interaction.applicationId) ||
            botFramework.getBotByName('Official Beacon Bot') ||
            botFramework.getBotByName('Beacon Bot');

        if (!bot) {
            return res.status(404).json({ error: 'System Bot not authorized' });
        }

        try {
            // 3. Delegate to BotFramework (handles all interaction types)
            const response = await botFramework.handleInteraction(interaction, bot);

            if (response) {
                const responseData = buildResponsePayload(response);

                // Broadcast bot reply to channel participants via WS
                // (Skip ephemeral, deferred, autocomplete, and modal responses)
                const channelId = interaction.channelId;
                const shouldBroadcast = channelId &&
                    !response.ephemeral &&
                    responseData.type === InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE;

                if (shouldBroadcast) {
                    try {
                        const channel = await prisma?.channel.findUnique({
                            where: { id: channelId },
                            select: {
                                type: true,
                                guildId: true,
                                recipients: { select: { id: true } },
                            },
                        });

                        const botMessage = {
                            id: `bot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                            channelId,
                            content: responseData.data.content || '',
                            embeds: responseData.data.embeds,
                            components: responseData.data.components,
                            authorId: 'BEACON_SYSTEM_BOT',
                            author: { id: 'BEACON_SYSTEM_BOT', username: bot?.name || 'Beacon Bot', avatar: null, bot: true },
                            attachments: [],
                            createdAt: new Date().toISOString(),
                            guild_id: channel?.guildId ?? null,
                        };

                        const isDM = channel?.type === 'DM' || channel?.type === 'GROUP_DM';
                        if (isDM && channel?.recipients?.length) {
                            const recipientIds = channel.recipients.map((r: { id: string }) => r.id);
                            await publishGatewayEvent('MESSAGE_CREATE', botMessage, null, recipientIds);
                        } else {
                            await publishGatewayEvent('MESSAGE_CREATE', botMessage, channel?.guildId ?? null);
                        }
                    } catch (broadcastErr) {
                        console.warn('[Interaction] WS broadcast failed:', broadcastErr);
                    }
                }

                return res.json(responseData);
            }

            // 4. Fallback if no response but handled
            if (!res.headersSent) {
                const deferredType = interaction.type === InteractionType.MESSAGE_COMPONENT
                    ? InteractionResponseType.DEFERRED_UPDATE_MESSAGE
                    : InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE;

                return res.json({ type: deferredType });
            }
        } catch (error) {
            console.error('Interaction error:', error);
            if (!res.headersSent) {
                return res.status(500).json({ error: 'Interaction processing failed' });
            }
        }
    }

    // ─── Interaction Callback (SDK bots respond here) ────────────────────────
    // POST /interactions/:id/:token/callback
    // This is called by bot SDKs (via InteractionContext.reply/showModal/etc.)
    static async handleInteractionCallback(req: Request, res: Response) {
        const { id, token } = req.params;
        const key = `${id}:${token}`;

        const pending = pendingInteractions.get(key);
        if (!pending) {
            // No pending interaction — this is a standalone callback.
            // Process it as a direct response (e.g., a bot replying via REST).
            const callbackData = req.body;

            // If it's a message response, broadcast to the channel
            if (callbackData.type === InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE && callbackData.data) {
                const channelId = callbackData.channelId || req.body.channelId;
                if (channelId) {
                    const embeds = normalizeEmbeds(callbackData.data.embeds);
                    const components = normalizeComponents(callbackData.data);

                    const botMessage = {
                        id: `bot-cb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                        channelId,
                        content: callbackData.data.content || '',
                        embeds: embeds.length > 0 ? embeds : undefined,
                        components: components.length > 0 ? components : undefined,
                        authorId: 'BEACON_SYSTEM_BOT',
                        author: { id: 'BEACON_SYSTEM_BOT', username: 'Beacon Bot', avatar: null, bot: true },
                        attachments: [],
                        createdAt: new Date().toISOString(),
                    };

                    try {
                        await publishGatewayEvent('MESSAGE_CREATE', botMessage);
                    } catch (err) {
                        console.warn('[Callback] Broadcast failed:', err);
                    }
                }
            }

            return res.json({ success: true });
        }

        // Resolve the pending interaction with the callback data
        clearTimeout(pending.timer);
        pendingInteractions.delete(key);
        pending.resolve(req.body);

        return res.json({ success: true });
    }

    // ─── Webhook-style follow-up / edit / delete ─────────────────────────────
    // PATCH /webhooks/:applicationId/:token/messages/@original
    static async handleEditOriginal(req: Request, res: Response) {
        const { applicationId: _appId, token: _token } = req.params;
        const data = req.body;

        // For now, publish an update event to connected clients
        const embeds = normalizeEmbeds(data.embeds);
        const components = normalizeComponents(data);

        await publishGatewayEvent('MESSAGE_UPDATE', {
            content: data.content,
            embeds: embeds.length > 0 ? embeds : undefined,
            components: components.length > 0 ? components : undefined,
        });

        return res.json({ success: true });
    }

    // POST /webhooks/:applicationId/:token (follow-up message)
    static async handleFollowUp(req: Request, res: Response) {
        const data = req.body;
        const embeds = normalizeEmbeds(data.embeds);
        const components = normalizeComponents(data);

        const message = {
            id: `followup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            content: data.content || '',
            embeds: embeds.length > 0 ? embeds : undefined,
            components: components.length > 0 ? components : undefined,
            authorId: 'BEACON_SYSTEM_BOT',
            author: { id: 'BEACON_SYSTEM_BOT', username: 'Beacon Bot', avatar: null, bot: true },
            attachments: [],
            createdAt: new Date().toISOString(),
            flags: data.flags,
        };

        await publishGatewayEvent('MESSAGE_CREATE', message);
        return res.json(message);
    }

    // DELETE /webhooks/:applicationId/:token/messages/@original
    static async handleDeleteOriginal(_req: Request, res: Response) {
        return res.json({ success: true });
    }

    // ─── Get Commands ────────────────────────────────────────────────────────
    static async getCommands(_req: Request, res: Response) {
        try {
            const commands = botFramework.getAllCommands();
            return res.json(commands);
        } catch (error) {
            console.error('Failed to get commands:', error);
            return res.status(500).json({ error: 'Failed to fetch slash commands' });
        }
    }

    // ─── Utility: Register pending interaction ───────────────────────────────
    static registerPending(interactionId: string, token: string): Promise<any> {
        return new Promise((resolve) => {
            const key = `${interactionId}:${token}`;
            const timer = setTimeout(() => {
                pendingInteractions.delete(key);
                resolve(null); // Timed out
            }, INTERACTION_TIMEOUT_MS);

            pendingInteractions.set(key, { resolve, timer });
        });
    }
}
