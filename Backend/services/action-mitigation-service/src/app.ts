import helmet from 'helmet';
import express from 'express';
import { config } from './config';
import { requireAuth } from './middleware/auth-guard';
import takedownRouter from './routes/takedown';
import mitigationRouter from './routes/mitigation';
import ticketRouter from './routes/ticket';
import webhookRouter from './routes/webhook';
import workflowRouter from './routes/workflow';
import integrationRouter from './routes/integration';
import socRouter from './routes/soc';
import healthRouter from './routes/health';

const app: express.Express = express();

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(express.json({ limit: '1mb' }));

if (config.nodeEnv === 'development') {
  app.use((req, _res, next) => { console.log(`[Mitigation] ${req.method} ${req.path}`); next(); });
}

// ── Auth middleware — defense-in-depth, applied to all API routes ──
const authMw = requireAuth(config.jwtSecret);

app.use('/api/v1/action/takedown', authMw, takedownRouter);
app.use('/api/v1/action/mitigation', authMw, mitigationRouter);
app.use('/api/v1/action/ticket', authMw, ticketRouter);
app.use('/api/v1/action/webhook', authMw, webhookRouter);
app.use('/api/v1/action/workflow', authMw, workflowRouter);
app.use('/api/v1/action/integration', authMw, integrationRouter);
app.use('/api/v1/action/soc', authMw, socRouter);
app.use('/api/v1/health', healthRouter);

app.use((_req, res) => { res.status(404).json({ error: 'NOT_FOUND' }); });

export default app;
