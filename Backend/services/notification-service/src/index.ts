/**
 * Notification Service — Entry Point
 * =====================================
 * Starts Express API + BullMQ consumer for global notification events.
 * Connects to API Gateway via Socket.io for real-time pushes.
 */

import app from './app';
import { config } from './config';
import { connectDatabase, disconnectDatabase } from './config/database';
import { isRedisConnected, closeConnections } from './queue/connection';
import { connectToGateway, disconnectFromGateway } from './services/gateway-connector';

async function main() {
  // ── MongoDB ──
  await connectDatabase();

  // ── Express server ──
  app.listen(config.port, '0.0.0.0', () => {
    console.log(`[Notification Service] Running on http://0.0.0.0:${config.port}`);
  });

  // ── Connect to API Gateway Socket.io (with delay for startup race) ──
  setTimeout(() => connectToGateway(), 2000);

  // ── Start BullMQ consumer ──
  const redisOk = await isRedisConnected().catch(() => false);
  if (redisOk) {
    const { createConsumer } = await import('./queue/consumer');
    const worker = createConsumer();
    console.log('[Notify] Global notification consumer started');

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n[Notify] ${signal}. Shutting down...`);
      await worker.close();
      await closeConnections();
      disconnectFromGateway();
      await disconnectDatabase();
      process.exit(0);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } else {
    console.warn('[Notify] Redis unavailable — notification consumer not started');
    console.warn('[Notify] Test/send-test endpoint will not work without Redis');
  }
}

main().catch((err) => { console.error('[Notify] Fatal:', err); process.exit(1); });
