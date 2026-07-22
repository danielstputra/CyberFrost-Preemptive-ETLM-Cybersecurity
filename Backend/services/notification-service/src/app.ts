import helmet from 'helmet';
import express from 'express';
import { config } from './config';
import notifRouter from './routes/notifications';
import healthRouter from './routes/health';

const app: express.Express = express();

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(express.json({ limit: '1mb' }));

if (config.nodeEnv === 'development') {
  app.use((req, _res, next) => { console.log(`[Notify] ${req.method} ${req.path}`); next(); });
}

app.use('/api/v1/notifications', notifRouter);
app.use('/api/v1/health', healthRouter);

app.use((_req, res) => { res.status(404).json({ error: 'NOT_FOUND' }); });

export default app;
