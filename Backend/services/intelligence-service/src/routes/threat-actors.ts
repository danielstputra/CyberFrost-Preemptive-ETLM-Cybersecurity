import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ThreatActor } from '../models/ThreatActor';

const router: Router = Router();
const pagination = z.object({ page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().positive().max(100).default(20), active: z.string().optional(), industry: z.string().optional() });

// GET /threat-actors — List threat actors with pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const q = pagination.parse(req.query);
    const tenantId = (req as any).user?.tenantId || 'default';
    const filter: Record<string, unknown> = { tenantId };
    if (q.active !== undefined) filter.isActive = q.active === 'true';
    if (q.industry) filter.targetIndustries = q.industry;

    const [total, items] = await Promise.all([
      ThreatActor.countDocuments(filter),
      ThreatActor.find(filter).sort({ lastSeen: -1 }).skip((q.page - 1) * q.limit).limit(q.limit)
        .select('name aliases country motivation targetIndustries isActive lastSeen'),
    ]);
    res.json({ data: items, pagination: { total, page: q.page, limit: q.limit, totalPages: Math.ceil(total / q.limit) } });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'VALIDATION', details: err.errors }); return; }
    res.status(500).json({ error: 'INTERNAL' });
  }
});

// GET /threat-actors/:id — Get detail
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const item = await ThreatActor.findOne({ _id: req.params.id });
    if (!item) { res.status(404).json({ error: 'NOT_FOUND' }); return; }
    res.json(item.toJSON());
  } catch { res.status(500).json({ error: 'INTERNAL' }); }
});

// GET /threat-actors/by-industry — Filter threat actors by industry
router.get('/by-industry', async (req: Request, res: Response) => {
  try {
    const q = pagination.parse(req.query);
    const tenantId = (req as any).user?.tenantId || 'default';

    if (!q.industry) {
      // Return industry aggregation if no specific industry filter
      const aggregation = await ThreatActor.aggregate([
        { $match: { tenantId } },
        { $unwind: '$targetIndustries' },
        { $group: { _id: '$targetIndustries', count: { $sum: 1 }, actors: { $addToSet: '$name' } } },
        { $sort: { count: -1 } },
      ]);
      res.json({ data: aggregation });
      return;
    }

    const filter: Record<string, unknown> = { tenantId, targetIndustries: q.industry };
    const [total, items] = await Promise.all([
      ThreatActor.countDocuments(filter),
      ThreatActor.find(filter).sort({ lastSeen: -1 }).skip((q.page - 1) * q.limit).limit(q.limit)
        .select('name aliases country motivation targetIndustries mitreTechniques isActive lastSeen'),
    ]);
    res.json({ data: items, pagination: { total, page: q.page, limit: q.limit, totalPages: Math.ceil(total / q.limit) } });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'VALIDATION', details: err.errors }); return; }
    res.status(500).json({ error: 'INTERNAL' });
  }
});

// GET /threat-actors/mitre/:technique — Get actors using MITRE technique
router.get('/mitre/:technique', async (req: Request, res: Response) => {
  try {
    const items = await ThreatActor.find({ mitreAttackIds: req.params.technique }).select('name aliases mitreAttackIds');
    res.json({ data: items });
  } catch { res.status(500).json({ error: 'INTERNAL' }); }
});

export default router;
