/**
 * Gateway — WebSocket connection to Beacon with full Node.js support,
 * auto-reconnect with exponential backoff, session resume, and heartbeat.
 */

import { EventEmitter } from 'events';
import WebSocket from 'ws';

export interface GatewayOptions {
  token: string;
  url?: string;
  intents?: number;
}

export const Intents = {
  GUILDS: 1 << 0,
  GUILD_MEMBERS: 1 << 1,
  GUILD_MODERATION: 1 << 2,
  GUILD_EMOJIS_AND_STICKERS: 1 << 3,
  GUILD_INTEGRATIONS: 1 << 4,
  GUILD_WEBHOOKS: 1 << 5,
  GUILD_INVITES: 1 << 6,
  GUILD_VOICE_STATES: 1 << 7,
  GUILD_PRESENCES: 1 << 8,
  GUILD_MESSAGES: 1 << 9,
  GUILD_MESSAGE_REACTIONS: 1 << 10,
  GUILD_MESSAGE_TYPING: 1 << 11,
  DIRECT_MESSAGES: 1 << 12,
  DIRECT_MESSAGE_REACTIONS: 1 << 13,
  DIRECT_MESSAGE_TYPING: 1 << 14,
  MESSAGE_CONTENT: 1 << 15,
  GUILD_SCHEDULED_EVENTS: 1 << 16,
} as const;

export const DEFAULT_INTENTS =
  Intents.GUILDS |
  Intents.GUILD_MEMBERS |
  Intents.GUILD_MESSAGES |
  Intents.GUILD_MESSAGE_REACTIONS |
  Intents.DIRECT_MESSAGES |
  Intents.MESSAGE_CONTENT;

const OPCodes = {
  DISPATCH: 0,
  HEARTBEAT: 1,
  IDENTIFY: 2,
  PRESENCE_UPDATE: 3,
  VOICE_STATE_UPDATE: 4,
  RESUME: 6,
  RECONNECT: 7,
  REQUEST_GUILD_MEMBERS: 8,
  INVALID_SESSION: 9,
  HELLO: 10,
  HEARTBEAT_ACK: 11,
} as const;

export class Gateway extends EventEmitter {
  private ws: WebSocket | null = null;
  private token: string;
  private url: string;
  private intents: number;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private heartbeatAcked = true;
  private sessionId: string | null = null;
  private sequence: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  constructor(options: GatewayOptions) {
    super();
    this.token = options.token;
    this.url = options.url || 'ws://localhost:4000/gateway';
    this.intents = options.intents ?? DEFAULT_INTENTS;
  }

  connect() {
    if (this.destroyed) return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;

    this.emit('debug', `[Gateway] Connecting to ${this.url}`);
    this.ws = new WebSocket(this.url);

    this.ws.on('open', () => {
      this.emit('debug', '[Gateway] WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.ws.on('message', (data: WebSocket.RawData) => {
      try {
        const packet = JSON.parse(data.toString());
        this.handlePacket(packet);
      } catch (err) {
        this.emit('error', err instanceof Error ? err : new Error(String(err)));
      }
    });

    this.ws.on('close', (code, reason) => {
      const reasonStr = reason.toString();
      this.emit('debug', `[Gateway] Closed: ${code} ${reasonStr}`);
      this.cleanup();
      this.emit('disconnect', { code, reason: reasonStr });

      // Reconnectable close codes
      const reconnectable = ![4004, 4010, 4011, 4012, 4013, 4014].includes(code);
      if (!this.destroyed && reconnectable) {
        this.scheduleReconnect();
      }
    });

    this.ws.on('error', (err) => {
      this.emit('error', err);
    });
  }

  private handlePacket(packet: any) {
    if (packet.s !== null && packet.s !== undefined) {
      this.sequence = packet.s;
    }

    switch (packet.op) {
      case OPCodes.HELLO:
        this.heartbeatAcked = true;
        this.startHeartbeat(packet.d.heartbeat_interval);
        if (this.sessionId && this.sequence) {
          this.resume();
        } else {
          this.identify();
        }
        break;

      case OPCodes.HEARTBEAT_ACK:
        this.heartbeatAcked = true;
        this.emit('debug', '[Gateway] Heartbeat ACK received');
        break;

      case OPCodes.HEARTBEAT:
        this.sendHeartbeat();
        break;

      case OPCodes.RECONNECT:
        this.emit('debug', '[Gateway] Server requested reconnect');
        this.forceReconnect();
        break;

      case OPCodes.INVALID_SESSION: {
        const resumable = Boolean(packet.d);
        this.emit('debug', `[Gateway] Invalid session, resumable: ${resumable}`);
        if (!resumable) {
          this.sessionId = null;
          this.sequence = null;
        }
        setTimeout(() => this.forceReconnect(), 5000);
        break;
      }

      case OPCodes.DISPATCH:
        if (packet.t === 'READY') {
          this.sessionId = packet.d.session_id;
          this.emit('ready', packet.d);
        } else if (packet.t === 'RESUMED') {
          this.emit('debug', '[Gateway] Session resumed successfully');
        }
        this.emit('packet', packet);
        // Camel-case event names for nice API
        this.emit(camelCase(packet.t), packet.d);
        break;

      default:
        this.emit('debug', `[Gateway] Unknown opcode: ${packet.op}`);
    }
  }

  private identify() {
    this.emit('debug', '[Gateway] Identifying...');
    this.send({
      op: OPCodes.IDENTIFY,
      d: {
        token: this.token,
        intents: this.intents,
        properties: {
          os: process.platform,
          browser: 'beacon.js',
          device: 'beacon.js',
        },
        compress: false,
      },
    });
  }

  private resume() {
    this.emit('debug', '[Gateway] Resuming session...');
    this.send({
      op: OPCodes.RESUME,
      d: {
        token: this.token,
        session_id: this.sessionId,
        seq: this.sequence,
      },
    });
  }

  private startHeartbeat(intervalMs: number) {
    this.cleanup(false);
    this.heartbeatInterval = setInterval(() => {
      if (!this.heartbeatAcked) {
        this.emit('debug', '[Gateway] Heartbeat not ACKed — reconnecting (zombie connection)');
        this.forceReconnect();
        return;
      }
      this.heartbeatAcked = false;
      this.sendHeartbeat();
    }, intervalMs);
  }

  private sendHeartbeat() {
    this.send({ op: OPCodes.HEARTBEAT, d: this.sequence });
  }

  public send(data: object) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('error', new Error('[Gateway] Max reconnect attempts reached'));
      return;
    }

    const delay = Math.min(500 * 2 ** this.reconnectAttempts, 30000);
    this.reconnectAttempts++;
    this.emit('debug', `[Gateway] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private forceReconnect() {
    this.cleanup();
    if (this.ws) {
      this.ws.terminate();
      this.ws = null;
    }
    this.scheduleReconnect();
  }

  private cleanup(clearReconnect = true) {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (clearReconnect && this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  disconnect() {
    this.destroyed = true;
    this.cleanup();
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  updatePresence(status: 'online' | 'idle' | 'dnd' | 'invisible', activities: any[] = []) {
    this.send({
      op: OPCodes.PRESENCE_UPDATE,
      d: {
        since: status === 'idle' ? Date.now() : null,
        activities,
        status,
        afk: status === 'idle',
      },
    });
  }
}

/** Convert SCREAMING_SNAKE to camelCase for event names */
function camelCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}
