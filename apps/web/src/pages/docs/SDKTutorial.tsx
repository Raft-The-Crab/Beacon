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
                <h1 className="accent-text">Bot Framework SDK v2.5.0 Tutorial</h1>
                <p className={styles.lead}>
                    Learn how to build powerful, multi-platform bots using the Beacon Bot SDK.
                    This guide covers authentication, event handling, and advanced command patterns.
                </p>

                <section>
                    <h2>Overview</h2>
                    <p>
                        The Beacon Bot SDK (<code>@beacon/sdk</code>) is designed for high performance
                        and ease of use. Version 2.5.0 introduces enhanced WebSocket stability and
                        improved type safety for complex event payloads.
                    </p>
                </section>

                <section>
                    <h2>1. Setup and Initialization</h2>
                    <p>
                        Beacon SDK is a standard Node.js library. You can use it in any JavaScript
                        or TypeScript project. First, install the SDK:
                    </p>
                    <pre className={styles.code}>
                        <code>npm install @beacon/sdk@2.5.0</code>
                    </pre>
                    <p>Initialize your client (works in both <code>require</code> and <code>import</code>):</p>
                    <pre className={styles.code}>
                        <code>{`// For Node.js (CommonJS)
const { BeaconClient } = require('@beacon/sdk');

// For Modern Node.js (ESM)
// import { BeaconClient } from '@beacon/sdk';

const client = new BeaconClient({
    token: 'YOUR_BOT_TOKEN'
});
`}</code>
                    </pre>
                </section>

                <section>
                    <h2>2. Handling Messages</h2>
                    <p>Respond to user messages using the <code>messageCreate</code> event:</p>
                    <pre className={styles.code}>
                        <code>{`client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === '!hello') {
        await message.reply('Hello from Beacon SDK v2.5.0! 🚀');
    }
});`}</code>
                    </pre>
                </section>

                <section>
                    <h2>3. Advanced Command Framework</h2>
                    <p>Use the built-in <code>BotFramework</code> for structured command management:</p>
                    <pre className={styles.code}>
                        <code>{`import { BotFramework } from '@beacon/sdk';

const bot = new BotFramework(client);

bot.command({
    name: 'ping',
    description: 'Check bot latency',
    execute: async (ctx) => {
        const latency = client.ws.ping;
        await ctx.reply(\`Pong! Latency: \${latency}ms\`);
    }
});`}</code>
                    </pre>
                </section>

                <section>
                    <h2>4. Multi-Platform Considerations</h2>
                    <p>
                        Beacon bots can be controlled via the Desktop app or Mobile interface.
                        Ensure your bot handles interactive elements like buttons and modals which
                        render beautifully across all v2.3.0+ clients.
                    </p>
                </section>

                <div className={styles.infoBox}>
                    <strong>Tip:</strong> Check out the <a href="/docs/api-reference">API Reference</a>
                    for a full list of available events and methods.
                </div>
            </article>
        </DocsLayout>
    )
}
