import IORedis from 'ioredis';
import { Queue } from 'bullmq';
import { config } from '../config';

let _redis: IORedis | null = null;

export function getRedis(): IORedis {
  if (!_redis) {
    _redis = new IORedis(config.redis.url, {
      maxRetriesPerRequest: null,
      enableOfflineQueue: true,
      retryStrategy: (times) => {
        if (times > 10) { return null; }
        return Math.min(times * 200, 3000);
      },
      lazyConnect: true,
    });
    _redis.on('error', (err) => { console.warn('[Notify-Redis]', err.message); });
    _redis.on('connect', () => { /* Redis connected */ });
  }
  return _redis;
}

export async function isRedisConnected(): Promise<boolean> {
  try { await getRedis().ping(); return true; } catch { return false; }
}

// Queue for publishing events FROM this service
let _queue: Queue | null = null;
export function getQueue(): Queue {
  if (!_queue) {
    _queue = new Queue('notifications', {
      connection: getRedis(),
      defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 3000 }, removeOnComplete: 100 },
    });
  }
  return _queue;
}

export async function closeConnections(): Promise<void> {
  try {
    if (_queue) await _queue.close();
    if (_redis) await _redis.quit();
  } catch { /* ignore */ }
}
