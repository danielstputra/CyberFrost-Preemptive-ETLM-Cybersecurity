import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { TakedownRequest } from '../models/TakedownRequest';
import { submitTakedownRequest } from '../services/takedown-submitter';
import { generateAbuseEmail, generateDomainAbuseEmail, AbuseReportData } from '../services/abuse-email';
import { generatePlatformReport, generateFacebookReport, generateInstagramReport, SocialMediaReportData } from '../services/legal-report';
import { detectRouting } from '../services/legal-template';
import { dispatchLegalEmail } from '../services/mailer';
import { dispatchToKominfo } from '../services/kominfoDispatcher';
import { TenantIntegration } from '../models/TenantIntegration';

const router: Router = Router();

const createSchema = z.object({
  targetUrl: z.string().url('Valid URL is required'),
  domain: z.string().min(1),
  threatType: z.enum(['PHISHING', 'MALWARE', 'TRADEMARK', 'COPYRIGHT', 'JUDI_ONLINE', 'PHISHING_BANK_LOKAL', 'PENIPUAN_TRANSAKSI', 'FRAUD', 'IMPERSONATION']).default('PHISHING'),
  platform: z.enum(['GOOGLE_SAFE_BROWSING', 'PHISHTANK', 'ABUSE_EMAIL', 'MANUAL']).default('MANUAL'),
  evidence: z.string().default(''),
  notes: z.string().default(''),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.string().optional(),
});

// POST /takedown — Create + submit takedown request
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = createSchema.parse(req.body);
    const tenantId = (req as any).user?.tenantId || 'default';
    const userId = (req as any).user?.userId || 'anonymous';

    // Submit to external providers
    const submitResults = await submitTakedownRequest(body.targetUrl);

    const record = await TakedownRequest.create({
      targetUrl: body.targetUrl,
      domain: body.domain,
      threatType: body.threatType,
      platform: body.platform,
      status: 'SUBMITTED',
      evidence: body.evidence,
      submittedTo: body.platform,
      submittedAt: new Date(),
      responseRef: submitResults.gsb.referenceId || submitResults.phishTank.referenceId || null,
      responseData: { gsb: submitResults.gsb, phishTank: submitResults.phishTank } as any,
      notes: body.notes,
      tenantId,
      createdBy: userId,
    });

    // Generate abuse email template
    const abuseData: AbuseReportData = {
      victimDomain: body.domain,
      maliciousUrl: body.targetUrl,
      maliciousIp: '',
      threatType: body.threatType,
      description: body.evidence || `Automated takedown request for ${body.domain} — ${body.threatType}`,
      evidenceUrls: [],
      discoveredAt: new Date().toISOString(),
      reporterName: 'CyberFrost Platform',
      reporterEmail: process.env.SMTP_FROM_EMAIL || 'abuse@cyberfrost.vercel.app',
    };
    const abuseEmail = generateAbuseEmail(abuseData);

    res.status(201).json({
      message: 'Takedown request submitted',
      id: record._id.toString(),
      status: record.status,
      submitResults,
      abuseEmailTemplate: abuseEmail,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'VALIDATION', details: err.errors }); return;
    }
    console.error('[Takedown] Error:', err);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to create takedown request' });
  }
});

// GET /takedown — List takedown requests
router.get('/', async (req: Request, res: Response) => {
  try {
    const q = paginationSchema.parse(req.query);
    const tenantId = (req as any).user?.tenantId || 'default';
    const filter: Record<string, unknown> = { tenantId };
    if (q.status) filter.status = q.status;

    const [total, items] = await Promise.all([
      TakedownRequest.countDocuments(filter),
      TakedownRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip((q.page - 1) * q.limit).limit(q.limit)
        .select('targetUrl domain threatType platform status submittedAt responseRef submittedTo targetType socialPlatform impersonatedEntity draftContent'),
    ]);

    res.json({ data: items, pagination: { total, page: q.page, limit: q.limit, totalPages: Math.ceil(total / q.limit) } });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'VALIDATION', details: err.errors }); return; }
    res.status(500).json({ error: 'INTERNAL' });
  }
});

