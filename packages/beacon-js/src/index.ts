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

// Utilities
export { Permissions, PermissionFlags, type PermissionFlagValues } from './utils/Permissions';
export { BeaconEventEmitter, type BeaconEvents } from './events/EventEmitter';
