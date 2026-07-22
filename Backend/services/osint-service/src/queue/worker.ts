/**
 * OSINT Worker — Background Processor
 * ======================================
 * Listens to BullMQ "osint-scans" queue and executes OSINT scans.
 *   pnpm run start:worker
 */

import { Worker } from 'bullmq';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { getRedis } from './index';
import { runOsintScan } from '../services/scanner';
import { OsintScanJob } from '../models/OsintScanJob';

async function main() {
  await connectDatabase();

  const redis = getRedis();
  const worker = new Worker(
    'osint-scans',
    async (job) => {
      const { target, scanType, tenantId, userId, osintJobId } = job.data;
      console.log(`[OSINT-Worker] Scanning: "${target}" (${scanType})`);

      await OsintScanJob.findByIdAndUpdate(osintJobId, {
        status: 'RUNNING',
        startedAt: new Date(),
      });

      const result = await runOsintScan({
        target,
        scanType,
        tenantId,
        userId,
        osintJobId,
        onProgress: async (progress, message) => {
          await OsintScanJob.findByIdAndUpdate(osintJobId, { progress });
          await job.updateProgress(progress);
          if (message) console.log(`[OSINT-Worker] ${progress}% — ${message}`);
        },
      });

      await OsintScanJob.findByIdAndUpdate(osintJobId, {
        status: 'COMPLETED',
        progress: 100,
        completedAt: new Date(),
        leaksFound: result.leaksCreated,
        exposuresFound: result.exposuresCreated,
      });

      console.log(`[OSINT-Worker] ✓ "${target}" — ${result.leaksCreated} leaks, ${result.exposuresCreated} exposures`);
      return result.summary;
    },
    { connection: redis, concurrency: 3, lockDuration: 300_000 },
  );

  worker.on('failed', async (job, err) => {
    if (!job) return;
    console.error(`[OSINT-Worker] ✗ Job ${job.id} failed:`, err.message);
    await OsintScanJob.findByIdAndUpdate(job.data.osintJobId, {
      status: 'FAILED',
      error: err.message,
      completedAt: new Date(),
    });
  });

  console.log('[OSINT-Worker] Listening for scan jobs...');

  process.on('SIGTERM', async () => { await worker.close(); await disconnectDatabase(); process.exit(0); });
  process.on('SIGINT', async () => { await worker.close(); await disconnectDatabase(); process.exit(0); });
}

main().catch((err) => { console.error('[OSINT-Worker] Fatal:', err); process.exit(1); });
