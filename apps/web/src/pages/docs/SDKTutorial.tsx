import { Helmet } from 'react-helmet-async'
import { DocsLayout } from '../../components/layout/DocsLayout'
import styles from './DocsPage.module.css'

export function SDKTutorial() {
    return (
        <DocsLayout>
            <Helmet>
                <title>SDK Tutorial - Beacon Docs</title>
            </Helmet>

            <article className={`${styles.article} animate-fadeIn`}>
                <h1 className="accent-text">Building Bots with the Beacon SDK</h1>
                <p className={styles.lead}>
                    The <code>@beacon/sdk</code> package makes it easy to build fully-featured bots.
                    This guide walks through setup, slash commands, interactive components, and more.
                </p>

                <section>
                    <h2>1. Install and initialize</h2>
                    <p>Install the SDK:</p>
                    <pre className={styles.code}>
                        <code>npm install @beacon/sdk</code>
                    </pre>
                    <p>Create your client:</p>
                    <pre className={styles.code}>
                        <code>{`import { BeaconClient } from '@beacon/sdk';

const client = new BeaconClient({
    token: process.env.BOT_TOKEN,
    intents: ['GUILDS', 'GUILD_MESSAGES', 'DIRECT_MESSAGES']
});

client.on('ready', () => {
    console.log(\`Online as \${client.user.username}!\`);
});

client.login();`}</code>
                    </pre>
                    <div className={styles.infoBox}>
                        Store your token in a <code>.env</code> file and use <code>dotenv</code> to load it. Never commit tokens to version control.
                    </div>
                </section>

                <section>
                    <h2>2. Responding to messages</h2>
                    <p>The simplest bot listens for messages and replies:</p>
                    <pre className={styles.code}>
                        <code>{`client.on('messageCreate', async (message) => {
    if (message.author.bot) return; // Ignore bots

    if (message.content === '!ping') {
        await message.reply('Pong! 🏓');
    }

    if (message.content.startsWith('!echo ')) {
        const text = message.content.slice(6);
        await message.channel.send(text);
    }
});`}</code>
                    </pre>
                </section>

                <section>
                    <h2>3. Slash commands with BotFramework</h2>
                    <p>
                        The built-in <code>BotFramework</code> makes slash commands easy to define and manage:
                    </p>
                    <pre className={styles.code}>
                        <code>{`import { BeaconClient, BotFramework } from '@beacon/sdk';

const client = new BeaconClient({ token: process.env.BOT_TOKEN });
const bot = new BotFramework(client);

bot.command({
    name: 'ping',
    description: 'Check the bot latency',
    execute: async (ctx) => {
        const latency = client.ws.ping;
        await ctx.reply(\`🏓 Pong! Latency: \${latency}ms\`);
    }
});

bot.command({
    name: 'say',
    description: 'Repeat something',
    options: [
        { name: 'text', type: 'STRING', description: 'What to say', required: true }
    ],
    execute: async (ctx) => {
        const text = ctx.options.getString('text');
        await ctx.reply(text);
    }
});

client.login();`}</code>
                    </pre>
                </section>

                <section>
                    <h2>4. Button components</h2>
                    <p>Add interactive buttons to your bot messages:</p>
                    <pre className={styles.code}>
                        <code>{`import { ButtonBuilder, ActionRowBuilder } from '@beacon/sdk';

bot.command({
    name: 'vote',
    description: 'Cast a quick vote',
    execute: async (ctx) => {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('vote_yes')
                .setLabel('👍 Yes')
                .setStyle('Success'),
            new ButtonBuilder()
                .setCustomId('vote_no')
                .setLabel('👎 No')
                .setStyle('Danger')
        );

        await ctx.reply({ content: 'What do you think?', components: [row] });
    }
});

// Handle button clicks
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'vote_yes') {
        await interaction.reply({ content: 'You voted yes!', ephemeral: true });
    }
    if (interaction.customId === 'vote_no') {
        await interaction.reply({ content: 'You voted no!', ephemeral: true });
    }
});`}</code>
                    </pre>
                </section>

                <section>
                    <h2>5. Embeds</h2>
                    <p>Send rich embed messages with titles, descriptions, colors, and more:</p>
                    <pre className={styles.code}>
                        <code>{`import { EmbedBuilder } from '@beacon/sdk';

bot.command({
    name: 'info',
    description: 'Server info',
    execute: async (ctx) => {
        const guild = ctx.guild;
        const embed = new EmbedBuilder()
            .setTitle(guild.name)
            .setDescription('Here is some info about this server.')
            .setColor('#7c3aed')
            .addFields(
                { name: 'Members', value: \`\${guild.memberCount}\`, inline: true },
                { name: 'Created', value: guild.createdAt.toDateString(), inline: true }
            )
            .setThumbnail(guild.iconURL());

        await ctx.reply({ embeds: [embed] });
    }
});`}</code>
                    </pre>
                </section>

                <section>
                    <h2>6. Voice Connections (Beyond Discord)</h2>
                    <p>
                        Beacon supports native 48kHz stereo Opus audio with zero external dependencies.
                        Bots can join voice channels and emit high-fidelity sound.
                    </p>
                    <pre className={styles.code}>
                        <code>{`const connection = await client.voice.join(guildId, channelId);

connection.on('stateChange', (state) => {
    console.log(\`Voice state: \${state}\`);
});

// Play local file or stream
const player = connection.createAudioPlayer();
await player.play('./soundboard/wow.mp3');`}</code>
                    </pre>
                </section>

                <section>
                    <h2>7. Theme-Aware Development</h2>
                    <p>
                        Build UIs that adapt to the user's selected theme (Glass, OLED, Neon, Midnight, Dark).
                        Use CSS variables for automatic styling.
                    </p>
                    <pre className={styles.code}>
                        <code>{`.my-component {
    background: var(--bg-primary);
    color: var(--text-primary);
    border: 1px solid var(--glass-border);
    backdrop-filter: blur(var(--glass-blur));
}`}</code>
                    </pre>
                </section>

                <section>
                    <h2>8. Permissions and errors</h2>
                    <p>Always check permissions before performing actions, and handle errors gracefully:</p>
                    <pre className={styles.code}>
                        <code>{`bot.command({
    name: 'kick',
    description: 'Kick a member',
    options: [{ name: 'user', type: 'USER', description: 'Who to kick', required: true }],
    execute: async (ctx) => {
        if (!ctx.member.permissions.has('KICK_MEMBERS')) {
            return ctx.reply({ content: "You don't have permission to kick members.", ephemeral: true });
        }

        const target = ctx.options.getUser('user');
        const member = ctx.guild.members.cache.get(target.id);

        if (!member) return ctx.reply({ content: 'Member not found.', ephemeral: true });

        try {
            await member.kick();
            await ctx.reply(\`Kicked \${target.username}.\`);
        } catch {
            await ctx.reply({ content: "Couldn't kick that member.", ephemeral: true });
        }
    }
});`}</code>
                    </pre>
                </section>

                <div className={styles.infoBox}>
                    <strong>More to explore:</strong> Check the <a href="/docs/api-reference">API Reference</a> for all available methods,
                    or the <a href="/docs/gateway-events">Gateway docs</a> for every event you can listen to.
                </div>
            </article>
        </DocsLayout>
    )
}