// GET /takedown/:id — Get detail
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId || 'default';
    const item = await TakedownRequest.findOne({ _id: req.params.id, tenantId });
    if (!item) { res.status(404).json({ error: 'NOT_FOUND' }); return; }
    res.json(item.toJSON());
  } catch { res.status(500).json({ error: 'INTERNAL' }); }
});

// PATCH /takedown/:id/status — Enterprise status update with analyst logging
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, note } = z.object({
      status: z.enum(['SUBMITTED', 'IN_REVIEW', 'ESCALATED_VIP', 'SUCCESSFUL', 'REJECTED']),
      note: z.string().min(1, 'Analyst note is required'),
    }).parse(req.body);
    const tenantId = (req as any).user?.tenantId || 'default';
    const analystId = (req as any).user?.userId || 'anonymous';
    const analystName = (req as any).user?.name || 'Unknown Analyst';

    const current = await TakedownRequest.findOne({ _id: req.params.id, tenantId });
    if (!current) { res.status(404).json({ error: 'NOT_FOUND' }); return; }

    const logEntry = {
      analystId,
      analystName,
      timestamp: new Date(),
      note,
      previousStatus: current.status,
      newStatus: status,
    };

    const item = await TakedownRequest.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      { $set: { status }, $push: { analystLogs: logEntry } },
      { new: true, select: 'targetUrl domain status notes analystLogs' },
    );
    res.json({ message: `Status ${current.status} → ${status}`, log: logEntry, item });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'VALIDATION', details: err.errors }); return; }
    res.status(500).json({ error: 'INTERNAL' });
  }
});

// POST /takedown/social-media — Submit social media impersonation takedown
const socialMediaSchema = z.object({
  profileUrl: z.string().url('Valid URL is required'),
  platform: z.enum(['FACEBOOK', 'TWITTER', 'LINKEDIN', 'INSTAGRAM', 'TIKTOK', 'OTHER']),
  impersonatedEntity: z.string().min(1, 'Impersonated entity is required'),
  description: z.string().min(1, 'Description is required'),
  evidenceFiles: z.array(z.string()).default([]),
  notes: z.string().default(''),
});

router.post('/social-media', async (req: Request, res: Response) => {
  try {
    const body = socialMediaSchema.parse(req.body);
    const tenantId = (req as any).user?.tenantId || 'default';
    const userId = (req as any).user?.userId || 'anonymous';

    const record = await TakedownRequest.create({
      targetUrl: body.profileUrl,
      domain: new URL(body.profileUrl).hostname,
      targetType: 'SOCIAL_MEDIA',
      threatType: 'TRADEMARK',
      platform: 'MANUAL',
      socialPlatform: body.platform,
      profileUrl: body.profileUrl,
      impersonatedEntity: body.impersonatedEntity,
      evidenceFiles: body.evidenceFiles,
      status: 'SUBMITTED',
      evidence: body.description,
      submittedTo: body.platform,
      submittedAt: new Date(),
      notes: body.notes,
      tenantId,
      createdBy: userId,
    });

    const reportData: SocialMediaReportData = {
      profileUrl: body.profileUrl,
      platform: body.platform,
      impersonatedEntity: body.impersonatedEntity,
      description: body.description,
      evidenceUrls: body.evidenceFiles,
      reporterName: 'CyberFrost Platform',
      reporterEmail: process.env.SMTP_FROM_EMAIL || 'abuse@cyberfrost.vercel.app',
      discoveredAt: new Date().toISOString(),
    };
    const legalReport = generatePlatformReport(reportData);

    res.status(201).json({
      message: 'Social media takedown request submitted',
      id: record._id.toString(),
      status: record.status,
      platform: body.platform,
      legalReport,
    });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'VALIDATION', details: err.errors }); return; }
    console.error('[Takedown] Social media error:', err);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to submit social media takedown' });
  }
});

