import { Router } from 'express';
import { isDatabaseConnected } from '../config/database';
import { isRedisConnected } from '../queue/connection';

const router: Router = Router();

router.get('/', (_req, res) => {
  res.json({ status: 'healthy', service: 'action-mitigation-service', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

router.get('/ready', async (_req, res) => {
  const checks: Record<string, string> = { mongodb: isDatabaseConnected() ? 'connected' : 'disconnected' };
  try { checks.redis = (await isRedisConnected()) ? 'connected' : 'disconnected'; } catch { checks.redis = 'error'; }
  const ready = Object.values(checks).every(v => v === 'connected');
  res.status(ready ? 200 : 503).json({ ready, checks });
});

export default router;
