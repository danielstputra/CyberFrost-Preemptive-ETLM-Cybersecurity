import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

export const config = {
  port: parseInt(process.env.AI_SERVICE_PORT || '4007', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/cyberfrost_ai',

  gemini: {
    apiKey: (process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || ''),
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  },
} as const;
