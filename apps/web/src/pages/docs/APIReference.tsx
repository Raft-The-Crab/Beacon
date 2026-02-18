import { DocsLayout } from '../../components/layout/DocsLayout'
import styles from './Docs.module.css'

export function APIReference() {
  return (
    <DocsLayout>
      <div className={`${styles.docsContent} animate-fadeIn`}>
        <header className={styles.docsHeader}>
          <h1 className="accent-text">REST API Reference</h1>
          <p>Everything you need to interact with Beacon programmatically. Standard REST, JSON responses, no surprises.</p>
        </header>

        <section className={styles.docsSection}>
          <h2>Base URL</h2>
          <div className={styles.infoBox}>
            <code>https://api.beacon.chat/v1</code>
          </div>
          <p>
            All requests must be made over HTTPS. Responses are JSON. We follow standard HTTP status codes —
            200 for success, 4xx for client errors, 5xx for server errors.
          </p>
        </section>

        <section className={styles.docsSection}>
          <h2>Authentication</h2>
          <p>
            Include your bot token in the <code>Authorization</code> header with every request.
            You can get your token from the <a href="/developer">Developer Portal</a>.
          </p>
          <div className={styles.codeBlock}>
            <pre>Authorization: Bot YOUR_BOT_TOKEN_HERE</pre>
          </div>
          <div className={styles.infoBox}>
            Never hardcode tokens in public repos. Use environment variables like <code>process.env.BOT_TOKEN</code>.
          </div>
        </section>

        <section className={styles.docsSection}>
          <h2>Rate Limits</h2>
          <p>
            The API is rate-limited per route and per bot. When you hit a limit, you'll get a <code>429 Too Many Requests</code> response
            with a <code>Retry-After</code> header telling you how many seconds to wait. The SDK handles this automatically.
          </p>
        </section>

        <section className={styles.docsSection}>
          <h2>Object Reference</h2>

          <div className={styles.modelCard}>
            <h3>User Object</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Type</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>id</code></td>
                  <td>string</td>
                  <td>The user's unique ID</td>
                </tr>
                <tr>
                  <td><code>username</code></td>
                  <td>string</td>
                  <td>Their display name</td>
                </tr>
                <tr>
                  <td><code>avatar</code></td>
                  <td>string?</td>
                  <td>Avatar image URL (null if not set)</td>
                </tr>
                <tr>
                  <td><code>bot</code></td>
                  <td>boolean?</td>
                  <td>True if this user is a bot account</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className={styles.modelCard}>
            <h3>Message Object</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Type</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>id</code></td>
                  <td>string</td>
                  <td>The message's unique ID</td>
                </tr>
                <tr>
                  <td><code>content</code></td>
                  <td>string</td>
                  <td>The text content of the message</td>
                </tr>
                <tr>
                  <td><code>author</code></td>
                  <td>User</td>
                  <td>Who sent the message</td>
                </tr>
                <tr>
                  <td><code>channelId</code></td>
                  <td>string</td>
                  <td>The channel this message was sent in</td>
                </tr>
                <tr>
                  <td><code>createdAt</code></td>
                  <td>ISO timestamp</td>
                  <td>When the message was created</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.docsSection}>
          <h2>Endpoints</h2>

          <div className={styles.resourceHeader}>
            <h3>Users</h3>
          </div>

          <div className={styles.endpointCard}>
            <div className={styles.endpointHeader}>
              <span className={styles.methodGet}>GET</span>
              <span className={styles.path}>/users/@me</span>
            </div>
            <p>Returns the current user's profile. Requires a valid bot or user token.</p>
          </div>

          <div className={styles.endpointCard}>
            <div className={styles.endpointHeader}>
              <span className={styles.methodPatch}>PATCH</span>
              <span className={styles.path}>/users/@me</span>
            </div>
            <p>Update your username or avatar. Returns the updated user object.</p>
          </div>

          <div className={styles.resourceHeader}>
            <h3>Guilds (Servers)</h3>
          </div>

          <div className={styles.endpointCard}>
            <div className={styles.endpointHeader}>
              <span className={styles.methodGet}>GET</span>
              <span className={styles.path}>/guilds/{"{guild.id}"}</span>
            </div>
            <p>Fetch info about a guild your bot is in. Add <code>?with_counts=true</code> to include member counts.</p>
          </div>

          <div className={styles.endpointCard}>
            <div className={styles.endpointHeader}>
              <span className={styles.methodPost}>POST</span>
              <span className={styles.path}>/guilds</span>
            </div>
            <p>Create a new guild. The bot becomes the owner. Use sparingly — bots are limited to 10 guilds by default.</p>
          </div>

          <div className={styles.endpointCard}>
            <div className={styles.endpointHeader}>
              <span className={styles.methodGet}>GET</span>
              <span className={styles.path}>/guilds/{"{guild.id}"}/members</span>
            </div>
            <p>List members of a guild. Requires the <code>GUILD_MEMBERS</code> intent and appropriate permissions.</p>
          </div>

          <div className={styles.resourceHeader}>
            <h3>Channels</h3>
          </div>

          <div className={styles.endpointCard}>
            <div className={styles.endpointHeader}>
              <span className={styles.methodGet}>GET</span>
              <span className={styles.path}>/channels/{"{channel.id}"}</span>
            </div>
            <p>Fetch a channel by ID. Works for both guild channels and DMs.</p>
          </div>

          <div className={styles.endpointCard}>
            <div className={styles.endpointHeader}>
              <span className={styles.methodGet}>GET</span>
              <span className={styles.path}>/channels/{"{channel.id}"}/messages</span>
            </div>
            <p>Get up to 100 messages from a channel. Use <code>?before</code>, <code>?after</code>, or <code>?around</code> to paginate.</p>
          </div>

          <div className={styles.resourceHeader}>
            <h3>Messages</h3>
          </div>

          <div className={styles.endpointCard}>
            <div className={styles.endpointHeader}>
              <span className={styles.methodPost}>POST</span>
              <span className={styles.path}>/channels/{"{channel.id}"}/messages</span>
            </div>
            <p>Send a message. Include <code>content</code> (text), <code>embeds</code>, or <code>components</code> in the request body.</p>
          </div>

          <div className={styles.endpointCard}>
            <div className={styles.endpointHeader}>
              <span className={styles.methodPatch}>PATCH</span>
              <span className={styles.path}>/channels/{"{channel.id}"}/messages/{"{message.id}"}</span>
            </div>
            <p>Edit a message you (or your bot) sent. Can update content and embeds.</p>
          </div>

          <div className={styles.endpointCard}>
            <div className={styles.endpointHeader}>
              <span className={styles.methodDelete}>DELETE</span>
              <span className={styles.path}>/channels/{"{channel.id}"}/messages/{"{message.id}"}</span>
            </div>
            <p>Delete a message. Bots need <code>MANAGE_MESSAGES</code> to delete messages from other users.</p>
          </div>
        </section>

        <div className={styles.infoBox} style={{ marginTop: 'var(--space-2xl)' }}>
          <strong>Need real-time updates instead?</strong> Check the <a href="/docs/gateway-events">Gateway Documentation</a> to subscribe to events via WebSocket.
        </div>
      </div>
    </DocsLayout>
  )
}
