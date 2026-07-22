import app from './app';
import { config } from './config';
import { getPrisma, replacePrisma } from './config/database';

async function connectWithFallback(): Promise<void> {
  const prisma = getPrisma();

  // Try primary database (Railway)
  try {
    await prisma.$connect();
    console.log('[Auth] PostgreSQL connected (Railway)');
    return;
  } catch (err) {
    console.warn('[Auth] Primary database unreachable, trying fallback (Neon)...');
  }

  // Try fallback database (Neon)
  if (config.databaseUrlFallback) {
    try {
      const fallbackPrisma = replacePrisma(config.databaseUrlFallback);
      await fallbackPrisma.$connect();
      console.log('[Auth] PostgreSQL connected via fallback (Neon)');
      return;
    } catch (fallbackErr) {
      console.error('[Auth] Fallback database also unreachable:', fallbackErr);
    }
  }

  console.error('[Auth] All database connections failed. Exiting.');
  process.exit(1);
}

async function main() {
  await connectWithFallback();

  // ── Start server ──
  app.listen(config.port, '0.0.0.0', () => {
    console.log(`[Auth Service] Running on http://0.0.0.0:${config.port}`);
  });
}

main().catch((err) => {
  console.error('[Auth] Fatal error:', err);
  process.exit(1);
});

// ── Graceful shutdown ──
process.on('SIGTERM', async () => {
  await getPrisma().$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await getPrisma().$disconnect();
  process.exit(0);
});
