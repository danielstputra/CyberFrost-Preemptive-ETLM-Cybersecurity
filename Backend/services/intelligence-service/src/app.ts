import helmet from 'helmet';
import express from 'express';
import { config } from './config';
import intelRouter from './routes/intelligence';
import threatActorRouter from './routes/threat-actors';
import searchRouter from './routes/search';
import healthRouter from './routes/health';

const app: express.Express = express();

// ── Middleware ──
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(express.json({ limit: '5mb' }));

if (config.nodeEnv === 'development') {
  app.use((req, _res, next) => {
    console.log(`[Intel] ${req.method} ${req.path}`);
    next();
  });
}

// ── Routes ──
app.use('/api/v1/intelligence', intelRouter);
app.use('/api/v1/intelligence/threat-actors', threatActorRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/health', healthRouter);

// ── 404 ──
app.use((_req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', message: 'Route not found' });
});

export default app;
