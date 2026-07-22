import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { MitigationAction } from '../models/MitigationAction';
import { getQueue } from '../queue/connection';

const router: Router = Router();

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.string().optional(),
  type: z.string().optional(),
});

// GET /mitigation — List all mitigation actions
router.get('/', async (req: Request, res: Response) => {
  try {
    const q = paginationSchema.parse(req.query);
    const tenantId = (req as any).user?.tenantId || 'default';
    const filter: Record<string, unknown> = { tenantId };
    if (q.status) filter.status = q.status;
    if (q.type) filter.mitigationType = q.type;

    const [total, items] = await Promise.all([
      MitigationAction.countDocuments(filter),
      MitigationAction.find(filter)
        .sort({ createdAt: -1 })
        .skip((q.page - 1) * q.limit).limit(q.limit)
        .select('targetIp targetDomain mitigationType firewallProvider status ruleName autoTriggered createdAt expiresAt'),
    ]);

    res.json({ data: items, pagination: { total, page: q.page, limit: q.limit, totalPages: Math.ceil(total / q.limit) } });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'VALIDATION', details: err.errors }); return; }
    res.status(500).json({ error: 'INTERNAL' });
  }
});

// GET /mitigation/:id — Get detail
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId || 'default';
    const item = await MitigationAction.findOne({ _id: req.params.id, tenantId });
    if (!item) { res.status(404).json({ error: 'NOT_FOUND' }); return; }
    res.json(item.toJSON());
  } catch { res.status(500).json({ error: 'INTERNAL' }); }
});

// PATCH /mitigation/:id/status — Update mitigation status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = z.object({
      status: z.enum(['PENDING', 'IN_PROGRESS', 'ACTIVE', 'EXPIRED', 'FAILED']),
    }).parse(req.body);
    const tenantId = (req as any).user?.tenantId || 'default';

    const item = await MitigationAction.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      { $set: { status } },
      { new: true, select: 'targetIp targetDomain mitigationType status' },
    );
    if (!item) { res.status(404).json({ error: 'NOT_FOUND' }); return; }
    res.json({ message: `Status → ${status}`, item });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'VALIDATION', details: err.errors }); return; }
    res.status(500).json({ error: 'INTERNAL' });
  }
});

// POST /mitigation/block — Manually block an IP/domain
router.post('/block', async (req: Request, res: Response) => {
  try {
    const body = z.object({
      targetIp: z.string().optional(),
      targetDomain: z.string().optional(),
      mitigationType: z.enum(['BLOCK_IP', 'BLOCK_DOMAIN', 'BLOCK_URL', 'WAF_RULE']),
      description: z.string().default(''),
      durationSeconds: z.number().int().positive().default(86400),
    }).parse(req.body);
    const tenantId = (req as any).user?.tenantId || 'default';
    const userId = (req as any).user?.userId || 'anonymous';

    // Publish to mitigation queue for async processing
    await getQueue().add('manual-block', {
      ...body,
      tenantId,
      userId,
    });

    res.status(202).json({
      message: 'Block action queued for processing',
      target: body.targetIp || body.targetDomain,
      mitigationType: body.mitigationType,
    });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'VALIDATION', details: err.errors }); return; }
    res.status(500).json({ error: 'INTERNAL' });
  }
});

// GET /mitigation/stats — Summary statistics
router.get('/stats/overview', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId || 'default';

    const [total, byStatus, byType, autoCount] = await Promise.all([
      MitigationAction.countDocuments({ tenantId }),
      MitigationAction.aggregate([{ $match: { tenantId } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      MitigationAction.aggregate([{ $match: { tenantId } }, { $group: { _id: '$mitigationType', count: { $sum: 1 } } }]),
      MitigationAction.countDocuments({ tenantId, autoTriggered: true }),
    ]);

    const statusMap: Record<string, number> = {};
    for (const s of byStatus) statusMap[s._id] = s.count;
    const typeMap: Record<string, number> = {};
    for (const t of byType) typeMap[t._id] = t.count;

    res.json({ total, autoTriggered: autoCount, byStatus: statusMap, byType: typeMap });
  } catch { res.status(500).json({ error: 'INTERNAL' }); }
});

export default router;
