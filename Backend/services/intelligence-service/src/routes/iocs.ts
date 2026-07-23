import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { IOC } from '../models/IOC';
import { parseStixBundle, exportStixBundle } from '../services/stix';
import { calculateThreatScore } from '../services/threat-score';
import { enrichIoc } from '../services/enrichment';
import { createLogger, sendZodError, apiError } from '@cyfirma/shared';

const router: Router = Router();
const log = createLogger({ serviceName: 'intelligence-service' });

// ──────────────────────────────────────
//  Zod Schemas
// ──────────────────────────────────────

const listQuerySchema = z.object({
  type: z.enum(['IP', 'DOMAIN', 'URL', 'MD5', 'SHA1', 'SHA256', 'EMAIL']).optional(),
  source: z.enum(['MISP', 'OTX', 'THREATFOX', 'URLHAUS', 'INTERNAL', 'MANUAL']).optional(),
  threatType: z.string().optional(),
  search: z.string().optional(),
  minScore: z.coerce.number().int().min(0).max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['score.value', 'lastSeen', 'confidence', 'type']).default('lastSeen'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const createIocSchema = z.object({
  type: z.enum(['IP', 'DOMAIN', 'URL', 'MD5', 'SHA1', 'SHA256', 'EMAIL']),
  value: z.string().min(1),
  description: z.string().optional(),
  threatType: z.string().optional(),
  confidence: z.number().int().min(0).max(100).optional(),
  labels: z.array(z.string()).optional(),
});

const lookupSchema = z.object({
  value: z.string().min(1),
});

// ──────────────────────────────────────
//  GET /api/v1/intelligence/iocs
// ──────────────────────────────────────

router.get('/iocs', async (req: Request, res: Response) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const tenantId = (req as any).user?.tenantId || 'default';

    const filter: Record<string, unknown> = { tenantId, expired: { $ne: true } };
    if (query.type) filter.type = query.type;
    if (query.source) filter.source = query.source;
    if (query.threatType) filter.threatType = query.threatType;
    if (query.minScore) filter['score.value'] = { $gte: query.minScore };
    if (query.search) {
      filter.$or = [
        { value: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
        { sourceRef: { $regex: query.search, $options: 'i' } },
      ];
    }

    const sortDir: 1 | -1 = query.sortOrder === 'desc' ? -1 : 1;

    const [total, items] = await Promise.all([
      IOC.countDocuments(filter),
      IOC.find(filter)
        .sort({ [query.sortBy]: sortDir })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit),
    ]);

    res.json({
      data: items,
      pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
    });
  } catch (err) {
    if (sendZodError(res, err)) return;
    log.error({ err }, 'Failed to list IOCs');
    res.status(500).json(apiError('INTERNAL', 'Failed to list IOCs.'));
  }
});

// ──────────────────────────────────────
//  POST /api/v1/intelligence/iocs/lookup
// ──────────────────────────────────────

