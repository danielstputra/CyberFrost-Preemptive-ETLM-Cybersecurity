import helmet from 'helmet';
import express from 'express';
import { config } from './config';
import { createLogger } from '@cyfirma/shared';
import intelRouter from './routes/intelligence';
import threatActorRouter from './routes/threat-actors';
import searchRouter from './routes/search';
import threatScoreRouter from './routes/threat-score';
import iocsRouter from './routes/iocs';
import huntingRouter from './routes/hunting';
import healthRouter from './routes/health';

const app: express.Express = express();
const log = createLogger({ serviceName: 'intelligence-service' });

// ── Middleware ──
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(express.json({ limit: '5mb' }));

if (config.nodeEnv === 'development') {
  app.use((req, _res, next) => {
    log.info({ method: req.method, path: req.path }, 'incoming request');
    next();
  });
}

// ── Routes ──
app.use('/api/v1/intelligence', intelRouter);
app.use('/api/v1/intelligence', threatScoreRouter);  // /threat-scores/*
app.use('/api/v1/intelligence', iocsRouter);          // /iocs/*
app.use('/api/v1/intelligence', huntingRouter);        // /hunting/*
app.use('/api/v1/intelligence/threat-actors', threatActorRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/health', healthRouter);

// ── 404 ──
app.use((_req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', message: 'Route not found' });
});

export default app;
