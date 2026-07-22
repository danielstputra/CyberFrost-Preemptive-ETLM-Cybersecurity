import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import { config } from './config';
import { setupSocketHandlers } from './socket';

// ──────────────────────────────────────
// HTTP + Socket.IO Server
// ──────────────────────────────────────

const httpServer = http.createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.corsOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // Production: configure Redis adapter for multi-instance
  // adapter: createAdapter(config.redis.url),
});

setupSocketHandlers(io);

// ── Start ──
httpServer.listen(config.port, '0.0.0.0', () => {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║        CyberFrost API Gateway              ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  Port      : ${String(config.port).padEnd(38)}║`);
  console.log(`║  Env       : ${config.nodeEnv.padEnd(38)}║`);
  console.log(`║  Socket.io : ${'ready'.padEnd(38)}║`);
  console.log('╚══════════════════════════════════════════════╝');
});

// ── Graceful Shutdown ──
const shutdown = (signal: string) => {
  console.log(`\n[API Gateway] Received ${signal}. Shutting down gracefully...`);

  io.close(() => {
    console.log('[Socket.io] Server closed.');
  });

  httpServer.close(() => {
    console.log('[HTTP] Server closed.');
    process.exit(0);
  });

  // Force exit after 10s
  setTimeout(() => {
    console.error('[API Gateway] Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export { io, httpServer };