router.post('/iocs/lookup', async (req: Request, res: Response) => {
  try {
    const { value } = lookupSchema.parse(req.body);
    const tenantId = (req as any).user?.tenantId || 'default';

    const ioc = await IOC.findOne({ tenantId, value: { $regex: `^${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } });

    if (!ioc) {
      res.status(404).json(apiError('NOT_FOUND', 'IOC not found in database.'));
      return;
    }

    res.json(ioc);
  } catch (err) {
    if (sendZodError(res, err)) return;
    log.error({ err }, 'IOC lookup failed');
    res.status(500).json(apiError('INTERNAL', 'IOC lookup failed.'));
  }
});

// ──────────────────────────────────────
//  POST /api/v1/intelligence/iocs (manual create)
// ──────────────────────────────────────

router.post('/iocs', async (req: Request, res: Response) => {
  try {
    const body = createIocSchema.parse(req.body);
    const tenantId = (req as any).user?.tenantId || 'default';

    const exists = await IOC.findOne({ type: body.type, value: body.value, tenantId });
    if (exists) {
      res.status(409).json(apiError('CONFLICT', 'IOC with this value already exists.'));
      return;
    }

    const signals = {
      exploitAvailable: false,
      exploitMaturity: 'NONE' as const,
      darkWebMentions: body.threatType === 'PHISHING' ? 5 : 0,
      threatActorCount: 0,
      threatActorActivity: 'LOW' as const,
      daysSincePublished: 0,
      daysSinceDetected: 0,
      assetCriticality: 'MEDIUM' as const,
      affectedAssetsCount: 1,
      cvssScore: 0,
    };

    const result = calculateThreatScore(signals);

    const ioc = await IOC.create({
      type: body.type,
      value: body.value,
      description: body.description || '',
      threatType: (body.threatType as any) || 'MALWARE',
      confidence: body.confidence || 50,
      labels: body.labels || [],
      source: 'MANUAL',
      firstSeen: new Date(),
      lastSeen: new Date(),
      expiresAt: new Date(Date.now() + 30 * 86400000),
      score: { value: result.score, level: result.level, calculatedAt: new Date() },
      tenantId,
    });

    res.status(201).json(ioc);
  } catch (err) {
    if (sendZodError(res, err)) return;
    log.error({ err }, 'Failed to create IOC');
    res.status(500).json(apiError('INTERNAL', 'Failed to create IOC.'));
  }
});

// ──────────────────────────────────────
//  GET /api/v1/intelligence/iocs/export/stix
// ──────────────────────────────────────

router.get('/iocs/export/stix', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId || 'default';
    const type = req.query.type as string | undefined;
    const minScore = req.query.minScore ? parseInt(req.query.minScore as string) : undefined;
    const limit = Math.min(parseInt((req.query.limit as string) || '500'), 5000);

    const filter: Record<string, unknown> = { tenantId, expired: { $ne: true } };
    if (type) filter.type = type;
    if (minScore) filter['score.value'] = { $gte: minScore };

    const iocs = await IOC.find(filter).sort({ lastSeen: -1 }).limit(limit);
    const bundle = exportStixBundle(iocs);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="iocs-stix-${Date.now()}.json"`);
    res.json(bundle);
  } catch (err) {
    log.error({ err }, 'Failed to export IOCs');
    res.status(500).json(apiError('INTERNAL', 'Failed to export IOCs.'));
  }
});

// ──────────────────────────────────────
//  GET /api/v1/intelligence/iocs/stats
// ──────────────────────────────────────

router.get('/iocs/stats', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId || 'default';

    const [total, byType, bySource] = await Promise.all([
      IOC.countDocuments({ tenantId, expired: { $ne: true } }),
      IOC.aggregate([
        { $match: { tenantId, expired: { $ne: true } } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      IOC.aggregate([
        { $match: { tenantId, expired: { $ne: true } } },
        { $group: { _id: '$source', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    res.json({ total, byType, bySource });
  } catch (err) {
    log.error({ err }, 'Failed to get IOC stats');
    res.status(500).json(apiError('INTERNAL', 'Failed to get IOC stats.'));
  }
});

// ──────────────────────────────────────
//  POST /api/v1/intelligence/iocs/import
//  Import STIX 2.1 bundle — parse & save IOCs
// ──────────────────────────────────────

const importSchema = z.object({
  bundle: z.object({
    type: z.literal('bundle'),
    id: z.string().optional(),
    objects: z.array(z.any()),
  }),
});

/**
 * @openapi
 * /intelligence/iocs/import:
 *   post:
 *     tags: [Intelligence]
 *     summary: Import STIX 2.1 bundle
 *     description: Upload STIX bundle → parse → store IOCs with Threat Score
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bundle: { type: object, description: "STIX 2.1 Bundle" }
 *     responses:
 *       201:
 *         description: IOCs imported
 */
router.post('/iocs/import', async (req: Request, res: Response) => {
  try {
    const body = importSchema.parse(req.body);
    const tenantId = (req as any).user?.tenantId || 'default';

    const bundle = body.bundle as { type: 'bundle'; id: string; objects: any[] };
    if (!bundle.id) bundle.id = `bundle--${Date.now()}`;
    const parsed = parseStixBundle(bundle, tenantId);
    if (parsed.length === 0) {
      res.status(400).json(apiError('PARSE_ERROR', 'No valid indicators found in the STIX bundle.'));
      return;
    }

    let imported = 0;
    let skipped = 0;

    for (const ioc of parsed) {
      const exists = await IOC.findOne({ type: ioc.type, value: ioc.value, tenantId });
      if (exists) { skipped++; continue; }

      // Calculate threat score
      const signals = {
        exploitAvailable: false,
        exploitMaturity: 'NONE' as const,
        darkWebMentions: ioc.source === 'THREATFOX' ? 10 : 5,
        threatActorCount: 0,
        threatActorActivity: 'LOW' as const,
        daysSincePublished: 0,
        daysSinceDetected: 0,
        assetCriticality: 'MEDIUM' as const,
        affectedAssetsCount: 1,
        cvssScore: 0,
      };

      const result = calculateThreatScore(signals);

      await IOC.create({
        ...ioc,
        threatType: ioc.threatType || 'MALWARE',
        source: ioc.source || 'MISP',
        confidence: ioc.confidence || 60,
        score: { value: result.score, level: result.level, calculatedAt: new Date() },
        lastSeen: new Date(),
        expired: false,
        expiresAt: new Date(Date.now() + 30 * 86400000),
      });
      imported++;
    }

    log.info({ imported, skipped }, 'STIX bundle imported');
    res.status(201).json({ imported, skipped, total: parsed.length });
  } catch (err) {
    if (sendZodError(res, err)) return;
    log.error({ err }, 'Failed to import STIX bundle');
    res.status(500).json(apiError('INTERNAL', 'Failed to import STIX bundle.'));
  }
});

// ──────────────────────────────────────
//  POST /api/v1/intelligence/iocs/:id/enrich
//  Trigger enrichment for a specific IOC
// ──────────────────────────────────────

/**
 * @openapi
 * /intelligence/iocs/{id}/enrich:
 *   post:
 *     tags: [Intelligence]
 *     summary: Enrich IOC with GeoIP / WHOIS data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Enrichment data added
 */
router.post('/iocs/:id/enrich', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).user?.tenantId || 'default';

    const ioc = await IOC.findOne({ _id: id, tenantId });
    if (!ioc) {
      res.status(404).json(apiError('NOT_FOUND', 'IOC not found.'));
      return;
    }

    if (ioc.type !== 'IP' && ioc.type !== 'DOMAIN' && ioc.type !== 'URL') {
      res.status(400).json(apiError('UNSUPPORTED', `Enrichment not supported for type "${ioc.type}".`));
      return;
    }

    const enrichment = await enrichIoc(ioc);
    const updated = await IOC.findByIdAndUpdate(
      id,
      { $set: { enrichment, updatedAt: new Date() } },
      { new: true },
    );

    log.info({ id: ioc._id, type: ioc.type, value: ioc.value }, 'IOC enriched');
    res.json(updated);
  } catch (err) {
    log.error({ err }, 'Failed to enrich IOC');
    res.status(500).json(apiError('INTERNAL', 'Failed to enrich IOC.'));
  }
});

// ──────────────────────────────────────
//  POST /api/v1/intelligence/iocs/enrich/batch
//  Enrich all IOCs without enrichment data
// ──────────────────────────────────────

router.post('/iocs/enrich/batch', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId || 'default';

    const unenriched = await IOC.find({
      tenantId,
      type: { $in: ['IP', 'DOMAIN', 'URL'] },
      $or: [
        { enrichment: { $exists: false } },
        { enrichment: null },
      ],
      expired: { $ne: true },
    }).limit(50);

    let enriched = 0;
    for (const ioc of unenriched) {
      const data = await enrichIoc(ioc);
      if (Object.keys(data).length > 0) {
        await IOC.findByIdAndUpdate(ioc._id, { $set: { enrichment: data, updatedAt: new Date() } });
        enriched++;
      }
    }

    log.info({ total: unenriched.length, enriched }, 'Batch enrichment complete');
    res.json({ total: unenriched.length, enriched });
  } catch (err) {
    log.error({ err }, 'Batch enrichment failed');
    res.status(500).json(apiError('INTERNAL', 'Batch enrichment failed.'));
  }
});

export default router;
