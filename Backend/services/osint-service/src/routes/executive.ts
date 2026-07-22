import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ExecutiveProfile } from '../models/ExecutiveProfile';
import { monitorAllExecutives } from '../services/executive-monitor';

const router: Router = Router();

// ════════════════════════════════════════════════════
//  Zod Schemas
// ════════════════════════════════════════════════════

const createSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  position: z.string().max(200).default(''),
  email: z.string().email().or(z.literal('')).default(''),
  phone: z.string().max(50).default(''),
});

const updateRiskSchema = z.object({
  riskStatus: z.enum(['SAFE', 'LEAKED', 'MONITORING']),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  riskStatus: z.enum(['SAFE', 'LEAKED', 'MONITORING']).optional(),
});

// ════════════════════════════════════════════════════
//  GET /api/v1/osint/executive — List executives
// ════════════════════════════════════════════════════

router.get('/', async (req: Request, res: Response) => {
  try {
    const q = paginationSchema.parse(req.query);
    const tenantId = (req as any).user?.tenantId || 'default';

    const filter: Record<string, unknown> = { tenantId };
    if (q.riskStatus) filter.riskStatus = q.riskStatus;

    const [total, items] = await Promise.all([
      ExecutiveProfile.countDocuments(filter),
      ExecutiveProfile.find(filter)
        .sort({ updatedAt: -1 })
        .skip((q.page - 1) * q.limit)
        .limit(q.limit)
        .select('name position email phone riskStatus lastCheckedAt createdAt updatedAt'),
    ]);

    res.json({
      data: items.map((e) => ({
        id: e._id.toString(),
        name: e.name,
        position: e.position,
        email: e.email,
        phone: e.phone,
        riskStatus: e.riskStatus,
        lastCheckedAt: e.lastCheckedAt,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      })),
      pagination: {
        total,
        page: q.page,
        limit: q.limit,
        totalPages: Math.ceil(total / q.limit),
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'VALIDATION', details: err.errors });
      return;
    }
    console.error('[Executive] List error:', err);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to list executives.' });
  }
});

// ════════════════════════════════════════════════════
//  POST /api/v1/osint/executive — Create executive
// ════════════════════════════════════════════════════

router.post('/', async (req: Request, res: Response) => {
  try {
    const body = createSchema.parse(req.body);
    const tenantId = (req as any).user?.tenantId || 'default';

    // Check for duplicate name within tenant
    const existing = await ExecutiveProfile.findOne({ name: body.name, tenantId });
    if (existing) {
      res.status(409).json({ error: 'CONFLICT', message: 'Executive with this name already exists.' });
      return;
    }

    const profile = await ExecutiveProfile.create({
      name: body.name,
      position: body.position,
      email: body.email,
      phone: body.phone,
      tenantId,
    });

    res.status(201).json({
      id: profile._id.toString(),
      name: profile.name,
      position: profile.position,
      email: profile.email,
      phone: profile.phone,
      riskStatus: profile.riskStatus,
      lastCheckedAt: profile.lastCheckedAt,
      createdAt: profile.createdAt,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'VALIDATION', details: err.errors });
      return;
    }
    console.error('[Executive] Create error:', err);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to create executive profile.' });
  }
});

// ════════════════════════════════════════════════════
//  PATCH /api/v1/osint/executive/:id — Update risk status
// ════════════════════════════════════════════════════

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const body = updateRiskSchema.parse(req.body);
    const tenantId = (req as any).user?.tenantId || 'default';

    const profile = await ExecutiveProfile.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      {
        $set: {
          riskStatus: body.riskStatus,
          lastCheckedAt: new Date(),
        },
      },
      { new: true, select: 'name position email phone riskStatus lastCheckedAt updatedAt' },
    );

    if (!profile) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Executive profile not found.' });
      return;
    }

    res.json({
      id: profile._id.toString(),
      name: profile.name,
      position: profile.position,
      email: profile.email,
      phone: profile.phone,
      riskStatus: profile.riskStatus,
      lastCheckedAt: profile.lastCheckedAt,
      updatedAt: profile.updatedAt,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'VALIDATION', details: err.errors });
      return;
    }
    console.error('[Executive] Update error:', err);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to update executive profile.' });
  }
});

// ════════════════════════════════════════════════════
//  DELETE /api/v1/osint/executive/:id — Remove executive
// ════════════════════════════════════════════════════

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId || 'default';

    const profile = await ExecutiveProfile.findOneAndDelete({ _id: req.params.id, tenantId });

    if (!profile) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Executive profile not found.' });
      return;
    }

    res.json({ message: 'Executive profile removed.', id: req.params.id });
  } catch (err) {
    console.error('[Executive] Delete error:', err);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to delete executive profile.' });
  }
});

// ════════════════════════════════════════════════════
//  POST /api/v1/osint/executive/monitor — Scan all executives for leaks
// ════════════════════════════════════════════════════

router.post('/monitor', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId || 'default';
    const results = await monitorAllExecutives(tenantId);
    res.json({
      message: `Scanned ${results.length} executives`,
      total: results.length,
      changed: results.filter(r => r.newStatus !== r.previousStatus).length,
      results,
    });
  } catch (err) {
    console.error('[Executive] Monitor error:', err);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to monitor executives.' });
  }
});

export default router;
