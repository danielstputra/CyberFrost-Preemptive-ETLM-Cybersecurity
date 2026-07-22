import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { OsintScanJob } from '../models/OsintScanJob';
import { DarkWebLeak } from '../models/DarkWebLeak';
import { BrandExposure } from '../models/BrandExposure';
import { getQueue, isRedisConnected } from '../queue';

const router: Router = Router();

// ════════════════════════════════════════════════════
//  Zod Schemas
// ════════════════════════════════════════════════════

const startScanSchema = z.object({
  target: z.string().min(1, 'Target is required (domain or company name)').max(200),
  scanType: z.enum(['DOMAIN', 'COMPANY', 'KEYWORD', 'DARKWEB']).default('DOMAIN'),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  status: z.string().optional(),
});

const statusUpdateSchema = z.object({
  status: z.enum(['NEW', 'INVESTIGATING', 'MITIGATED', 'FALSE_POSITIVE', 'VERIFIED', 'REMEDIATED']),
});

// ════════════════════════════════════════════════════
//  POST /api/v1/osint/scan — Trigger OSINT scan
// ════════════════════════════════════════════════════

router.post('/scan', async (req: Request, res: Response) => {
  try {
    const body = startScanSchema.parse(req.body);
    const userId = (req as any).user?.userId || 'anonymous';
    const tenantId = (req as any).user?.tenantId || 'default';

    const scanJob = await OsintScanJob.create({
      target: body.target,
      scanType: body.scanType,
      status: 'QUEUED',
      tenantId,
      createdBy: userId,
    });

    // Hybrid: Redis queue jika tersedia, inline fallback jika tidak
    const redisOk = await isRedisConnected().catch(() => false);
    if (redisOk) {
      await getQueue().add('osint-scan', {
        target: body.target, scanType: body.scanType, tenantId, userId,
        osintJobId: scanJob._id.toString(),
      }, { jobId: scanJob._id.toString() });
    } else {
      processOsintInBackground(scanJob._id.toString(), body.target, body.scanType, tenantId, userId);
    }

    res.status(202).json({
      message: redisOk ? 'OSINT scan queued via Redis.' : 'OSINT scan started (inline).',
      jobId: scanJob._id.toString(),
      target: body.target,
      scanType: body.scanType,
      status: scanJob.status,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'VALIDATION', details: err.errors }); return;
    }
    console.error('[OSINT] Start scan error:', err);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to start OSINT scan.' });
  }
});

// ════════════════════════════════════════════════════
//  GET /api/v1/osint/scan/:jobId
// ════════════════════════════════════════════════════

router.get('/scan/:jobId', async (req: Request, res: Response) => {
  try {
    const job = await OsintScanJob.findById(req.params.jobId);
    if (!job) { res.status(404).json({ error: 'NOT_FOUND' }); return; }
    res.json({
      jobId: job._id, target: job.target, scanType: job.scanType,
      status: job.status, progress: job.progress,
      leaksFound: job.leaksFound, exposuresFound: job.exposuresFound,
      startedAt: job.startedAt, completedAt: job.completedAt, error: job.error,
    });
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL' });
  }
});

// ════════════════════════════════════════════════════
//  GET /api/v1/osint/scans
// ════════════════════════════════════════════════════

router.get('/scans', async (req: Request, res: Response) => {
  try {
    const q = paginationSchema.parse(req.query);
    const tenantId = (req as any).user?.tenantId || 'default';
    const [total, items] = await Promise.all([
      OsintScanJob.countDocuments({ tenantId }),
      OsintScanJob.find({ tenantId }).sort({ createdAt: -1 })
        .skip((q.page - 1) * q.limit).limit(q.limit)
        .select('target scanType status progress leaksFound exposuresFound createdAt completedAt'),
    ]);
    res.json({ data: items, pagination: { total, page: q.page, limit: q.limit, totalPages: Math.ceil(total / q.limit) } });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'VALIDATION', details: err.errors }); return; }
    res.status(500).json({ error: 'INTERNAL' });
  }
});

// ════════════════════════════════════════════════════
//  GET /api/v1/osint/leaks
// ════════════════════════════════════════════════════

router.get('/leaks', async (req: Request, res: Response) => {
  try {
    const q = paginationSchema.parse(req.query);
    const tenantId = (req as any).user?.tenantId || 'default';
    const filter: Record<string, unknown> = { tenantId };
    if (q.severity) filter.severity = q.severity;
    if (q.status) filter.status = q.status;

    const [total, items] = await Promise.all([
      DarkWebLeak.countDocuments(filter),
      DarkWebLeak.find(filter).sort({ discoveredAt: -1 })
        .skip((q.page - 1) * q.limit).limit(q.limit)
        .select('title source domain leakType severity status leakedCredentials emailsInvolved discoveredAt'),
    ]);
    res.json({ data: items, pagination: { total, page: q.page, limit: q.limit, totalPages: Math.ceil(total / q.limit) } });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'VALIDATION', details: err.errors }); return; }
    res.status(500).json({ error: 'INTERNAL' });
  }
});

// ════════════════════════════════════════════════════
//  GET /api/v1/osint/leaks/:id
// ════════════════════════════════════════════════════

