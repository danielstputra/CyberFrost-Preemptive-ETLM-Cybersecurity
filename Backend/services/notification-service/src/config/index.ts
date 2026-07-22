import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

export const config = {
  port: parseInt(process.env.NOTIFICATION_SERVICE_PORT || '4005', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/cyfirma',

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  apiGateway: {
    url: process.env.API_GATEWAY_URL || `http://localhost:${process.env.PORT || 4000}`,
    // Internal service key for Socket.io auth
    serviceKey: process.env.NOTIFICATION_SERVICE_KEY || '',
  },

  smtp: {
    host: process.env.SMTP_HOST || 'smtp.resend.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    fromEmail: process.env.SMTP_FROM_EMAIL || 'danielstputra@gmail.com',
  },

  // Email recipients for critical alerts
  adminEmails: (process.env.ADMIN_EMAILS || 'ciso@company.com').split(','),

  // Which severity levels trigger email
  emailThreshold: (process.env.EMAIL_THRESHOLD || 'HIGH') as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
} as const;
