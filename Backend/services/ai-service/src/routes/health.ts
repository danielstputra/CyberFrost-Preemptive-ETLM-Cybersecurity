import { Router } from 'express';
import { isDatabaseConnected } from '../config/database';

const router: Router = Router();

router.get('/', (_req, res) => {
  res.json({ status: 'healthy', service: 'ai-service', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

router.get('/ready', async (_req, res) => {
  const checks: Record<string, string> = { mongodb: isDatabaseConnected() ? 'connected' : 'disconnected' };
  const ready = Object.values(checks).every((v) => v === 'connected');
  res.status(ready ? 200 : 503).json({ ready, checks });
});

export default router;
