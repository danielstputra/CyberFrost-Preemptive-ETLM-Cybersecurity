import { Router, Request, Response } from 'express';
import { z } from 'zod';

const router: Router = Router();

// ── SSRF Guard: blokir akses ke internal network ──
function validateUrlAgainstSSRF(urlString: string): { valid: boolean; reason?: string } {
  const BLOCKED_HOSTNAMES = ['localhost', 'localhost.localdomain', '127.0.0.1', '::1', '0.0.0.0', 'metadata.google.internal', 'metadata.internal'];
  const BLOCKED_IP_PATTERNS = [
    (ip: string) => ip.startsWith('10.'),
    (ip: string) => ip.startsWith('127.'),
    (ip: string) => ip.startsWith('192.168.'),
    (ip: string) => /^172\.(1[6-9]|2\d|3[01])\./.test(ip),
    (ip: string) => ip.startsWith('169.254.'),
    (ip: string) => ip === '0.0.0.0',
    (ip: string) => ip === '::1' || ip === '0:0:0:0:0:0:0:1',
  ];
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return { valid: false, reason: `Protocol '${parsed.protocol}' is not allowed` };
    const hostname = parsed.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.includes(hostname)) return { valid: false, reason: `Access to '${hostname}' is blocked (internal resource).` };
    const { isIP } = require('net');
    if (isIP(hostname)) {
      for (const check of BLOCKED_IP_PATTERNS) { if (check(hostname)) return { valid: false, reason: `Private IP '${hostname}' blocked.` }; }
    }
    return { valid: true };
  } catch { return { valid: false, reason: 'Invalid URL format' }; }
}

// Simulated webhook dispatch
async function dispatchWebhook(url: string, payload: Record<string, unknown>): Promise<{ success: boolean; statusCode: number }> {
  const ssrf = validateUrlAgainstSSRF(url);
  if (!ssrf.valid) {
    console.warn(`[Webhook] SSRF blocked URL: ${url} — ${ssrf.reason}`);
    return { success: false, statusCode: 0 };
  }
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(10000) });
    return { success: res.ok, statusCode: res.status };
  } catch (err: any) {
    return { success: false, statusCode: 0 };
  }
}

// POST /webhook/send — Send webhook to SIEM/SOAR
router.post('/send', async (req: Request, res: Response) => {
  try {
    const body = z.object({
      url: z.string().url(),
      eventType: z.string(),
      payload: z.record(z.unknown()).default({}),
      secret: z.string().optional(),
    }).parse(req.body);

    const result = await dispatchWebhook(body.url, {
      event: body.eventType,
      tenantId: (req as any).user?.tenantId || 'default',
      timestamp: new Date().toISOString(),
      ...body.payload,
    });

    res.json({ message: result.success ? 'Webhook sent' : 'Webhook failed', statusCode: result.statusCode });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'VALIDATION', details: err.errors }); return; }
    res.status(500).json({ error: 'INTERNAL' });
  }
});

// POST /webhook/test — Test webhook connectivity
router.post('/test', async (req: Request, res: Response) => {
  try {
    const { url } = z.object({ url: z.string().url() }).parse(req.body);
    const result = await dispatchWebhook(url, { event: 'test', message: 'Webhook connectivity test from CyberFrost' });
    res.json({ message: result.success ? 'Webhook reachable' : 'Webhook unreachable', statusCode: result.statusCode });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'VALIDATION', details: err.errors }); return; }
    res.status(500).json({ error: 'INTERNAL' });
  }
});

export default router;
