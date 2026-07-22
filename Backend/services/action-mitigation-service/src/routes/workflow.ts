import { Router, Request, Response } from 'express';

const router: Router = Router();

// GET /workflow — List workflows
router.get('/', async (_req: Request, res: Response) => {
  try {
    res.json({ data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } });
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL' });
  }
});

// POST /workflow — Trigger a workflow
router.post('/', async (req: Request, res: Response) => {
  try {
    const { type, target } = req.body;
    res.status(201).json({ message: 'Workflow triggered', type, target, status: 'RUNNING' });
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL' });
  }
});

export default router;
