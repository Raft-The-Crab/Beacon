# beacon.js

**Official Bot SDK for Beacon** — Build powerful, event-driven bots for the Beacon platform with ease.

[![npm version](https://img.shields.io/npm/v/beacon.js)](https://www.npmjs.com/package/beacon.js)
[![Node.js ≥18](https://img.shields.io/node/v/beacon.js)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

---

## Features

- 🔌 **WebSocket Gateway** — Auto-reconnect, session resume, exponential backoff, heartbeat
- ⚡ **Rate-limit-aware REST** — Request queuing, per-route bucket tracking, global rate limit handling
- 🧠 **Slash Commands** — Register handlers, deploy to Beacon API, rich `InteractionContext`
- 📦 **Collection** — Discord.js-style enhanced `Map` with `filter`, `find`, `map`, `reduce`, and more
- 🪝 **Collectors** — Await messages or reactions matching a filter with timeouts
- 🎨 **EmbedBuilder** — Rich message embeds with fields, images, footers, timestamps
- 🔐 **Permissions** — Full 40+ permission bitfield system
- 🤖 **Full Caching** — Guilds, channels, users, and messages cached by default
- 📡 **Presence** — Update bot status and activities at runtime
- 🌲 **TypeScript** — 100% typed, ships declarations

---

## Installation

```bash
npm install beacon.js
# or
pnpm add beacon.js
# or
yarn add beacon.js
```

**Requirements:** Node.js 18+

---

## Quick Start

```typescript
import { Client, EmbedBuilder, CommandBuilder, CommandOptionType } from 'beacon.js';

const client = new Client({
  token: process.env.BOT_TOKEN!,
  debug: true, // log gateway events
});

// Ready event
client.on('ready', () => {
  console.log(`✅ Logged in as ${client.user?.username}`);
  client.setPresence('online', [{ type: 'playing', name: 'with Beacon' }]);
});

// Simple message response
client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;
  if (msg.content === '!ping') {
    await client.sendMessage(msg.channel_id, '🏓 Pong!');
  }
});

// Slash command handler
client.command('hello', async (ctx) => {
  const name = ctx.getString('name') ?? 'world';
  await ctx.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle('Hello!')
        .setDescription(`Hello, **${name}**! 👋`)
        .setColor('#5865F2')
        .setTimestamp()
        .toJSON(),
    ],
  });
});

// Deploy slash commands on ready
client.once('ready', async () => {
  await client.deployCommands([
    new CommandBuilder()
      .setName('hello')
      .setDescription('Say hello')
      .addStringOption((opt) =>
        opt.setName('name').setDescription('Who to greet').setRequired(false)
      )
      .toJSON(),
  ]);
});

// Start the bot
client.login();
```

---

## Events

| Event | Args | Description |
|-------|------|-------------|
| `ready` | — | Bot connected and ready |
| `messageCreate` | `RawMessage` | New message received |
| `messageUpdate` | `old, new` | Message edited |
| `messageDelete` | `RawMessage` | Message deleted |
| `guildCreate` | `RawGuild` | Bot joined a server |
| `guildDelete` | `{id}` | Bot removed from a server |
| `channelCreate` | `RawChannel` | Channel created |
| `channelDelete` | `RawChannel` | Channel deleted |
| `guildMemberAdd` | `RawMember` | Member joined |
| `guildMemberRemove` | `data` | Member left |
| `interactionCreate` | `InteractionContext` | Slash command / interaction |
| `messageReactionAdd` | `data` | Reaction added |
| `messageReactionRemove` | `data` | Reaction removed |
| `typingStart` | `data` | User started typing |
| `presenceUpdate` | `Presence` | User presence changed |
| `voiceStateUpdate` | `VoiceState` | Voice state changed |
| `disconnect` | `{code, reason}` | Gateway disconnected |
| `error` | `Error` | An error occurred |
| `raw` | `packet` | Every raw gateway packet |

---

## Slash Commands

### Registering Handlers

```typescript
client.command('ban', async (ctx) => {
  const userId = ctx.getId('user', true);
  const reason = ctx.getString('reason') ?? 'No reason';

  await ctx.deferReply(true); // ephemeral

  await client.banMember(ctx.guildId!, userId, { reason });
  await ctx.editReply(`✅ Banned <@${userId}> — ${reason}`);
});
```

### Deploying Commands

```typescript
await client.deployCommands([
  new CommandBuilder()
    .setName('ban')
    .setDescription('Ban a member')
    .addUserOption((o) => o.setName('user').setDescription('Who to ban').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason for ban'))
    .setDefaultMemberPermissions(PermissionFlags.BAN_MEMBERS)
    .toJSON(),
], guildId); // omit guildId for global commands
```

---

## Collectors

```typescript
// Collect up to 5 messages from a user within 30 seconds
const collector = client.createMessageCollector(channelId, {
  filter: (msg) => msg.author.id === targetUserId,
  max: 5,
  time: 30_000,
  errors: ['time'], // throw if times out
});

collector.on('collect', (msg) => console.log('Got:', msg.content));
collector.on('end', (collected, reason) => {
  console.log(`Collected ${collected.length} messages (${reason})`);
});

// Or await it:
const messages = await client.createMessageCollector(channelId, {
  filter: (msg) => msg.author.id === userId,
  max: 1,
  time: 15_000,
}).await();
```

---

## Embeds

```typescript
const embed = new EmbedBuilder()
  .setTitle('Server Stats')
  .setDescription('Here are the current statistics:')
  .setColor('#00FF88')
  .setAuthor('Beacon Bot', 'https://beacon.chat', 'https://beacon.chat/logo.png')
  .addFields(
    { name: 'Members', value: '1,234', inline: true },
    { name: 'Channels', value: '42', inline: true },
    { name: 'Online', value: '567', inline: true },
  )
  .setFooter('Powered by beacon.js')
  .setTimestamp()
  .toJSON();

await client.sendMessage(channelId, { embeds: [embed] });
```

---

## Permissions

```typescript
import { Permissions, PermissionFlags } from 'beacon.js';

const perms = new Permissions([
  PermissionFlags.SEND_MESSAGES,
  PermissionFlags.EMBED_LINKS,
  PermissionFlags.ATTACH_FILES,
]);

perms.has(PermissionFlags.SEND_MESSAGES); // true
perms.has(PermissionFlags.BAN_MEMBERS);   // false

// Serialize for storage
const bitfield = perms.serialize(); // "18432"

// Default permissions
const defaults = new Permissions(Permissions.default());
```

---

## Collection

```typescript
// client.guilds, client.channels, client.users, client.messages are all Collections

const textChannels = client.channels.filter((ch) => ch.type === 0);
const guildNames = client.guilds.map((g) => g.name);
const bigGuilds = client.guilds.filter((g) => (g.member_count ?? 0) > 100);
const random = client.guilds.random();
```

---

## API Reference

Full API docs available at **[https://beacon.chat/developers/docs](https://beacon.chat/developers/docs)**

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BEACON_API_URL` | `https://api.beacon.chat` | Beacon REST API base URL |
| `BEACON_GATEWAY_URL` | `wss://gateway.beacon.chat` | Beacon WebSocket gateway URL |

---

## Self-hosting

If you're running a self-hosted Beacon instance:

```typescript
const client = new Client({
  token: 'Bot YOUR_TOKEN',
  apiURL: 'http://localhost:4000',
  gatewayURL: 'ws://localhost:4000/gateway',
});
```

---

## License

MIT © Beacon Team
