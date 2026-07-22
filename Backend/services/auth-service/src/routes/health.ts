import { Router, Request, Response } from 'express';
import { getPrisma } from '../config/database';

const prisma = getPrisma();
const router: Router = Router();

router.get('/', async (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'auth-service',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/v1/health/ready
 * Readiness probe — pings the PostgreSQL connection.
 */
router.get('/ready', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ready: true, database: 'connected' });
  } catch (err) {
    res.status(503).json({ ready: false, database: 'disconnected' });
  }
});

export default router;
