import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { globalRateLimiter } from './middleware/rateLimit';
import apiRouter from './routes';
import { swaggerSpec, swaggerUiOptions } from './config/swagger';

// ──────────────────────────────────────
// Express Application
// ──────────────────────────────────────

const app: express.Express = express();

// ── Trust proxy (Railway / reverse proxy) ──
app.set('trust proxy', 1);

// ── Security headers ──
app.use(helmet());

// ── CORS ──
app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ── Root health check (BEFORE rate limiter — Railway pings this frequently) ──
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// ── Swagger UI (before rate limiter — dokumentasi harus bisa diakses) ──
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// ── Global rate limiter ──
app.use(globalRateLimiter);

// ── Request logging ──
if (config.nodeEnv === 'development') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ── API Routes ──
app.use('/api/v1', apiRouter);

// ── JSON spec endpoint ──
app.get('/api/v1/docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(swaggerSpec);
});

// ── 404 handler ──
app.use((_req, res) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: 'The requested resource does not exist.',
  });
});

export default app;
