import { Helmet } from 'react-helmet-async'
import { Cpu } from 'lucide-react'
import { DocsLayout } from '../../components/layout/DocsLayout'
import styles from '../../styles/modules/pages/DocsPage.module.css'

export function BotCommands() {
    return (
        <DocsLayout>
            <Helmet>
                <title>Bot Commands - Beacon Docs</title>
            </Helmet>

            <article className={`${styles.article} animate-fadeIn`}>
                <header className={`${styles.header} premium-hero-section`} style={{ padding: '64px 0', textAlign: 'left', background: 'transparent' }}>
                    <div className="premium-badge">
                        <Cpu size={14} />
                        <span>Interactive Apps</span>
                    </div>
                    <h1 className="premium-hero-heading accent-text" style={{ fontSize: 48 }}>Bot Commands & Interactions</h1>
                    <p className="premium-hero-subtitle" style={{ margin: 0, fontSize: 18 }}>
                        Build rich interactive experiences with slash commands, prefix support, and AI-driven NLU.
                    </p>
                </header>

                <section>
                    <h2>Built-in Commands</h2>
                    <p>Beacon Bot responds to these commands out of the box:</p>
                    <div className={styles.table}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Command</th>
                                    <th>Description</th>
                                    <th>Cooldown</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td><code>/help</code></td><td>List all available commands with descriptions</td><td>5s</td></tr>
                                <tr><td><code>/ping</code></td><td>Check bot latency, memory, and uptime</td><td>3s</td></tr>
                                <tr><td><code>/stats</code></td><td>Detailed server statistics in an embed</td><td>10s</td></tr>
                                <tr><td><code>/moderate &lt;text&gt;</code></td><td>Run text through the AI moderation pipeline</td><td>5s</td></tr>
                                <tr><td><code>/beacoin [balance|daily]</code></td><td>Check your Beacoin balance or claim daily reward</td><td>3s</td></tr>
                                <tr><td><code>/about</code></td><td>Learn about the Beacon platform</td><td>5s</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div className={styles.infoBox}>
                        All commands also work with the <code>!</code> prefix. For example, <code>!help</code> is the same as <code>/help</code>.
                    </div>
                </section>

                <section>
                    <h2>How Commands Work</h2>
                    <p>
                        The bot framework uses a <strong>3-tier priority system</strong> to route messages:
                    </p>
                    <ol>
                        <li><strong>Slash commands</strong> (<code>/command</code>) — Highest priority, parsed first</li>
                        <li><strong>Prefix commands</strong> (<code>!command</code>) — Converted to slash internally</li>
                        <li><strong>Mention/NLU</strong> — Natural language when you mention a bot by name</li>
                    </ol>
                    <p>
                        Each bot can register multiple commands with options, cooldowns, and handlers.
                        All registered bots are checked for matches — not just the first one.
                    </p>
                </section>

                <section>
                    <h2>Rich Responses</h2>
                    <p>Bot responses can include several types of rich content:</p>
                    <h3>Embeds</h3>
                    <p>
                        Embeds are colored cards with titles, descriptions, field grids, and footers.
                        They appear below the bot's message text.
                    </p>
                    <pre className={styles.code}>
                        <code>{`{
    content: '📊 Server Stats',
    embeds: [{
        title: 'Beacon Statistics',
        color: '#00D166',
        fields: [
            { name: 'Uptime', value: '42 min', inline: true },
            { name: 'Memory', value: '128 MB', inline: true },
            { name: 'Users', value: '1,234', inline: true },
        ],
        footer: 'Last updated just now',
    }],
}`}</code>
                    </pre>

                    <h3>Action Buttons</h3>
                    <p>
                        Bots can attach clickable buttons that trigger follow-up actions:
                    </p>
                    <pre className={styles.code}>
                        <code>{`{
    content: '💰 Your Beacoin Wallet',
    actions: [
        { type: 'button', label: '📅 Claim Daily', payload: { command: '/beacoin daily' } },
        { type: 'button', label: '🏪 Shop', payload: { command: '/shop' } },
    ],
}`}</code>
                    </pre>

                    <h3>Ephemeral Messages</h3>
                    <p>
                        Set <code>ephemeral: true</code> to make a response visible only to the user who triggered the command.
                        Useful for moderation results and error messages.
                    </p>
                </section>

                <section>
                    <h2>Creating Your Own Bot</h2>
                    <p>
                        Extend the <code>BaseBot</code> class and register commands in the constructor:
                    </p>
                    <pre className={styles.code}>
                        <code>{`import { BaseBot, BotContext, BotResponse } from './bots';

class WeatherBot extends BaseBot {
    constructor() {
        super('Weather', 'A weather forecasting bot', '!');

        this.registerCommand({
            name: 'weather',
            description: 'Get the weather forecast',
            options: [
                { name: 'city', description: 'City name', type: 'string', required: true }
            ],
            cooldownMs: 10000,
            handler: async (args, ctx) => ({
                content: \`☀️ Weather for \${args.city || 'Unknown'}: 72°F, Sunny\`,
                embeds: [{
                    title: \`\${args.city} Forecast\`,
                    color: '#FEE75C',
                    fields: [
                        { name: 'Temperature', value: '72°F', inline: true },
                        { name: 'Humidity', value: '45%', inline: true },
                        { name: 'Wind', value: '12 mph', inline: true },
                    ],
                }],
            }),
        });
    }

    async onMessage(content: string, context: BotContext): Promise<BotResponse> {
        return { content: 'Try /weather <city> for a forecast!' };
    }
}`}</code>
                    </pre>
                    <p>Then register it in your bot init file:</p>
                    <pre className={styles.code}>
                        <code>{`import { botFramework } from './bots';
const weatherBot = new WeatherBot();
botFramework.registerBot(weatherBot);`}</code>
                    </pre>
                </section>

                <section>
                    <h2>Cooldown System</h2>
                    <p>
                        Every command can define a <code>cooldownMs</code> value. Cooldowns are tracked per-user per-command —
                        so User A's cooldown on <code>/ping</code> doesn't affect User B.
                        When a cooldown is active, the bot returns an ephemeral "try again shortly" message.
                    </p>
                </section>

                <section>
                    <h2>Beacon AI & Direct Messages</h2>
                    <p>
                        When mentioned by name in a server (e.g., "Hey Beacon Bot, how do I build a bot?"), Beacon Bot uses an AI language model
                        to generate conversational responses. It maintains context through a long-term memory system
                        that remembers user insights and channel topics.
                    </p>
                    <div className={styles.infoBox}>
                        <strong>Direct Message Restriction:</strong> To maintain security and focus on integration, you cannot send raw text messages to the <strong>Beacon Bot</strong> in DMs. Please use <strong>Slash Commands</strong> (<code>/</code>) to interact with it directly.
                    </div>
                </section>

                <div className={styles.infoBox}>
                    <strong>Next steps:</strong> See the <a href="/docs/sdk-tutorial">SDK Tutorial</a> for building bots with
                    the full SDK, or the <a href="/docs/api-reference">API Reference</a> for all endpoints.
                </div>
            </article>
        </DocsLayout>
    )
}
