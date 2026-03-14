# beacon-sdk

Official JavaScript and TypeScript SDK for Beacon.

Production version documented here: 1.2.0.

## Install

```bash
npm install beacon-sdk
```

## Quick Start

```ts
import { BeaconClient } from 'beacon-sdk'
import 'dotenv/config'

const client = new BeaconClient({
  token: process.env.BOT_TOKEN,
  apiUrl: process.env.BEACON_API_URL,
  wsUrl: process.env.BEACON_GATEWAY_URL,
  reconnect: true,
  reconnectAttempts: 10,
  reconnectDelay: 2000,
})

client.on('ready', () => {
  console.log('online as', client.user?.username)
})

client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return
  if (msg.content === '!ping') await msg.reply('Pong')
})

client.login()
```

## Runtime URLs

- API: https://api.beacon.qzz.io/api
- Railway API: https://beacon-v1-api.up.railway.app/api
- Gateway: wss://gateway.beacon.qzz.io

## Main Exports

- BeaconClient
- BotFramework
- AuthAPI
- MessagesAPI
- ServersAPI
- ChannelsAPI
- UsersAPI
- RolesAPI
- PresenceAPI
- VoiceAPI
- NotificationsAPI
- WebhooksAPI
- InvitesAPI

## API Usage Examples

### Messages

```ts
await client.messages.send(channelId, { content: 'hello' })
await client.messages.edit(channelId, messageId, { content: 'edited' })
await client.messages.delete(channelId, messageId)
```

### Servers and channels

```ts
const guild = await client.servers.get(guildId)
const channel = await client.channels.get(channelId)
```

### Users and roles

```ts
const me = await client.users.getMe()
await client.roles.create(guildId, { name: 'Moderator' })
```

### Presence and voice

```ts
await client.presence.update({ status: 'online' })
await client.voice.join(channelId)
```

## New in 1.2.0

### NotificationsAPI

```ts
const list = await client.notifications.getAll({ limit: 25 })
const unread = await client.notifications.getUnreadCount()
await client.notifications.markAllRead()
```

### WebhooksAPI

```ts
const hook = await client.webhooks.create(channelId, { name: 'DeployBot' })
await client.webhooks.execute(hook.id, hook.token, {
  content: 'Build completed',
})
```

### InvitesAPI

```ts
const invite = await client.invites.create(channelId, { maxUses: 5 })
await client.invites.accept(invite.code)
```

## Error Handling

```ts
try {
  await client.messages.send(channelId, { content: 'test' })
} catch (error) {
  console.error('request failed', error)
}
```

## Production Notes

- Keep tokens in environment variables.
- Restrict gateway intents to only what your app needs.
- Use reconnect settings in unstable network environments.
- Prefer typed SDK APIs over raw fetch calls for auth and retry consistency.

## License

MIT
