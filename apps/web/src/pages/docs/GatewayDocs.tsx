import { DocsLayout } from '../../components/layout/DocsLayout'
import styles from './Docs.module.css'

export function GatewayDocs() {
  return (
    <DocsLayout>
      <div className={`${styles.docsContent} animate-fadeIn`}>
        <header className={styles.docsHeader}>
          <h1 className="accent-text">Gateway Events</h1>
          <p>Real-time communication with Beacon via high-performance WebSockets.</p>
        </header>

        <section className={styles.docsSection}>
          <h2>Connecting</h2>
          <p>
            The Gateway is Beacon's real-time message delivery system. To receive real-time updates, connect to our Gateway URL using a standard WebSocket client:
          </p>
          <div className={styles.infoBox}>
            <code>wss://gateway.beacon.chat/?v=1&encoding=json</code>
          </div>
          <p>Clients are expected to maintain a heartbeat and handle reconnection logic automatically.</p>
        </section>

        <section className={styles.docsSection}>
          <h2>Payload Structure</h2>
          <p>
            Every payload sent or received over the gateway is a JSON object with the following structure:
          </p>
          <div className={styles.codeBlock}>
            <pre>{`{
  "op": 0,    // Opcode
  "d": {},    // Event data
  "s": 42,    // Sequence number (Dispatches only)
  "t": "NAME" // Event name (Dispatches only)
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
                <th>Action</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>0</td>
                <td>Dispatch</td>
                <td>Receive</td>
                <td>An event was dispatched (e.g., MESSAGE_CREATE).</td>
              </tr>
              <tr>
                <td>1</td>
                <td>Heartbeat</td>
                <td>Send/Receive</td>
                <td>Used for client keep-alive.</td>
              </tr>
              <tr>
                <td>2</td>
                <td>Identify</td>
                <td>Send</td>
                <td>Starts a new session during initial handshake.</td>
              </tr>
              <tr>
                <td>6</td>
                <td>Resume</td>
                <td>Send</td>
                <td>Resumes a disconnected session.</td>
              </tr>
              <tr>
                <td>10</td>
                <td>Hello</td>
                <td>Receive</td>
                <td>Sent immediately after connecting. Includes heartbeat_interval.</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className={styles.docsSection}>
          <h2>Standard Events</h2>

          <div className={styles.eventItem}>
            <h3>READY</h3>
            <p>Sent as the first event after a successful Identification. Contains state initialization data (user, guilds, DMs).</p>
          </div>

          <div className={styles.eventItem}>
            <h3>MESSAGE_CREATE</h3>
            <p>Sent when a message is created in a guild text or DM channel that the user has access to.</p>
          </div>

          <div className={styles.eventItem}>
            <h3>PRESENCE_UPDATE</h3>
            <p>Sent when a user's status or custom activity changes across shared guilds or DMs.</p>
          </div>

          <div className={styles.eventItem}>
            <h3>GUILD_MEMBER_ADD</h3>
            <p>Sent when a new user joins a guild. Requires the GUILD_MEMBERS intent.</p>
          </div>
        </section>

        <div className={styles.infoBox} style={{ marginTop: 'var(--space-2xl)' }}>
          <strong>Tip:</strong> Use the <a href="/docs/sdk">official Beacon SDK</a> to handle the Gateway handshake and heartbeating automatically.
        </div>
      </div>
    </DocsLayout>
  )
}