// POST /takedown/generate-email — Generate abuse email template without submitting
router.post('/generate-email', async (req: Request, res: Response) => {
  try {
    const body = z.object({
      targetUrl: z.string().url(),
      domain: z.string().min(1),
      threatType: z.string().default('PHISHING'),
      description: z.string().default(''),
      emailType: z.enum(['HOSTING', 'DOMAIN']).default('HOSTING'),
    }).parse(req.body);

    const abuseData: AbuseReportData = {
      victimDomain: body.domain,
      maliciousUrl: body.targetUrl,
      maliciousIp: '',
      threatType: body.threatType,
      description: body.description || `Abuse report for ${body.domain}`,
      evidenceUrls: [],
      discoveredAt: new Date().toISOString(),
      reporterName: 'CyberFrost Platform',
      reporterEmail: process.env.SMTP_FROM_EMAIL || 'abuse@cyberfrost.vercel.app',
    };

    const email = body.emailType === 'DOMAIN'
      ? generateDomainAbuseEmail(abuseData)
      : generateAbuseEmail(abuseData);

    res.json({ email });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'VALIDATION', details: err.errors }); return; }
    res.status(500).json({ error: 'INTERNAL' });
  }
});

// POST /takedown/:id/generate-draft — Generate + save draft to DB
router.post('/:id/generate-draft', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId || 'default';
    const item = await TakedownRequest.findOne({ _id: req.params.id, tenantId });
    if (!item) { res.status(404).json({ error: 'NOT_FOUND' }); return; }

    const routing = detectRouting(item.platform, item.socialPlatform);
    const draftData = {
      reporterName: 'CyberFrost Security',
      reporterEmail: process.env.SMTP_FROM_EMAIL || 'abuse@cyberfrost.vercel.app',
      platform: item.socialPlatform || item.platform || 'the platform',
      profileUrl: item.profileUrl || item.targetUrl,
      impersonatedEntity: item.impersonatedEntity || item.domain,
      threatType: item.threatType,
      discoveredAt: item.createdAt?.toISOString() || new Date().toISOString(),
      description: item.evidence || item.notes || 'No description provided.',
      evidenceUrls: item.evidenceFiles || [],
      date: new Date().toISOString().split('T')[0],
    };
    const draft = routing.draft(draftData);

    // Save draft to DB and set status to DRAFT
    await TakedownRequest.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      { $set: { draftContent: draft, status: 'DRAFT' } },
    );

    res.json({ draft, _id: item._id, status: 'DRAFT' });
  } catch (err) {
    console.error('[Takedown] Generate draft error:', err);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to generate draft' });
  }
});

// PATCH /takedown/:id/draft — Save draft content manually
router.patch('/:id/draft', async (req: Request, res: Response) => {
  try {
    const { draftContent } = z.object({
      draftContent: z.string().min(1, 'Draft content is required'),
    }).parse(req.body);
    const tenantId = (req as any).user?.tenantId || 'default';

    const item = await TakedownRequest.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      { $set: { draftContent, status: 'DRAFT' } },
      { new: true, select: 'draftContent status' },
    );
    if (!item) { res.status(404).json({ error: 'NOT_FOUND' }); return; }
    res.json({ message: 'Draft saved', status: item.status });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'VALIDATION', details: err.errors }); return; }
    console.error('[Takedown] Save draft error:', err);
    res.status(500).json({ error: 'INTERNAL' });
  }
});

