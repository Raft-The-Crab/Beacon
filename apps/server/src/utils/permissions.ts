/**
 * Beacon Sovereignty — Permission Constants
 * Based on bitwise BigInt operations for infinite scalability.
 */

import { PermissionBit } from '@beacon/types';

export const Permissions = {
    ADMINISTRATOR: BigInt(PermissionBit.ADMINISTRATOR),
    MANAGE_SERVER: BigInt(PermissionBit.MANAGE_SERVER),
    MANAGE_ROLES: BigInt(PermissionBit.MANAGE_ROLES),
    MANAGE_CHANNELS: BigInt(PermissionBit.MANAGE_CHANNELS),
    KICK_MEMBERS: BigInt(PermissionBit.KICK_MEMBERS),
    BAN_MEMBERS: BigInt(PermissionBit.BAN_MEMBERS),
    CREATE_INVITE: BigInt(PermissionBit.CREATE_INVITE),
    CHANGE_NICKNAME: BigInt(PermissionBit.CHANGE_NICKNAME),
    MANAGE_NICKNAMES: BigInt(PermissionBit.MANAGE_NICKNAMES),
    MANAGE_MESSAGES: BigInt(PermissionBit.MANAGE_MESSAGES),
    SEND_MESSAGES: BigInt(PermissionBit.SEND_MESSAGES),
    EMBED_LINKS: BigInt(PermissionBit.EMBED_LINKS),
    ATTACH_FILES: BigInt(PermissionBit.ATTACH_FILES),
    ADD_REACTIONS: BigInt(PermissionBit.ADD_REACTIONS),
    USE_EXTERNAL_EMOJIS: BigInt(PermissionBit.USE_EXTERNAL_EMOJIS),
    MENTION_EVERYONE: BigInt(PermissionBit.MENTION_EVERYONE),
    MANAGE_WEBHOOKS: BigInt(PermissionBit.MANAGE_WEBHOOKS),
    VIEW_CHANNELS: BigInt(PermissionBit.VIEW_CHANNELS),
    SEND_TTS_MESSAGES: BigInt(PermissionBit.SEND_TTS_MESSAGES),
    CONNECT_VOICE: BigInt(PermissionBit.CONNECT_VOICE),
    SPEAK_VOICE: BigInt(PermissionBit.SPEAK_VOICE),
    MUTE_MEMBERS: BigInt(PermissionBit.MUTE_MEMBERS),
    DEAFEN_MEMBERS: BigInt(PermissionBit.DEAFEN_MEMBERS),
    MOVE_MEMBERS: BigInt(PermissionBit.MOVE_MEMBERS),
    USE_VOICE_ACTIVITY: BigInt(PermissionBit.USE_VOICE_ACTIVITY),
    PRIORITY_SPEAKER: BigInt(PermissionBit.PRIORITY_SPEAKER),
};

/**
 * Checks if a set of permissions contains the required bit(s).
 */
export function hasPermission(memberPerms: bigint, requiredPerms: bigint): boolean {
    if ((memberPerms & BigInt(Permissions.ADMINISTRATOR)) === BigInt(Permissions.ADMINISTRATOR)) {
        return true;
    }
    return (memberPerms & requiredPerms) === requiredPerms;
}

/**
 * Computes the total permissions for a member based on their roles.
 */
export function computePermissions(roles: { permissions: bigint }[]): bigint {
    return roles.reduce((acc, role) => acc | role.permissions, 0n);
}
