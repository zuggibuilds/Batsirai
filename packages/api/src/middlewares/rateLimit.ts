import rateLimit from 'express-rate-limit';
import { Request } from 'express';

function resolveRateLimitKey(req: Request): string {
  return req.user?.userId ?? req.ip ?? req.socket?.remoteAddress ?? 'anonymous';
}

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
});

export const adminAuthRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
});

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  keyGenerator: (req) => resolveRateLimitKey(req),
});

export const imageUploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  keyGenerator: (req) => resolveRateLimitKey(req),
});

export const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  keyGenerator: (req) => resolveRateLimitKey(req),
});
