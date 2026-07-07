import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import type { User } from '@waliabet/shared';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export function generateTokenPair(user: Pick<User, 'id' | 'email' | 'role'>): TokenPair {
  const sessionId = uuidv4();
  const expiresIn = parseInt(process.env.JWT_EXPIRES_IN?.replace('m', '') ?? '15') * 60;

  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    sessionId,
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '15m') as jwt.SignOptions['expiresIn'],
  });

  const refreshToken = jwt.sign(
    { userId: user.id, sessionId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn'] }
  );

  return { accessToken, refreshToken, expiresIn };
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
}

export function verifyRefreshToken(token: string): { userId: string; sessionId: string } {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string; sessionId: string };
}

export function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}
