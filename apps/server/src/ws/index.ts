/**
 * WebSocket Server — Socket.IO gateway with full event routing
 * Handles: auth, rooms, messages, typing, presence, voice
 */
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';

let io: SocketIOServer;

// Simple in-memory presence store (Redis when available)
const presence: Map<string, { status: string; customStatus?: string; lastSeen: number }> = new Map();

export function getIO(): SocketIOServer {
  if (!io) throw new Error('Socket.IO not initialized — call initWS() first');
  return io;
}

export function initWS(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingInterval: 25000,
    pingTimeout: 60000,
  });

  // ─── Authentication middleware ────────────────────────────────
  io.use(async (socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers?.authorization as string)?.replace('Bearer ', '');
    if (!token) return next(new Error('No token provided'));

    try {
      const secret = process.env.JWT_SECRET || 'beacon-secret';
      const decoded = jwt.verify(token, secret) as { userId: string; id?: string; username?: string };
      const userId = decoded.userId || decoded.id;
      if (!userId) throw new Error('Invalid token payload');

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, avatar: true },
      });
      if (!user) return next(new Error('User not found'));

      (socket as any).user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // ─── Connection ───────────────────────────────────────────────
  (io as any).on('connection', async (socket: any) => {
    const user = (socket as any).user as { id: string; username: string; avatar: string | null };
    if (!user) return socket.disconnect();

    console.log(`[WS] ${user.username} connected (${socket.id})`);

    // Track presence
    presence.set(user.id, { status: 'online', lastSeen: Date.now() });

    // Join personal room
    socket.join(`user:${user.id}`);

    // Auto-join guild rooms
    try {
      const memberships = await (prisma as any).guildMember?.findMany?.({
        where: { userId: user.id },
        select: { guildId: true },
      }) ?? await (prisma as any).member?.findMany?.({
        where: { userId: user.id },
        select: { guildId: true },
      }) ?? [];

      for (const m of memberships) {
        socket.join(`guild:${m.guildId}`);
        io.to(`guild:${m.guildId}`).emit('PRESENCE_UPDATE', {
          userId: user.id,
          status: 'online',
        });
      }
    } catch (err) {
      console.warn('[WS] Could not load guild memberships:', (err as Error).message);
    }

    // ─── Channel rooms ──────────────────────────────────────────
    socket.on('JOIN_CHANNEL', async (channelId: string) => {
      try {
        const channel = await prisma.channel.findUnique({
          where: { id: channelId },
          select: { guildId: true }
        });

        if (channel?.guildId) {
          // Verify guild membership
          const isMember = await prisma.guildMember.findFirst({
            where: { guildId: channel.guildId, userId: user.id }
          });
          if (!isMember) return;
        }

        socket.join(`channel:${channelId}`);
        socket.emit('CHANNEL_JOINED', channelId);
      } catch (err) {
        console.error('[WS] JOIN_CHANNEL Error:', err);
      }
    });

    socket.on('LEAVE_CHANNEL', (channelId: string) => {
      socket.leave(`channel:${channelId}`);
    });

    socket.on('JOIN_DM', (channelId: string) => {
      socket.join(`dm:${channelId}`);
    });

    // ─── Typing indicators ──────────────────────────────────────
    socket.on('TYPING_START', ({ channelId }: { channelId: string }) => {
      if (!channelId) return;
      socket.to(`channel:${channelId}`).emit('TYPING_START', {
        channelId,
        userId: user.id,
        username: user.username,
        timestamp: Date.now(),
      });
    });

    socket.on('TYPING_STOP', ({ channelId }: { channelId: string }) => {
      if (!channelId) return;
      socket.to(`channel:${channelId}`).emit('TYPING_STOP', {
        channelId,
        userId: user.id,
      });
    });

    // ─── Presence update ────────────────────────────────────────
    socket.on('UPDATE_PRESENCE', async ({ status, customStatus }: { status: string; customStatus?: string }) => {
      const valid = ['online', 'idle', 'dnd', 'invisible'];
      if (!valid.includes(status)) return;

      presence.set(user.id, { status, customStatus, lastSeen: Date.now() });

      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            ...(status && { status: status as any }),
            ...(customStatus !== undefined && { customStatus }),
          } as any,
        });
      } catch (_) { }

      // Broadcast to guilds
      socket.rooms.forEach((room: string) => {
        if (room.startsWith('guild:')) {
          io.to(room).emit('PRESENCE_UPDATE', {
            userId: user.id,
            status,
            customStatus: customStatus ?? null,
          });
        }
      });
    });

    // ─── Voice state ─────────────────────────────────────────────
    socket.on('VOICE_STATE_UPDATE', async ({ channelId, mute, deaf, video }: {
      channelId: string | null;
      mute: boolean;
      deaf: boolean;
      video: boolean;
    }) => {
      const state = { userId: user.id, channelId, mute, deaf, video };

      if (channelId) socket.join(`voice:${channelId}`);

      // Find guild and broadcast
      try {
        if (channelId) {
          const channel = await prisma.channel.findUnique({
            where: { id: channelId },
            select: { guildId: true }
          });

          if (channel?.guildId) {
            // Membership check
            const isMember = await prisma.guildMember.findFirst({
              where: { guildId: channel.guildId, userId: user.id }
            });
            if (!isMember) return;

            io.to(`guild:${channel.guildId}`).emit('VOICE_STATE_UPDATE', state);
          }
        }
      } catch (_) { }
    });

    // ─── Disconnect ─────────────────────────────────────────────
    socket.on('disconnect', async (reason: string) => {
      console.log(`[WS] ${user.username} disconnected: ${reason}`);
      presence.delete(user.id);

      socket.rooms.forEach((room: any) => {
        if (typeof room === 'string' && room.startsWith('guild:')) {
          io.to(room).emit('PRESENCE_UPDATE', { userId: user.id, status: 'offline' });
        }
      });

      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { status: 'offline' as any },
        });
      } catch (_) { }
    });
  });

  console.log('[WS] Socket.IO server initialized');
  return io;
}

export { presence };
