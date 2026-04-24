import { NextFunction, Request, Response } from 'express';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  console.error('API Error', { err, path: req.path });
  return res.status(500).json({ message: 'Internal server error' });
}
