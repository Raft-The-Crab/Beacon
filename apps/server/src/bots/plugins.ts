import { BaseBot, BotPlugin, BotContext } from './bots.js';
import { musicService } from '../services/music.service';

export class MusicPlugin implements BotPlugin {
    id = 'music';
    name = 'Music Player';

    async onCommand(ctx: BotContext) {
        if (ctx.commandName === 'play') {
            const query = ctx.options?.[0]?.value as string;
            
            await ctx.respond({
                content: `🔍 **Searching Beacon Music...** \n*Query: ${query}*`,
            });

            const metadata = await musicService.fetchMetadata(query);
            
            if (metadata) {
                await ctx.respond({
                    content: `🎵 **Now Playing:** [${metadata.title}](${metadata.url})\n**Artist:** ${metadata.artist}\n**Duration:** ${Math.floor(metadata.duration / 60)}:${(metadata.duration % 60).toString().padStart(2, '0')}\n${metadata.thumbnail ? `![thumbnail](${metadata.thumbnail})` : ''}`,
                });
            } else {
                await ctx.respond({
                    content: `❌ Could not find any results for **${query}**.`,
                });
            }
            return true;
        }
        return false;
    }

    async onMessage(ctx: BotContext) {
        const content = ctx.content || '';
        const isMusicLink = content.includes('spotify.com') || content.includes('youtube.com') || content.includes('youtu.be');
        
        if (isMusicLink) {
            const metadata = await musicService.fetchMetadata(content);
            if (metadata) {
                await ctx.respond({
                    content: `🎶 **Music Detected:** [${metadata.title}](${metadata.url}) by *${metadata.artist}*\n*Type \`/play\` to listen in a voice channel!*`,
                });
            }
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
