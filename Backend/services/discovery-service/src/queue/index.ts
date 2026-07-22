import { Queue, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config';

// ──────────────────────────────────────
//  Redis Connection (fault-tolerant)
// ──────────────────────────────────────

let _redis: IORedis | null = null;
let _redisError: string | null = null;

/**
 * Get or create the shared Redis connection.
 * If Redis is unavailable, we don't crash — we just mark it as errored.
 */
export function getRedis(): IORedis {
  if (!_redis) {
    _redis = new IORedis(config.redis.url, {
      maxRetriesPerRequest: null,
      // Allow queueing commands while disconnected
      enableOfflineQueue: true,
      // Quick reconnect
      retryStrategy: (times) => {
        if (times > 10) {
          _redisError = `Redis unreachable after ${times} retries`;
          return null; // stop retrying
        }
        return Math.min(times * 200, 3000);
      },
      lazyConnect: true,
    });

    _redis.on('error', (err: Error) => {
      _redisError = err.message;
      console.warn('[Redis] Connection error:', err.message);
    });

    _redis.on('connect', () => {
      _redisError = null;
      console.log('[Redis] Connected');
    });

    _redis.on('ready', () => {
      _redisError = null;
      console.log('[Redis] Ready');
    });
  }
  return _redis;
}

/** Check whether Redis is currently connected and usable. */
export async function isRedisConnected(): Promise<boolean> {
  try {
    const redis = getRedis();
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}

/** Get the last known Redis error message, or null if Redis is OK. */
export function getRedisError(): string | null {
  return _redisError;
}

// ──────────────────────────────────────
//  BullMQ Queue (lazy — don't connect at import time)
// ──────────────────────────────────────

let _queue: Queue | null = null;
let _queueEvents: QueueEvents | null = null;

/**
 * Get or create the BullMQ discovery queue.
 * Safe to call even if Redis is not yet connected — BullMQ will
 * buffer jobs in-memory until the connection is established.
 */
export function getQueue(): Queue {
  if (!_queue) {
    _queue = new Queue('discovery-scans', {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    });
  }
  return _queue;
}

export function getQueueEvents(): QueueEvents {
  if (!_queueEvents) {
    _queueEvents = new QueueEvents('discovery-scans', {
      connection: getRedis(),
    });
  }
  return _queueEvents;
}

// ──────────────────────────────────────
//  Graceful Shutdown
// ──────────────────────────────────────

export async function closeQueue(): Promise<void> {
  try {
    if (_queue) await _queue.close();
    if (_queueEvents) await _queueEvents.close();
    if (_redis) {
      // Only disconnect if we're not in the middle of a command
      await _redis.quit();
    }
  } catch (err) {
    console.warn('[Redis] Close error:', (err as Error).message);
  }
}
