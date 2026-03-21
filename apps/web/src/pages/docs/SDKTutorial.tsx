import { Helmet } from 'react-helmet-async'
import { BookOpen } from 'lucide-react'
import { DocsLayout } from '../../components/layout/DocsLayout'
import styles from '../../styles/modules/pages/DocsPage.module.css'

export function SDKTutorial() {
  return (
    <DocsLayout>
      <Helmet>
        <title>SDK Tutorial - Beacon Docs</title>
      </Helmet>

      <article className={`${styles.article} animate-fadeIn`}>
        <header className={`${styles.header} premium-hero-section`} style={{ padding: '64px 0', textAlign: 'left', background: 'transparent' }}>
            <div className="premium-badge">
                <BookOpen size={14} />
                <span>Developer Guide</span>
            </div>
            <h1 className="premium-hero-heading accent-text" style={{ fontSize: 48 }}>Mastering the Beacon SDK</h1>
            <p className="premium-hero-subtitle" style={{ margin: 0, fontSize: 18 }}>
                Build next-generation bots, rich integrations, and high-performance services with the official SDK.
            </p>
        </header>

        <section>
          <h2>1. Install</h2>
          <pre className={styles.code}><code>npm install beacon-sdk</code></pre>
          <div className={styles.infoBox}>
            Package: <a href="https://www.npmjs.com/package/beacon-sdk" target="_blank" rel="noreferrer">beacon-sdk on npm</a>
          </div>
        </section>

        <section>
          <h2>2. Initialize the client</h2>
          <pre className={styles.code}>
            <code>{`import { BeaconClient } from 'beacon-sdk'
import 'dotenv/config'

const client = new BeaconClient({
  token: process.env.BOT_TOKEN,
  apiUrl: process.env.BEACON_API_URL,
  wsUrl: process.env.BEACON_GATEWAY_URL,
  reconnect: true,
  reconnectAttempts: 10,
  reconnectDelay: 2000
})

client.on('ready', () => {
  console.log('Connected as', client.user?.username)
})

client.login()`}</code>
          </pre>
        </section>

        <section>
          <h2>3. Message handling</h2>
          <pre className={styles.code}>
            <code>{`client.on('messageCreate', async (message) => {
  if (message.author.bot) return

  if (message.content === '!ping') {
    await message.reply('Pong')
  }

  if (message.content.startsWith('!echo ')) {
    await message.channel.send(message.content.slice(6))
  }
})`}</code>
          </pre>
        </section>

        <section>
          <h2>4. Slash commands with BotFramework</h2>
          <pre className={styles.code}>
            <code>{`import { BotFramework } from 'beacon-sdk'

const bot = new BotFramework(client)

bot.command({
  name: 'health',
  description: 'Check runtime health',
  execute: async (ctx) => {
    await ctx.reply('runtime-ok')
  }
})`}</code>
          </pre>
        </section>

        <section>
          <h2>5. REST APIs</h2>
          <p>Use typed API modules directly:</p>
          <pre className={styles.code}>
            <code>{`await client.messages.send(channelId, { content: 'hello' })
const me = await client.users.getMe()
const guild = await client.servers.get(serverId)`}</code>
          </pre>
        </section>

        <section>
          <h2>6. New in v1.2.0</h2>
          <h3>Notifications</h3>
          <pre className={styles.code}>
            <code>{`const all = await client.notifications.getAll({ limit: 25 })
const unread = await client.notifications.getUnreadCount()
await client.notifications.markAllRead()`}</code>
          </pre>

          <h3>Webhooks</h3>
          <pre className={styles.code}>
            <code>{`const hook = await client.webhooks.create(channelId, { name: 'BuildBot' })
await client.webhooks.execute(hook.id, hook.token, {
  content: 'Deployment completed'
})`}</code>
          </pre>

          <h3>Invites</h3>
          <pre className={styles.code}>
            <code>{`const invite = await client.invites.create(channelId, { maxUses: 10 })
await client.invites.accept(invite.code)`}</code>
          </pre>
        </section>

        <section>
          <h2>7. Production checklist</h2>
          <ul>
            <li>Store token and URLs in environment variables</li>
            <li>Enable reconnect and monitor error events</li>
            <li>Handle 429 and retry for custom REST calls</li>
            <li>Limit intents to only what your bot needs</li>
            <li>Pin SDK to production version <strong>1.2.0</strong></li>
          </ul>
        </section>
      </article>
    </DocsLayout>
  )
}
