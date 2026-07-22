import helmet from 'helmet';
import express from 'express';
import { config } from './config';
import discoveryRouter from './routes/discovery';
import easmRouter from './routes/easm';
import healthRouter from './routes/health';

const app: express.Express = express();

// ── Middleware ──
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(express.json({ limit: '5mb' }));

if (config.nodeEnv === 'development') {
  app.use((req, _res, next) => {
    console.log(`[Discovery] ${req.method} ${req.path}`);
    next();
  });
}

// ── Routes ──
app.use('/api/v1/discovery', discoveryRouter);
app.use('/api/v1/discovery/easm', easmRouter);
app.use('/api/v1/health', healthRouter);

// ── 404 ──
app.use((_req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', message: 'Route not found' });
});

export default app;
