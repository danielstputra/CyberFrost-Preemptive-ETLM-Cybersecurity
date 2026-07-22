import express from 'express';
import helmet from 'helmet';
import { config } from './config';
import { createLogger } from '@cyfirma/shared';
import authRouter from './routes/auth';
import twofaRouter from './routes/twofa';
import tokensRouter from './routes/tokens';
import healthRouter from './routes/health';

const app: express.Express = express();
const log = createLogger({ serviceName: 'auth-service' });

// Trust proxy — diperlukan untuk rate limiter di belakang reverse proxy
app.set('trust proxy', true);

// ── Security Headers ──
app.use(helmet({
  contentSecurityPolicy: false, // Nonaktifkan CSP — API server
  crossOriginEmbedderPolicy: false,
}));

// ── Middleware ──
app.use(express.json({ limit: '1mb' }));

if (config.nodeEnv === 'development') {
  app.use((req, _res, next) => {
    log.info({ method: req.method, path: req.path }, 'incoming request');
    next();
  });
}

// ── Routes ──
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/auth/2fa', twofaRouter);
app.use('/api/v1/auth/tokens', tokensRouter);
app.use('/api/v1/auth/sessions', tokensRouter);
app.use('/api/v1/health', healthRouter);

// ── 404 ──
app.use((_req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', message: 'Route not found' });
});

export default app;