// POST /takedown/:id/dispatch-email — Dispatch legal notice via email
router.post('/:id/dispatch-email', async (req: Request, res: Response) => {
  try {
    const body = z.object({
      to: z.string().email('Valid email is required'),
      cc: z.string().optional(),
      subject: z.string().min(1, 'Subject is required'),
      body: z.string().min(1, 'Body is required'),
    }).parse(req.body);
    const tenantId = (req as any).user?.tenantId || 'default';
    const analystId = (req as any).user?.userId || 'anonymous';
    const analystName = (req as any).user?.name || 'Unknown Analyst';

    const item = await TakedownRequest.findOne({ _id: req.params.id, tenantId });
    const routing = item ? detectRouting(item.platform, item.socialPlatform) : null;
    const targetEmail = body.to || routing?.to || 'aduankonten@kominfo.go.id';
    const subject = body.subject || routing?.subject || 'URGENT: Impersonation Notice';

    const result = await dispatchLegalEmail({
      to: targetEmail,
      cc: body.cc,
      subject,
      body: body.body,
    });

    if (!result.success) {
      res.status(502).json({ error: 'EMAIL_FAILED', message: result.error || 'Failed to send email' });
      return;
    }

    const isKominfo = targetEmail === 'aduankonten@kominfo.go.id';
    const newStatus = isKominfo ? 'ESCALATED_VIP' : 'SUBMITTED';
    const logNote = isKominfo
      ? `[SYSTEM] Escalated to Kominfo Trust+ via aduankonten@kominfo.go.id — ${subject}`
      : `Legal Notice sent successfully to ${targetEmail}. Subject: ${subject}`;

    const logEntry = {
      analystId,
      analystName,
      timestamp: new Date(),
      note: logNote,
      previousStatus: 'SUBMITTED',
      newStatus,
    };

    await TakedownRequest.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      { $set: { status: newStatus }, $push: { analystLogs: logEntry } },
    );

    res.json({ message: 'Legal notice dispatched', messageId: result.messageId, log: logEntry, routedTo: targetEmail });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'VALIDATION', details: err.errors }); return; }
    console.error('[Takedown] Dispatch error:', err);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to dispatch email' });
  }
});

// ════════════════════════════════════════════════════════
//  POST /takedown/bulk-export — Export selected takedowns as CSV
// ════════════════════════════════════════════════════════
const bulkExportSchema = z.object({ ids: z.array(z.string()).min(1, 'At least one ID is required') });

