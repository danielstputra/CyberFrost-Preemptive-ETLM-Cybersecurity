import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ThreatScore } from '../models/ThreatScore';
import { calculateThreatScore } from '../services/threat-score';
import { createLogger } from '@cyfirma/shared';
import { sendZodError, apiError } from '@cyfirma/shared';

const router: Router = Router();
const log = createLogger({ serviceName: 'intelligence-service' });

// ──────────────────────────────────────
//  Zod Schemas
// ──────────────────────────────────────

const scoreQuerySchema = z.object({
  targetType: z.enum(['CVE', 'IOC', 'THREAT_ACTOR', 'INCIDENT', 'ASSET']).optional(),
  minScore: z.coerce.number().int().min(0).max(100).optional(),
  level: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['score', 'lastCalculatedAt', 'targetType']).default('score'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const calculateSchema = z.object({
  targetType: z.enum(['CVE', 'IOC', 'THREAT_ACTOR', 'INCIDENT', 'ASSET']),
  targetId: z.string().min(1),
  targetRef: z.string().min(1),
  signals: z.object({
    cvssScore: z.number().min(0).max(10).optional(),
    cvssVector: z.string().optional(),
    exploitAvailable: z.boolean().optional(),
    exploitMaturity: z.enum(['NONE', 'POC', 'WEAPONIZED', 'ACTIVE']).optional(),
    darkWebMentions: z.number().int().min(0).optional(),
    threatActorCount: z.number().int().min(0).optional(),
    threatActorActivity: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    daysSincePublished: z.number().int().min(0).optional(),
    daysSinceDetected: z.number().int().min(0).optional(),
    assetCriticality: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    affectedAssetsCount: z.number().int().min(0).optional(),
  }),
});

// ──────────────────────────────────────
//  GET /api/v1/intelligence/threat-scores
//  List all threat scores with filters
// ──────────────────────────────────────

/**
 * @openapi
 * /intelligence/threat-scores:
 *   get:
 *     tags: [Intelligence]
 *     summary: List threat scores with pagination
 *     parameters:
 *       - in: query
 *         name: targetType
 *         schema: { type: string, enum: [CVE, IOC, THREAT_ACTOR, INCIDENT, ASSET] }
 *       - in: query
 *         name: minScore
 *         schema: { type: integer, minimum: 0, maximum: 100 }
 *       - in: query
 *         name: level
 *         schema: { type: string, enum: [LOW, MEDIUM, HIGH, CRITICAL] }
 *     responses:
 *       200:
 *         description: Paginated threat scores
 */
router.get('/threat-scores', async (req: Request, res: Response) => {
  try {
    const query = scoreQuerySchema.parse(req.query);
    const tenantId = (req as any).user?.tenantId || 'default';

    const filter: Record<string, unknown> = { tenantId };
    if (query.targetType) filter.targetType = query.targetType;
    if (query.minScore) filter.score = { $gte: query.minScore };
    if (query.level) filter.level = query.level;

    const sortField = query.sortBy;
    const sortDir: 1 | -1 = query.sortOrder === 'desc' ? -1 : 1;

    const [total, items] = await Promise.all([
      ThreatScore.countDocuments(filter),
      ThreatScore.find(filter)
        .sort({ [sortField]: sortDir })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit),
    ]);

    res.json({
      data: items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  } catch (err) {
    if (sendZodError(res, err)) return;
    log.error({ err }, 'Failed to list threat scores');
    res.status(500).json(apiError('INTERNAL', 'Failed to list threat scores.'));
  }
});

// ──────────────────────────────────────
//  GET /api/v1/intelligence/threat-scores/:targetType/:targetId
//  Get threat score for a specific target
// ──────────────────────────────────────

router.get('/threat-scores/:targetType/:targetId', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId || 'default';
    const { targetType, targetId } = req.params;

    const doc = await ThreatScore.findOne({ tenantId, targetType, targetId });
    if (!doc) {
      res.status(404).json(apiError('NOT_FOUND', 'Threat score not found for this target.'));
      return;
    }

    res.json(doc);
  } catch (err) {
    log.error({ err }, 'Failed to get threat score');
    res.status(500).json(apiError('INTERNAL', 'Failed to get threat score.'));
  }
});

// ──────────────────────────────────────
//  POST /api/v1/intelligence/threat-scores/calculate
//  Calculate & store a new threat score
// ──────────────────────────────────────

/**
 * @openapi
 * /intelligence/threat-scores/calculate:
 *   post:
 *     tags: [Intelligence]
 *     summary: Calculate threat score for a target
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [targetType, targetId, targetRef, signals]
 *             properties:
 *               targetType: { type: string, enum: [CVE, IOC, THREAT_ACTOR, INCIDENT, ASSET] }
 *               targetId:   { type: string }
 *               targetRef:  { type: string }
 *               signals:
 *                 type: object
 *                 properties:
 *                   cvssScore:          { type: number, example: 9.8 }
 *                   exploitAvailable:   { type: boolean }
 *                   exploitMaturity:    { type: string, enum: [NONE, POC, WEAPONIZED, ACTIVE] }
 *                   darkWebMentions:    { type: integer }
 *                   threatActorCount:   { type: integer }
 *                   daysSincePublished: { type: integer }
 *     responses:
 *       200:
 *         description: Calculated threat score
 */
router.post('/threat-scores/calculate', async (req: Request, res: Response) => {
  try {
    const body = calculateSchema.parse(req.body);
    const tenantId = (req as any).user?.tenantId || 'default';

    // Run the algorithm
    const result = calculateThreatScore(body.signals);

    // Store in database (upsert — replace if exists)
    const doc = await ThreatScore.findOneAndUpdate(
      { tenantId, targetType: body.targetType, targetId: body.targetId },
      {
        $set: {
          targetRef: body.targetRef,
          signals: body.signals,
          score: result.score,
          level: result.level,
          confidence: result.confidence,
          breakdown: result.breakdown,
          recommendedAction: result.recommendedAction,
          recommendedActionReason: result.recommendedActionReason,
          lastCalculatedAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // recalculate in 24h
        },
      },
      { upsert: true, new: true },
    );

    log.info({
      targetType: body.targetType,
      targetId: body.targetId,
      score: result.score,
      level: result.level,
    }, 'Threat score calculated');

    res.json(doc);
  } catch (err) {
    if (sendZodError(res, err)) return;
    log.error({ err }, 'Failed to calculate threat score');
    res.status(500).json(apiError('INTERNAL', 'Failed to calculate threat score.'));
  }
});

// ──────────────────────────────────────
//  GET /api/v1/intelligence/threat-scores/stats
//  Aggregate stats for dashboard
// ──────────────────────────────────────

router.get('/threat-scores/stats', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId || 'default';

    const stats = await ThreatScore.aggregate([
      { $match: { tenantId } },
      {
        $group: {
          _id: '$level',
          count: { $sum: 1 },
          avgScore: { $avg: '$score' },
          maxScore: { $max: '$score' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const totalScores = stats.reduce((acc, s) => acc + s.count, 0);
    const avgScore = stats.length > 0
      ? Math.round(stats.reduce((acc, s) => acc + s.avgScore * s.count, 0) / totalScores)
      : 0;

    res.json({
      total: totalScores,
      average: avgScore,
      distribution: stats.map(s => ({
        level: s._id,
        count: s.count,
        avgScore: Math.round(s.avgScore),
        maxScore: Math.round(s.maxScore),
      })),
    });
  } catch (err) {
    log.error({ err }, 'Failed to get threat score stats');
    res.status(500).json(apiError('INTERNAL', 'Failed to get threat score stats.'));
  }
});

export default router;
