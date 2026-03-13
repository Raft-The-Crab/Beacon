import { Helmet } from 'react-helmet-async'
import { DocsLayout } from '../../components/layout/DocsLayout'
import styles from '../../styles/modules/pages/DocsPage.module.css'

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
                    <div className={styles.infoBox}>
                        Latest SDK package: <a href="https://www.npmjs.com/package/@beacon/sdk" target="_blank" rel="noreferrer">@beacon/sdk on npm</a>.
                    </div>
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
                    <h2>4. Interactive Builders</h2>
                    <p>Add interactive components to your messages using specialized builders.</p>

                    <h3>Buttons</h3>
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
});`}</code>
                    </pre>

                    <h3>Dropdowns (Select Menus)</h3>
                    <p>Dropdowns allow users to pick one or more options from a list:</p>
                    <pre className={styles.code}>
                        <code>{`import { SelectMenuBuilder, ActionRowBuilder } from '@beacon/sdk';

bot.command({
    name: 'roles',
    description: 'Pick your server roles',
    execute: async (ctx) => {
        const menu = new SelectMenuBuilder()
            .setCustomId('role_select')
            .setPlaceholder('Pick a role...')
            .addOptions([
                { label: 'Developer', value: 'role_dev', description: 'Access to dev channels' },
                { label: 'Designer', value: 'role_design', description: 'Access to design channels' }
            ])
            .setMinValues(1)
            .setMaxValues(1);

        const row = new ActionRowBuilder().addComponents(menu);
        await ctx.reply({ content: 'Select your team:', components: [row] });
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
                    <h2>6. Forms and Timeline Builders</h2>
                    <p>
                        For complex user input or tracking activity, use the Form and Timeline builders.
                    </p>

                    <h3>Form Builder</h3>
                    <pre className={styles.code}>
                        <code>{`import { FormBuilder, TextInputBuilder } from '@beacon/sdk';

bot.command({
    name: 'feedback',
    description: 'Send feedback to developers',
    execute: async (ctx) => {
        const form = new FormBuilder()
            .setCustomId('feedback_form')
            .setTitle('Platform Feedback')
            .addComponents(
                new TextInputBuilder()
                    .setCustomId('subject')
                    .setLabel('Subject')
                    .setStyle('Short')
                    .setRequired(true),
                new TextInputBuilder()
                    .setCustomId('body')
                    .setLabel('Your Message')
                    .setStyle('Paragraph')
                    .setRequired(true)
            );

        await ctx.showForm(form);
    }
});`}</code>
                    </pre>

                    <h3>Timeline Builder</h3>
                    <p>Create visual vertical timelines for logs or activity feeds:</p>
                    <pre className={styles.code}>
                        <code>{`import { TimelineBuilder } from '@beacon/sdk';

bot.command({
    name: 'history',
    description: 'Show bot deployment history',
    execute: async (ctx) => {
        const timeline = new TimelineBuilder()
            .addEvent({ 
                title: 'v2.4 Released', 
                time: '2 hours ago', 
                type: 'success',
                content: 'Improved voice gateway stability.' 
            })
            .addEvent({ 
                title: 'Maintenance', 
                time: '6 hours ago', 
                type: 'warn',
                content: 'Database scaling completed.' 
            });

        await ctx.reply({ timelines: [timeline] });
    }
});`}</code>
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

                <section>
                    <h2>9. Managers — Guild, Channel, Member</h2>
                    <p>
                        The SDK ships with dedicated manager classes that wrap REST calls with automatic caching.
                        Access them directly from the client:
                    </p>
                    <pre className={styles.code}>
                        <code>{`// Fetch a guild with caching
const guild = await client.guildManager.fetch('guild-id');

// Create a channel
const channel = await client.channelManager.create(guild.id, {
    name: 'bot-logs',
    type: 'TEXT',
    topic: 'Automated bot logs',
});

// Fetch message history
const messages = await client.channelManager.fetchMessages(channel.id, {
    limit: 50,
    before: 'some-message-id',
});

// Member management
const members = await client.memberManager.list(guild.id, { limit: 100 });
await client.memberManager.addRole(guild.id, 'user-id', 'role-id');
await client.memberManager.timeout(guild.id, 'user-id', new Date(Date.now() + 60000));`}</code>
                    </pre>
                    <div className={styles.infoBox}>
                        All managers use <strong>cache-first</strong> fetching. Pass <code>force: true</code> to bypass the cache and hit the API directly.
                    </div>
                </section>

                <section>
                    <h2>10. Presence tracking</h2>
                    <p>
                        Track who's online in real time using the <code>PresenceManager</code>:
                    </p>
                    <pre className={styles.code}>
                        <code>{`// Check if a user is online
const isOnline = client.presences.isOnline('user-id');

// Get all online users
const online = client.presences.getOnline();
console.log(\`\${client.presences.onlineCount} users online\`);

// Listen for presence updates
client.on('presenceUpdate', (oldPresence, newPresence) => {
    if (newPresence.status === 'online') {
        console.log(\`\${newPresence.userId} came online!\`);
    }
});`}</code>
                    </pre>
                </section>

                <section>
                    <h2>11. Message collectors</h2>
                    <p>
                        Collect messages that match a filter, perfect for multi-step interactions:
                    </p>
                    <pre className={styles.code}>
                        <code>{`// Collect up to 5 messages in 30 seconds
const collector = client.createMessageCollector(channelId, {
    filter: (msg) => msg.author_id === userId,
    max: 5,
    timeout: 30000,
});

collector.on('collect', (msg) => {
    console.log('Collected:', msg.content);
});

collector.on('end', (collected) => {
    console.log(\`Collected \${collected.length} messages\`);
});

// Or await a single message
const reply = await client.awaitMessage(channelId, {
    filter: (msg) => msg.content.startsWith('yes'),
    timeout: 15000,
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
