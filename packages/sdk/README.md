# @beacon/sdk

Official JavaScript/TypeScript SDK for Beacon - A comprehensive client library for building real-time communication applications.

## Features

- 🔐 **Authentication** - Complete auth flow with token management
- 💬 **Real-time Messaging** - WebSocket-based instant messaging
- 🎙️ **Voice & Video** - WebRTC voice and video calls
- 👥 **User Management** - Presence, profiles, and relationships
- 🏢 **Server Management** - Channels, roles, and permissions
- 📡 **Event System** - Type-safe event emitters and handlers
- 📦 **TypeScript First** - Full type definitions included
- ⚡ **Performance** - Optimized for large-scale applications

## Installation

```bash
npm install @beacon/sdk
# or
pnpm add @beacon/sdk
# or
yarn add @beacon/sdk
```

## Quick Start

```typescript
import { BeaconClient } from '@beacon/sdk'

// Initialize the client
const beacon = new BeaconClient({
  apiUrl: 'https://api.beacon.example.com',
  wsUrl: 'wss://ws.beacon.example.com'
})

// Authenticate
await beacon.auth.login('user@example.com', 'password')

// Listen for messages
beacon.on('message', (message) => {
  console.log(`${message.author.username}: ${message.content}`)
})

// Send a message
await beacon.messages.send('channel-id', {
  content: 'Hello, Beacon!'
})

// Connect to WebSocket
await beacon.connect()
```

## API Reference

### Authentication

```typescript
// Login with email and password
await beacon.auth.login(email, password)

// Register a new account
await beacon.auth.register(email, username, password)

// Logout
await beacon.auth.logout()

// Get current user
const user = beacon.auth.getCurrentUser()
```

### Messages

```typescript
// Send a message
await beacon.messages.send(channelId, {
  content: 'Hello!',
  attachments: [...],
  embeds: [...]
})

// Edit a message
await beacon.messages.edit(channelId, messageId, {
  content: 'Updated content'
})

// Delete a message
await beacon.messages.delete(channelId, messageId)

// Get message history
const messages = await beacon.messages.getHistory(channelId, {
  limit: 50,
  before: messageId
})

// Add reaction
await beacon.messages.addReaction(channelId, messageId, emoji)

// Pin message
await beacon.messages.pin(channelId, messageId)
```

### Servers

```typescript
// Create a server
const server = await beacon.servers.create({
  name: 'My Server',
  icon: '...'
})

// Get server details
const server = await beacon.servers.get(serverId)

// Update server
await beacon.servers.update(serverId, {
  name: 'New Name',
  description: 'New Description'
})

// Delete server
await beacon.servers.delete(serverId)

// Create channel
const channel = await beacon.servers.createChannel(serverId, {
  name: 'general',
  type: 'text'
})
```

### Channels

```typescript
// Get channel
const channel = await beacon.channels.get(channelId)

// Update channel
await beacon.channels.update(channelId, {
  name: 'new-name',
  topic: 'Channel topic'
})

// Delete channel
await beacon.channels.delete(channelId)

// Set permissions
await beacon.channels.setPermissions(channelId, roleId, {
  allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
  deny: ['MANAGE_MESSAGES']
})
```

### Users

```typescript
// Get user profile
const user = await beacon.users.get(userId)

// Update own profile
await beacon.users.updateProfile({
  displayName: 'New Name',
  bio: 'My bio',
  avatar: '...'
})

// Send friend request
await beacon.users.sendFriendRequest(userId)

// Get friends list
const friends = await beacon.users.getFriends()
```

### Roles

```typescript
// Create role
const role = await beacon.roles.create(serverId, {
  name: 'Moderator',
  color: '#FF5733',
  icon: 'shield',
  permissions: ['MANAGE_MESSAGES', 'KICK_MEMBERS']
})

// Update role
await beacon.roles.update(serverId, roleId, {
  name: 'Admin',
  permissions: ['ADMINISTRATOR']
})

// Delete role
await beacon.roles.delete(serverId, roleId)

// Assign role to user
await beacon.roles.assignToUser(serverId, userId, roleId)
```

