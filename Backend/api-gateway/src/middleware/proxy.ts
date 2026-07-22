import { createProxyMiddleware, RequestHandler } from 'http-proxy-middleware';
import { config } from '../config';

// ──────────────────────────────────────
// Service Registry
// ──────────────────────────────────────

const SERVICE_MAP: Record<string, { url: string; name: string; apiPrefix?: string }> = {
  auth: { url: config.services.auth, name: 'auth-service' },
  discovery: { url: config.services.discovery, name: 'discovery-service' },
  intelligence: { url: config.services.intelligence, name: 'intelligence-service' },
  osint: { url: config.services.osint, name: 'osint-service' },
  notification: { url: config.services.notification, name: 'notification-service', apiPrefix: 'notifications' },
  'action-mitigation': { url: config.services.actionMitigation, name: 'action-mitigation-service', apiPrefix: 'action' },
  ai: { url: config.services.ai, name: 'ai-service', apiPrefix: 'ai' },
  report: { url: config.services.report, name: 'report-service', apiPrefix: 'reports' },
};

// ──────────────────────────────────────
// Proxy Factory
// ──────────────────────────────────────

/**
 * Creates a reverse-proxy handler that forwards requests from the API Gateway
 * to the target microservice.
 *
 * Path rewrite rule:
 *   Express mounts the proxy at `/api/v1/{service}`,
 *   strips that prefix, and then we prepend it back via pathRewrite
 *   so the target service receives the full path it registered.
 *
 * Example:
 *   Gateway receives:  POST /api/v1/auth/register
 *   Express strips:    /auth  →  req.url = "/register"
 *   pathRewrite adds:  /api/v1/auth/  back
 *   Final target:      http://auth-service:4001/api/v1/auth/register   ✓
 */
export const createServiceProxy = (serviceName: string, rewritePrefix?: string): RequestHandler => {
  const svc = SERVICE_MAP[serviceName];

  if (!svc) {
    throw new Error(`[Proxy] Unknown service "${serviceName}". Valid: ${Object.keys(SERVICE_MAP).join(', ')}`);
  }

  const defaultPrefix = svc.apiPrefix || serviceName;

  return createProxyMiddleware({
    target: svc.url,
    changeOrigin: true,

    // Restore the path prefix that Express strips
    // rewritePrefix override digunakan untuk route yang perlu path berbeda
    pathRewrite: {
      '^/': rewritePrefix || `/api/v1/${defaultPrefix}/`,
    },

    on: {
      // ── Log each proxied request & re-attach body ──
      proxyReq: (_proxyReq, req, _res) => {
        console.log(
          `[Gateway → ${svc.name}] ${req.method} ${(req as any).originalUrl}`,
        );
      },

      // ── Handle proxy errors gracefully ──
      error: (err, _req, res) => {
        console.error(`[Proxy] ${svc.name} error: ${err.message}`);
        const res_ = res as unknown as import('http').ServerResponse;
        if (!res_.headersSent) {
          res_.writeHead(502, { 'Content-Type': 'application/json' });
          res_.end(JSON.stringify({
              error: 'SERVICE_UNAVAILABLE',
              message: `${svc.name} is currently unavailable. Please try again later.`,
            }));
        }
      },
    },

    // Timeouts
    timeout: 30_000,
    proxyTimeout: 30_000,
  });
};
