import { Request, Response, NextFunction } from 'express';
import { trackFailedAttempt } from '../services/securityAlerts';

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const raw = typeof forwarded === 'string' ? forwarded : forwarded[0];
    return raw.split(',')[0].trim();
  }

  return (req.ip || req.socket.remoteAddress || 'unknown').replace('::ffff:', '');
}

export function verifyFlutterwaveWebhook(req: Request, res: Response, next: NextFunction): void {
  const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
  const signature = req.headers['verif-hash'] as string | undefined;
  const ip = getClientIp(req);

  if (!secretHash || !signature) {
    void trackFailedAttempt({
      scope: 'flutterwave-webhook-signature',
      identifier: ip,
      reason: 'signature_missing',
      metadata: { path: req.originalUrl },
    });
    res.status(401).json({ error: 'Webhook signature missing' });
    return;
  }

  if (signature !== secretHash) {
    void trackFailedAttempt({
      scope: 'flutterwave-webhook-signature',
      identifier: ip,
      reason: 'signature_invalid',
      metadata: { path: req.originalUrl },
    });
    res.status(401).json({ error: 'Invalid webhook signature' });
    return;
  }

  next();
}
