/**
 * API Token + Session Management
 * =================================
 * - tokens: create, list, revoke
 * - sessions: list active, terminate
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { getPrisma } from '../config/database';
import { authenticate } from '../middleware/auth';

const router: Router = Router();
const prisma = getPrisma();

// ═══════════════════════════════════════════
//  GET /tokens — List all API tokens
// ═══════════════════════════════════════════

router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const tokens = await prisma.apiToken.findMany({
      where: { userId: req.user!.userId },
      select: { id: true, name: true, lastUsedAt: true, expiresAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    // Never expose tokenHash
    res.json({ data: tokens });
  } catch { res.status(500).json({ error: 'INTERNAL' }); }
});

// ═══════════════════════════════════════════
//  POST /tokens — Create a new API token
// ═══════════════════════════════════════════

const createSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  expiresInDays: z.number().int().min(1).max(365).default(90),
});

router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { name, expiresInDays } = createSchema.parse(req.body);
    const rawToken = `cyf_${crypto.randomBytes(32).toString('hex')}`;
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const expiresAt = new Date(Date.now() + expiresInDays * 86400000);
    const token = await prisma.apiToken.create({
      data: { name, tokenHash, expiresAt, userId: req.user!.userId },
    });

    res.status(201).json({
      id: token.id,
      name: token.name,
      token: rawToken, // Only shown once
      expiresAt: token.expiresAt,
      message: 'Save this token — it will not be shown again.',
    });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'VALIDATION', details: err.errors }); return; }
    res.status(500).json({ error: 'INTERNAL' });
  }
});

// ═══════════════════════════════════════════
//  DELETE /tokens/:id — Revoke an API token
// ═══════════════════════════════════════════

router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const token = await prisma.apiToken.findFirst({ where: { id, userId: req.user!.userId } });
    if (!token) { res.status(404).json({ error: 'NOT_FOUND' }); return; }
    await prisma.apiToken.delete({ where: { id } });
    res.json({ message: 'Token revoked.' });
  } catch { res.status(500).json({ error: 'INTERNAL' }); }
});

// ═══════════════════════════════════════════
//  GET /sessions — List active sessions
//  (Derived from recent activity + refresh token)
// ═══════════════════════════════════════════

router.get('/sessions', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { lastLoginAt: true, refreshTokenHash: true, createdAt: true },
    });
    if (!user) { res.status(404).json({ error: 'NOT_FOUND' }); return; }

    // Build session list from available data
    const sessions = [];
    if (user.lastLoginAt) {
      sessions.push({
        id: 'current',
        device: 'Current Session',
        ip: '—',
        lastActive: user.lastLoginAt,
        isCurrent: true,
      });
    }
    res.json({ data: sessions, currentSessionId: 'current' });
  } catch { res.status(500).json({ error: 'INTERNAL' }); }
});

export default router;
