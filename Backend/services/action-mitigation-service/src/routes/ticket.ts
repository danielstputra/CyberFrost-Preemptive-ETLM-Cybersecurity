import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { IncidentTicket } from '../models/IncidentTicket';

const router: Router = Router();
const pagination = z.object({ page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().positive().max(100).default(20) });

// POST /ticket — Create incident ticket
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = z.object({ title: z.string().min(1), description: z.string().default(''), severity: z.string().default('MEDIUM'), provider: z.string().default('MANUAL'), sourceEvent: z.string().default(''), sourceEventId: z.string().optional() }).parse(req.body);
    const ticket = await IncidentTicket.create({ ...body, ticketRef: `TKT-${Date.now()}`, tenantId: (req as any).user?.tenantId || 'default', createdBy: (req as any).user?.userId || 'anonymous' });
    res.status(201).json({ message: 'Ticket created', id: ticket._id, ticketRef: ticket.ticketRef });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'VALIDATION', details: err.errors }); return; }
    res.status(500).json({ error: 'INTERNAL' });
  }
});

// GET /ticket — List tickets
router.get('/', async (req: Request, res: Response) => {
  try {
    const q = pagination.parse(req.query);
    const tenantId = (req as any).user?.tenantId || 'default';
    const [total, items] = await Promise.all([
      IncidentTicket.countDocuments({ tenantId }),
      IncidentTicket.find({ tenantId }).sort({ createdAt: -1 }).skip((q.page - 1) * q.limit).limit(q.limit)
        .select('title severity provider status ticketRef sourceEvent autoCreated createdAt'),
    ]);
    res.json({ data: items, pagination: { total, page: q.page, limit: q.limit, totalPages: Math.ceil(total / q.limit) } });
  } catch { res.status(500).json({ error: 'INTERNAL' }); }
});

// PATCH /ticket/:id/status — Update ticket status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = z.object({ status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED']) }).parse(req.body);
    const tenantId = (req as any).user?.tenantId || 'default';
    const ticket = await IncidentTicket.findOneAndUpdate({ _id: req.params.id, tenantId }, { $set: { status } }, { new: true });
    if (!ticket) { res.status(404).json({ error: 'NOT_FOUND' }); return; }
    res.json({ message: `Ticket ${status}`, ticket });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'VALIDATION', details: err.errors }); return; }
    res.status(500).json({ error: 'INTERNAL' });
  }
});

export default router;
