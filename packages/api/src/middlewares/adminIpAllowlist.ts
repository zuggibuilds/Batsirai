import { Request, Response, NextFunction } from 'express';

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const raw = typeof forwarded === 'string' ? forwarded : forwarded[0];
    return raw.split(',')[0].trim();
  }

  const ip = req.socket.remoteAddress || req.ip || '';
  return ip.replace('::ffff:', '');
}

export function adminIpAllowlist(req: Request, res: Response, next: NextFunction): void {
  const allowedIps = (process.env.ADMIN_ALLOWED_IPS || '127.0.0.1,::1')
    .split(',')
    .map((ip) => ip.trim().replace('::ffff:', ''));

  if ((process.env.NODE_ENV || 'development') === 'development') {
    next();
    return;
  }

  const clientIp = getClientIp(req);
  if (!allowedIps.includes(clientIp)) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  next();
}
