import { BaseBot, BotPlugin, BotContext } from './bots.js';

export class MusicPlugin implements BotPlugin {
    id = 'music';
    name = 'Music Player';

    async onCommand(ctx: BotContext) {
        if (ctx.commandName === 'play') {
            const query = ctx.options?.[0]?.value as string;
            await ctx.respond({
                content: `🎵 Searching for **${query}**... This would typically interface with a voice engine.`,
            });
            return true;
        }
        return false;
    }

    async onMessage(ctx: BotContext) {
        // Optional: detect song links and show previews
        if (ctx.content?.includes('spotify.com') || ctx.content?.includes('youtube.com')) {
            await ctx.respond({
                content: '🎶 *I see you posted a music link! Need help playing it in a voice channel?*',
            });
        }
    }
}

export class ModerationPlugin implements BotPlugin {
    id = 'moderation';
    name = 'Auto-Mod Elite';

    async onMessage(ctx: BotContext) {
        const content = ctx.content?.toLowerCase() || '';
        const forbidden = ['badword1', 'badword2']; // Example

        for (const word of forbidden) {
            if (content.includes(word)) {
                await ctx.respond({
                    content: `⚠️ **Moderation:** User <@${ctx.userId}> used forbidden language. Message flagged for review.`,
                });
                break;
            }
        }
    }

    async onCommand(ctx: BotContext) {
        if (ctx.commandName === 'warn') {
            const targetId = ctx.options?.[0]?.value as string;
            const reason = ctx.options?.[1]?.value as string || 'No reason provided';

            await ctx.respond({
                content: `🔨 <@${ctx.userId}> has warned <@${targetId}> for: *${reason}*`,
            });
            return true;
        }
        return false;
    }
}
