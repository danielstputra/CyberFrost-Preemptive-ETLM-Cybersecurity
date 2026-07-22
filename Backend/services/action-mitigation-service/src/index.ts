import app from './app';
import { config } from './config';
import { connectDatabase, disconnectDatabase } from './config/database';
import { isRedisConnected, closeConnections } from './queue/connection';

async function main() {
  await connectDatabase();

  // Start Express
  app.listen(config.port, '0.0.0.0', () => {
    console.log(`[Action Mitigation] Running on http://0.0.0.0:${config.port}`);
  });

  // Start BullMQ Consumers
  const redisOk = await isRedisConnected().catch(() => false);
  if (redisOk) {
    const { createMitigationConsumer, createManualBlockConsumer } = await import('./queue/consumer');

    // Auto-mitigation: listens for CRITICAL_THREAT_FOUND
    const autoWorker = createMitigationConsumer();
    console.log('[Action Mitigation] CRITICAL_THREAT_FOUND consumer started');

    // Manual block: processes "Block Threat" from CVE Database & Action pages
    const manualWorker = createManualBlockConsumer();
    console.log('[Action Mitigation] Manual block consumer started (mitigation-actions queue)');

    const shutdown = async (signal: string) => {
      console.log(`\n[Mitigation] ${signal}. Shutting down...`);
      await autoWorker.close();
      await manualWorker.close();
      await closeConnections();
      await disconnectDatabase();
      process.exit(0);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } else {
    console.warn('[Action Mitigation] Redis unavailable — consumers disabled');
  }
}

main().catch((err) => { console.error('[Mitigation] Fatal:', err); process.exit(1); });
