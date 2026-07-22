import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'dev-secret-change-in-production') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '[FATAL] JWT_SECRET environment variable is not set or is still the default value. ' +
        'Set a strong, unique secret in production. Server will not start.'
      );
    }
    console.warn('[WARN] JWT_SECRET is using the default development value. Set a strong secret for production.');
    return 'dev-secret-change-in-production';
  }
  return secret;
}

export const config = {
  port: parseInt(process.env.AUTH_SERVICE_PORT || '4001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.AUTH_DATABASE_URL || 'postgresql://localhost:5432/cyberfrost_auth',
  databaseUrlFallback: process.env.AUTH_DATABASE_URL_FALLBACK,

  jwt: {
    secret: getJwtSecret(),
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: '7d',
  },

  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
  },
} as const;
