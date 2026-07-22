import helmet from 'helmet';
import express from 'express';
import { config } from './config';
import osintRouter from './routes/osint';
import executiveRouter from './routes/executive';
import tprmRouter from './routes/tprm';
import healthRouter from './routes/health';

const app: express.Express = express();

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(express.json({ limit: '10mb' }));

if (config.nodeEnv === 'development') {
  app.use((req, _res, next) => { console.log(`[OSINT] ${req.method} ${req.path}`); next(); });
}

app.use('/api/v1/osint', osintRouter);
app.use('/api/v1/osint/executive', executiveRouter);
app.use('/api/v1/tprm', tprmRouter);
app.use('/api/v1/health', healthRouter);

app.use((_req, res) => { res.status(404).json({ error: 'NOT_FOUND', message: 'Route not found' }); });

export default app;
