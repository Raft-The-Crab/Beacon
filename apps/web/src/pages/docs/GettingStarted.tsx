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
                    Welcome to the Beacon developer platform. This guide will help you set up your environment
                    and start building on Beacon.
                </p>

                <section>
                    <h2>Prerequisites</h2>
                    <p>To follow this guide, you will need:</p>
                    <ul>
                        <li>A Beacon account</li>
                        <li>Node.js 18.x or later installed</li>
                        <li>Basic knowledge of JavaScript or TypeScript</li>
                    </ul>
                </section>

                <section>
                    <h2>1. Create an Application</h2>
                    <p>
                        Head over to the <a href="/developer">Developer Portal</a> and click on
                        "New Application". This will generate your <strong>Client ID</strong> and
                        <strong>Client Secret</strong>.
                    </p>
                    <div className={styles.infoBox}>
                        Never share your Client Secret with anyone. If leaked, you can regenerate it
                        in the Developer Portal settings.
                    </div>
                </section>

                <section>
                    <h2>2. Install the SDK</h2>
                    <p>Install the official Beacon JavaScript SDK using your preferred package manager:</p>
                    <pre className={`${styles.code} glass`}>
                        <code>npm install @beacon/sdk</code>
                    </pre>
                </section>

                <section>
                    <h2>3. Your First Bot</h2>
                    <p>Here is a snippet to get your first bot online and responding to messages:</p>
                    <pre className={`${styles.code} glass`}>
                        <code>{`import { BeaconClient } from '@beacon/sdk';

const client = new BeaconClient({
    token: 'YOUR_BOT_TOKEN'
});

client.on('messageCreate', (message) => {
    if (message.content === '!ping') {
        message.reply('Pong! 🏓');
    }
});

client.login();`}</code>
                    </pre>
                </section>
            </article>
        </DocsLayout>
    )
}
