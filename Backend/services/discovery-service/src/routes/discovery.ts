import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getQueue, isRedisConnected } from '../queue';
import { ScanJob } from '../models/ScanJob';
import { DiscoveredDomain } from '../models/DiscoveredDomain';

const router: Router = Router();

// ════════════════════════════════════════════════════════════
//  Zod Validation Schemas
// ════════════════════════════════════════════════════════════

const startScanSchema = z.object({
  domain: z
    .string()
    .min(1, 'Domain is required')
    .regex(
      /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i,
      'Invalid domain format (e.g. example.com)',
    ),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ════════════════════════════════════════════════════════════
//  POST  /api/v1/discovery/scan
//  Start a new attack-surface scan for the given domain.
//  Publishes a job to the BullMQ queue, returns immediately.
//  Falls back to synchronous scan if Redis is unavailable.
// ════════════════════════════════════════════════════════════

router.post('/scan', async (req: Request, res: Response) => {
  try {
    const body = startScanSchema.parse(req.body);

    const userId = (req as any).user?.userId || 'anonymous';
    const tenantId = (req as any).user?.tenantId || 'default';

    // ── Check Redis availability ──
    const redisOk = await isRedisConnected();

    if (!redisOk) {
      // ── Fallback: queue in memory (no Redis) ──
      // Still create the DB record, but run the scan inline on a next tick
      const scanJob = await ScanJob.create({
        domain: body.domain,
        status: 'QUEUED',
        progress: 0,
        tenantId,
        createdBy: userId,
      });

      // Process the scan asynchronously (fire-and-forget)
      processScanInBackground(scanJob._id.toString(), body.domain, tenantId, userId);

      res.status(202).json({
        message:
          'Scan queued (in-memory — Redis unavailable). Results will appear when processing completes.',
        jobId: scanJob._id.toString(),
        domain: body.domain,
        status: 'QUEUED',
        note: 'Install Redis on localhost:6379 for persistent queueing',
      });
      return;
    }

    // ── Normal path: publish to BullMQ queue ──
    const scanJob = await ScanJob.create({
      domain: body.domain,
      status: 'QUEUED',
      progress: 0,
      tenantId,
      createdBy: userId,
    });

    await getQueue().add(
      'scan',
      {
        domain: body.domain,
        tenantId,
        userId,
        scanJobId: scanJob._id.toString(),
      },
      {
        jobId: scanJob._id.toString(),
      },
    );

    console.log(`[Discovery] Scan queued via BullMQ: ${body.domain} (job: ${scanJob._id})`);

    res.status(202).json({
      message: 'Scan queued successfully.',
      jobId: scanJob._id.toString(),
      domain: body.domain,
      status: scanJob.status,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'VALIDATION', details: err.errors });
      return;
    }
    console.error('[Discovery] Start scan error:', err);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to queue scan.' });
  }
});

// ════════════════════════════════════════════════════════════
//  GET  /api/v1/discovery/scan/:jobId
// ════════════════════════════════════════════════════════════

router.get('/scan/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const scanJob = await ScanJob.findById(jobId);

    if (!scanJob) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Scan job not found.' });
      return;
    }

    const tenantId = (req as any).user?.tenantId || 'default';
    if (scanJob.tenantId !== tenantId) {
      res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied.' });
      return;
    }

    res.json({
      jobId: scanJob._id.toString(),
      domain: scanJob.domain,
      status: scanJob.status,
      progress: scanJob.progress,
      subdomainsFound: scanJob.subdomainsFound,
      openPortsFound: scanJob.openPortsFound,
      startedAt: scanJob.startedAt,
      completedAt: scanJob.completedAt,
      error: scanJob.error,
      resultSummary: scanJob.resultSummary,
      createdAt: scanJob.createdAt,
    });
  } catch (err) {
    console.error('[Discovery] Get scan job error:', err);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to get scan job.' });
  }
});

// ════════════════════════════════════════════════════════════
//  GET  /api/v1/discovery/scans
// ════════════════════════════════════════════════════════════

