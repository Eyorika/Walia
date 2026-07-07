import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export function requestLogger(req: Request, _res: Response, next: NextFunction): void {
  logger.debug(`${req.method} ${req.path}`, {
    ip: req.ip,
    userId: req.userId,
    body: req.method !== 'GET' ? req.body : undefined,
  });
  next();
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
}
