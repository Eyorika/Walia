import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { HTTP_STATUS } from '@waliabet/shared';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.userId,
  });

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
    return;
  }

  // Postgres constraint violation
  if ('code' in err) {
    const pgErr = err as Error & { code: string; constraint?: string };

    if (pgErr.code === '23505') {
      const field = pgErr.constraint?.split('_').slice(-1)[0] ?? 'field';
      res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        error: `${field} already exists`,
        code: 'DUPLICATE_ENTRY',
      });
      return;
    }

    if (pgErr.code === '23503') {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Referenced resource not found',
        code: 'FOREIGN_KEY_VIOLATION',
      });
      return;
    }
  }

  res.status(HTTP_STATUS.INTERNAL_ERROR).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
}
