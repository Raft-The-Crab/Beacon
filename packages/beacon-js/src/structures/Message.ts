/**
 * Message structure
 */
export interface RawMessage {
  id: string;
  channel_id: string;
  author: RawUser;
  content: string;
  timestamp: string;
  edited_timestamp?: string | null;
  mentions: RawUser[];
  attachments: RawAttachment[];
  embeds: any[];
  reactions?: RawReaction[];
  pinned: boolean;
  webhook_id?: string;
  referenced_message?: RawMessage | null;
}

export interface RawUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  bot?: boolean;
}

export interface RawAttachment {
  id: string;
  filename: string;
  size: number;
  url: string;
  content_type?: string;
}

export interface RawReaction {
  count: number;
  me: boolean;
  emoji: { id: string | null; name: string | null; animated?: boolean };
}

export interface RawGuild {
  id: string;
  name: string;
  icon: string | null;
  banner: string | null;
  owner_id: string;
  member_count?: number;
  channels?: RawChannel[];
  roles?: RawRole[];
  members?: RawMember[];
}

export interface RawChannel {
  id: string;
  guild_id?: string;
  name: string;
  type: number;
  position: number;
  parent_id?: string | null;
  topic?: string | null;
  nsfw?: boolean;
  slowmode_delay?: number;
  recipients?: RawUser[];
}

export interface RawRole {
  id: string;
  name: string;
  color: number;
  hoist: boolean;
  position: number;
  permissions: string;
  managed: boolean;
  mentionable: boolean;
}

export interface RawMember {
  user: RawUser;
  nick?: string | null;
  roles: string[];
  joined_at: string;
  deaf: boolean;
  mute: boolean;
}

export interface RawInteraction {
  id: string;
  application_id: string;
  type: number;
  data?: {
    id: string;
    name: string;
    type: number;
    options?: InteractionOption[];
  };
  guild_id?: string;
  channel_id: string;
  member?: RawMember;
  user?: RawUser;
  token: string;
  version: number;
}

export interface InteractionOption {
  name: string;
  type: number;
  value?: string | number | boolean;
  options?: InteractionOption[];
}
