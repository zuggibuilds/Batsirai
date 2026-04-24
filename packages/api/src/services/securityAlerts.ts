import { redis } from '../lib/redis';

type FailedAttemptInput = {
  scope: string;
  identifier: string;
  reason: string;
  windowSec?: number;
  threshold?: number;
  lockoutSec?: number;
  metadata?: Record<string, unknown>;
};

function failedKey(scope: string, identifier: string): string {
  return `security:failed:${scope}:${identifier}`;
}

function lockKey(scope: string, identifier: string): string {
  return `security:lock:${scope}:${identifier}`;
}

export async function getLockoutRemainingSeconds(scope: string, identifier: string): Promise<number> {
  try {
    const ttl = await redis.ttl(lockKey(scope, identifier));
    return ttl > 0 ? ttl : 0;
  } catch {
    return 0;
  }
}

export async function clearFailedAttempts(scope: string, identifier: string): Promise<void> {
  try {
    await redis.del(failedKey(scope, identifier), lockKey(scope, identifier));
  } catch (error) {
    console.error('[SecurityAlert] Clear failed', error);
  }
}

export async function registerFailedAttempt(input: FailedAttemptInput): Promise<{ count: number; locked: boolean }> {
  const windowSec = input.windowSec ?? 15 * 60;
  const threshold = input.threshold ?? 5;
  const lockoutSec = input.lockoutSec ?? 15 * 60;
  const key = failedKey(input.scope, input.identifier);

  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, windowSec);
    }

    let locked = false;
    if (count >= threshold) {
      locked = true;
      await redis.set(lockKey(input.scope, input.identifier), '1', 'EX', lockoutSec);
    }

    if (count >= threshold && count % threshold === 0) {
      console.warn('[SecurityAlert]', JSON.stringify({
        scope: input.scope,
        identifier: input.identifier,
        reason: input.reason,
        count,
        windowSec,
        lockoutSec,
        metadata: input.metadata ?? {},
        timestamp: new Date().toISOString(),
      }));
    }

    return { count, locked };
  } catch (error) {
    console.error('[SecurityAlert] Tracking failed', error);
    return { count: 0, locked: false };
  }
}

export async function trackFailedAttempt(input: FailedAttemptInput): Promise<void> {
  await registerFailedAttempt(input);
}

function maskIdentifierPart(part: string): string {
  if (!part) return '***';

  if (part.includes('@')) {
    const [user, domain] = part.split('@');
    const safeUser = user.length <= 2 ? `${user[0] ?? ''}***` : `${user.slice(0, 2)}***`;
    return `${safeUser}@${domain}`;
  }

  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(part)) {
    const [a, b] = part.split('.');
    return `${a}.${b}.x.x`;
  }

  if (part.length <= 4) return '***';
  return `${part.slice(0, 2)}***${part.slice(-2)}`;
}

function redactSecurityKey(key: string): string {
  const parts = key.split(':');
  if (parts.length < 4) return key;

  const identifier = parts.slice(3).join(':');
  const maskedIdentifier = identifier
    .split('|')
    .map((segment) => maskIdentifierPart(segment))
    .join('|');

  return `${parts[0]}:${parts[1]}:${parts[2]}:${maskedIdentifier}`;
}

export async function getSecurityAlertSnapshot(options?: { limit?: number; page?: number }): Promise<{
  page: number;
  limit: number;
  hasMoreLockouts: boolean;
  hasMoreFailedCounters: boolean;
  activeLockouts: Array<{ key: string; ttlSec: number }>;
  failedCounters: Array<{ key: string; count: number }>;
}> {
  const page = Math.max(1, options?.page ?? 1);
  const limit = Math.min(200, Math.max(1, options?.limit ?? 100));
  const start = (page - 1) * limit;
  const end = start + limit;

  const [lockKeys, failedKeys] = await Promise.all([
    redis.keys('security:lock:*'),
    redis.keys('security:failed:*'),
  ]);

  const lockSlice = lockKeys.slice(start, end);
  const failedSlice = failedKeys.slice(start, end);

  const [ttlResult, countResult] = await Promise.all([
    lockSlice.length
      ? redis.pipeline(lockSlice.map((key) => ['ttl', key])).exec()
      : Promise.resolve([]),
    failedSlice.length
      ? redis.pipeline(failedSlice.map((key) => ['get', key])).exec()
      : Promise.resolve([]),
  ]);

  const ttls = (ttlResult || []).map((entry) => Number(entry?.[1] ?? 0));
  const counts = (countResult || []).map((entry) => Number(entry?.[1] ?? 0));

  return {
    page,
    limit,
    hasMoreLockouts: lockKeys.length > end,
    hasMoreFailedCounters: failedKeys.length > end,
    activeLockouts: lockSlice.map((key, i) => ({ key: redactSecurityKey(key), ttlSec: Number(ttls[i] ?? 0) })),
    failedCounters: failedSlice.map((key, i) => ({ key: redactSecurityKey(key), count: counts[i] ?? 0 })),
  };
}
