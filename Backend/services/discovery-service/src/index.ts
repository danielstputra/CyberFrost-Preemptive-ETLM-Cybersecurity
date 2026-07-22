/**
 * Discovery Service — Entry Point
 * ==================================
 * Starts the Express API server. If Redis is available, also starts
 * the BullMQ background worker for async scanning. Without Redis,
 * the API still works but POST /scan returns a hint to start Redis.
 */

import app from './app';
import { config } from './config';
import { connectDatabase, disconnectDatabase } from './config/database';
import { isRedisConnected, closeQueue } from './queue';

// ──────────────────────────────────────
//  Main
// ──────────────────────────────────────

async function main() {
  // ── Connect to MongoDB ──
  await connectDatabase();

  // ── Start Express server (always, even without Redis) ──
  app.listen(config.port, '0.0.0.0', () => {
    console.log(`[Discovery Service] Running on http://0.0.0.0:${config.port}`);
  });

  // ── Start BullMQ Worker (only if Redis is available) ──
  const redisOk = await isRedisConnected().catch(() => false);
  if (!redisOk) {
    console.warn('[Discovery] Redis not available — worker not started.');
    console.warn('[Discovery] POST /scan will queue in memory only.');
    console.warn('[Discovery] Start Redis on localhost:6379 for full functionality.');
  } else {
    await startWorker();
  }

  // ── Graceful Shutdown ──
  const shutdown = async (signal: string) => {
    console.log(`\n[Discovery] ${signal}. Shutting down...`);
    await closeQueue();
    await disconnectDatabase();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// ──────────────────────────────────────
//  Worker (only called when Redis is up)
// ──────────────────────────────────────

async function startWorker() {
  const { Worker } = await import('bullmq');
  const { getRedis } = await import('./queue');
  const { runScan } = await import('./services/scanner');
  const { ScanJob } = await import('./models/ScanJob');
  const { DiscoveredDomain } = await import('./models/DiscoveredDomain');

  const worker = new Worker(
    'discovery-scans',
    async (job) => {
      const { domain, tenantId, userId, scanJobId } = job.data;
      console.log(`[Worker] Starting scan: ${domain}`);

      await ScanJob.findByIdAndUpdate(scanJobId, {
        status: 'RUNNING',
        startedAt: new Date(),
      });

      const result = await runScan({
        domain,
        tenantId,
        userId,
        onProgress: async (progress) => {
          await ScanJob.findByIdAndUpdate(scanJobId, { progress });
          await job.updateProgress(progress);
        },
      });

      await DiscoveredDomain.updateMany(
        { parentDomain: domain, tenantId, scanJobId: '' },
        { $set: { scanJobId } },
      );

      const summary = {
        totalSubdomainsChecked: result.subdomainsChecked,
        resolvableSubdomains: result.subdomainsFound,
        openPorts: result.openPorts,
        technologies: result.technologies,
      };

      await ScanJob.findByIdAndUpdate(scanJobId, {
        status: 'COMPLETED',
        progress: 100,
        completedAt: new Date(),
        subdomainsFound: result.subdomainsFound.length,
        openPortsFound: result.openPorts.length,
        resultSummary: summary,
      });

      console.log(
        `[Worker] ✓ ${domain}: ${result.subdomainsFound.length} subdomains, ${result.openPorts.length} ports`,
      );
      return summary;
    },
    {
      connection: getRedis(),
      concurrency: 3,
    },
  );

  worker.on('failed', async (job, err) => {
    if (!job) return;
    console.error(`[Worker] ✗ ${job.id} failed:`, err.message);
    await ScanJob.findByIdAndUpdate(job.data.scanJobId, {
      status: 'FAILED',
      error: err.message,
      completedAt: new Date(),
    });
  });

  console.log('[Discovery] Worker listening for scan jobs...');
}

main().catch((err) => {
  console.error('[Discovery] Fatal:', err);
  process.exit(1);
});
