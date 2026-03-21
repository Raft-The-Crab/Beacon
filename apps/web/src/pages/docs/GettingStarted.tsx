import { Helmet } from 'react-helmet-async'
import { Terminal } from 'lucide-react'
import { DocsLayout } from '../../components/layout/DocsLayout'
import styles from '../../styles/modules/pages/DocsPage.module.css'

export function GettingStarted() {
    return (
        <DocsLayout>
            <Helmet>
                <title>Getting Started - Beacon Docs</title>
            </Helmet>

            <article className={`${styles.article} animate-fadeIn`}>
                <header className={`${styles.header} premium-hero-section`} style={{ padding: '64px 0', textAlign: 'left', background: 'transparent' }}>
                    <div className="premium-badge">
                        <Terminal size={14} />
                        <span>Quick Start</span>
                    </div>
                    <h1 className="premium-hero-heading accent-text" style={{ fontSize: 48 }}>Getting Started</h1>
                    <p className="premium-hero-subtitle" style={{ margin: 0, fontSize: 18 }}>
                        Learn how to set up your account, join servers, and begin your journey in the Beacon ecosystem.
                    </p>
                </header>

                <section>
                    <h2>What you'll need</h2>
                    <ul>
                        <li>A <strong>Beacon account</strong> — <a href="/login">create one free</a></li>
                        <li><strong>Node.js 20+</strong> installed on your machine</li>
                        <li>Basic JavaScript or TypeScript knowledge</li>
                    </ul>
                </section>

                <section>
                    <h2>Step 1 — Create an Application</h2>
                    <p>
                        Open the <a href="/developer">Developer Portal</a>, create a new app, then copy your <strong>Client ID</strong> and <strong>Bot Token</strong>.
                    </p>
                    <div className={styles.infoBox}>
                        <strong>Security warning:</strong> treat your bot token like a password. If exposed, rotate it immediately.
                    </div>
                </section>

                <section>
                    <h2>Step 2 — Install the SDK</h2>
                    <p>Install the official SDK:</p>
                    <pre className={`${styles.code} glass`}>
                        <code>npm install beacon-sdk</code>
                    </pre>
                    <p>Or with pnpm:</p>
                    <pre className={`${styles.code} glass`}>
                        <code>pnpm add beacon-sdk</code>
                    </pre>
                    <div className={styles.infoBox}>
                        Package links: <a href="https://www.npmjs.com/package/beacon-sdk" target="_blank" rel="noreferrer">npm: beacon-sdk</a> and <a href="/docs/sdk-tutorial">SDK tutorial docs</a>.
                    </div>
                </section>

                <section>
                    <h2>Step 3 — Write your first bot</h2>
                    <p>Create a file called <code>bot.js</code>:</p>
                    <pre className={`${styles.code} glass`}>
                        <code>{`import { BeaconClient } from 'beacon-sdk';
import 'dotenv/config';

const client = new BeaconClient({
    token: process.env.BOT_TOKEN,
    apiUrl: process.env.BEACON_API_URL,
    wsUrl: process.env.BEACON_GATEWAY_URL
});

client.on('ready', () => {
    console.log(\`Logged in as \${client.user?.username}\`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === '!ping') {
        await message.reply('Pong!');
    }
});

client.login();`}</code>
                    </pre>
                    <p>Then run it:</p>
                    <pre className={`${styles.code} glass`}>
                        <code>node bot.js</code>
                    </pre>
                </section>

        <section>
          <h2>Step 4 — Add environment variables</h2>
          <p>Create a <code>.env</code> file in your bot project:</p>
          <pre className={`${styles.code} glass`}>
            <code>{`BOT_TOKEN=your_bot_token_here
# Primary URL
BEACON_API_URL=https://api.beacon.qzz.io/api
BEACON_GATEWAY_URL=wss://gateway.beacon.qzz.io/gateway

# Railway Fallback (Use if primary is blocked)
# BEACON_API_URL=https://beacon-production-72fe.up.railway.app/api
# BEACON_GATEWAY_URL=wss://beacon-production-72fe.up.railway.app/gateway`}</code>
          </pre>
        </section>

                <section>
                    <h2>Step 5 — Invite your bot to a server</h2>
                    <p>
                        In the <a href="/developer">Developer Portal</a>, generate an invite URL and add your bot to a server you control.
                        Start with <strong>Send Messages</strong> and <strong>Read Message History</strong> permissions.
                    </p>
                </section>

                <section>
                    <h2>What's next?</h2>
                    <ul>
                        <li><a href="/docs/sdk-tutorial">Build slash commands and buttons</a> with the Bot Framework</li>
                        <li><a href="/docs/gateway-events">Learn about Gateway events</a> for real-time updates</li>
                        <li><a href="/docs/api-reference">Browse the full API reference</a> for every endpoint</li>
                    </ul>
                </section>
            </article>
        </DocsLayout>
    )
}
