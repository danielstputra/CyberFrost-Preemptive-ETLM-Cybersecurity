/**
 * Intelligence Service — Entry Point
 * =====================================
 * Starts the Express API server + the cron scheduler for
 * periodic threat data fetching.
 */

import app from './app';
import { config } from './config';
import { createLogger } from '@cyfirma/shared';
import { connectDatabase, disconnectDatabase } from './config/database';
import { startThreatFetcher, stopThreatFetcher } from './jobs/threat-fetcher';
import { startIocFetcher, runIocFetch } from './jobs/ioc-fetcher';

const log = createLogger({ serviceName: 'intelligence-service' });

async function main() {
  // ── Connect to MongoDB ──
  await connectDatabase();

  // ── Start Express server ──
  app.listen(config.port, '0.0.0.0', () => {
    log.info({ port: config.port }, 'Intelligence Service running');
  });

  // ── Start Cron Jobs ──
  startThreatFetcher();
  startIocFetcher();

  // ── Graceful Shutdown ──
  const shutdown = async (signal: string) => {
    log.info({ signal }, 'Shutting down...');
    stopThreatFetcher();
    await disconnectDatabase();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  log.error({ err }, 'Fatal startup error');
  process.exit(1);
});
