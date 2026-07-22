import { Router, Request, Response } from 'express';
import http from 'http';
import { config } from '../config';

const router: Router = Router();

/**
 * GET /api/v1/health
 * Standard health check — used by Railway load balancers.
 */
router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'api-gateway',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

/**
 * GET /api/v1/health/live
 * Kubernetes / Railway liveness probe.
 */
router.get('/live', (_req: Request, res: Response) => {
  res.status(200).end();
});

/**
 * GET /api/v1/health/ready
 * Readiness probe — pings the auth-service database as a canary.
 */
router.get('/ready', async (_req: Request, res: Response) => {
  const checks: Record<string, string> = {};

  // Ping auth-service readiness
  try {
    const result = await pingService(`${config.services.auth}/api/v1/health/ready`);
    checks.auth = result === 'connected' ? 'healthy' : 'degraded';
  } catch {
    checks.auth = 'unreachable';
  }

  const allHealthy = Object.values(checks).every((v) => v === 'healthy');
  res.status(allHealthy ? 200 : 503).json({
    ready: allHealthy,
    checks,
  });
});

/** Simple HTTP GET helper */
function pingService(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data).database || 'unknown');
          } catch {
            resolve('unknown');
          }
        });
      })
      .on('error', reject)
      .setTimeout(3000, function () {
        reject(new Error('timeout'));
      });
  });
}

export default router;
