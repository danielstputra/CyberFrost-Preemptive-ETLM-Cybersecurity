import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ReportTemplate } from '../models/ReportTemplate';

const router: Router = Router();

const DEFAULT_TEMPLATES = [
  { name: 'Executive Summary Report', type: 'EXECUTIVE_SUMMARY', config: { sections: ['overview', 'severity', 'trending', 'top_cves'], dateRange: 'LAST_30_DAYS', formats: ['PDF'], includeCharts: true, recipients: [] }, schedule: { enabled: true, frequency: 'WEEKLY', dayOfWeek: 1, time: '08:00' } },
  { name: 'Compliance Report', type: 'COMPLIANCE', config: { sections: ['overview', 'iso27001', 'nist', 'pci'], dateRange: 'LAST_30_DAYS', formats: ['PDF', 'CSV'], includeCharts: true, recipients: [] }, schedule: { enabled: true, frequency: 'MONTHLY', dayOfMonth: 1, time: '08:00' } },
  { name: 'Vulnerability Report', type: 'VULNERABILITY', config: { sections: ['cves', 'exploits', 'patches'], dateRange: 'LAST_30_DAYS', formats: ['PDF', 'CSV'], includeCharts: true, recipients: [] }, schedule: { enabled: true, frequency: 'DAILY', time: '06:00' } },
  { name: 'Threat Intelligence Brief', type: 'THREAT_INTEL', config: { sections: ['threats', 'actors', 'campaigns'], dateRange: 'LAST_7_DAYS', formats: ['PDF'], includeCharts: false, recipients: [] }, schedule: { enabled: true, frequency: 'WEEKLY', dayOfWeek: 5, time: '07:00' } },
];

// ═══ GET /reports/templates — List report templates ═══
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId || 'default';
    let data = await ReportTemplate.find({ tenantId }).sort({ createdAt: -1 }).lean();
    if (data.length === 0) {
      await ReportTemplate.insertMany(DEFAULT_TEMPLATES.map(t => ({ ...t, tenantId })));
      data = await ReportTemplate.find({ tenantId }).sort({ createdAt: -1 }).lean();
    }
    res.json({ data });
  } catch { res.status(500).json({ error: 'INTERNAL' }); }
});

// ═══ GET /reports/dashboard — Report stats ═══
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId || 'default';
    const total = await ReportTemplate.countDocuments({ tenantId });
    const scheduled = await ReportTemplate.countDocuments({ tenantId, 'schedule.enabled': true });
    res.json({ templates: total, scheduled });
  } catch { res.status(500).json({ error: 'INTERNAL' }); }
});

const createSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['EXECUTIVE_SUMMARY', 'COMPLIANCE', 'VULNERABILITY', 'THREAT_INTEL', 'CUSTOM']),
  config: z.object({
    sections: z.array(z.string()).default([]),
    dateRange: z.string().default('LAST_30_DAYS'),
    formats: z.array(z.string()).default(['PDF']),
    includeCharts: z.boolean().default(true),
    recipients: z.array(z.string()).default([]),
  }),
  schedule: z.object({ enabled: z.boolean(), frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHTHLY', 'QUARTERLY']), time: z.string().default('08:00') }).nullable().optional(),
});

router.post('/templates', async (req: Request, res: Response) => {
  try {
    const body = createSchema.parse(req.body);
    const tenantId = (req as any).user?.tenantId || 'default';
    const tmpl = await ReportTemplate.create({ ...body, tenantId });
    res.status(201).json({ data: tmpl });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'VALIDATION', details: err.errors }); return; }
    res.status(500).json({ error: 'INTERNAL' });
  }
});

export default router;
