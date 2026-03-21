# Changelog

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
