import { Router } from 'express';
import healthRouter from './health';
import { authenticateJWT } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimit';
import { createServiceProxy } from '../middleware/proxy';

const apiRouter: Router = Router();

// ──────────────────────────────────────
//  PUBLIC ROUTES
// ──────────────────────────────────────

apiRouter.use('/health', healthRouter);

// ──────────────────────────────────────
//  AUTH ROUTES  (rate-limited, no JWT required at gateway level)
//  → proxied to auth-service:4001/api/v1/auth/*
// ──────────────────────────────────────
//  POST  /auth/register   → auth-service   (register new tenant + admin user)
//  POST  /auth/login      → auth-service   (login, get JWT)
//  POST  /auth/refresh    → auth-service   (exchange refresh token)
//  GET   /auth/me         → auth-service   (current user — service validates its own JWT)
//  POST  /auth/logout     → auth-service   (invalidate refresh token)
// ──────────────────────────────────────
apiRouter.use('/auth', authRateLimiter, createServiceProxy('auth'));

// ──────────────────────────────────────
//  PROTECTED SERVICE ROUTES  (JWT required at gateway)
// ──────────────────────────────────────
//  POST /discovery/scan            → Start domain scan (queued via BullMQ)
//  GET  /discovery/scan/:jobId     → Get scan status
//  GET  /discovery/scans           → List all scans
//  GET  /discovery/domains         → List discovered assets
//  GET  /discovery/domains/:id     → Get domain details
// ──────────────────────────────────────
apiRouter.use('/discovery',     authenticateJWT, createServiceProxy('discovery'));

// ──────────────────────────────────────
//  GET  /intelligence/vulnerabilities       → List CVE (pagination + severity filter)
//  GET  /intelligence/vulnerabilities/:id   → CVE detail
//  PATCH /intelligence/vulnerabilities/:id/status → Update CVE status
//  GET  /intelligence/threats               → List threat intel
//  GET  /intelligence/threats/:id           → Threat detail (+IOCs)
//  GET  /intelligence/dashboard             → Summary stats
// ──────────────────────────────────────
apiRouter.use('/search',        authenticateJWT, createServiceProxy('intelligence', '/api/v1/intelligence/search/'));
apiRouter.use('/intelligence',  authenticateJWT, createServiceProxy('intelligence'));

// ──────────────────────────────────────
//  POST /osint/scan                  → Trigger OSINT scan (dark web, pastebin, typo-squat)
//  GET  /osint/scan/:jobId           → Scan status
//  GET  /osint/scans                 → List scans
//  GET  /osint/leaks                 → Dark web leaks list
//  GET  /osint/leaks/:id             → Leak detail
//  PATCH /osint/leaks/:id/status     → Update leak status
//  GET  /osint/exposures             → Brand exposures list
//  GET  /osint/exposures/:id         → Exposure detail
//  PATCH /osint/exposures/:id/status → Update exposure status
//  GET  /osint/dashboard             → Summary stats
// ──────────────────────────────────────
apiRouter.use('/osint',         authenticateJWT, createServiceProxy('osint'));

// ──────────────────────────────────────
//  GET  /notifications              → List notifications
//  GET  /notifications/unread-count → Unread counts
//  PATCH /notifications/:id/read    → Mark as read
//  POST /notifications/read-all     → Mark all as read
//  POST /notifications/send-test    → Send test notification
// ──────────────────────────────────────
apiRouter.use('/notifications', authenticateJWT, createServiceProxy('notification'));

// ──────────────────────────────────────
//  POST /action/takedown              → Submit phishing takedown request
//  GET  /action/takedown              → List takedown requests
//  PATCH /action/takedown/:id/status  → Update takedown status
//  POST /action/takedown/generate-email → Generate abuse email template
//  GET  /action/mitigation            → List mitigation actions
//  POST /action/mitigation/block      → Manually block IP/domain
//  PATCH /action/mitigation/:id/status → Update mitigation status
//  GET  /action/mitigation/stats/overview → Mitigation stats
// ──────────────────────────────────────
apiRouter.use('/action', authenticateJWT, createServiceProxy('action-mitigation'));

// ──────────────────────────────────────
//  POST /ai/generate              → Generate AI insight (summary, scenario, rule)
//  POST /ai/summarize             → Summarize text
//  GET  /ai/insights              → List AI insights
//  GET  /ai/insights/:id          → Get insight detail
// ──────────────────────────────────────
apiRouter.use('/ai', authenticateJWT, createServiceProxy('ai'));

// ──────────────────────────────────────
//  POST /reports/generate         → Generate PDF security report
//  GET  /reports/health           → Report service health
// ──────────────────────────────────────
apiRouter.use('/reports', authenticateJWT, createServiceProxy('report'));

export default apiRouter;
