# Changelog

## [3.0.0-beta.1] - 2026-03-21

### Breaking
- **Major Version Bump**: All 7 packages unified to `3.0.0-beta.1`. Previous `2.5.x` packages are superseded.
- **Server Class Rename**: `BeaconServerV2` → `BeaconServer`. Update any external references.

### Added — SDK
- **`SDK_VERSION` constant**: Exported version string for runtime diagnostics.
- **`Client.fetchSelf()`**: Convenience method to fetch the bot's own User from the API.
- **`Client.cacheStats`**: Getter returning `{ guilds, channels, users, messages }` cache sizes.
- **`Client.uptime`**: Getter returning ms since the `ready` event.
- **`Client.ping()`**: Returns `{ ws, health, grade }` for gateway diagnostics.
- **`Client.healthScore` / `Client.healthGrade`**: Gateway connection health (0-100, excellent/good/degraded/critical).
- **`Client.sessionInfo`**: Full gateway session diagnostics snapshot.
- **`Client.restStats`**: Live REST request metrics (total, errors, avg latency).
- **`Gateway.healthScore`**: Connection quality scoring based on heartbeat ACK ratio, latency, and reconnects.
- **`Gateway.sessionInfo`**: Exposes `sessionId`, `sequence`, `reconnectAttempts`, health data.
- **`Gateway.lastHeartbeatAt`**: Timestamp of last successful heartbeat ACK.
- **`healthChange` event**: Emitted on every heartbeat with `{ score, grade, latency }`.
- **`RestClient.stats`**: Request metrics — `totalRequests`, `failedRequests`, `avgLatencyMs`.
- **`RestClient` timeout**: 30s `AbortController` timeout on all REST calls (configurable via `timeout` option).
- **Frontend `useIntersectionObserver`**: Lazy-load components/images when entering viewport.
- **Frontend `useMediaQuery`**: Reactive CSS media query hook for responsive logic.
- **Frontend `useOnlineStatus`**: Detect network connectivity changes.
- **ErrorBoundary v3**: Auto-retry (3x, exponential backoff), crash ID hashing, copy-to-clipboard, structured telemetry via `beacon:error` custom event.
- **Server `Permissions-Policy`**: Restricts camera, microphone, geolocation, payment, USB, magnetometer, gyroscope.
- **Server `X-Beacon-Version`**: Response header on every request for client version detection.
- **Server boot timing**: Startup banner logs total boot duration.
- **Server `uploadLimiter`**: Stricter rate limiter (10 req/min) for file upload endpoints.
- **Server `detectProtoPollution`**: Audit-logged detection of `__proto__`/`constructor`/`prototype` keys in payloads.
- **Sanitizer `sanitizeUrl()`**: URL validation with SSRF prevention (blocks private IPs in production).
- **Sanitizer zero-width stripping**: Removes U+200B, U+200C, U+200D, U+FEFF, U+2060, U+180E from messages.
- **Sanitizer proto pollution guard**: Strips `__proto__`, `constructor`, `prototype` keys from request body recursively.
- **Attachment Downloads**: All attachment types (images, videos, audio, files) now have download buttons — hover overlay for media, inline button for files.
- **Easter Egg Text Effects**: New shorthand markdown in chat messages:
  - `--text--` → **Glitch** effect (chromatic aberration animation)
  - `^^text^^` → **Bounce** effect (letter-by-letter wave)
  - `%%text%%` → **Flip** effect (rotates on hover)
  - `>>text<<` → **Typewriter** effect (types character by character)
  - Also available as `[glitch]`, `[bounce]`, `[flip]`, `[type]` tags

### Fixed
- **opusscript Browser Leak**: Resolved `Failed to resolve module specifier "opusscript"` via Vite resolve alias.
- **Build Config Safety**: Validated `nixpacks.toml` and `railway.json` — both confirmed clean.

### Changed
- **SDK User-Agent**: Dynamic `beacon.js/3.0.0-beta.1 (Beacon SDK)` instead of hardcoded `2.5.0`.
- **Gateway debug logs**: Now include health score in heartbeat ACK messages.
- **Server `sanitizeHeaders`**: Now enforces `X-Content-Type-Options: nosniff`.
- **Web tsconfig**: Target upgraded ES2020 → ES2022, added `forceConsistentCasingInFileNames`.
- **Server tsconfig**: Added `noFallthroughCasesInSwitch`.
- **CSS v3 Refresh**: New micro-interaction utilities (reveal animations, surface interactions, stagger, skeleton loading, card lift, focus ring, glow pulse).
- **`__APP_VERSION__`**: Fallback updated to `3.0.0-beta.1`.


## [2.2.0] - 2026-03-17

### Added
- **Full Interaction Bridge**: Established end-to-end communication for all interaction types.
- **Slash Commands**: Recursive option parsing supporting sub-commands and sub-command groups.
- **Context Menus**: Support for User and Message context menu commands (Types 2 & 3).
- **Dynamic Modals**: Full support for bot-triggered modals with frontend rendering and submission.
- **Autocomplete**: Real-time suggestions for command options via the SDK.
- **Advanced Types**: Added `ApplicationCommandType` and `ApplicationCommandOptionType` to `beacon-types`.
- **Deferred Responses**: Integrated "thinking" states for long-running bot operations.

### Fixed
- **MessageInput UI**: Restored the voice message button and resolved linting warnings for `Volume2` and `onVoiceClick`.
- **Interaction Logic**: Corrected argument parsing for nested slash command options.
- **Type Safety**: Fixed persistent lint errors in `api/webhooks.ts` by correctly casting request objects.

### Changed
- **BotFramework Expansion**: Enhanced `BaseBot` with native support for `onModalSubmit` and `onAutocomplete`.
- **UI Store**: Added global state for bot-driven modals.