router.get('/scans', async (req: Request, res: Response) => {
  try {
    const query = paginationSchema.parse(req.query);
    const tenantId = (req as any).user?.tenantId || 'default';

    const [total, jobs] = await Promise.all([
      ScanJob.countDocuments({ tenantId }),
      ScanJob.find({ tenantId })
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .select('domain status progress subdomainsFound openPortsFound createdAt completedAt'),
    ]);

    res.json({
      data: jobs.map((j) => ({
        jobId: j._id.toString(),
        domain: j.domain,
        status: j.status,
        progress: j.progress,
        subdomainsFound: j.subdomainsFound,
        openPortsFound: j.openPortsFound,
        createdAt: j.createdAt,
        completedAt: j.completedAt,
      })),
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'VALIDATION', details: err.errors });
      return;
    }
    console.error('[Discovery] List scans error:', err);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to list scans.' });
  }
});

// ════════════════════════════════════════════════════════════
//  GET  /api/v1/discovery/domains
// ════════════════════════════════════════════════════════════

router.get('/domains', async (req: Request, res: Response) => {
  try {
    const query = paginationSchema.parse(req.query);
    const tenantId = (req as any).user?.tenantId || 'default';

    const [total, domains] = await Promise.all([
      DiscoveredDomain.countDocuments({ tenantId }),
      DiscoveredDomain.find({ tenantId })
        .sort({ lastSeenAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .select('domain parentDomain ipAddress ports technologies isActive lastSeenAt'),
    ]);

    res.json({
      data: domains.map((d) => ({
        id: d._id.toString(),
        domain: d.domain,
        parentDomain: d.parentDomain,
        ipAddress: d.ipAddress,
        ports: d.ports.filter((p) => p.isOpen).map((p) => ({ port: p.port, service: p.service })),
        technologies: d.technologies.map((t) => ({ name: t.name, category: t.category })),
        isActive: d.isActive,
        lastSeenAt: d.lastSeenAt,
      })),
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'VALIDATION', details: err.errors });
      return;
    }
    console.error('[Discovery] List domains error:', err);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to list domains.' });
  }
});

// ════════════════════════════════════════════════════════════
//  GET  /api/v1/discovery/domains/:id
// ════════════════════════════════════════════════════════════

router.get('/domains/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId || 'default';
    const domain = await DiscoveredDomain.findOne({ _id: req.params.id, tenantId });

    if (!domain) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Domain not found.' });
      return;
    }

    res.json({
      id: domain._id.toString(),
      domain: domain.domain,
      parentDomain: domain.parentDomain,
      ipAddress: domain.ipAddress,
      ports: domain.ports,
      technologies: domain.technologies,
      ssl: domain.ssl,
      isActive: domain.isActive,
      lastSeenAt: domain.lastSeenAt,
      scanJobId: domain.scanJobId,
      createdAt: domain.createdAt,
    });
  } catch (err) {
    console.error('[Discovery] Get domain error:', err);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to get domain details.' });
  }
});

// ════════════════════════════════════════════════════════════
//  Background Scan (fallback when Redis is unavailable)
// ════════════════════════════════════════════════════════════

/**
 * Jalankan scan di latar belakang tanpa blocking event loop.
 * Gunakan setImmediate agar response handler bisa selesai duluan.
 */
async function processScanInBackground(
  scanJobId: string,
  domain: string,
  tenantId: string,
  userId: string,
): Promise<void> {
  // Yield event loop agar request handler bisa selesai
  await new Promise<void>(resolve => setImmediate(() => resolve()));

  try {
    const { runScan } = await import('../services/scanner');

    const result = await runScan({
      domain,
      tenantId,
      userId,
      onProgress: async (progress) => {
        await ScanJob.findByIdAndUpdate(scanJobId, { progress });
        // Yield setiap progress update agar event loop tidak tersumbat
        await new Promise<void>(resolve => setImmediate(() => resolve()));
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

    console.log(`[Background] ✓ ${domain}: ${result.subdomainsFound.length} subdomains`);
  } catch (err) {
    console.error(`[Background] ✗ ${domain}:`, (err as Error).message);
    await ScanJob.findByIdAndUpdate(scanJobId, {
      status: 'FAILED',
      error: (err as Error).message,
      completedAt: new Date(),
    });
  }
}

export default router;
