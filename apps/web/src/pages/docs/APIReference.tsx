import { DocsLayout } from '../../components/layout/DocsLayout'
import styles from './Docs.module.css'

export function APIReference() {
  return (
    <DocsLayout>
      <div className={`${styles.docsContent} animate-fadeIn`}>
        <header className={styles.docsHeader}>
          <h1 className="accent-text">Kernel API Reference</h1>
          <p>Exposing the raw communication primitives of the Beacon distributed core.</p>
        </header>

        <section className={styles.docsSection}>
          <h2>The Binary Protocol</h2>
          <p>
            While we expose RESTful endpoints for convenience, the Beacon core operates on a proprietary
            binary serialization format. This ensures maximum throughput and minimum discoverability by
            DPI (Deep Packet Inspection) engines.
          </p>
        </section>

        <section className={styles.docsSection}>
          <h2>Base URL</h2>
          <div className={styles.infoBox}>
            <code>https://api.beacon.chat/v1</code>
          </div>
          <p>
            All API requests must be made over HTTPS. Data is returned in JSON format.
            The API follows standard RESTful principles and status codes.
          </p>
        </section>

        <section className={styles.docsSection}>
          <h2>Authentication</h2>
          <p>
            Authenticate your requests by including your bot token in the <code>Authorization</code> header.
            Tokens can be generated in the <a href="/developer">Developer Portal</a>.
          </p>
          <div className={styles.codeBlock}>
            <pre>Authorization: Bot YOUR_BOT_TOKEN_HERE</pre>
          </div>
        </section>

        <section className={styles.docsSection}>
          <h2>Object Models</h2>

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
                  <td>id</td>
                  <td>snowflake</td>
                  <td>User's 64-bit ID</td>
                </tr>
                <tr>
                  <td>username</td>
                  <td>string</td>
                  <td>User's display name</td>
                </tr>
                <tr>
                  <td>discriminator</td>
                  <td>string</td>
                  <td>User's 4-digit tag</td>
                </tr>
                <tr>
                  <td>avatar</td>
                  <td>string?</td>
                  <td>Hash of the user's avatar</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.docsSection}>
          <h2>Resources</h2>

          <div className={styles.resourceHeader}>
            <h3>Users</h3>
          </div>

          <div className={styles.endpointCard}>
            <div className={styles.endpointHeader}>
              <span className={styles.methodGet}>GET</span>
              <span className={styles.path}>/users/@me</span>
            </div>
            <p>Returns the user object of the requester's account.</p>
          </div>

          <div className={styles.endpointCard}>
            <div className={styles.endpointHeader}>
              <span className={styles.methodPatch}>PATCH</span>
              <span className={styles.path}>/users/@me</span>
            </div>
            <p>Modify the requester's user account settings. Returns a user object on success.</p>
          </div>

          <div className={styles.resourceHeader}>
            <h3>Guilds</h3>
          </div>

          <div className={styles.endpointCard}>
            <div className={styles.endpointHeader}>
              <span className={styles.methodGet}>GET</span>
              <span className={styles.path}>/guilds/{"{guild.id}"}</span>
            </div>
            <p>Returns a guild object for the given ID. If with_counts is true, includes approximate member and presence counts.</p>
          </div>

          <div className={styles.endpointCard}>
            <div className={styles.endpointHeader}>
              <span className={styles.methodPost}>POST</span>
              <span className={styles.path}>/guilds</span>
            </div>
            <p>Create a new guild. Returns a guild object on success. Requires the CREATE_GUILD permission.</p>
          </div>

          <div className={styles.resourceHeader}>
            <h3>Messages</h3>
          </div>

          <div className={styles.endpointCard}>
            <div className={styles.endpointHeader}>
              <span className={styles.methodPost}>POST</span>
              <span className={styles.path}>/channels/{"{channel.id}"}/messages</span>
            </div>
            <p>Post a message to a guild text or DM channel. Returns a message object.</p>
          </div>

          <div className={styles.endpointCard}>
            <div className={styles.endpointHeader}>
              <span className={styles.methodDelete}>DELETE</span>
              <span className={styles.path}>/channels/{"{channel.id}"}/messages/{"{message.id}"}</span>
            </div>
            <p>Delete a message. If operating on a guild channel and the user has MANAGE_MESSAGES, this can delete any message.</p>
          </div>
        </section>

        <div className={styles.infoBox} style={{ marginTop: 'var(--space-2xl)' }}>
          <strong>Note:</strong> Looking for real-time updates? Check the <a href="/docs/gateway">Gateway Documentation</a>.
        </div>
      </div>
    </DocsLayout>
  )
}
