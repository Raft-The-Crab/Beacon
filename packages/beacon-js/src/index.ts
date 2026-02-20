/**
 * beacon.js — Official Bot SDK for Beacon
 * @version 2.5.0
 * @license MIT
 *
 * Quick start:
 *   import { Client, CommandBuilder, EmbedBuilder } from 'beacon.js';
 *
 *   const client = new Client({ token: 'Bot YOUR_TOKEN' });
 *
 *   client.on('ready', () => console.log(`Logged in as ${client.user?.username}`));
 *   client.on('messageCreate', (msg) => {
 *     if (msg.content === '!ping') client.sendMessage(msg.channel_id, 'Pong! 🏓');
 *   });
 *
 *   client.login();
 */

// Core client
export { Client } from './client';

// Gateway
export { Gateway, Intents, DEFAULT_INTENTS, type GatewayOptions } from './gateway';

// REST
export { RestClient, type RestClientOptions } from './rest/RestClient';

// Builders
export { CommandBuilder, CommandOptionBuilder, CommandOptionType, type Command, type CommandOption } from './builders/CommandBuilder';
export { EmbedBuilder, type Embed } from './builders/EmbedBuilder';
export { ButtonBuilder, type ButtonData, type ButtonStyle } from './builders/ButtonBuilder';
export { SelectMenuBuilder, type SelectMenuData, type SelectMenuOption } from './builders/SelectMenuBuilder';
export { ActionRowBuilder, type ActionRowData, type ActionRowComponent } from './builders/ActionRowBuilder';
export { ModalBuilder, type ModalData, type TextInputData } from './builders/ModalBuilder';
export { PollBuilder, type PollData, type PollOption } from './builders/PollBuilder';
export { CardBuilder, type CardData, type CardField } from './builders/CardBuilder';
export { FormBuilder, type FormData, type FormField } from './builders/FormBuilder';
export { PaginatorBuilder, type PaginatorData, type PaginatorPage } from './builders/PaginatorBuilder';
export { TimelineBuilder, type TimelineData, type TimelineEvent } from './builders/TimelineBuilder';
export { TableBuilder, type TableData, type TableColumn, type TableRow } from './builders/TableBuilder';
export { DropdownBuilder, type DropdownData, type DropdownOption, type DropdownType } from './builders/DropdownBuilder';

// Structures
export { Collection } from './structures/Collection';
export { InteractionContext, type ReplyOptions } from './structures/InteractionContext';
export { Collector, type CollectorOptions } from './structures/Collector';
export type {
  RawMessage,
  RawUser,
  RawGuild,
  RawChannel,
  RawRole,
  RawMember,
  RawAttachment,
  RawReaction,
  RawInteraction,
  InteractionOption,
} from './structures/Message';

// Utility Managers
export { VoiceManager } from './managers/VoiceManager';
export { E2EEContext } from './structures/E2EEContext';

// Utilities
export { Permissions, PermissionFlags, type PermissionFlagValues } from './utils/Permissions';
export { BeaconEventEmitter, type BeaconEvents } from './events/EventEmitter';
