import { Zap } from 'lucide-react'
import { DocsLayout } from '../../components/layout/DocsLayout'
import styles from '../../styles/modules/pages/Docs.module.css'

export function GatewayDocs() {
  return (
    <DocsLayout>
      <div className={`${styles.docsContent} animate-fadeIn`}>
        <header className={`${styles.docsHeader} premium-hero-section`} style={{ padding: '64px 0', textAlign: 'left', background: 'transparent' }}>
          <div className="premium-badge">
            <Zap size={14} />
            <span>Real-Time Engine</span>
          </div>
          <h1 className="premium-hero-heading accent-text" style={{ fontSize: 48 }}>Gateway & Socket Events</h1>
          <p className="premium-hero-subtitle" style={{ margin: '0', fontSize: 18 }}>
            Build low-latency bots and apps with our high-performance WebSocket architecture.
          </p>
        </header>

        <section className={styles.docsSection}>
          <h2 className="premium-glow-text" style={{ fontSize: 28, marginBottom: 20 }}>Gateway URL</h2>
          <div className="premium-glass-card" style={{ padding: 24, marginBottom: 20 }}>
            <p style={{ marginBottom: 12 }}><strong>Primary:</strong> <code style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 4 }}>wss://gateway.beacon.qzz.io/gateway</code></p>
            <p><strong>Railway Direct:</strong> <code style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 4 }}>wss://beacon-production-72fe.up.railway.app/gateway</code></p>
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>Connect with standard WebSocket clients. After connect, wait for Hello (op 10), then send Identify (op 2).</p>
        </section>

        <section className={styles.docsSection}>
          <h2>Packet Shape</h2>
          <div className={styles.codeBlock}>
            <pre>{`{
  "op": 0,
  "d": { },
  "s": 14,
  "t": "MESSAGE_CREATE"
}`}</pre>
          </div>
        </section>

        <section className={styles.docsSection}>
          <h2>Lifecycle</h2>
          <table className={styles.table}>
            <thead>
              <tr><th>Step</th><th>Action</th><th>Details</th></tr>
            </thead>
            <tbody>
              <tr><td>1</td><td>Connect</td><td>Open WebSocket to gateway URL.</td></tr>
              <tr><td>2</td><td>Hello</td><td>Receive heartbeat interval in payload.</td></tr>
              <tr><td>3</td><td>Identify</td><td>Send token and intents.</td></tr>
              <tr><td>4</td><td>Heartbeat</td><td>Send op 1 on interval and track ACK.</td></tr>
              <tr><td>5</td><td>Dispatch</td><td>Process events and store latest sequence.</td></tr>
              <tr><td>6</td><td>Resume</td><td>Reconnect using session id + sequence after drop.</td></tr>
            </tbody>
          </table>
        </section>

        <section className={styles.docsSection}>
          <h2>Identify Example</h2>
          <div className={styles.codeBlock}>
            <pre>{`{
  "op": 2,
  "d": {
    "token": "YOUR_BOT_TOKEN",
    "intents": ["GUILDS", "GUILD_MESSAGES", "DIRECT_MESSAGES"],
    "properties": {
      "os": "linux",
      "browser": "beacon-sdk",
      "device": "beacon-sdk"
    }
  }
}`}</pre>
          </div>
        </section>

        <section className={styles.docsSection}>
          <h2>Intents</h2>
          <table className={styles.table}>
            <thead><tr><th>Intent</th><th>Purpose</th></tr></thead>
            <tbody>
              <tr><td><code>GUILDS</code></td><td>Guild metadata, channels, and role events</td></tr>
              <tr><td><code>GUILD_MEMBERS</code></td><td>Member join and leave lifecycle</td></tr>
              <tr><td><code>GUILD_MESSAGES</code></td><td>Guild message create, update, delete</td></tr>
              <tr><td><code>DIRECT_MESSAGES</code></td><td>Direct message events</td></tr>
              <tr><td><code>MESSAGE_REACTIONS</code></td><td>Reaction add and remove events</td></tr>
            </tbody>
          </table>
        </section>

        <section className={styles.docsSection}>
          <h2>Common Events</h2>
          <div className={styles.endpointCard}><div className={styles.endpointHeader}><span className={styles.methodGet}>EVENT</span><span className={styles.path}>READY</span></div><p>Initial authenticated state. Save session id for resume.</p></div>
          <div className={styles.endpointCard}><div className={styles.endpointHeader}><span className={styles.methodGet}>EVENT</span><span className={styles.path}>MESSAGE_CREATE</span></div><p>New message payload for channels your bot can access.</p></div>
          <div className={styles.endpointCard}><div className={styles.endpointHeader}><span className={styles.methodGet}>EVENT</span><span className={styles.path}>MESSAGE_UPDATE</span></div><p>Partial updates when message content or metadata changes.</p></div>
          <div className={styles.endpointCard}><div className={styles.endpointHeader}><span className={styles.methodGet}>EVENT</span><span className={styles.path}>GUILD_MEMBER_ADD</span></div><p>A new user joined a guild.</p></div>
        </section>

        <section className={styles.docsSection}>
          <h2>SDK Usage</h2>
          <div className={styles.codeBlock}>
            <pre>{`import { BeaconClient } from 'beacon-sdk'

const client = new BeaconClient({
  token: process.env.BOT_TOKEN,
  wsUrl: process.env.BEACON_GATEWAY_URL
})

client.on('ready', () => {
  console.log('Gateway connected')
})

client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return
  if (msg.content === '!health') await msg.reply('ok')
})

client.login()`}</pre>
          </div>
        </section>
      </div>
    </DocsLayout>
  )
}
