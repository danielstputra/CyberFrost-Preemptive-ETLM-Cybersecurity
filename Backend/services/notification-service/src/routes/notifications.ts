import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Notification } from '../models/Notification';
import { getQueue } from '../queue/connection';

const router: Router = Router();

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  type: z.enum(['ALERT', 'WARNING', 'INFO', 'CRITICAL']).optional(),
  read: z.coerce.boolean().optional(),
});

// ══════════════════════════════════════════
//  GET /notifications — List notifications
// ══════════════════════════════════════════

router.get('/', async (req: Request, res: Response) => {
  try {
    const q = paginationSchema.parse(req.query);
    const tenantId = (req as any).user?.tenantId || 'default';
    const filter: Record<string, unknown> = { tenantId };
    if (q.type) filter.type = q.type;
    if (q.read !== undefined) filter.read = q.read;

    const [total, items] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((q.page - 1) * q.limit).limit(q.limit)
        .select('title message type eventType source read createdAt'),
    ]);

    res.json({
      data: items,
      pagination: { total, page: q.page, limit: q.limit, totalPages: Math.ceil(total / q.limit) },
    });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'VALIDATION', details: err.errors }); return; }
    res.status(500).json({ error: 'INTERNAL' });
  }
});

// ══════════════════════════════════════════
//  GET /notifications/unread-count
// ══════════════════════════════════════════

router.get('/unread-count', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId || 'default';
    const total = await Notification.countDocuments({ tenantId });
    const unread = await Notification.countDocuments({ tenantId, read: false });
    const critical = await Notification.countDocuments({ tenantId, type: 'CRITICAL', read: false });
    res.json({ total, unread, criticalUnread: critical });
  } catch { res.status(500).json({ error: 'INTERNAL' }); }
});

// ══════════════════════════════════════════
//  GET /notifications/:id — Get notification detail
// ══════════════════════════════════════════

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId || 'default';
    const notif = await Notification.findOne({ _id: req.params.id, tenantId })
      .select('title message type eventType source severity read readAt createdAt metadata');
    if (!notif) { res.status(404).json({ error: 'NOT_FOUND' }); return; }
    res.json(notif);
  } catch { res.status(500).json({ error: 'INTERNAL' }); }
});

// ══════════════════════════════════════════
//  PATCH /notifications/:id/read
// ══════════════════════════════════════════

router.patch('/:id/read', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId || 'default';
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      { $set: { read: true, readAt: new Date() } },
      { new: true, select: 'title type read readAt' },
    );
    if (!notif) { res.status(404).json({ error: 'NOT_FOUND' }); return; }
    res.json({ message: 'Marked as read', notification: notif });
  } catch { res.status(500).json({ error: 'INTERNAL' }); }
});

// ══════════════════════════════════════════
//  POST /notifications/read-all
// ══════════════════════════════════════════

router.post('/read-all', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId || 'default';
    const result = await Notification.updateMany(
      { tenantId, read: false },
      { $set: { read: true, readAt: new Date() } },
    );
    res.json({ message: `Marked ${result.modifiedCount} notifications as read` });
  } catch { res.status(500).json({ error: 'INTERNAL' }); }
});

// ══════════════════════════════════════════
//  POST /notifications/send-test
//  Manual test — sends a notification event
// ══════════════════════════════════════════

const testSchema = z.object({
  title: z.string().default('🧪 Test Notification'),
  message: z.string().default('This is a test notification from CyberFrost platform.'),
  severity: z.enum(['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('INFO'),
  eventType: z.enum([
    'THREAT_DETECTED', 'VULNERABILITY_FOUND', 'SCAN_COMPLETED',
    'DATA_BREACH_DETECTED', 'BRAND_EXPOSURE_FOUND', 'OSINT_LEAK_FOUND', 'TEST',
  ]).default('TEST'),
});

router.post('/send-test', async (req: Request, res: Response) => {
  try {
    const body = testSchema.parse(req.body);
    const tenantId = (req as any).user?.tenantId || 'default';
    const userId = (req as any).user?.userId || 'anonymous';

    // Publish to the notifications queue
    await getQueue().add('test-notification', {
      type: body.eventType,
      title: body.title,
      message: body.message,
      severity: body.severity,
      sourceService: 'notification-service',
      tenantId,
      sourceId: undefined,
      metadata: { triggeredBy: userId, test: true },
    });

    res.status(202).json({
      message: 'Test notification queued — check logs and connected frontend clients.',
      eventType: body.eventType,
      severity: body.severity,
    });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'VALIDATION', details: err.errors }); return; }
    res.status(500).json({ error: 'INTERNAL' });
  }
});

export default router;
