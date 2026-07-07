import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractBearerToken } from '../utils/jwt.js';
import { queryOne } from '../config/database.js';
import { HTTP_STATUS } from '@waliabet/shared';
import type { User } from '@waliabet/shared';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: User;
      userId?: string;
    }
  }
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  try {
    const payload = verifyAccessToken(token);

    // Check if session is still active
    const session = await queryOne(
      'SELECT id FROM user_sessions WHERE id = $1 AND is_active = true AND expires_at > NOW()',
      [payload.sessionId]
    );

    if (!session) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Session expired or revoked',
      });
      return;
    }

    // Load user
    const user = await queryOne<User>(
      `SELECT id, email, phone, username, first_name, last_name, role, status,
              kyc_status, email_verified, phone_verified, two_factor_enabled,
              telegram_id, referral_code, referred_by, agent_id, created_at
       FROM users WHERE id = $1`,
      [payload.userId]
    );

    if (!user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    if (user.status === 'banned' || user.status === 'suspended') {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: `Account is ${user.status}`,
      });
      return;
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, error: 'Unauthorized' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireRole('admin', 'super_admin')(req, res, next);
}

export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.userId;
  } catch {
    // Optional — continue without auth
  }

  next();
}
