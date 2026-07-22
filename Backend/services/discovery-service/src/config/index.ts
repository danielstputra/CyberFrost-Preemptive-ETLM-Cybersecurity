import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

export const config = {
  port: parseInt(process.env.DISCOVERY_SERVICE_PORT || '4002', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/cyfirma',

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  apiGateway: {
    url: process.env.API_GATEWAY_URL || 'http://localhost:4000',
  },

  scan: {
    // How many subdomains to check in parallel
    concurrency: 10,
    // Simulated delay per subdomain check (ms)
    subdomainDelayMs: 150,
    // Simulated port scan delay per port (ms)
    portScanDelayMs: 50,
  },
} as const;
