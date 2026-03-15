import { DocsLayout } from '../../components/layout/DocsLayout'
import styles from '../../styles/modules/pages/Docs.module.css'

export function APIReference() {
  return (
    <DocsLayout>
      <div className={`${styles.docsContent} animate-fadeIn`}>
        <header className={styles.docsHeader}>
          <h1 className="accent-text">REST API Reference</h1>
          <p>Production API documentation for Beacon v1.2.0: auth, endpoints, response contracts, and SDK usage mappings.</p>
        </header>

        <section className={styles.docsSection}>
          <h2>Base URLs</h2>
          <div className={styles.infoBox}>
            <p><strong>Primary:</strong> <code>https://beacon-production-72fe.up.railway.app/api</code></p>
            <p><strong>Railway small API:</strong> <code>https://beacon-v1-api.up.railway.app/api</code></p>
          </div>
          <p>Use HTTPS only. All responses are JSON. Use standard HTTP status handling in clients.</p>
        </section>

        <section className={styles.docsSection}>
          <h2>Authentication</h2>
          <p>Every protected endpoint requires an Authorization header.</p>
          <div className={styles.codeBlock}>
            <pre>{`Authorization: Bot YOUR_BOT_TOKEN
Authorization: Bearer YOUR_USER_TOKEN`}</pre>
          </div>
          <p>Bot tokens are recommended for automation services. User tokens should only be used in first-party app flows.</p>
        </section>

        <section className={styles.docsSection}>
          <h2>Rate Limits</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Bucket</th>
                <th>Limit</th>
                <th>Window</th>
                <th>Behavior</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Auth routes</td><td>5</td><td>60s</td><td>Returns 429 + Retry-After</td></tr>
              <tr><td>Message create</td><td>30</td><td>10s</td><td>Per route and token</td></tr>
              <tr><td>General API</td><td>120</td><td>60s</td><td>Per route and token</td></tr>
              <tr><td>Uploads</td><td>10</td><td>60s</td><td>Per route and token</td></tr>
            </tbody>
          </table>
        </section>

        <section className={styles.docsSection}>
          <h2>Response Envelope</h2>
          <div className={styles.codeBlock}>
            <pre>{`// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": "Message", "code": "ERROR_CODE" }`}</pre>
          </div>
        </section>

        <section className={styles.docsSection}>
          <h2>Core Endpoints</h2>

          <div className={styles.resourceHeader}><h3>Auth</h3></div>
          <div className={styles.endpointCard}><div className={styles.endpointHeader}><span className={styles.methodPost}>POST</span><span className={styles.path}>/auth/login</span></div><p>Login and return a user token.</p></div>
          <div className={styles.endpointCard}><div className={styles.endpointHeader}><span className={styles.methodPost}>POST</span><span className={styles.path}>/auth/register</span></div><p>Create a user account and return auth payload.</p></div>
          <div className={styles.endpointCard}><div className={styles.endpointHeader}><span className={styles.methodGet}>GET</span><span className={styles.path}>/auth/me</span></div><p>Current account identity and session context.</p></div>

          <div className={styles.resourceHeader}><h3>Users</h3></div>
          <div className={styles.endpointCard}><div className={styles.endpointHeader}><span className={styles.methodGet}>GET</span><span className={styles.path}>/users/@me</span></div><p>Get your profile.</p></div>
          <div className={styles.endpointCard}><div className={styles.endpointHeader}><span className={styles.methodPatch}>PATCH</span><span className={styles.path}>/users/@me</span></div><p>Update your profile fields.</p></div>

          <div className={styles.resourceHeader}><h3>Servers and Channels</h3></div>
          <div className={styles.endpointCard}><div className={styles.endpointHeader}><span className={styles.methodPost}>POST</span><span className={styles.path}>/guilds</span></div><p>Create a server.</p></div>
          <div className={styles.endpointCard}><div className={styles.endpointHeader}><span className={styles.methodGet}>GET</span><span className={styles.path}>/guilds/{'{guildId}'}</span></div><p>Get server metadata and optional counts.</p></div>
          <div className={styles.endpointCard}><div className={styles.endpointHeader}><span className={styles.methodGet}>GET</span><span className={styles.path}>/channels/{'{channelId}'}/messages</span></div><p>Fetch channel history with pagination options.</p></div>

          <div className={styles.resourceHeader}><h3>Messages</h3></div>
          <div className={styles.endpointCard}><div className={styles.endpointHeader}><span className={styles.methodPost}>POST</span><span className={styles.path}>/channels/{'{channelId}'}/messages</span></div><p>Send message with content, embeds, and components.</p></div>
          <div className={styles.endpointCard}><div className={styles.endpointHeader}><span className={styles.methodPatch}>PATCH</span><span className={styles.path}>/channels/{'{channelId}'}/messages/{'{messageId}'}</span></div><p>Edit message content or embeds.</p></div>
          <div className={styles.endpointCard}><div className={styles.endpointHeader}><span className={styles.methodDelete}>DELETE</span><span className={styles.path}>/channels/{'{channelId}'}/messages/{'{messageId}'}</span></div><p>Delete a message.</p></div>

          <div className={styles.resourceHeader}><h3>New v1.2.0 APIs</h3></div>
          <div className={styles.endpointCard}><div className={styles.endpointHeader}><span className={styles.methodGet}>GET</span><span className={styles.path}>/notifications</span></div><p>List notifications and unread state.</p></div>
          <div className={styles.endpointCard}><div className={styles.endpointHeader}><span className={styles.methodPost}>POST</span><span className={styles.path}>/webhooks</span></div><p>Create webhooks for channels or servers.</p></div>
          <div className={styles.endpointCard}><div className={styles.endpointHeader}><span className={styles.methodPost}>POST</span><span className={styles.path}>/webhooks/{'{id}'}/{'{token}'}</span></div><p>Execute webhook messages.</p></div>
          <div className={styles.endpointCard}><div className={styles.endpointHeader}><span className={styles.methodPost}>POST</span><span className={styles.path}>/invites</span></div><p>Create invite links.</p></div>
          <div className={styles.endpointCard}><div className={styles.endpointHeader}><span className={styles.methodPost}>POST</span><span className={styles.path}>/invites/{'{code}'}/accept</span></div><p>Accept invite and join target.</p></div>
        </section>

        <section className={styles.docsSection}>
          <h2>cURL Examples</h2>
          <div className={styles.codeBlock}>
            <pre>{`curl -X POST "https://beacon-production-72fe.up.railway.app/api/channels/123/messages" \\
  -H "Authorization: Bot YOUR_BOT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"content":"Hello from Beacon API"}'`}</pre>
          </div>
          <div className={styles.codeBlock}>
            <pre>{`curl -X GET "https://beacon-production-72fe.up.railway.app/api/notifications" \\
  -H "Authorization: Bot YOUR_BOT_TOKEN"`}</pre>
          </div>
        </section>

        <section className={styles.docsSection}>
          <h2>SDK Mapping</h2>
          <p>Most API routes are wrapped by beacon-sdk modules:</p>
          <table className={styles.table}>
            <thead><tr><th>SDK API</th><th>Route Group</th><th>Example</th></tr></thead>
            <tbody>
              <tr><td>messages</td><td>/channels/:id/messages</td><td>client.messages.send(...)</td></tr>
              <tr><td>servers</td><td>/guilds</td><td>client.servers.get(...)</td></tr>
              <tr><td>notifications</td><td>/notifications</td><td>client.notifications.getAll()</td></tr>
              <tr><td>webhooks</td><td>/webhooks</td><td>client.webhooks.create(...)</td></tr>
              <tr><td>invites</td><td>/invites</td><td>client.invites.accept(...)</td></tr>
            </tbody>
          </table>
        </section>
      </div>
    </DocsLayout>
  )
}
