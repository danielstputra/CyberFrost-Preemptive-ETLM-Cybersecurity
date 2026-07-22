import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

export const config = {
  port: parseInt(process.env.INTELLIGENCE_SERVICE_PORT || '4003', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/cyfirma',

  cron: {
    // Interval for the simulated threat-fetcher cron job.
    // Default: every 30 minutes. Use a string like "*/30 * * * *"
    fetchInterval: process.env.INTEL_CRON_INTERVAL || '*/30 * * * *',
    // How many fake records to insert per tick
    batchSize: parseInt(process.env.INTEL_BATCH_SIZE || '5', 10),
  },

  externalSources: {
    // In production these would be real API endpoints (NVD, AlienVault, etc.)
    nvdUrl: process.env.NVD_API_URL || 'https://services.nvd.nist.gov/rest/json/cves/2.0',
  },
} as const;
