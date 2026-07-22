import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  corsOrigins: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
  },

  services: {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:4001',
    discovery: process.env.DISCOVERY_SERVICE_URL || 'http://localhost:4002',
    intelligence: process.env.INTELLIGENCE_SERVICE_URL || 'http://localhost:4003',
    osint: process.env.OSINT_SERVICE_URL || 'http://localhost:4004',
    notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4005',
    actionMitigation: process.env.ACTION_MITIGATION_SERVICE_URL || 'http://localhost:4006',
    ai: process.env.AI_SERVICE_URL || 'http://localhost:4007',
    report: process.env.REPORT_SERVICE_URL || 'http://localhost:4008',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  },
} as const;
