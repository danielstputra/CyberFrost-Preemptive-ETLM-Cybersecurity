import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Vendor } from '../models/Vendor';
import { VendorRisk } from '../models/VendorRisk';

const router: Router = Router();
const pagination = z.object({ page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().positive().max(100).default(20) });

// POST /tprm/vendor — Add vendor
router.post('/vendor', async (req: Request, res: Response) => {
  try {
    const body = z.object({ name: z.string().min(1), domain: z.string().min(1), category: z.string().default('Technology'), contactEmail: z.string().default('') }).parse(req.body);
    const vendor = await Vendor.create({ ...body, tenantId: (req as any).user?.tenantId || 'default' });
    res.status(201).json(vendor);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'VALIDATION', details: err.errors }); return; }
    if ((err as any)?.code === 11000) { res.status(409).json({ error: 'Vendor with this domain already exists' }); return; }
    res.status(500).json({ error: 'INTERNAL' });
  }
});

// GET /tprm/vendor — List vendors
router.get('/vendor', async (req: Request, res: Response) => {
  try {
    const q = pagination.parse(req.query);
    const tenantId = (req as any).user?.tenantId || 'default';
    const [total, items] = await Promise.all([
      Vendor.countDocuments({ tenantId }),
      Vendor.find({ tenantId }).sort({ createdAt: -1 }).skip((q.page - 1) * q.limit).limit(q.limit),
    ]);
    res.json({ data: items, pagination: { total, page: q.page, limit: q.limit, totalPages: Math.ceil(total / q.limit) } });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'VALIDATION', details: err.errors }); return; }
    res.status(500).json({ error: 'INTERNAL' });
  }
});

// PATCH /tprm/vendor/:id — Update vendor
router.patch('/vendor/:id', async (req: Request, res: Response) => {
  try {
    const body = z.object({ riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(), status: z.enum(['ACTIVE', 'INACTIVE', 'UNDER_REVIEW']).optional() }).parse(req.body);
    const vendor = await Vendor.findOneAndUpdate({ _id: req.params.id }, { $set: body }, { new: true });
    if (!vendor) { res.status(404).json({ error: 'NOT_FOUND' }); return; }
    res.json(vendor);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'VALIDATION', details: err.errors }); return; }
    res.status(500).json({ error: 'INTERNAL' });
  }
});

// GET /tprm/vendor/:id/risks — List vendor risks
router.get('/vendor/:id/risks', async (req: Request, res: Response) => {
  try {
    const risks = await VendorRisk.find({ vendorId: req.params.id }).sort({ discoveredAt: -1 }).limit(20);
    res.json({ data: risks });
  } catch { res.status(500).json({ error: 'INTERNAL' }); }
});

export default router;
