import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

export const config = {
  port: parseInt(process.env.OSINT_SERVICE_PORT || '4004', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/cyfirma',

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  apiGateway: {
    url: process.env.API_GATEWAY_URL || 'http://localhost:4000',
  },

  puppeteer: {
    // Disable Puppeteer for dev — use simulated mode
    enabled: process.env.PUPPETEER_ENABLED === 'true',
    headless: true,
    executablePath: process.env.PUPPETEER_EXEC_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },

  scan: {
    // How many fake results to generate per scan
    batchSize: parseInt(process.env.OSINT_BATCH_SIZE || '8', 10),
  },
} as const;
