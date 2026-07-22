import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';

/**
 * The internal service API key used by the Notification Service
 * to authenticate and push broadcast events through the Gateway.
 */
const SERVICE_API_KEY = process.env.NOTIFICATION_SERVICE_KEY || 'cyberfrost-notification-svc-key';

/**
 * Set up all Socket.io handlers on the server.
 */
export const setupSocketHandlers = (io: SocketIOServer): void => {
  // ── Authentication middleware for Socket.io ──
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token || typeof token !== 'string') {
      (socket as any).authenticated = false;
      return next();
    }

    // Allow internal service authentication
    if (token === SERVICE_API_KEY) {
      (socket as any).authenticated = true;
      (socket as any).isService = true;
      return next();
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      (socket as any).user = decoded;
      (socket as any).authenticated = true;
      (socket as any).isService = false;
      next();
    } catch {
      (socket as any).authenticated = false;
      next();
    }
  });

  // ── Connection handler ──
  io.on('connection', (socket: Socket) => {
    const authed = (socket as any).authenticated;
    const isService = (socket as any).isService;

    console.log(
      `[Socket.io] ${isService ? '🔧 Service' : '👤 Client'} connected: ${socket.id} (authed: ${authed})`,
    );

    if (isService) {
      // ── Internal service: accept broadcast requests ──
      socket.on('notification:push', (data: { tenantId?: string; userId?: string; notification: any }) => {
        const { tenantId, userId, notification } = data;

        if (tenantId) {
          io.to(`tenant:${tenantId}`).emit('notification', notification);
          console.log(`[Socket.io → tenant:${tenantId}] Notification pushed`);
        }

        if (userId) {
          io.to(`user:${userId}`).emit('notification', notification);
          console.log(`[Socket.io → user:${userId}] Notification pushed`);
        }
      });

      socket.on('scan:progress', (data: { tenantId: string; jobId: string; progress: number; status: string }) => {
        io.to(`tenant:${data.tenantId}`).emit('scan:progress', {
          jobId: data.jobId,
          progress: data.progress,
          status: data.status,
        });
      });

      return;
    }

    // ── Regular client: room subscriptions ──
    socket.on('subscribe:notifications', (userId: string) => {
      socket.join(`user:${userId}`);
      console.log(`[Socket.io] ${socket.id} → user:${userId}`);
    });

    socket.on('subscribe:alerts', (tenantId: string) => {
      socket.join(`tenant:${tenantId}`);
      console.log(`[Socket.io] ${socket.id} → tenant:${tenantId}`);
    });

    socket.on('subscribe:scan', (scanId: string) => {
      socket.join(`scan:${scanId}`);
    });

    socket.on('unsubscribe:notifications', (userId: string) => {
      socket.leave(`user:${userId}`);
    });

    socket.on('unsubscribe:alerts', (tenantId: string) => {
      socket.leave(`tenant:${tenantId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });
};