### Presence

```typescript
// Update status
await beacon.presence.updateStatus({
  status: 'online', // 'online' | 'idle' | 'dnd' | 'invisible'
  customStatus: 'Working on something cool'
})

// Get user presence
const presence = await beacon.presence.get(userId)
```

### Voice

```typescript
// Join voice channel
await beacon.voice.join(channelId)

// Leave voice channel
await beacon.voice.leave()

// Mute/unmute
await beacon.voice.setMute(true)

// Deafen/undeafen
await beacon.voice.setDeafen(true)

// Start screen share
await beacon.voice.startScreenShare()
```

## Events

The SDK emits various events that you can listen to:

```typescript
// Message events
beacon.on('message', (message) => {})
beacon.on('messageUpdate', (message) => {})
beacon.on('messageDelete', (data) => {})

// Server events
beacon.on('serverCreate', (server) => {})
beacon.on('serverUpdate', (server) => {})
beacon.on('serverDelete', (serverId) => {})

// Channel events
beacon.on('channelCreate', (channel) => {})
beacon.on('channelUpdate', (channel) => {})
beacon.on('channelDelete', (channelId) => {})

// User events
beacon.on('userUpdate', (user) => {})
beacon.on('presenceUpdate', (presence) => {})
beacon.on('typingStart', (data) => {})

// Voice events
beacon.on('voiceStateUpdate', (state) => {})
beacon.on('speakingStart', (userId) => {})
beacon.on('speakingStop', (userId) => {})

// Connection events
beacon.on('ready', () => {})
beacon.on('disconnect', () => {})
beacon.on('reconnect', () => {})
beacon.on('error', (error) => {})
```

## Advanced Usage

### Custom Event Handlers

```typescript
import { BeaconClient, EventHandler } from '@beacon/sdk'

class MyMessageHandler extends EventHandler<'message'> {
  async handle(message) {
    // Custom message processing
    console.log('Received:', message)
  }
}

const beacon = new BeaconClient(options)
beacon.registerHandler('message', new MyMessageHandler())
```

### Middleware

```typescript
// Add request middleware
beacon.middleware.use(async (req, next) => {
  console.log('Request:', req)
  const res = await next(req)
  console.log('Response:', res)
  return res
})
```

### Connection Options

```typescript
const beacon = new BeaconClient({
  apiUrl: 'https://api.beacon.example.com',
  wsUrl: 'wss://ws.beacon.example.com',
  reconnect: true,
  reconnectAttempts: 5,
  reconnectDelay: 3000,
  heartbeatInterval: 30000,
  requestTimeout: 10000,
  debug: true
})
```

## TypeScript Support

The SDK is written in TypeScript and includes full type definitions:

```typescript
import type {
  Message,
  Server,
  Channel,
  User,
  Role,
  Presence,
  Permission
} from '@beacon/sdk'

// All types are fully typed
beacon.on('message', (message: Message) => {
  // TypeScript knows all message properties
  console.log(message.content)
})
```

## Error Handling

```typescript
try {
  await beacon.messages.send(channelId, { content: 'test' })
} catch (error) {
  if (error instanceof BeaconError) {
    console.error('API Error:', error.code, error.message)
  } else {
    console.error('Unknown error:', error)
  }
}
```

## Best Practices

1. **Always handle errors** - Wrap API calls in try-catch blocks
2. **Clean up listeners** - Remove event listeners when components unmount
3. **Use TypeScript** - Take advantage of full type safety
4. **Rate limiting** - Be aware of API rate limits
5. **Connection management** - Handle disconnections gracefully
6. **Token refresh** - Implement token refresh logic
7. **Caching** - Cache frequently accessed data locally

## License

MIT

## Support

For issues and questions, please visit our [GitHub Issues](https://github.com/beacon/beacon/issues)
