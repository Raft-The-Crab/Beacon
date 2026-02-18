import { DocsLayout } from '../../components/layout/DocsLayout'
import styles from './Docs.module.css'

export function GatewayDocs() {
  return (
    <DocsLayout>
      <div className={`${styles.docsContent} animate-fadeIn`}>
        <header className={styles.docsHeader}>
          <h1 className="accent-text">Gateway & Real-Time Events</h1>
          <p>Get instant updates via WebSocket — messages, reactions, member changes, and more, as they happen.</p>
        </header>

        <section className={styles.docsSection}>
          <h2>What is the Gateway?</h2>
          <p>
            The REST API is great for one-off requests, but if you want to <em>react</em> to things as they happen —
            like a new message arriving or a user joining a server — you need the Gateway. It's a persistent WebSocket
            connection that Beacon uses to push events to your bot in real time.
          </p>
          <p>
            The official SDK handles all the plumbing for you (connecting, heartbeating, reconnecting). But if you're
            building something custom, here's how it works.
          </p>
        </section>

        <section className={styles.docsSection}>
          <h2>Connecting</h2>
          <p>Connect to the Gateway URL using any standard WebSocket client:</p>
          <div className={styles.infoBox}>
            <code>wss://gateway.beacon.chat/?v=1&encoding=json</code>
          </div>
          <p>
            Once connected, Beacon will immediately send you a <strong>Hello</strong> packet (opcode 10) that tells you
            how often to send heartbeats. After that, you send an <strong>Identify</strong> packet with your token to start receiving events.
          </p>
        </section>

        <section className={styles.docsSection}>
          <h2>Packet Format</h2>
          <p>Every message over the Gateway follows this structure:</p>
          <div className={styles.codeBlock}>
            <pre>{`{
  "op": 0,        // Opcode (what kind of packet this is)
  "d": { ... },   // The payload data
  "s": 42,        // Sequence number — used to resume sessions
  "t": "EVENT"    // Event name (only present on dispatch packets)
}`}</pre>
          </div>
        </section>

        <section className={styles.docsSection}>
          <h2>Opcodes</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Direction</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>0</td>
                <td>Dispatch</td>
                <td>Receive</td>
                <td>An event fired (e.g. a new message). This is most of what you'll see.</td>
              </tr>
              <tr>
                <td>1</td>
                <td>Heartbeat</td>
                <td>Send/Receive</td>
                <td>Keep the connection alive. Send at the interval from the Hello packet.</td>
              </tr>
              <tr>
                <td>2</td>
                <td>Identify</td>
                <td>Send</td>
                <td>Log in with your token and specify which intents you need.</td>
              </tr>
              <tr>
                <td>3</td>
                <td>Presence Update</td>
                <td>Send</td>
                <td>Update your bot's status (e.g. "Playing something").</td>
              </tr>
              <tr>
                <td>6</td>
                <td>Resume</td>
                <td>Send</td>
                <td>Reconnect and catch up on missed events using your last sequence number.</td>
              </tr>
              <tr>
                <td>10</td>
                <td>Hello</td>
                <td>Receive</td>
                <td>First thing you receive after connecting. Contains the heartbeat interval.</td>
              </tr>
              <tr>
                <td>11</td>
                <td>Heartbeat ACK</td>
                <td>Receive</td>
                <td>Beacon acknowledging your heartbeat. If this stops, reconnect.</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className={styles.docsSection}>
          <h2>Intents</h2>
          <p>
            Intents control which events your bot receives. You declare them in your Identify payload.
            Only request the intents you actually need — it keeps your bot lean.
          </p>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Intent</th>
                <th>Events included</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>GUILDS</code></td>
                <td>Guild create/update/delete, channel changes, role changes</td>
              </tr>
              <tr>
                <td><code>GUILD_MEMBERS</code></td>
                <td>Member join/leave/update — requires approval for large bots</td>
              </tr>
              <tr>
                <td><code>GUILD_MESSAGES</code></td>
                <td>Message create/update/delete in guild channels</td>
              </tr>
              <tr>
                <td><code>DIRECT_MESSAGES</code></td>
                <td>Messages in DMs with your bot</td>
              </tr>
              <tr>
                <td><code>MESSAGE_REACTIONS</code></td>
                <td>Reaction add/remove on messages</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className={styles.docsSection}>
          <h2>Common Events</h2>

          <div className={styles.eventItem}>
            <h3>READY</h3>
            <p>Fired after a successful Identify. Contains your bot's user object and initial guild list. Store the <code>session_id</code> for resuming.</p>
          </div>

          <div className={styles.eventItem}>
            <h3>MESSAGE_CREATE</h3>
            <p>A message was sent in a channel your bot can see. The payload is a full Message object including author, channel, and guild IDs.</p>
          </div>

          <div className={styles.eventItem}>
            <h3>MESSAGE_UPDATE</h3>
            <p>A message was edited. The payload may be partial — only changed fields are guaranteed.</p>
          </div>

          <div className={styles.eventItem}>
            <h3>MESSAGE_DELETE</h3>
            <p>A message was deleted. Contains the message ID and channel ID only (not the message content).</p>
          </div>

          <div className={styles.eventItem}>
            <h3>GUILD_MEMBER_ADD</h3>
            <p>Someone joined a server. Requires the <code>GUILD_MEMBERS</code> intent.</p>
          </div>

          <div className={styles.eventItem}>
            <h3>PRESENCE_UPDATE</h3>
            <p>A user's status or activity changed in a shared server.</p>
          </div>

          <div className={styles.eventItem}>
            <h3>TYPING_START</h3>
            <p>Someone started typing in a channel. Useful for "typing..." indicators.</p>
          </div>
        </section>

        <div className={styles.infoBox} style={{ marginTop: 'var(--space-2xl)' }}>
          <strong>Tip:</strong> Use the <a href="/docs/sdk-tutorial">official Beacon SDK</a> and you won't have to implement any of this manually — it handles heartbeating, reconnections, and event parsing for you.
        </div>
      </div>
    </DocsLayout>
  )
}
