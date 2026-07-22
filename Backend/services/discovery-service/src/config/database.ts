import mongoose from 'mongoose';
import { config } from './index';

let isConnected = false;

/**
 * Connect (or reuse) the MongoDB connection.
 * Called once at startup — subsequent calls are no-ops.
 */
export async function connectDatabase(): Promise<void> {
  if (isConnected) return;

  try {
    await mongoose.connect(config.mongodbUri);
    isConnected = true;
    console.log('[Discovery] MongoDB connected');
  } catch (err) {
    console.error('[Discovery] MongoDB connection error:', err);
    throw err;
  }
}

/**
 * Gracefully disconnect — used during shutdown.
 */
export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log('[Discovery] MongoDB disconnected');
}

/**
 * Check if the database connection is alive.
 */
export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
