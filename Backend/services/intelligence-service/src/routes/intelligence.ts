import { Router, Request, Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Vulnerability } from '../models/Vulnerability';
import { ThreatIntel } from '../models/ThreatIntel';

const router: Router = Router();

// ════════════════════════════════════════════════════
//  Zod Validation Schemas
// ════════════════════════════════════════════════════

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  status: z.string().optional(),
  source: z.string().optional(),
  search: z.string().optional(),
  exploitAvailable: z.coerce.boolean().optional(),
  sortBy: z.enum(['publishedAt', 'cvss.score', 'severity', 'createdAt']).default('publishedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ════════════════════════════════════════════════════
//  Helpers
// ════════════════════════════════════════════════════

/** Escape regex special characters untuk mencegah ReDoS */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildFilter(query: ReturnType<typeof listQuerySchema.parse>, tenantId: string) {
  const filter: Record<string, unknown> = { tenantId };

  if (query.severity) filter.severity = query.severity;
  if (query.status) filter.status = query.status;
  if (query.source) filter.source = query.source;
  if (query.exploitAvailable !== undefined) filter.exploitAvailable = query.exploitAvailable;
  if (query.search) {
    const escaped = escapeRegex(query.search);
    filter.$or = [
      { title: { $regex: escaped, $options: 'i' } },
      { description: { $regex: escaped, $options: 'i' } },
      { cveId: { $regex: escaped, $options: 'i' } },
    ];
  }

  return filter;
}

function buildSort(query: ReturnType<typeof listQuerySchema.parse>): Record<string, 1 | -1> {
  // Sort by nested field (e.g. "cvss.score") → { "cvss.score": -1 }
  const field = query.sortBy;
  const direction: 1 | -1 = query.sortOrder === 'desc' ? -1 : 1;
  return { [field]: direction };
}

// ════════════════════════════════════════════════════
//  GET  /api/v1/intelligence/vulnerabilities
//  List CVE vulnerabilities with pagination & filters.
// ════════════════════════════════════════════════════

router.get('/vulnerabilities', async (req: Request, res: Response) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const tenantId = (req as any).user?.tenantId || 'default';
    const filter = buildFilter(query, tenantId);
    const sort = buildSort(query);

    const [total, items] = await Promise.all([
      Vulnerability.countDocuments(filter),
      Vulnerability.find(filter)
        .sort(sort)
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .select('-metadata'),
    ]);

    res.json({
      data: items.map((v) => ({
        id: v._id.toString(),
        cveId: v.cveId,
        title: v.title,
        description: v.description,
        cvss: v.cvss,
        severity: v.severity,
        affectedProducts: v.affectedProducts,
        exploitAvailable: v.exploitAvailable,
        publishedAt: v.publishedAt,
        lastModifiedAt: v.lastModifiedAt,
        source: v.source,
        status: v.status,
        tags: v.tags,
      })),
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
      filters: {
        severity: query.severity || null,
        status: query.status || null,
        search: query.search || null,
        exploitAvailable: query.exploitAvailable ?? null,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'VALIDATION', details: err.errors });
      return;
    }
    console.error('[Intel] List vulns error:', err);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to fetch vulnerabilities.' });
  }
});

// ════════════════════════════════════════════════════
//  GET  /api/v1/intelligence/vulnerabilities/:id
//  Get single CVE detail.
// ════════════════════════════════════════════════════

router.get('/vulnerabilities/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId || 'default';
    const vuln = await Vulnerability.findOne({ _id: req.params.id, tenantId });

    if (!vuln) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Vulnerability not found.' });
      return;
    }

    res.json({
      id: vuln._id.toString(),
      cveId: vuln.cveId,
      title: vuln.title,
      description: vuln.description,
      cvss: vuln.cvss,
      severity: vuln.severity,
      affectedProducts: vuln.affectedProducts,
      exploitAvailable: vuln.exploitAvailable,
      exploitDetails: vuln.exploitDetails,
      publishedAt: vuln.publishedAt,
      lastModifiedAt: vuln.lastModifiedAt,
      source: vuln.source,
      references: vuln.references,
      tags: vuln.tags,
      status: vuln.status,
      createdAt: vuln.createdAt,
    });
  } catch (err) {
    console.error('[Intel] Get vuln error:', err);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to get vulnerability.' });
  }
});

// ════════════════════════════════════════════════════
//  PATCH  /api/v1/intelligence/vulnerabilities/:id/status
//  Update vulnerability status (review, accept, false-positive, etc.)
// ════════════════════════════════════════════════════

const statusUpdateSchema = z.object({
  status: z.enum(['NEW', 'REVIEWING', 'PATCHED', 'ACCEPTED', 'FALSE_POSITIVE']),
});

router.patch('/vulnerabilities/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = statusUpdateSchema.parse(req.body);
    const tenantId = (req as any).user?.tenantId || 'default';

    const vuln = await Vulnerability.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      { $set: { status } },
      { new: true, select: 'cveId title severity status' },
    );

    if (!vuln) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Vulnerability not found.' });
      return;
    }

    res.json({
      message: `Status updated to ${status}`,
      cveId: vuln.cveId,
      severity: vuln.severity,
      status: vuln.status,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'VALIDATION', details: err.errors });
      return;
    }
    console.error('[Intel] Update vuln status error:', err);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to update status.' });
  }
});

// ════════════════════════════════════════════════════
//  GET  /api/v1/intelligence/threats
//  List threat intelligence with pagination & filters.
// ════════════════════════════════════════════════════

