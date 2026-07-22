import { Queue, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config';

let _redis: IORedis | null = null;
let _redisError: string | null = null;

export function getRedis(): IORedis {
  if (!_redis) {
    _redis = new IORedis(config.redis.url, {
      maxRetriesPerRequest: null,
      enableOfflineQueue: true,
      retryStrategy: (times) => {
        if (times > 10) {
          _redisError = `Redis unreachable after ${times} retries`;
          return null;
        }
        return Math.min(times * 200, 3000);
      },
      lazyConnect: true,
    });
    _redis.on('error', (err: Error) => {
      _redisError = err.message;
      console.warn('[OSINT-Redis]', err.message);
    });
    _redis.on('connect', () => { _redisError = null; });
  }
  return _redis;
}

export async function isRedisConnected(): Promise<boolean> {
  try {
    await getRedis().ping();
    return true;
  } catch { return false; }
}

export function getRedisError(): string | null { return _redisError; }

let _queue: Queue | null = null;

export function getQueue(): Queue {
  if (!_queue) {
    _queue = new Queue('osint-scans', {
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

let _queueEvents: QueueEvents | null = null;

export function getQueueEvents(): QueueEvents {
  if (!_queueEvents) {
    _queueEvents = new QueueEvents('osint-scans', { connection: getRedis() });
  }
  return _queueEvents;
}

export async function closeQueue(): Promise<void> {
  try {
    if (_queue) await _queue.close();
    if (_queueEvents) await _queueEvents.close();
    if (_redis) await _redis.quit();
  } catch { /* ignore */ }
}
