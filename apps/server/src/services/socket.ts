import { Server as IOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { AuthService } from '../services/auth';


interface BeaconSocket extends Socket {
    userId?: string;
}

export class SocketService {
    private static io: IOServer;

    static init(httpServer: HttpServer) {
        this.io = new IOServer(httpServer, {
            cors: {
                origin: '*', // Configure properly in production
                methods: ['GET', 'POST']
            }
        });

        this.io.use(async (socket: BeaconSocket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token) return next(new Error('Authentication error'));

                // Mock verification for now if middleware isn't ready, assuming JWT_SECRET
                // const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
                // socket.userId = decoded.userId;

                const decoded = AuthService.verifyToken(token);
                if (decoded) {
                    socket.userId = decoded.id;
                } else {
                    // For development speed, strict auth later:
                    socket.userId = 'dev-user';
                }

                next();
            } catch (err) {
                next(new Error('Authentication error'));
            }
        });

        this.io.on('connection', (socket: BeaconSocket) => {
            console.log(`User connected: ${socket.userId}`);

            // Handle joining rooms (Guilds/Channels)
            socket.on('join_room', (roomId: string) => {
                socket.join(roomId);
                console.log(`User ${socket.userId} joined room ${roomId}`);
            });

            socket.on('leave_room', (roomId: string) => {
                socket.leave(roomId);
            });

            // Handle disconnect
            socket.on('disconnect', () => {
                console.log(`User disconnected: ${socket.userId}`);
            });
        });
    }

    /**
     * Broadcast an event to a specific room (Guild or Channel)
     */
    static emitToRoom(roomId: string, event: string, payload: any) {
        if (this.io) {
            this.io.to(roomId).emit(event, payload);
        }
    }

    /**
     * Broadcast to a specific user (e.g. notifications)
     */
    static emitToUser(userId: string, event: string, payload: any) {
        // This requires tracking socket-to-user mapping, simplistic broadcast for now
        // In production, we'd use a Redis adapter or local map
        // For now, emit to a room named after the userId
        if (this.io) {
            this.io.to(userId).emit(event, payload);
        }
    }
}
