import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { TakedownRequest } from '../models/TakedownRequest';
import { MitigationAction } from '../models/MitigationAction';
import { SocMetric } from '../models/SocMetric';
import { ShiftHandover } from '../models/ShiftHandover';

const router: Router = Router();

// SLA thresholds per severity (minutes)
const SLA_THRESHOLDS: Record<string, number> = {
  CRITICAL: 60,    // 1 jam
  HIGH: 240,       // 4 jam
  MEDIUM: 1440,    // 24 jam
  LOW: 4320,       // 72 jam
};

// ═══ GET /soc/dashboard — SOC Overview Metrics ═══
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId || 'default';

    const [openTakedowns, openMitigations, monthlyMetrics, recentAlerts] = await Promise.all([
      TakedownRequest.countDocuments({ tenantId, status: { $nin: ['SUCCESSFUL', 'REJECTED'] } }),
      MitigationAction.countDocuments({ tenantId, status: 'ACTIVE' }),
      SocMetric.find({ tenantId, period: 'DAILY' }).sort({ date: -1 }).limit(30).lean(),
      TakedownRequest.find({ tenantId, status: 'IN_REVIEW' })
        .sort({ createdAt: -1 }).limit(5)
        .select('targetUrl threatType status createdAt').lean(),
    ]);

    // Calculate MTTR & MTTC from resolved takedowns
    const resolved = await TakedownRequest.find({
      tenantId,
      status: { $in: ['SUCCESSFUL', 'REJECTED'] },
      submittedAt: { $ne: null },
    }).select('submittedAt updatedAt status threatType').lean();

    let totalMttr = 0; let totalMttc = 0; let slaBreaches = 0;
    let resolvedInPeriod = 0; let criticalCount = 0;

    for (const item of resolved) {
      if (item.submittedAt && item.updatedAt) {
        const resolutionTime = (new Date(item.updatedAt).getTime() - new Date(item.submittedAt).getTime()) / 60000;
        totalMttr += resolutionTime;
        resolvedInPeriod++;

        // Check SLA breach
        const threshold = SLA_THRESHOLDS[item.threatType] || SLA_THRESHOLDS.HIGH;
        if (resolutionTime > threshold) slaBreaches++;
      }
    }

    const mttr = resolvedInPeriod > 0 ? Math.round(totalMttr / resolvedInPeriod) : 0;
    const mttc = Math.round(mttr * 0.3); // ~30% of MTTR is typical for triage

    res.json({
      metrics: {
        openIncidents: openTakedowns,
        activeBlocks: openMitigations,
        mttr,
        mttc,
        slaBreaches,
        criticalCount,
        totalResolved: resolvedInPeriod,
      },
      trend: monthlyMetrics.map(m => ({
        date: m.date,
        mttr: m.mttr,
        openIncidents: m.openIncidents,
        slaBreaches: m.slaBreaches,
      })),
      recentAlerts: recentAlerts.map(a => ({
        id: a._id,
        title: a.targetUrl,
        type: a.threatType,
        status: a.status,
        time: a.createdAt,
      })),
    });
  } catch (err) {
    console.error('[SOC] Dashboard error:', err);
    res.status(500).json({ error: 'INTERNAL' });
  }
});

// ═══ GET /soc/metrics — Historical SOC Metrics ═══
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId || 'default';
    const { period = 'DAILY', limit = '30' } = req.query as Record<string, string>;

    const metrics = await SocMetric.find({ tenantId, period })
      .sort({ date: -1 }).limit(parseInt(limit || '30')).lean();

    res.json({ data: metrics });
  } catch { res.status(500).json({ error: 'INTERNAL' }); }
});

// ═══ Shift Handover CRUD ═══

// GET /soc/shift — List shift handovers
router.get('/shift', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId || 'default';
    const shifts = await ShiftHandover.find({ tenantId })
      .sort({ shiftDate: -1 }).limit(20).lean();
    res.json({ data: shifts });
  } catch { res.status(500).json({ error: 'INTERNAL' }); }
});

// POST /soc/shift — Create shift handover
const createShiftSchema = z.object({
  shiftDate: z.string().optional(),
  shiftType: z.enum(['PAGI', 'SIANG', 'MALAM', 'CUSTOM']).default('PAGI'),
  officerOutgoing: z.string().min(1),
  officerIncoming: z.string().min(1),
  notes: z.string().default(''),
  ongoingIssues: z.string().default(''),
  pendingTakedowns: z.number().default(0),
  criticalAlerts: z.number().default(0),
});

router.post('/shift', async (req: Request, res: Response) => {
  try {
    const body = createShiftSchema.parse(req.body);
    const tenantId = (req as any).user?.tenantId || 'default';
    const shift = await ShiftHandover.create({ ...body, tenantId });
    res.status(201).json({ message: 'Shift created', data: shift });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'VALIDATION', details: err.errors }); return; }
    res.status(500).json({ error: 'INTERNAL' });
  }
});

// PATCH /soc/shift/:id — Update shift handover
router.patch('/shift/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId || 'default';
    const shift = await ShiftHandover.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      { $set: { ...req.body, updatedAt: new Date() } },
      { new: true },
    );
    if (!shift) { res.status(404).json({ error: 'NOT_FOUND' }); return; }
    res.json({ message: 'Shift updated', data: shift });
  } catch { res.status(500).json({ error: 'INTERNAL' }); }
});

export default router;
