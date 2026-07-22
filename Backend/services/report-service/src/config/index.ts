import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

export const config = {
  port: parseInt(process.env.REPORT_SERVICE_PORT || '4008', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
} as const;
