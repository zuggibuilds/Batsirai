import { NextFunction, Request, Response } from 'express';
import { ROLE_PERMISSIONS } from '@batsirai/shared';
import { verifyAdminToken } from '../utils/jwt';

export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    req.admin = verifyAdminToken(authHeader.substring(7));
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid admin token' });
  }
}

export function checkAdminRole(roles: Array<keyof typeof ROLE_PERMISSIONS>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return next();
  };
}