router.get('/threats', async (req: Request, res: Response) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const tenantId = (req as any).user?.tenantId || 'default';

    const filter: Record<string, unknown> = { tenantId };
    if (query.severity) filter.severity = query.severity;
    if (query.status) filter.status = query.status;
    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [total, items] = await Promise.all([
      ThreatIntel.countDocuments(filter),
      ThreatIntel.find(filter)
        .sort({ publishedAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .select('-indicators'),
    ]);

    res.json({
      data: items.map((t) => ({
        id: t._id.toString(),
        title: t.title,
        summary: t.summary,
        threatType: t.threatType,
        severity: t.severity,
        status: t.status,
        source: t.source,
        affectedSectors: t.affectedSectors,
        affectedRegions: t.affectedRegions,
        mitreAttackIds: t.mitreAttackIds,
        publishedAt: t.publishedAt,
        isActive: t.isActive,
      })),
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'VALIDATION', details: err.errors });
      return;
    }
    console.error('[Intel] List threats error:', err);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to fetch threats.' });
  }
});

// ════════════════════════════════════════════════════
//  GET  /api/v1/intelligence/threats/:id
//  Get single threat detail (with IOCs / indicators).
// ════════════════════════════════════════════════════

router.get('/threats/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId || 'default';
    const threat = await ThreatIntel.findOne({ _id: req.params.id, tenantId });

    if (!threat) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Threat not found.' });
      return;
    }

    res.json({
      id: threat._id.toString(),
      title: threat.title,
      description: threat.description,
      summary: threat.summary,
      threatType: threat.threatType,
      severity: threat.severity,
      status: threat.status,
      source: threat.source,
      sourceUrl: threat.sourceUrl,
      affectedSectors: threat.affectedSectors,
      affectedRegions: threat.affectedRegions,
      indicators: threat.indicators,
      mitreAttackIds: threat.mitreAttackIds,
      publishedAt: threat.publishedAt,
      isActive: threat.isActive,
      createdAt: threat.createdAt,
    });
  } catch (err) {
    console.error('[Intel] Get threat error:', err);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to get threat.' });
  }
});

// ════════════════════════════════════════════════════
//  GET  /api/v1/intelligence/dashboard
//  Summary statistics for the dashboard widgets.
// ════════════════════════════════════════════════════

router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId || 'default';

    const [
      totalVulnerabilities,
      severityBreakdown,
      exploitAvailable,
      recentVulns,
      recentThreats,
      threatTypeBreakdown,
    ] = await Promise.all([
      Vulnerability.countDocuments({ tenantId }),
      Vulnerability.aggregate([
        { $match: { tenantId } },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]),
      Vulnerability.countDocuments({ tenantId, exploitAvailable: true }),
      Vulnerability.find({ tenantId })
        .sort({ publishedAt: -1 })
        .limit(5)
        .select('cveId title severity cvss.score publishedAt'),
      ThreatIntel.find({ tenantId, isActive: true })
        .sort({ publishedAt: -1 })
        .limit(5)
        .select('title threatType severity publishedAt'),
      ThreatIntel.aggregate([
        { $match: { tenantId } },
        { $group: { _id: '$threatType', count: { $sum: 1 } } },
      ]),
    ]);

    // Normalize severity breakdown
    const severityMap: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    for (const item of severityBreakdown) {
      severityMap[item._id] = item.count;
    }

    const threatTypeMap: Record<string, number> = {};
    for (const item of threatTypeBreakdown) {
      threatTypeMap[item._id] = item.count;
    }

    res.json({
      totalVulnerabilities,
      severityBreakdown: severityMap,
      exploitsAvailable: exploitAvailable,
      recentVulnerabilities: recentVulns.map((v) => ({
        cveId: v.cveId,
        title: v.title,
        severity: v.severity,
        cvssScore: v.cvss?.score,
        publishedAt: v.publishedAt,
      })),
      activeThreats: recentThreats.map((t) => ({
        title: t.title,
        threatType: t.threatType,
        severity: t.severity,
        publishedAt: t.publishedAt,
      })),
      threatTypeBreakdown: threatTypeMap,
    });
  } catch (err) {
    console.error('[Intel] Dashboard error:', err);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to load dashboard.' });
  }
});

// ════════════════════════════════════════════════════
//  GET /api/v1/intelligence/search?q=...
//  Pencarian global: vulnerability, threats, actors
// ════════════════════════════════════════════════════

router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q } = z.object({ q: z.string().min(1).max(100) }).parse(req.query);
    const tenantId = (req as any).user?.tenantId || 'default';
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regexp = { $regex: escaped, $options: 'i' };

    const [vulnerabilities, threats, actors] = await Promise.all([
      Vulnerability.find({ tenantId, $or: [{ title: regexp }, { cveId: regexp }, { description: regexp }] })
        .limit(5).select('cveId title severity').lean(),
      ThreatIntel.find({ tenantId, $or: [{ title: regexp }, { description: regexp }] })
        .limit(5).select('title threatType severity').lean(),
      mongoose.model('ThreatActor').find({ tenantId, $or: [{ name: regexp }, { aliases: regexp }, { description: regexp }] })
        .limit(5).select('name country motivation').lean(),
    ]);

    res.json({
      results: {
        vulnerabilities: vulnerabilities.map((v: Record<string, any>) => ({ cveId: v.cveId, title: v.title, severity: v.severity })),
        threats: threats.map((t: Record<string, any>) => ({ title: t.title, threatType: t.threatType, severity: t.severity })),
        actors: actors.map((a: Record<string, any>) => ({ name: a.name, country: a.country })),
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'VALIDATION', details: err.errors }); return; }
    console.error('[Intel] Search error:', err);
    res.status(500).json({ error: 'INTERNAL', message: 'Search failed.' });
  }
});

export default router;
