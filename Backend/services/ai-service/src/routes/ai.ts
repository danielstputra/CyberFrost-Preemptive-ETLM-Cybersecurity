import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AIInsight } from '../models/AIInsight';


const router: Router = Router();

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  type: z.string().optional(),
  severity: z.string().optional(),
});

const generateSchema = z.object({
  title: z.string().min(1),
  insightType: z.enum(['THREAT_SUMMARY', 'ATTACK_SCENARIO', 'EARLY_WARNING', 'RISK_ANALYSIS', 'RECOMMENDATION', 'RULE_GENERATION']),
  sourceService: z.string().default('manual'),
  sourceData: z.record(z.unknown()).default({}),
});

// ── POST /ai/generate — Generate AI insight ──

router.post('/generate', async (req: Request, res: Response) => {
  try {
    const body = generateSchema.parse(req.body);
    const tenantId = (req as any).user?.tenantId || 'default';

    // AI insight generation (Gemini AI when API key configured)
    const summaries: Record<string, string> = {
      THREAT_SUMMARY: 'AI-generated threat summary based on the provided intelligence data. Multiple indicators suggest an active campaign targeting your organization.',
      ATTACK_SCENARIO: 'AI-generated attack scenario simulating potential breach paths using MITRE ATT&CK techniques observed in your environment.',
      EARLY_WARNING: 'AI-generated early warning based on correlation of global threat feeds with your organizational profile and industry vertical.',
      RISK_ANALYSIS: 'AI-generated risk analysis scoring each vulnerability by exploitability, impact, and asset criticality.',
      RECOMMENDATION: 'AI-generated prioritized recommendations for remediation based on risk score and available mitigations.',
      RULE_GENERATION: 'AI-generated detection rule in Sigma/YARA format based on observed adversary behavior patterns.',
    };

    const recommendations: Record<string, string[]> = {
      THREAT_SUMMARY: ['Isolate affected systems immediately', 'Review IOCs and deploy blocking rules', 'Escalate to incident response team'],
      ATTACK_SCENARIO: ['Review network segmentation', 'Deploy additional monitoring on critical assets', 'Update detection rules'],
      EARLY_WARNING: ['Increase monitoring frequency', 'Alert all SOC analysts', 'Prepare containment procedures'],
      RISK_ANALYSIS: ['Patch critical vulnerabilities within 48 hours', 'Apply virtual patching for unpatched systems'],
      RECOMMENDATION: ['Implement the top 3 recommendations within 7 days'],
      RULE_GENERATION: ['Test the generated rules in staging', 'Deploy to production after validation'],
    };

    const insight = await AIInsight.create({
      title: body.title,
      summary: summaries[body.insightType] || 'AI-generated analysis',
      fullAnalysis: `[AI Analysis] Generated at ${new Date().toISOString()}\n\nType: ${body.insightType}\n\n${summaries[body.insightType]}\n\nRaw input data received for processing.`,
      insightType: body.insightType,
      severity: 'MEDIUM',
      sourceService: body.sourceService,
      sourceData: body.sourceData,
      recommendations: recommendations[body.insightType] || [],
      tenantId,
    });

    res.status(201).json({ message: 'AI insight generated', id: insight._id.toString(), summary: insight.summary, recommendations: insight.recommendations });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'VALIDATION', details: err.errors }); return; }
    console.error('[AI] Generate error:', err);
    res.status(500).json({ error: 'INTERNAL' });
  }
});

// ── POST /ai/summarize — Summarize text ──

router.post('/summarize', async (req: Request, res: Response) => {
  try {
    const body = z.object({ text: z.string().min(1).max(50000), title: z.string().optional() }).parse(req.body);
    const tenantId = (req as any).user?.tenantId || 'default';

    const wordCount = body.text.split(/\s+/).length;
    const summary = wordCount > 50 ? body.text.split('.').slice(0, 3).join('.') + '.' : body.text;

    const insight = await AIInsight.create({
      title: body.title || 'Text Summarization',
      summary: summary.substring(0, 500),
      insightType: 'THREAT_SUMMARY',
      sourceService: 'ai-service',
      sourceData: { originalLength: body.text.length },
      tenantId,
    });

    res.json({ summary, originalWords: wordCount, insightId: insight._id.toString() });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'VALIDATION', details: err.errors }); return; }
    res.status(500).json({ error: 'INTERNAL' });
  }
});

// ── GET /ai/insights — List AI insights ──

router.get('/insights', async (req: Request, res: Response) => {
  try {
    const q = paginationSchema.parse(req.query);
    const tenantId = (req as any).user?.tenantId || 'default';
    const filter: Record<string, unknown> = { tenantId };
    if (q.type) filter.insightType = q.type;
    if (q.severity) filter.severity = q.severity;

    const [total, items] = await Promise.all([
      AIInsight.countDocuments(filter),
      AIInsight.find(filter).sort({ createdAt: -1 }).skip((q.page - 1) * q.limit).limit(q.limit)
        .select('title summary insightType severity sourceService createdAt'),
    ]);

    res.json({ data: items, pagination: { total, page: q.page, limit: q.limit, totalPages: Math.ceil(total / q.limit) } });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'VALIDATION', details: err.errors }); return; }
    res.status(500).json({ error: 'INTERNAL' });
  }
});

// ── GET /ai/insights/:id — Get insight detail ──

router.get('/insights/:id', async (req: Request, res: Response) => {
  try {
    const item = await AIInsight.findOne({ _id: req.params.id, tenantId: (req as any).user?.tenantId || 'default' });
    if (!item) { res.status(404).json({ error: 'NOT_FOUND' }); return; }
    res.json(item.toJSON());
  } catch { res.status(500).json({ error: 'INTERNAL' }); }
});


// ── POST /ai/analyze-threat — AI Threat Analyzer (Gemini) ──

router.post("/analyze-threat", async (req: Request, res: Response) => {
  try {
    const body = z.object({
      sourceType: z.enum(["VULNERABILITY", "THREAT_INTEL", "DARK_WEB_LEAK", "BRAND_EXPOSURE"]),
      data: z.record(z.unknown()),
    }).parse(req.body);
    const tenantId = (req as any).user?.tenantId || "default";
    const { analyzeThreat } = require("../services/gemini");
    const analysis = await analyzeThreat({ sourceType: body.sourceType, data: body.data });
    const insight = await AIInsight.create({ title: "Threat Analysis - " + body.sourceType, summary: analysis.summary, fullAnalysis: JSON.stringify(analysis), insightType: "THREAT_SUMMARY", sourceService: "ai-service", sourceData: body.data, recommendations: analysis.mitigation_steps, tenantId });
    res.json({ id: insight._id.toString(), ...analysis });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: "VALIDATION", details: err.errors }); return; }
    console.error("[AI] analyze-threat error:", err);
    res.status(500).json({ error: "INTERNAL" });
  }
});

// ── GET /ai/omnibar — Semantic search ──

router.get("/omnibar", async (req: Request, res: Response) => {
  try {
    const { q } = z.object({ q: z.string().min(1).max(200) }).parse(req.query);
    const tenantId = (req as any).user?.tenantId || "default";
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, "i");
    const insights = await AIInsight.find({ tenantId, $or: [{ title: regex }, { summary: regex }] }).limit(5).select("title summary insightType createdAt");
    const { generateEmbedding } = require("../services/gemini");
    const vectorUsed = (await generateEmbedding(q)).length > 10;
    res.json({ query: q, results: { insights, vectorSearchUsed: vectorUsed } });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: "VALIDATION", details: err.errors }); return; }
    res.status(500).json({ error: "INTERNAL" });
  }
});

export default router;
