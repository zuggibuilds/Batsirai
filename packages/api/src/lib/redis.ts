import Redis from 'ioredis';
import { env } from '@batsirai/config';

export const redis = new Redis(env.REDIS_URL, {
	lazyConnect: true,
	maxRetriesPerRequest: 2,
	enableReadyCheck: true,
});

redis.on('error', (error: unknown) => {
	console.error('Redis connection error', error as Error);
});

redis.on('connect', () => {
	console.info('Redis connected');
});

void redis.connect().catch((error: unknown) => {
	const err = error as Error;
	console.error('Redis initial connect failed', err);
});
