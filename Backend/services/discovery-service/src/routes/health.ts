import { Router, Request, Response } from 'express';
import { isDatabaseConnected } from '../config/database';
import { isRedisConnected, getRedisError } from '../queue';

const router: Router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'discovery-service',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * Readiness probe — checks MongoDB + Redis connectivity.
 */
router.get('/ready', async (_req: Request, res: Response) => {
  const checks: Record<string, string> = {};

  // Check MongoDB
  checks.mongodb = isDatabaseConnected() ? 'connected' : 'disconnected';

  // Check Redis (fault-tolerant)
  try {
    const redisOk = await isRedisConnected();
    checks.redis = redisOk ? 'connected' : 'disconnected';
    if (!redisOk) {
      const err = getRedisError();
      if (err) checks.redis = `error: ${err}`;
    }
  } catch (err) {
    checks.redis = `error: ${(err as Error).message}`;
  }

  const allHealthy = Object.values(checks).every((v) => v === 'connected');
  res.status(allHealthy ? 200 : 503).json({
    ready: allHealthy,
    checks,
  });
});

export default router;
