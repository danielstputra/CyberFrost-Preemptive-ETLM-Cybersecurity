import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

export const config = {
  port: parseInt(process.env.ACTION_MITIGATION_PORT || '4006', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/cyfirma',

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // Google Safe Browsing API (verifikasi URL phishing)
  googleSafeBrowsing: {
    apiKey: process.env.GSB_API_KEY || '',
    apiUrl: 'https://safebrowsing.googleapis.com/v4/threatMatches:find',
  },

  // PhishTank API (submit URL phishing)
  phishTank: {
    apiKey: process.env.PHISHTANK_API_KEY || '',
    apiUrl: 'https://checkurl.phishtank.com/checkurl/',
  },

  // Cloudflare API (firewall WAF rules)
  cloudflare: {
    apiToken: process.env.CF_API_TOKEN || '',
    zoneId: process.env.CF_ZONE_ID || '',
    email: process.env.CF_EMAIL || '',
    apiUrl: 'https://api.cloudflare.com/client/v4',
  },

  // JWT secret — dibaca dari env, fallback development hanya
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',

  // Abuse email config
  abuseEmail: {
    fromEmail: process.env.ABUSE_FROM_EMAIL || 'abuse@cyberfrost.vercel.app',
    ccEmails: (process.env.ABUSE_CC_EMAILS || '').split(',').filter(Boolean),
  },
} as const;
