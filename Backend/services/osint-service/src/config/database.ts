import mongoose from 'mongoose';
import { config } from './index';

let isConnected = false;

export async function connectDatabase(): Promise<void> {
  if (isConnected) return;
  try {
    await mongoose.connect(config.mongodbUri);
    isConnected = true;
    console.log('[OSINT] MongoDB connected');
  } catch (err) {
    console.error('[OSINT] MongoDB connection error:', err);
    throw err;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log('[OSINT] MongoDB disconnected');
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
