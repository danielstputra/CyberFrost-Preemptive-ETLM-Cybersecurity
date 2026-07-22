import express from 'express';
import { config } from './config';
import { connectDatabase, disconnectDatabase } from './config/database';
import aiRouter from './routes/ai';
import healthRouter from './routes/health';

const app = express();
app.use(express.json({ limit: '5mb' }));

if (config.nodeEnv === 'development') {
  app.use((req, _res, next) => { console.log(`[AI] ${req.method} ${req.path}`); next(); });
}

app.use('/api/v1/health', healthRouter);
app.use('/api/v1/ai', aiRouter);

app.use((_req, res) => res.status(404).json({ error: 'NOT_FOUND' }));

async function main() {
  await connectDatabase();
  app.listen(config.port, '0.0.0.0', () => console.log(`[AI Service] Running on http://0.0.0.0:${config.port}`));

  const shutdown = async (signal: string) => {
    console.log(`\n[AI] ${signal}. Shutting down...`);
    await disconnectDatabase();
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => { console.error('[AI] Fatal:', err); process.exit(1); });
