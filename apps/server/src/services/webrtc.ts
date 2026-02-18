import { Server as SocketIOServer } from 'socket.io';
import { redis } from './redis';

export class WebRTCService {
  private io: SocketIOServer;
  private peers: Map<string, Set<string>> = new Map(); // channelId -> Set of userId

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupSignaling();
  }

  private setupSignaling() {
    this.io.on('connection', (socket) => {
      console.log(`[WebRTC] Client connected: ${socket.id}`);

      // Join voice channel
      socket.on('voice:join', async ({ channelId, userId, guildId }) => {
        try {
          // Leave previous channel if any
          for (const [ch, users] of this.peers.entries()) {
            if (users.has(userId)) {
              users.delete(userId);
              socket.leave(`voice:${ch}`);
              this.io.to(`voice:${ch}`).emit('voice:user-left', { userId, channelId: ch });
            }
          }

          // Join new channel
          if (!this.peers.has(channelId)) {
            this.peers.set(channelId, new Set());
          }
          this.peers.get(channelId)!.add(userId);
          socket.join(`voice:${channelId}`);

          // Save voice state to Redis
          await redis.setVoiceState(userId, guildId, channelId, {
            deaf: false,
            mute: false,
            selfDeaf: false,
            selfMute: false,
            selfVideo: false,
          });

          // Get all current peers in channel
          const peers = Array.from(this.peers.get(channelId) || []).filter(id => id !== userId);

          // Notify user of existing peers
          socket.emit('voice:peers', { peers, channelId });

          // Notify others of new peer
          socket.to(`voice:${channelId}`).emit('voice:user-joined', { userId, channelId });

          console.log(`[WebRTC] User ${userId} joined channel ${channelId}`);
        } catch (error) {
          console.error('[WebRTC] Join error:', error);
          socket.emit('voice:error', { message: 'Failed to join voice channel' });
        }
      });

      // Leave voice channel
      socket.on('voice:leave', async ({ channelId, userId, guildId }) => {
        try {
          const channelPeers = this.peers.get(channelId);
          if (channelPeers) {
            channelPeers.delete(userId);
            if (channelPeers.size === 0) {
              this.peers.delete(channelId);
            }
          }

          socket.leave(`voice:${channelId}`);
          socket.to(`voice:${channelId}`).emit('voice:user-left', { userId, channelId });

          // Clear voice state from Redis
          await redis.setVoiceState(userId, guildId, null, {});

          console.log(`[WebRTC] User ${userId} left channel ${channelId}`);
        } catch (error) {
          console.error('[WebRTC] Leave error:', error);
        }
      });

      // WebRTC Signaling: Offer
      socket.on('voice:offer', ({ targetUserId, offer, channelId }) => {
        this.io.to(this.getUserSocketId(targetUserId)).emit('voice:offer', {
          fromUserId: socket.data.userId,
          offer,
          channelId,
        });
      });

      // WebRTC Signaling: Answer
      socket.on('voice:answer', ({ targetUserId, answer, channelId }) => {
        this.io.to(this.getUserSocketId(targetUserId)).emit('voice:answer', {
          fromUserId: socket.data.userId,
          answer,
          channelId,
        });
      });

      // WebRTC Signaling: ICE Candidate
      socket.on('voice:ice-candidate', ({ targetUserId, candidate, channelId }) => {
        this.io.to(this.getUserSocketId(targetUserId)).emit('voice:ice-candidate', {
          fromUserId: socket.data.userId,
          candidate,
          channelId,
        });
      });

      // Update voice state (mute, deaf, video, etc.)
      socket.on('voice:update-state', async ({ channelId, userId, guildId, state }) => {
        try {
          await redis.setVoiceState(userId, guildId, channelId, state);
          this.io.to(`voice:${channelId}`).emit('voice:state-updated', { userId, state });
        } catch (error) {
          console.error('[WebRTC] State update error:', error);
        }
      });

      // Screen sharing
      socket.on('screen:start', ({ channelId, userId }) => {
        socket.to(`voice:${channelId}`).emit('screen:started', { userId, channelId });
      });

      socket.on('screen:stop', ({ channelId, userId }) => {
        socket.to(`voice:${channelId}`).emit('screen:stopped', { userId, channelId });
      });

      // Disconnect handling
      socket.on('disconnect', async () => {
        const userId = socket.data.userId;
        if (!userId) return;

        // Remove from all voice channels
        for (const [channelId, users] of this.peers.entries()) {
          if (users.has(userId)) {
            users.delete(userId);
            socket.to(`voice:${channelId}`).emit('voice:user-left', { userId, channelId });
            
            // Clear Redis state
            await redis.setVoiceState(userId, socket.data.guildId || '', null, {});
          }
        }

        console.log(`[WebRTC] Client disconnected: ${socket.id}`);
      });
    });
  }

  private getUserSocketId(userId: string): string {
    // This would typically map userId to socketId via a Map
    // For now, using socket.io rooms
    return userId; // Simplified - in production, maintain userId -> socketId mapping
  }

  getChannelPeers(channelId: string): string[] {
    return Array.from(this.peers.get(channelId) || []);
  }

  isUserInVoice(userId: string): boolean {
    for (const users of this.peers.values()) {
      if (users.has(userId)) return true;
    }
    return false;
  }
}
