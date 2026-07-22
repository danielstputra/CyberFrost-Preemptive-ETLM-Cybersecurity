import { Router, Request, Response } from 'express';
import { isDatabaseConnected } from '../config/database';

const router: Router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'intelligence-service',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

router.get('/ready', async (_req: Request, res: Response) => {
  const checks = {
    mongodb: isDatabaseConnected() ? 'connected' : 'disconnected',
  };

  const ready = Object.values(checks).every((v) => v === 'connected');
  res.status(ready ? 200 : 503).json({ ready, checks });
});

export default router;
