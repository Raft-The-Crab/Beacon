import { Request, Response } from 'express';
import { InteractionType, InteractionResponseType, Interaction } from '@beacon/types';
import { botFramework } from '../bots';
import crypto from 'crypto';

const BUTTON_STYLE_MAP: Record<string, number> = {
    primary: 1,
    secondary: 2,
    success: 3,
    danger: 4,
    link: 5,
};

const SELECT_TYPE_MAP: Record<string, number> = {
    string: 3,
    select: 3,
    user: 5,
    role: 6,
    mentionable: 7,
    channel: 8,
};

function normalizeColor(color?: string | number | null): string | undefined {
    if (typeof color === 'number' && Number.isFinite(color)) {
        return `#${color.toString(16).padStart(6, '0')}`;
    }

    if (typeof color === 'string' && color.trim()) {
        return color;
    }

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
            if (normalized.length > 0) {
                rows.push({ type: 1, components: normalized });
            }
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
        // External gateway/webhook requests must include signature headers.
        // Internal first-party calls are already authenticated via middleware.
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
                const embeds = [...normalizeEmbeds(response.embeds), ...normalizeCards(response.cards)];
                const components = normalizeComponents(response);

                return res.json({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        content: response.content,
                        embeds: embeds.length > 0 ? embeds : undefined,
                        flags: response.ephemeral ? 64 : 0,
                        components: components.length > 0 ? components : undefined,
                    }
                });
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