router.post('/bulk-export', async (req: Request, res: Response) => {
  try {
    const { ids } = bulkExportSchema.parse(req.body);
    const tenantId = (req as any).user?.tenantId || 'default';

    const items = await TakedownRequest.find({ _id: { $in: ids }, tenantId })
      .select('targetUrl domain threatType platform status submittedAt socialPlatform profileUrl impersonatedEntity');

    const headers = 'Target URL,Domain,Threat Type,Platform,Status,Submitted At,Social Platform,Profile URL,Impersonated Entity\n';
    const rows = items.map(item => {
      const escape = (v: string | undefined | null) => {
        const s = (v || '').replace(/"/g, '""');
        return s.includes(',') ? `"${s}"` : s;
      };
      return [
        escape(item.targetUrl), escape(item.domain), escape(item.threatType),
        escape(item.platform), escape(item.status), item.submittedAt?.toISOString() || '',
        escape(item.socialPlatform), escape(item.profileUrl), escape(item.impersonatedEntity),
      ].join(',');
    }).join('\n');

    const csv = '﻿' + headers + rows;
    const filename = `takedown-export-${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(csv);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'VALIDATION', details: err.errors }); return; }
    console.error('[Takedown] Bulk export error:', err);
    res.status(500).json({ error: 'INTERNAL' });
  }
});

// ════════════════════════════════════════════════════════
//  PATCH /takedown/bulk-status — Bulk update status with analyst logging
// ════════════════════════════════════════════════════════
const bulkStatusSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one ID is required'),
  status: z.enum(['SUBMITTED', 'IN_REVIEW', 'ESCALATED_VIP', 'SUCCESSFUL', 'REJECTED']),
  note: z.string().min(1, 'Analyst note is required'),
});

router.patch('/bulk-status', async (req: Request, res: Response) => {
  try {
    const { ids, status, note } = bulkStatusSchema.parse(req.body);
    const tenantId = (req as any).user?.tenantId || 'default';
    const analystId = (req as any).user?.userId || 'anonymous';
    const analystName = (req as any).user?.name || 'Unknown Analyst';

    const items = await TakedownRequest.find({ _id: { $in: ids }, tenantId }).select('_id status');

    const logEntry = {
      analystId,
      analystName,
      timestamp: new Date(),
      note,
      previousStatus: '',
      newStatus: status,
    };

    let updated = 0;
    for (const item of items) {
      logEntry.previousStatus = item.status;
      await TakedownRequest.findOneAndUpdate(
        { _id: item._id, tenantId },
        { $set: { status }, $push: { analystLogs: logEntry } },
      );
      updated++;
    }

    res.json({ message: `Bulk status updated: ${updated} items → ${status}`, updated, totalRequested: ids.length });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'VALIDATION', details: err.errors }); return; }
    console.error('[Takedown] Bulk status error:', err);
    res.status(500).json({ error: 'INTERNAL' });
  }
});

// ════════════════════════════════════════════════════════
//  POST /takedown/:id/execute-one-click — SOAR Auto-Execute
// ════════════════════════════════════════════════════════
async function dispatchOneClick(item: any, testEmail?: string): Promise<{ success: boolean; provider: string; ref?: string; error?: string }> {
  const platform = item.socialPlatform || item.platform || 'MANUAL';
  const payload = {
    targetUrl: item.profileUrl || item.targetUrl,
    domain: item.domain,
    impersonatedEntity: item.impersonatedEntity,
    evidence: item.evidence || item.notes,
    evidenceFiles: item.evidenceFiles || [],
    reporterName: 'CyberFrost Platform',
    reporterEmail: process.env.SMTP_FROM_EMAIL || 'abuse@cyberfrost.vercel.app',
  };

  // If test mode, override destination to test email
  const sendTest = async (subject: string, body: string) => {
    return dispatchLegalEmail({ to: testEmail!, subject: `[TEST] ${subject}`, body });
  };

  if (testEmail) {
    const routing = detectRouting(item.platform, item.socialPlatform);
    const draftData = {
      reporterName: payload.reporterName, reporterEmail: payload.reporterEmail,
      platform, profileUrl: payload.targetUrl,
      impersonatedEntity: payload.impersonatedEntity || item.domain,
      threatType: item.threatType,
      discoveredAt: item.createdAt?.toISOString() || new Date().toISOString(),
      description: payload.evidence || 'Test mode',
      evidenceUrls: payload.evidenceFiles,
      date: new Date().toISOString().split('T')[0],
    };
    const draft = routing.draft(draftData);
    const result = await sendTest(`TEST One-Click Report — ${payload.impersonatedEntity}`, draft);
    return { success: result.success, provider: `TEST:${platform}`, ref: result.messageId, error: result.error };
  }

  switch (platform) {
    case 'KOMINFO_TRUST_POSITIF':
    case 'KOMINFO': {
      const result = await dispatchToKominfo({
        reporterName: payload.reporterName,
        reporterEmail: payload.reporterEmail,
        impersonatedEntity: payload.impersonatedEntity || payload.domain,
        threatType: item.threatType || 'JUDI_ONLINE',
        targetUrl: payload.targetUrl,
        domain: payload.domain,
        description: payload.evidence || 'Automated takedown via SOAR.',
        evidenceUrls: payload.evidenceFiles || [],
        discoveredAt: item.createdAt?.toISOString() || new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
      });
      if (!result.success) {
        return { success: false, provider: 'KOMINFO', error: result.error || 'Kominfo dispatch failed' };
      }
      return { success: true, provider: 'KOMINFO', ref: result.messageId || result.refId };
    }

    case 'FACEBOOK':
    case 'INSTAGRAM': {
      // ── Check tenant Meta BRP integration ──
      const metaCfg = await TenantIntegration.findOne({ tenantId: item.tenantId, provider: 'META_BRP', enabled: true }).lean();

      // Helper: send enhanced legal email fallback
      const sendMetaEmailFallback = async (): Promise<{ success: boolean; provider: string; ref?: string; error?: string }> => {
        const isFb = platform === 'FACEBOOK';

        const reportData = {
          profileUrl: payload.targetUrl,
          platform: platform,
          impersonatedEntity: payload.impersonatedEntity || payload.domain,
          description: payload.evidence || `Impersonation on ${platform}`,
          evidenceUrls: payload.evidenceFiles || [],
          reporterName: payload.reporterName,
          reporterEmail: payload.reporterEmail,
          discoveredAt: item.createdAt?.toISOString() || new Date().toISOString(),
        };
        const draft = isFb ? generateFacebookReport(reportData) : generateInstagramReport(reportData);

        const emailResult = await dispatchLegalEmail({
          to: 'abuse@facebookmail.com',
          subject: isFb
            ? `[URGENT] [FB] Impersonation Report — ${payload.impersonatedEntity} [REF: META-FB-${Date.now().toString(36).toUpperCase()}]`
            : `[URGENT] [IG] Impersonation Report — ${payload.impersonatedEntity} [REF: META-IG-${Date.now().toString(36).toUpperCase()}]`,
          body: draft,
        });
        return { success: emailResult.success, provider: `${platform}_EMAIL`, ref: emailResult.messageId, error: emailResult.error };
      };

      if (!metaCfg?.config?.webhookUrl) {
        // No BRP configured — send enhanced email fallback
        return await sendMetaEmailFallback();
      }

      // ── Meta BRP API v19.0 — Better Rights Protection ──
      const brandId = metaCfg.config.webhookUrl;
      const token = metaCfg.config.apiKey || process.env.META_BRP_API_KEY || '';
      if (!token) {
        console.log(`[Meta BRP] API token not configured for brand ${brandId}. Falling back to email report.`);
        return await sendMetaEmailFallback();
      }

      // Map threat type to Meta BRP violation category
      const THREAT_MAP: Record<string, string> = {
        IMPERSONATION: 'IMPERSONATION',
        TRADEMARK: 'TRADEMARK_INFRINGEMENT',
        COPYRIGHT: 'COPYRIGHT_INFRINGEMENT',
        PHISHING: 'SCAM',
        MALWARE: 'MALICIOUS_SOFTWARE',
        FRAUD: 'FRAUD',
        COUNTERFEIT: 'COUNTERFEIT',
      };
      const reason = THREAT_MAP[item.threatType || 'IMPERSONATION'] || 'IMPERSONATION';

      const brpPayload: any = {
        profile_url: payload.targetUrl,
        reason,
        description: payload.evidence || `This profile is impersonating ${payload.impersonatedEntity}`,
        platform: platform.toLowerCase(),
      };

      // Attach evidence URLs if available
      if (payload.evidenceFiles && payload.evidenceFiles.length > 0) {
        brpPayload.evidence_urls = payload.evidenceFiles;
      }

      // Attach reporter info
      brpPayload.reporter_name = payload.reporterName;
      brpPayload.reporter_email = payload.reporterEmail;

      // ── Send to Meta BRP API with retry ──
      const url = `https://graph.facebook.com/v19.0/${brandId}/reports`;
      let lastError = '';

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const fetchRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(brpPayload),
            signal: AbortSignal.timeout(15000),
          });

          if (fetchRes.ok) {
            const metaData: any = await fetchRes.json();
            console.log(`[Meta BRP] Report submitted. Case ID: ${metaData.id}`);
            return { success: true, provider: 'META_BRP', ref: metaData.id || '' };
          }

          // Rate limited — retry
          if (fetchRes.status === 429) {
            const retryAfter = parseInt(fetchRes.headers.get('Retry-After') || '5', 10);
            console.log(`[Meta BRP] Rate limited. Retry after ${retryAfter}s (attempt ${attempt}/3)`);
            if (attempt < 3) {
              await new Promise(r => setTimeout(r, retryAfter * 1000));
              continue;
            }
          }

          const errBody = await fetchRes.text().catch(() => 'unknown error');
          lastError = `Meta API rejected (${fetchRes.status}): ${errBody.slice(0, 200)}`;

          // Non-retryable error — break
          if (fetchRes.status !== 429 && fetchRes.status !== 500 && fetchRes.status !== 503) {
            break;
          }
        } catch (fetchErr: any) {
          lastError = `Meta API unreachable (attempt ${attempt}/3): ${fetchErr.message}`;
          if (attempt < 3) {
            await new Promise(r => setTimeout(r, 3000));
            continue;
          }
        }
      }

      // ── BRP failed — fallback to enhanced email ──
      console.log(`[Meta BRP] API failed (${lastError}). Falling back to email report.`);
      return await sendMetaEmailFallback();
    }

    case 'TWITTER': {
      const res = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.TWITTER_API_KEY || 'placeholder'}` },
        body: JSON.stringify({ profile_url: payload.targetUrl, violation: 'impersonation', description: payload.evidence }),
      });
      return { success: res.ok, provider: 'TWITTER', ref: '', error: res.ok ? undefined : 'X API rejected' };
    }

    case 'LINKEDIN': {
      const res = await fetch('https://api.linkedin.com/v2/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.LINKEDIN_API_KEY || 'placeholder'}` },
        body: JSON.stringify({ target: payload.targetUrl, reason: 'fake_profile', notes: payload.evidence }),
      });
      return { success: res.ok, provider: 'LINKEDIN', ref: '', error: res.ok ? undefined : 'LinkedIn API rejected' };
    }

    default: {
      // Generic webhook / abuse email fallback
      const routing = detectRouting(item.platform);
      const draftData = {
        reporterName: payload.reporterName,
        reporterEmail: payload.reporterEmail,
        platform: item.socialPlatform || item.platform || 'Unknown',
        profileUrl: payload.targetUrl,
        impersonatedEntity: payload.impersonatedEntity || item.domain,
        threatType: item.threatType,
        discoveredAt: item.createdAt?.toISOString() || new Date().toISOString(),
        description: payload.evidence || 'No description.',
        evidenceUrls: payload.evidenceFiles,
        date: new Date().toISOString().split('T')[0],
      };
      const draft = routing.draft(draftData);
      const result = await dispatchLegalEmail({ to: 'abuse@platform.com', subject: `[SOAR] Takedown - ${payload.impersonatedEntity}`, body: draft });
      return { success: result.success, provider: platform, ref: result.messageId, error: result.error };
    }
  }
}

