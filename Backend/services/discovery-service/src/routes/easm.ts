import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ShadowIT } from '../models/ShadowIT';

const router: Router = Router();
const pagination = z.object({ page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().positive().max(100).default(20), riskLevel: z.string().optional() });

// GET /easm/shadow-it — List shadow IT assets
router.get('/shadow-it', async (req: Request, res: Response) => {
  try {
    const q = pagination.parse(req.query);
    const tenantId = (req as any).user?.tenantId || 'default';
    const filter: Record<string, unknown> = { tenantId };
    if (q.riskLevel) filter.riskLevel = q.riskLevel;
    const [total, items] = await Promise.all([
      ShadowIT.countDocuments(filter),
      ShadowIT.find(filter).sort({ riskScore: -1 }).skip((q.page - 1) * q.limit).limit(q.limit)
        .select('name assetType domain riskScore riskLevel isManaged firstSeen'),
    ]);
    res.json({ data: items, pagination: { total, page: q.page, limit: q.limit, totalPages: Math.ceil(total / q.limit) } });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'VALIDATION', details: err.errors }); return; }
    res.status(500).json({ error: 'INTERNAL' });
  }
});

// PATCH /easm/shadow-it/:id/owner — Assign owner
router.patch('/shadow-it/:id/owner', async (req: Request, res: Response) => {
  try {
    const { owner } = z.object({ owner: z.string().min(1) }).parse(req.body);
    const item = await ShadowIT.findOneAndUpdate({ _id: req.params.id }, { $set: { owner, isManaged: true } }, { new: true });
    if (!item) { res.status(404).json({ error: 'NOT_FOUND' }); return; }
    res.json({ message: 'Owner assigned', item });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'VALIDATION', details: err.errors }); return; }
    res.status(500).json({ error: 'INTERNAL' });
  }
});

// GET /easm/digital-footprint — Digital footprint summary
router.get('/digital-footprint', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId || 'default';
    const [totalAssets, shadowCount, criticalCount, byType] = await Promise.all([
      ShadowIT.countDocuments({ tenantId }),
      ShadowIT.countDocuments({ tenantId, isManaged: false }),
      ShadowIT.countDocuments({ tenantId, riskLevel: { $in: ['HIGH', 'CRITICAL'] } }),
      ShadowIT.aggregate([{ $match: { tenantId } }, { $group: { _id: '$assetType', count: { $sum: 1 } } }]),
    ]);
    res.json({ totalAssets, unmanagedAssets: shadowCount, criticalRisk: criticalCount, byType });
  } catch { res.status(500).json({ error: 'INTERNAL' }); }
});

export default router;
