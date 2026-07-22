/**
 * Gateway Connector — Socket.io Bridge
 * ======================================
 * Connects to the API Gateway's Socket.io server as an internal service.
 * When a notification needs to be pushed to clients, it emits an event
 * that the Gateway's socket handler receives and broadcasts to rooms.
 */

import { io as SocketIOClient, Socket } from 'socket.io-client';
import { config } from '../config';

let socket: Socket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Connect to API Gateway as an internal notification service.
 * Automatically reconnects on disconnect.
 */
export function connectToGateway(): Socket {
  if (socket?.connected) return socket;

  socket = SocketIOClient(config.apiGateway.url, {
    transports: ['websocket', 'polling'],
    auth: {
      token: config.apiGateway.serviceKey,
      service: 'notification-service',
    },
    reconnection: true,
    reconnectionDelay: 3000,
    reconnectionAttempts: 20,
  });

  socket.on('connect', () => {
    console.log(`[Gateway] Connected to API Gateway (socket: ${socket?.id})`);
  });

  socket.on('disconnect', (reason) => {
    console.warn(`[Gateway] Disconnected from API Gateway: ${reason}`);
  });

  let attemptCount = 0;
  socket.on('connect_error', (err) => {
    attemptCount++;
    if (attemptCount > 5) {
      console.warn(`[Gateway] Connection error (${attemptCount}): ${err.message}`);
    }
  });

  return socket;
}

/**
 * Push a notification to a specific tenant's room via the Gateway.
 * The Gateway's socket handler will broadcast to `tenant:{tenantId}`.
 */
export function pushToTenant(tenantId: string, notification: Record<string, unknown>): void {
  if (!socket?.connected) {
    console.warn('[Gateway] Not connected — cannot push notification');
    return;
  }
  socket.emit('notification:push', { tenantId, notification });
}

/**
 * Push a notification to a specific user's room.
 */
export function pushToUser(userId: string, notification: Record<string, unknown>): void {
  if (!socket?.connected) {
    console.warn('[Gateway] Not connected — cannot push notification');
    return;
  }
  socket.emit('notification:push', { userId, notification });
}

/**
 * Disconnect from the Gateway.
 */
export function disconnectFromGateway(): void {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
