import mongoose from 'mongoose';
import { config } from './index';

let isConnected = false;

export async function connectDatabase(): Promise<void> {
  if (isConnected) return;
  try {
    await mongoose.connect(config.mongodbUri);
    isConnected = true;
    console.log('[Intel] MongoDB connected');
  } catch (err) {
    console.error('[Intel] MongoDB connection error:', err);
    throw err;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log('[Intel] MongoDB disconnected');
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

/**
 * Count total documents across all intel collections.
 * Used by the dashboard/stats endpoint.
 */
export async function getDatabaseStats() {
  const db = mongoose.connection.db;
  if (!db) return null;

  const collections = await db.listCollections().toArray();
  const stats: Record<string, number> = {};

  for (const col of collections) {
    const count = await db.collection(col.name).countDocuments();
    stats[col.name] = count;
  }

  return stats;
}
