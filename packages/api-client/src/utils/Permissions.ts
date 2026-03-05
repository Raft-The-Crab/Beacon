/**
 * Permissions - Bitfield-based permission system
 */

export const PermissionFlags = {
  CREATE_INSTANT_INVITE: 1n << 0n,
  KICK_MEMBERS: 1n << 1n,
  BAN_MEMBERS: 1n << 2n,
  ADMINISTRATOR: 1n << 3n,
  MANAGE_CHANNELS: 1n << 4n,
  MANAGE_GUILD: 1n << 5n,
  ADD_REACTIONS: 1n << 6n,
  VIEW_AUDIT_LOG: 1n << 7n,
  PRIORITY_SPEAKER: 1n << 8n,
  STREAM: 1n << 9n,
  VIEW_CHANNEL: 1n << 10n,
  SEND_MESSAGES: 1n << 11n,
  SEND_TTS_MESSAGES: 1n << 12n,
  MANAGE_MESSAGES: 1n << 13n,
  EMBED_LINKS: 1n << 14n,
  ATTACH_FILES: 1n << 15n,
  READ_MESSAGE_HISTORY: 1n << 16n,
  MENTION_EVERYONE: 1n << 17n,
  USE_EXTERNAL_EMOJIS: 1n << 18n,
  VIEW_GUILD_INSIGHTS: 1n << 19n,
  CONNECT: 1n << 20n,
  SPEAK: 1n << 21n,
  MUTE_MEMBERS: 1n << 22n,
  DEAFEN_MEMBERS: 1n << 23n,
  MOVE_MEMBERS: 1n << 24n,
  USE_VAD: 1n << 25n,
  CHANGE_NICKNAME: 1n << 26n,
  MANAGE_NICKNAMES: 1n << 27n,
  MANAGE_ROLES: 1n << 28n,
  MANAGE_WEBHOOKS: 1n << 29n,
  MANAGE_EMOJIS_AND_STICKERS: 1n << 30n,
  USE_APPLICATION_COMMANDS: 1n << 31n,
  REQUEST_TO_SPEAK: 1n << 32n,
  MANAGE_EVENTS: 1n << 33n,
  MANAGE_THREADS: 1n << 34n,
  CREATE_PUBLIC_THREADS: 1n << 35n,
  CREATE_PRIVATE_THREADS: 1n << 36n,
  USE_EXTERNAL_STICKERS: 1n << 37n,
  SEND_MESSAGES_IN_THREADS: 1n << 38n,
  USE_EMBEDDED_ACTIVITIES: 1n << 39n,
  MODERATE_MEMBERS: 1n << 40n
} as const;

export type PermissionFlagValues = typeof PermissionFlags[keyof typeof PermissionFlags];

export class Permissions {
  private bitfield: bigint;

  constructor(permissions: bigint | bigint[] | PermissionFlagValues[]) {
    if (Array.isArray(permissions)) {
      this.bitfield = permissions.reduce((acc, perm) => acc | BigInt(perm), 0n);
    } else {
      this.bitfield = BigInt(permissions);
    }
  }

  has(permission: PermissionFlagValues | bigint): boolean {
    const perm = BigInt(permission);
    if ((this.bitfield & PermissionFlags.ADMINISTRATOR) === PermissionFlags.ADMINISTRATOR) {
      return true;
    }
    return (this.bitfield & perm) === perm;
  }

  add(...permissions: (PermissionFlagValues | bigint)[]): this {
    for (const perm of permissions) {
      this.bitfield |= BigInt(perm);
    }
    return this;
  }

  remove(...permissions: (PermissionFlagValues | bigint)[]): this {
    for (const perm of permissions) {
      this.bitfield &= ~BigInt(perm);
    }
    return this;
  }

  toArray(): PermissionFlagValues[] {
    const perms: PermissionFlagValues[] = [];
    for (const value of Object.values(PermissionFlags)) {
      if (this.has(value)) {
        perms.push(value);
      }
    }
    return perms;
  }

  serialize(): string {
    return this.bitfield.toString();
  }

  equals(other: Permissions): boolean {
    return this.bitfield === other.bitfield;
  }

  static resolve(permission: PermissionFlagValues | bigint | Permissions): bigint {
    if (permission instanceof Permissions) {
      return permission.bitfield;
    }
    return BigInt(permission);
  }

  static all(): bigint {
    return Object.values(PermissionFlags)
      .reduce((acc, perm) => acc | perm, 0n);
  }

  static default(): bigint {
    return (
      PermissionFlags.VIEW_CHANNEL |
      PermissionFlags.SEND_MESSAGES |
      PermissionFlags.READ_MESSAGE_HISTORY |
      PermissionFlags.ADD_REACTIONS |
      PermissionFlags.EMBED_LINKS |
      PermissionFlags.ATTACH_FILES |
      PermissionFlags.USE_EXTERNAL_EMOJIS |
      PermissionFlags.CONNECT |
      PermissionFlags.SPEAK |
      PermissionFlags.USE_VAD |
      PermissionFlags.CHANGE_NICKNAME
    );
  }
}
