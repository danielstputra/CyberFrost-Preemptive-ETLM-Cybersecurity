import app from './app';
import { config } from './config';
import { connectDatabase, disconnectDatabase } from './config/database';
import { isRedisConnected, closeQueue } from './queue';
import { monitorAllExecutives } from './services/executive-monitor';

async function main() {
  await connectDatabase();

  app.listen(config.port, '0.0.0.0', () => {
    console.log(`[OSINT Service] Running on http://0.0.0.0:${config.port}`);
  });

  const redisOk = await isRedisConnected().catch(() => false);
  if (redisOk) {
    const { Worker } = await import('bullmq');
    const { getRedis } = await import('./queue');
    const { runOsintScan } = await import('./services/scanner');
    const { OsintScanJob } = await import('./models/OsintScanJob');

    const worker = new Worker('osint-scans', async (job) => {
      const { target, scanType, tenantId, userId, osintJobId } = job.data;
      await OsintScanJob.findByIdAndUpdate(osintJobId, { status: 'RUNNING', startedAt: new Date() });
      const result = await runOsintScan({
        target, scanType, tenantId, userId, osintJobId,
        onProgress: async (p) => { await OsintScanJob.findByIdAndUpdate(osintJobId, { progress: p }); await job.updateProgress(p); },
      });
      await OsintScanJob.findByIdAndUpdate(osintJobId, {
        status: 'COMPLETED', progress: 100, completedAt: new Date(),
        leaksFound: result.leaksCreated, exposuresFound: result.exposuresCreated,
      });
      return result.summary;
    }, { connection: getRedis(), concurrency: 3 });

    worker.on('failed', async (job, err) => {
      if (!job) return;
      await OsintScanJob.findByIdAndUpdate(job.data.osintJobId, { status: 'FAILED', error: err.message, completedAt: new Date() });
    });

    console.log('[OSINT] BullMQ Worker started');
    // ── Executive Monitor: check for leaks every 30 minutes ──
    setInterval(async () => {
      console.log('[Executive-Monitor] Running scheduled leak check...');
      try {
        const results = await monitorAllExecutives();
        const changed = results.filter(r => r.newStatus !== r.previousStatus);
        if (changed.length > 0) {
          console.log(`[Executive-Monitor] ${changed.length} status changes detected`);
          changed.forEach(r => console.log(`  ${r.name}: ${r.previousStatus} → ${r.newStatus}`));
        }
      } catch (err: any) {
        console.error('[Executive-Monitor] Error:', err.message);
      }
    }, 30 * 60 * 1000);
  } else {
    console.warn('[OSINT] Redis unavailable — OSINT scans will run in-memory');
    // ── In-memory monitor fallback ──
    setInterval(async () => {
      try {
        const results = await monitorAllExecutives();
        const changed = results.filter(r => r.newStatus !== r.previousStatus);
        if (changed.length > 0) console.log(`[Executive-Monitor] ${changed.length} status changes`);
      } catch { /* silent */ }
    }, 30 * 60 * 1000);
  }

  const shutdown = async (signal: string) => {
    console.log(`\n[OSINT] ${signal}. Shutting down...`);
    await closeQueue();
    await disconnectDatabase();
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => { console.error('[OSINT] Fatal:', err); process.exit(1); });
