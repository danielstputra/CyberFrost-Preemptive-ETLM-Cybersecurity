import express from 'express';
import { config } from './config';
import reportRouter from './routes/report';

const app: express.Express = express();

app.use(express.json({ limit: '10mb' }));

if (config.nodeEnv === 'development') {
  app.use((req, _res, next) => {
    console.log(`[Report] ${req.method} ${req.path}`);
    next();
  });
}

app.use('/api/v1/reports', reportRouter);
app.use('/api/v1/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'report-service', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'NOT_FOUND' });
});

const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`[Report Service] Running on http://0.0.0.0:${config.port}`);
});

// ── Graceful Shutdown ──
const shutdown = (signal: string) => {
  console.log(`[Report Service] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('[Report Service] Server closed.');
    process.exit(0);
  });
  // Force exit after 10s if graceful shutdown hangs
  setTimeout(() => { console.warn('[Report Service] Forced shutdown after timeout.'); process.exit(1); }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
