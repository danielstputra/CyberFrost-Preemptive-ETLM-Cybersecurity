/**
 * Intelligence Service — Entry Point
 * =====================================
 * Starts the Express API server + the cron scheduler for
 * periodic threat data fetching.
 */

import app from './app';
import { config } from './config';
import { connectDatabase, disconnectDatabase } from './config/database';
import { startThreatFetcher, stopThreatFetcher } from './jobs/threat-fetcher';

async function main() {
  // ── Connect to MongoDB ──
  await connectDatabase();

  // ── Start Express server ──
  app.listen(config.port, '0.0.0.0', () => {
    console.log(`[Intelligence Service] Running on http://0.0.0.0:${config.port}`);
  });

  // ── Start Cron Job ──
  // Runs on configurable interval (default every 30 min).
  // Simulates pulling CVE + threat intel from external sources.
  startThreatFetcher();

  // ── Graceful Shutdown ──
  const shutdown = async (signal: string) => {
    console.log(`\n[Intel] ${signal}. Shutting down...`);
    stopThreatFetcher();
    await disconnectDatabase();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('[Intel] Fatal:', err);
  process.exit(1);
});
