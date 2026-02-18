import { Helmet } from 'react-helmet-async'
import { DocsLayout } from '../../components/layout/DocsLayout'
import styles from './DocsPage.module.css'

export function GettingStarted() {
    return (
        <DocsLayout>
            <Helmet>
                <title>Getting Started - Beacon Docs</title>
            </Helmet>

            <article className={`${styles.article} animate-fadeIn`}>
                <h1 className="accent-text">Getting Started</h1>
                <p className={styles.lead}>
                    Welcome! This guide will get you from zero to a working bot in about 5 minutes.
                    No prior experience with Beacon's API needed.
                </p>

                <section>
                    <h2>What you'll need</h2>
                    <ul>
                        <li>A <strong>Beacon account</strong> — <a href="/login">create one free</a></li>
                        <li><strong>Node.js 18+</strong> installed on your machine</li>
                        <li>Basic JavaScript or TypeScript knowledge</li>
                    </ul>
                </section>

                <section>
                    <h2>Step 1 — Create an Application</h2>
                    <p>
                        Head to the <a href="/developer">Developer Portal</a> and click <strong>"New App"</strong>.
                        Give it a name, then open the app to find your <strong>Client ID</strong> and <strong>Bot Token</strong>.
                    </p>
                    <div className={styles.infoBox}>
                        🔒 <strong>Keep your bot token secret.</strong> Anyone who has it can control your bot. If it leaks, regenerate it immediately from the Developer Portal.
                    </div>
                </section>

                <section>
                    <h2>Step 2 — Install the SDK</h2>
                    <p>Install the official Beacon SDK with npm, yarn, or pnpm:</p>
                    <pre className={`${styles.code} glass`}>
                        <code>npm install @beacon/sdk</code>
                    </pre>
                    <p>Or with pnpm:</p>
                    <pre className={`${styles.code} glass`}>
                        <code>pnpm add @beacon/sdk</code>
                    </pre>
                </section>

                <section>
                    <h2>Step 3 — Write your first bot</h2>
                    <p>Create a new file called <code>bot.js</code> and paste this in:</p>
                    <pre className={`${styles.code} glass`}>
                        <code>{`import { BeaconClient } from '@beacon/sdk';

const client = new BeaconClient({
    token: 'YOUR_BOT_TOKEN'
});

client.on('ready', () => {
    console.log(\`Logged in as \${client.user.username}!\`);
});

client.on('messageCreate', (message) => {
    // Ignore messages from bots (including yourself)
    if (message.author.bot) return;

    if (message.content === '!ping') {
        message.reply('Pong! 🏓');
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
                    <h2>Step 4 — Invite your bot to a server</h2>
                    <p>
                        Go back to the <a href="/developer">Developer Portal</a>, open your app, and use the
                        invite link generator to add your bot to a server you own. Select the permissions
                        your bot will need (start with <strong>Send Messages</strong> and <strong>Read Message History</strong>).
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