router.post('/:id/execute-one-click', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId || 'default';
    const analystId = (req as any).user?.userId || 'anonymous';
    const analystName = (req as any).user?.name || 'Unknown Analyst';
    const testEmail = req.query.test as string | undefined;

    const item = await TakedownRequest.findOne({ _id: req.params.id, tenantId });
    if (!item) { res.status(404).json({ error: 'NOT_FOUND' }); return; }

    // Fire email in background (async) to avoid gateway timeout
    const logEntry = {
      analystId, analystName, timestamp: new Date(),
      note: testEmail ? `[SOAR-TEST] Sending test email to ${testEmail}...` : `[SOAR] Executing via ${item.socialPlatform || item.platform}...`,
      previousStatus: item.status,
      newStatus: testEmail ? item.status : 'SUBMITTED',
    };

    dispatchOneClick(item, testEmail).then(result => {
      if (result.success && !testEmail) {
        const updateFields: Record<string, any> = {
          status: 'SUBMITTED', submittedAt: new Date(), responseRef: result.ref || '',
        };
        // Simpan kominfo dispatch ref jika provider adalah KOMINFO
        if (result.provider === 'KOMINFO' && result.ref) {
          updateFields.kominfoDispatchRef = result.ref;
        }
        TakedownRequest.findOneAndUpdate(
          { _id: req.params.id, tenantId },
          { $set: updateFields,
            $push: { analystLogs: { ...logEntry, note: `[SOAR] Auto-executed via ${result.provider}. Ref: ${result.ref || 'N/A'}` } } },
        ).catch((err: any) => console.error('[Takedown] Async SOAR status update error:', err?.message || err));
      } else if (testEmail) {
        TakedownRequest.findOneAndUpdate(
          { _id: req.params.id, tenantId },
          { $push: { analystLogs: { ...logEntry, note: result.success ? `[SOAR-TEST] Test email sent to ${testEmail}. Ref: ${result.ref || 'N/A'}` : `[SOAR-TEST] Failed: ${result.error}` } } },
        ).catch((err: any) => console.error('[Takedown] Async test email status update error:', err?.message || err));
      }
    }).catch((err: any) => console.error('[Takedown] Async dispatchOneClick error:', err?.message || err));

    if (!testEmail) {
      await TakedownRequest.findOneAndUpdate(
        { _id: req.params.id, tenantId },
        { $set: { status: 'SUBMITTED', submittedAt: new Date() }, $push: { analystLogs: logEntry } },
      );
    } else {
      await TakedownRequest.findOneAndUpdate(
        { _id: req.params.id, tenantId },
        { $push: { analystLogs: logEntry } },
      );
    }

    res.json({ message: testEmail ? `Test email is being sent to ${testEmail} (async)` : `One-click execution started (async)`, note: 'Email sending in background, check analyst logs for result' });
  } catch (err) {
    console.error('[Takedown] One-click error:', err);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to execute one-click takedown' });
  }
});

