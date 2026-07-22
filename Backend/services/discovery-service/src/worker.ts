/**
 * Discovery Worker — Standalone Process
 * =======================================
 * Runs independently for horizontal scaling.
 * Only starts if Redis is available.
 *
 *   pnpm run dev:worker
 *   # or in production:
 *   node dist/worker.js
 */

import { connectDatabase, disconnectDatabase } from './config/database';
import { getRedis, isRedisConnected } from './queue';

async function start() {
  await connectDatabase();

  const redisOk = await isRedisConnected();
  if (!redisOk) {
    console.error('[Worker] Redis is not available. Cannot start worker.');
    console.error('[Worker] Start Redis on localhost:6379 and try again.');
    process.exit(1);
  }

  const { Worker } = await import('bullmq');
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
      concurrency: 5,
      lockDuration: 300_000,
    },
  );

  worker.on('completed', (job) => console.log(`[Worker] ✅ Job ${job.id} completed`));
  worker.on('failed', async (job, err) => {
    if (!job) return;
    console.error(`[Worker] ❌ Job ${job.id} failed:`, err.message);
    await ScanJob.findByIdAndUpdate(job.data.scanJobId, {
      status: 'FAILED',
      error: err.message,
      completedAt: new Date(),
    });
  });

  console.log('[Worker] Listening for scan jobs...');

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    await worker.close();
    await disconnectDatabase();
    process.exit(0);
  });
  process.on('SIGINT', async () => {
    await worker.close();
    await disconnectDatabase();
    process.exit(0);
  });
}

start().catch((err) => {
  console.error('[Worker] Fatal:', err);
  process.exit(1);
});