router.get('/leaks/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId || 'default';
    const leak = await DarkWebLeak.findOne({ _id: req.params.id, tenantId });
    if (!leak) { res.status(404).json({ error: 'NOT_FOUND' }); return; }
    res.json(leak.toJSON());
  } catch { res.status(500).json({ error: 'INTERNAL' }); }
});

// ════════════════════════════════════════════════════
//  PATCH /api/v1/osint/leaks/:id/status
// ════════════════════════════════════════════════════

router.patch('/leaks/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = statusUpdateSchema.parse(req.body);
    const tenantId = (req as any).user?.tenantId || 'default';
    const leak = await DarkWebLeak.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      { $set: { status } },
      { new: true, select: 'title source severity status' },
    );
    if (!leak) { res.status(404).json({ error: 'NOT_FOUND' }); return; }
    res.json({ message: `Status → ${status}`, leak });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'VALIDATION', details: err.errors }); return; }
    res.status(500).json({ error: 'INTERNAL' });
  }
});

// ════════════════════════════════════════════════════
//  GET /api/v1/osint/exposures
// ════════════════════════════════════════════════════

router.get('/exposures', async (req: Request, res: Response) => {
  try {
    const q = paginationSchema.parse(req.query);
    const tenantId = (req as any).user?.tenantId || 'default';
    const filter: Record<string, unknown> = { tenantId };
    if (q.severity) filter.severity = q.severity;

    const [total, items] = await Promise.all([
      BrandExposure.countDocuments(filter),
      BrandExposure.find(filter).sort({ discoveredAt: -1 })
        .skip((q.page - 1) * q.limit).limit(q.limit)
        .select('brandName domain exposureType severity status url discoveredAt'),
    ]);
    res.json({ data: items, pagination: { total, page: q.page, limit: q.limit, totalPages: Math.ceil(total / q.limit) } });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'VALIDATION', details: err.errors }); return; }
    res.status(500).json({ error: 'INTERNAL' });
  }
});

// ════════════════════════════════════════════════════
//  GET /api/v1/osint/exposures/:id
// ════════════════════════════════════════════════════

router.get('/exposures/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId || 'default';
    const exp = await BrandExposure.findOne({ _id: req.params.id, tenantId });
    if (!exp) { res.status(404).json({ error: 'NOT_FOUND' }); return; }
    res.json(exp.toJSON());
  } catch { res.status(500).json({ error: 'INTERNAL' }); }
});

// ════════════════════════════════════════════════════
//  PATCH /api/v1/osint/exposures/:id/status
// ════════════════════════════════════════════════════

router.patch('/exposures/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = statusUpdateSchema.parse(req.body);
    const tenantId = (req as any).user?.tenantId || 'default';
    const exp = await BrandExposure.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      { $set: { status } },
      { new: true, select: 'brandName domain exposureType severity status' },
    );
    if (!exp) { res.status(404).json({ error: 'NOT_FOUND' }); return; }
    res.json({ message: `Status → ${status}`, exposure: exp });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'VALIDATION', details: err.errors }); return; }
    res.status(500).json({ error: 'INTERNAL' });
  }
});

// ════════════════════════════════════════════════════
//  GET /api/v1/osint/dashboard
// ════════════════════════════════════════════════════

router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId || 'default';

    const [totalLeaks, criticalLeaks, totalExposures, criticalExposures, recentLeaks] = await Promise.all([
      DarkWebLeak.countDocuments({ tenantId }),
      DarkWebLeak.countDocuments({ tenantId, severity: 'CRITICAL' }),
      BrandExposure.countDocuments({ tenantId }),
      BrandExposure.countDocuments({ tenantId, severity: 'CRITICAL' }),
      DarkWebLeak.find({ tenantId }).sort({ discoveredAt: -1 }).limit(5)
        .select('title source severity discoveredAt'),
    ]);

    const severityBreakdown = await DarkWebLeak.aggregate([
      { $match: { tenantId } },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]);

    const severityMap: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    for (const s of severityBreakdown) severityMap[s._id] = s.count;

    res.json({
      totalLeaks, criticalLeaks, totalExposures, criticalExposures,
      severityBreakdown: severityMap,
      recentLeaks: recentLeaks.map(l => ({ title: l.title, source: l.source, severity: l.severity, discoveredAt: l.discoveredAt })),
    });
  } catch (err) {
    console.error('[OSINT] Dashboard error:', err);
    res.status(500).json({ error: 'INTERNAL' });
  }
});

// ════════════════════════════════════════════════════
//  Background fallback (when no Redis)
// ════════════════════════════════════════════════════

async function processOsintInBackground(
  osintJobId: string, target: string, scanType: string, tenantId: string, userId: string,
) {
  try {
    const { runOsintScan } = await import('../services/scanner');
    const result = await runOsintScan({
      target, scanType: scanType as any, tenantId, userId, osintJobId,
      onProgress: async (p) => { await OsintScanJob.findByIdAndUpdate(osintJobId, { progress: p }); },
    });
    await OsintScanJob.findByIdAndUpdate(osintJobId, {
      status: 'COMPLETED', progress: 100, completedAt: new Date(),
      leaksFound: result.leaksCreated, exposuresFound: result.exposuresCreated,
    });
  } catch (err) {
    await OsintScanJob.findByIdAndUpdate(osintJobId, {
      status: 'FAILED', error: (err as Error).message, completedAt: new Date(),
    });
  }
}

export default router;