// ════════════════════════════════════════════════════════
//  POST /takedown/bulk-execute — One-click bulk SOAR execution
// ════════════════════════════════════════════════════════
const bulkExecuteSchema = z.object({ ids: z.array(z.string()).min(1, 'At least one ID is required'), testEmail: z.string().email().optional() });

router.post('/bulk-execute', async (req: Request, res: Response) => {
  try {
    const { ids, testEmail } = bulkExecuteSchema.parse(req.body);
    const tenantId = (req as any).user?.tenantId || 'default';
    const analystId = (req as any).user?.userId || 'anonymous';
    const analystName = (req as any).user?.name || 'Unknown Analyst';

    const items = await TakedownRequest.find({ _id: { $in: ids }, tenantId });
    const results: { id: string; success: boolean; provider?: string; error?: string }[] = [];

    for (const item of items) {
      try {
        const result = await dispatchOneClick(item, testEmail);
        if (result.success && !testEmail) {
          await TakedownRequest.findOneAndUpdate(
            { _id: item._id, tenantId },
            { $set: { status: 'SUBMITTED', submittedAt: new Date(), responseRef: result.ref || '' },
              $push: { analystLogs: { analystId, analystName, timestamp: new Date(), note: `[SOAR-BULK] Auto-executed via ${result.provider}`, previousStatus: item.status, newStatus: 'SUBMITTED' } } },
          );
        }
        results.push({ id: item._id.toString(), success: result.success, provider: result.provider, error: result.error });
      } catch (err: any) {
        results.push({ id: item._id.toString(), success: false, error: err.message });
      }
    }

    const succeeded = results.filter(r => r.success).length;
    res.json({ message: `Bulk execute: ${succeeded}/${results.length} succeeded`, results, totalRequested: ids.length });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'VALIDATION', details: err.errors }); return; }
    console.error('[Takedown] Bulk execute error:', err);
    res.status(500).json({ error: 'INTERNAL' });
  }
});

export default router;
