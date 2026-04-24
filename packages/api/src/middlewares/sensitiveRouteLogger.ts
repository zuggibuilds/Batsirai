import { NextFunction, Request, Response } from 'express';

const REDACT_KEYS = new Set([
  'password',
  'newPassword',
  'confirmPassword',
  'token',
  'refreshToken',
  'accessToken',
  'code',
  'ephemeralToken',
  'totpSecret',
  'authorization',
]);

function scrubValue(value: unknown): unknown {
  if (Buffer.isBuffer(value)) {
    return '[RAW_BODY_REDACTED]';
  }

  if (Array.isArray(value)) {
    return value.map((item) => scrubValue(item));
  }

  if (value && typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      output[key] = REDACT_KEYS.has(key) ? '[REDACTED]' : scrubValue(nested);
    }
    return output;
  }

  return value;
}

function getActor(req: Request): string {
  if (req.admin?.adminId) return `admin:${req.admin.adminId}`;
  if (req.user?.userId) return `user:${req.user.userId}`;
  return 'anonymous';
}

export function sensitiveRouteLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
    || req.ip
    || req.socket.remoteAddress
    || 'unknown';

  const requestBody = scrubValue(req.body ?? {});

  res.on('finish', () => {
    const elapsedMs = Date.now() - start;
    console.info('[SensitiveRoute]', JSON.stringify({
      method: req.method,
      path: req.originalUrl,
      actor: getActor(req),
      ip,
      statusCode: res.statusCode,
      elapsedMs,
      requestBody,
      timestamp: new Date().toISOString(),
    }));
  });

  next();
}
