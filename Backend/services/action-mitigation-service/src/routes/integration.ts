import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { TenantIntegration } from '../models/TenantIntegration';
import { sendTestWebhook } from '../services/webhook-dispatcher';

const router: Router = Router();

// ──────────────────────────────────────
// Validation Schemas
// ──────────────────────────────────────

const createIntegrationSchema = z.object({
  name: z.string().min(1).max(128),
  provider: z.enum(['JIRA', 'SERVICENOW', 'SPLUNK', 'CUSTOM_WEBHOOK', 'META_BRP']),
  config: z.object({
    webhookUrl: z.string().url('webhookUrl must be a valid URL'),
    apiKey: z.string().default(''),
  }),
  enabled: z.boolean().default(true),
  tenantId: z.string().min(1),
});

const testWebhookSchema = z.object({
  webhookUrl: z.string().url('webhookUrl must be a valid URL'),
  apiKey: z.string().optional(),
});

// ──────────────────────────────────────
// GET /integrations — List integrations for a tenant
// ──────────────────────────────────────

router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = (req.query.tenantId as string) || (req as any).user?.tenantId || 'default';

    const integrations = await TenantIntegration.find({ tenantId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ data: integrations });
  } catch (err) {
    console.error('[Integration] List error:', err);
    res.status(500).json({ error: 'INTERNAL' });
  }
});

// ──────────────────────────────────────
// POST /integrations — Create a new integration
// ──────────────────────────────────────

router.post('/', async (req: Request, res: Response) => {
  try {
    const body = createIntegrationSchema.parse(req.body);

    const existing = await TenantIntegration.findOne({
      tenantId: body.tenantId,
      name: body.name,
    });

    if (existing) {
      // Update existing integration
      Object.assign(existing, body);
      await existing.save();
      res.json({ message: 'Integration updated', data: existing.toJSON() });
      return;
    }

    const integration = await TenantIntegration.create(body);
    res.status(201).json({ message: 'Integration created', data: integration.toJSON() });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'VALIDATION', details: err.errors });
      return;
    }
    console.error('[Integration] Create error:', err);
    res.status(500).json({ error: 'INTERNAL' });
  }
});

// ──────────────────────────────────────
// PATCH /integrations/:id/toggle — Toggle enabled/disabled
// ──────────────────────────────────────

router.patch('/:id/toggle', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req.query.tenantId as string) || (req as any).user?.tenantId || 'default';

    const integration = await TenantIntegration.findOne({ _id: id, tenantId });

    if (!integration) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Integration not found' });
      return;
    }

    integration.enabled = !integration.enabled;
    await integration.save();

    res.json({
      message: `Integration ${integration.enabled ? 'enabled' : 'disabled'}`,
      data: integration.toJSON(),
    });
  } catch (err) {
    console.error('[Integration] Toggle error:', err);
    res.status(500).json({ error: 'INTERNAL' });
  }
});

// ──────────────────────────────────────
// POST /integrations/test — Send test webhook
// ──────────────────────────────────────

router.post('/test', async (req: Request, res: Response) => {
  try {
    const { webhookUrl, apiKey } = testWebhookSchema.parse(req.body);

    const result = await sendTestWebhook(webhookUrl, apiKey);

    if (result.success) {
      res.json({ message: 'Test webhook sent successfully', details: result });
    } else {
      res.status(502).json({ error: 'WEBHOOK_FAILED', message: 'Test webhook failed', details: result });
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'VALIDATION', details: err.errors });
      return;
    }
    console.error('[Integration] Test error:', err);
    res.status(500).json({ error: 'INTERNAL' });
  }
});

export default router;
