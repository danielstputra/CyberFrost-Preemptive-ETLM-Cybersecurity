/**
 * 2FA Routes — TOTP-based (Google/Microsoft Authenticator)
 * =========================================================
 * - setup  : Generate secret + QR code URL
 * - verify  : Confirm setup with TOTP code → enable 2FA
 * - disable : Turn off 2FA (requires current password)
 * - authenticate : Verify TOTP code after login
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import * as otplib from 'otplib';
import * as QRCode from 'qrcode';

// Window 2 steps (±60 detik) toleransi time drift antara server dan authenticator app
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { getPrisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import { createLogger, sendZodError, apiError } from '@cyfirma/shared';

const router: Router = Router();
const prisma = getPrisma();
const log = createLogger({ serviceName: 'auth-service' });

// ══════════════════════════════════════════════════════
//  POST /2fa/setup — Generate secret + QR code
// ══════════════════════════════════════════════════════
/**
 * @openapi
 * /auth/2fa/setup:
 *   post:
 *     tags: [2FA]
 *     summary: Setup 2FA — generate secret + QR code
 *     description: Menghasilkan TOTP secret dan QR code untuk Google/Microsoft Authenticator. Wajib login.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Secret + QR code (data URL) + manual entry key
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 secret:    { type: string, example: "JBSWY3DPEHPK3PXP" }
 *                 qrCode:    { type: string, format: data-url }
 *                 manualKey: { type: string, example: "JBSW Y3DP EHPK 3PXP" }
 *       400:
 *         description: 2FA already enabled
 */
router.post('/setup', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true, totpSecret: true, totpEnabled: true } });
    if (!user) { res.status(404).json({ error: 'NOT_FOUND' }); return; }
    if (user.totpEnabled) { res.status(400).json({ error: '2FA_ALREADY_ENABLED', message: '2FA is already enabled. Disable it first to reconfigure.' }); return; }

    // Generate secret
    const secret = otplib.generateSecret();
    const serviceName = 'CyberFrost Security';

    // Save secret temporarily (not enabled yet — wait for verification)
    await prisma.user.update({ where: { id: userId }, data: { totpSecret: secret } });

    // Generate otpauth URL
    const otpauth = otplib.generateURI({ label: user.email, secret, issuer: serviceName });

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

    res.json({
      secret,
      qrCode: qrCodeDataUrl,
      otpauth,
      manualKey: secret.match(/.{1,4}/g)?.join(' ') || secret,
    });
  } catch (err) {
    log.error({ err }, '2FA setup failed');
    res.status(500).json(apiError('INTERNAL', 'Failed to setup 2FA.'));
  }
});

// ══════════════════════════════════════════════════════
//  POST /2fa/verify — Confirm setup & enable 2FA
// ══════════════════════════════════════════════════════

const verifySchema = z.object({
  token: z.string().min(6, 'Token must be 6 digits').max(6),
});

router.post('/verify', authenticate, async (req: Request, res: Response) => {
  try {
    const { token } = verifySchema.parse(req.body);
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { totpSecret: true, totpEnabled: true } });
    if (!user || !user.totpSecret) { res.status(400).json({ error: 'NO_SECRET', message: 'Run /2fa/setup first to generate a secret.' }); return; }
    if (user.totpEnabled) { res.status(400).json({ error: 'ALREADY_ENABLED', message: '2FA is already enabled.' }); return; }

    const isValid = await otplib.verify({ token, secret: user.totpSecret, window: 2 } as any);
    if (!isValid?.valid) { res.status(400).json({ error: 'INVALID_TOKEN', message: 'Invalid code. Try again or resync your authenticator app.' }); return; }

    await prisma.user.update({ where: { id: userId }, data: { totpEnabled: true } });

    res.json({ message: '2FA enabled successfully.' });
  } catch (err) {
    if (sendZodError(res, err)) return;
    log.error({ err }, '2FA verify failed');
    res.status(500).json(apiError('INTERNAL', 'Failed to verify 2FA.'));
  }
});

// ══════════════════════════════════════════════════════
//  POST /2fa/disable — Turn off 2FA (needs password)
// ══════════════════════════════════════════════════════

const disableSchema = z.object({
  password: z.string().min(1, 'Current password is required'),
});

router.post('/disable', authenticate, async (req: Request, res: Response) => {
  try {
    const { password } = disableSchema.parse(req.body);
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true, totpEnabled: true } });
    if (!user) { res.status(404).json({ error: 'NOT_FOUND' }); return; }
    if (!user.totpEnabled) { res.status(400).json({ error: '2FA_NOT_ENABLED', message: '2FA is not enabled.' }); return; }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) { res.status(401).json({ error: 'WRONG_PASSWORD', message: 'Password is incorrect.' }); return; }

    await prisma.user.update({ where: { id: userId }, data: { totpSecret: null, totpEnabled: false } });

    res.json({ message: '2FA disabled successfully.' });
  } catch (err) {
    if (sendZodError(res, err)) return;
    log.error({ err }, '2FA disable failed');
    res.status(500).json(apiError('INTERNAL', 'Failed to disable 2FA.'));
  }
});

// ══════════════════════════════════════════════════════
//  POST /2fa/status — Check 2FA status
// ══════════════════════════════════════════════════════

router.get('/status', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { totpEnabled: true } });
    res.json({ totpEnabled: user?.totpEnabled || false });
  } catch { res.status(500).json({ error: 'INTERNAL' }); }
});

// ══════════════════════════════════════════════════════
//  POST /2fa/authenticate — Verify TOTP after login
//  Returns JWT pair on success
// ══════════════════════════════════════════════════════
/**
 * @openapi
 * /auth/2fa/authenticate:
 *   post:
 *     tags: [2FA]
 *     summary: Complete 2FA login — verify TOTP code
 *     description: |
 *       Setelah login biasa (yang mengembalikan `requires2fa: true`), panggil endpoint ini
 *       dengan `userId` dari response login + 6-digit TOTP code dari Authenticator app.
 *       Mengembalikan JWT pair yang lengkap.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, token]
 *             properties:
 *               userId: { type: string, example: "clx..." }
 *               token:  { type: string, minLength: 6, maxLength: 6, example: "482901" }
 *     responses:
 *       200:
 *         description: 2FA valid — returns accessToken + refreshToken
 *       401:
 *         description: Invalid 2FA code / tenant inactive
 */
const authSchema = z.object({
  userId: z.string().min(1),
  token: z.string().min(6).max(6),
});

router.post('/authenticate', async (req: Request, res: Response) => {
  try {
    const { userId, token } = authSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, totpSecret: true, totpEnabled: true, role: true, tenantId: true, tenant: { select: { isActive: true } } } });
    if (!user || !user.totpEnabled || !user.totpSecret) { res.status(401).json({ error: '2FA_NOT_CONFIGURED' }); return; }
    if (!user.tenant?.isActive) { res.status(401).json({ error: 'TENANT_INACTIVE' }); return; }

    const result = await otplib.verify({ token, secret: user.totpSecret, window: 2 } as any);
    if (!result?.valid) { res.status(401).json({ error: 'INVALID_2FA', message: 'Invalid 2FA code.' }); return; }

    // Generate JWT
    const payload = { userId: user.id, tenantId: user.tenantId!, role: user.role };
    const accessToken = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn as any });
    const refreshToken = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.refreshExpiresIn as any });

    res.json({ accessToken, refreshToken });
  } catch (err) {
    if (sendZodError(res, err)) return;
    log.error({ err }, '2FA authenticate failed');
    res.status(500).json(apiError('INTERNAL', '2FA authentication failed.'));
  }
});

export default router;
