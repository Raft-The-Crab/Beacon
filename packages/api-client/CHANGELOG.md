# Changelog — beacon.js

All notable changes are documented here.

---

## [2.5.0] — 2026-02-18

### Added
- **Node.js native WebSocket** via `ws` package — runs in Node.js 18+ without polyfills
- **Auto-reconnect** with exponential backoff (max 10 attempts, caps at 30s)
- **Session resume** — reconnects without re-identifying when possible
- **Zombie connection detection** — force-reconnects if heartbeat not ACKed
- **`Collection<K, V>`** — Discord.js-style enhanced Map with `filter`, `find`, `map`, `reduce`, `some`, `every`, `first`, `last`, `random`, `sorted`, `clone`, `concat`
- **`InteractionContext`** — Full slash command context with typed option getters, `reply`, `deferReply`, `editReply`, `followUp`
- **`Collector<T>`** — Await messages/reactions with filter, time limit, max count
- **`Client.command(name, handler)`** — Register slash command handlers locally
- **`Client.deployCommands(commands, guildId?)`** — Deploy commands to Beacon API
- **`Client.createMessageCollector(channelId, options)`** — Factory method for message collectors
- **`Client.awaitMessage(channelId, options)`** — Convenience one-shot message await
- **`Client.setPresence(status, activities)`** — Update bot presence at runtime
- **`Client.pinMessage` / `unpinMessage` / `getPinnedMessages`** — Pin API
- **`Client.addReaction` / `removeReaction`** — Reaction helpers
- **Rate-limit-aware `RestClient`** — Per-route bucket tracking, global rate limit, 429 retry
- **`Intents` constants** — All gateway intents exported
- **`DEFAULT_INTENTS`** — Sane defaults: Guilds, GuildMembers, GuildMessages, MessageContent, DirectMessages, Reactions
- **Presence Update opcode** — `client.setPresence()` uses OP 3
- Caching: guilds, channels, users, messages cached in `Collection` instances
- Raw packet event: `client.on('raw', packet => ...)`
- `interactionCreate` auto-dispatches to registered `.command()` handlers
- All camelCase gateway events: `messageCreate`, `guildMemberAdd`, `typingStart`, etc.
- Full README with quickstart, event table, slash command guide, embed examples
- `publishConfig` pointing to npm public registry
- `engines: { node: ">=18" }`
- `@types/ws` dev dependency

### Changed
- `RestClient.request()` is now **public** — can be used for custom endpoints
- `kickGuildMember` now accepts optional `reason` parameter
- `banGuildMember` now accepts optional `reason` parameter
- `Client.login()` is now `async` and returns `this` for chaining

### Fixed
- Gateway used browser `WebSocket` — now correctly uses `ws` for Node.js
- No heartbeat detection for zombie connections
- Missing session resume causing full re-identify on every disconnect

---

## [2.0.0] — 2026-01-20

### Added
- Initial SDK release
- `CommandBuilder`, `EmbedBuilder`
- `RestClient`, `Gateway`
- `Permissions`, `PermissionFlags`
- `BeaconEventEmitter`
