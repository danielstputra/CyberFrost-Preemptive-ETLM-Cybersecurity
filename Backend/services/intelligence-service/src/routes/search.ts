import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Vulnerability } from '../models/Vulnerability';
import { ThreatIntel } from '../models/ThreatIntel';
import { ThreatActor } from '../models/ThreatActor';

const router: Router = Router();

// GET /search?q= — Global IOC search across multiple collections
router.get('/', async (req: Request, res: Response) => {
  try {
    const { q, type } = z.object({ q: z.string().min(1).max(200), type: z.string().optional() }).parse(req.query);
    const tenantId = (req as any).user?.tenantId || 'default';
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const results: Record<string, unknown[]> = {};

    // Search CVEs
    if (!type || type === 'cve' || type === 'all') {
      results.vulnerabilities = await Vulnerability.find({
        tenantId, $or: [{ cveId: regex }, { title: regex }, { description: regex }],
      }).limit(10).select('cveId title severity cvss.score');
    }

    // Search Threat Intel
    if (!type || type === 'threat' || type === 'all') {
      results.threats = await ThreatIntel.find({
        tenantId, $or: [{ title: regex }, { description: regex }, { summary: regex }],
      }).limit(10).select('title threatType severity summary');
    }

    // Search Threat Actors
    if (!type || type === 'actor' || type === 'all') {
      try {
        results.actors = await ThreatActor.find({
          tenantId, $or: [{ name: regex }, { aliases: regex }, { description: regex }],
        }).limit(10).select('name aliases motivation active');
      } catch { /* Schema may not exist yet */ }
    }

    res.json({ query: q, results, total: Object.values(results).reduce((s, a) => s + a.length, 0) });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'VALIDATION', details: err.errors }); return; }
    res.status(500).json({ error: 'INTERNAL' });
  }
});

export default router;
