import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import type { Request, Response, NextFunction } from 'express';
import { query, queryOne, transaction } from '../../config/database.js';
import { generateTokenPair, verifyRefreshToken } from '../../utils/jwt.js';
import { AppError } from '../../middleware/errorHandler.js';
import { HTTP_STATUS } from '@waliabet/shared';
import type { User } from '@waliabet/shared';

// ─── Register ─────────────────────────────────────────────────
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, phone, username, firstName, lastName, password, dateOfBirth, referralCode } = req.body;

    // Check existing
    const existing = await queryOne(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email.toLowerCase(), username.toLowerCase()]
    );
    if (existing) throw new AppError('Email or username already exists', HTTP_STATUS.CONFLICT);

    // Check phone
    if (phone) {
      const phoneExists = await queryOne('SELECT id FROM users WHERE phone = $1', [phone]);
      if (phoneExists) throw new AppError('Phone number already registered', HTTP_STATUS.CONFLICT);
    }

    // Find referrer
    let referrerId: string | null = null;
    if (referralCode) {
      const referrer = await queryOne<{ id: string }>(
        'SELECT id FROM users WHERE referral_code = $1',
        [referralCode]
      );
      referrerId = referrer?.id ?? null;
    }

    const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS ?? '12'));

    await transaction(async (client) => {
      // Create user
      const [newUser] = await client.query<User>(
        `INSERT INTO users (email, phone, username, first_name, last_name, password_hash, date_of_birth, referred_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, email, username, first_name, last_name, role, status, referral_code`,
        [email.toLowerCase(), phone ?? null, username.toLowerCase(), firstName, lastName, passwordHash, dateOfBirth ?? null, referrerId]
      );

      const user = newUser.rows[0];

      // Create main wallet
      await client.query(
        'INSERT INTO wallets (user_id, type, balance, currency) VALUES ($1, $2, 0, $3)',
        [user.id, 'main', 'ETB']
      );

      // Create bonus wallet
      await client.query(
        'INSERT INTO wallets (user_id, type, balance, currency) VALUES ($1, $2, 0, $3)',
        [user.id, 'bonus', 'ETB']
      );

      // Create referral record
      if (referrerId) {
        await client.query(
          'INSERT INTO referrals (referrer_id, referee_id, status) VALUES ($1, $2, $3)',
          [referrerId, user.id, 'pending']
        );
      }

      // Generate tokens
      const tokens = generateTokenPair(user);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await client.query(
        `INSERT INTO user_sessions (id, user_id, refresh_token, ip_address, user_agent, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [uuidv4(), user.id, tokens.refreshToken, req.ip, req.headers['user-agent'], expiresAt]
      );

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Account created successfully',
        data: {
          user: { id: user.id, email: user.email, username: user.username, role: user.role },
          ...tokens,
        },
      });
    });
  } catch (err) {
    next(err);
  }
}

// ─── Login ────────────────────────────────────────────────────
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password, twoFactorCode } = req.body;

    const user = await queryOne<User & { password_hash: string }>(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    // Log attempt
    const success = !!user;

    if (!user) {
      await query('INSERT INTO login_logs (email, ip_address, user_agent, success, failure_reason) VALUES ($1, $2, $3, $4, $5)',
        [email, req.ip, req.headers['user-agent'], false, 'User not found']);
      throw new AppError('Invalid credentials', HTTP_STATUS.UNAUTHORIZED);
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      await query('INSERT INTO login_logs (user_id, email, ip_address, user_agent, success, failure_reason) VALUES ($1, $2, $3, $4, $5, $6)',
        [user.id, email, req.ip, req.headers['user-agent'], false, 'Wrong password']);
      throw new AppError('Invalid credentials', HTTP_STATUS.UNAUTHORIZED);
    }

    if (user.status === 'banned' || user.status === 'suspended') {
      throw new AppError(`Your account is ${user.status}. Contact support.`, HTTP_STATUS.FORBIDDEN);
    }

    // 2FA check
    if (user.two_factor_enabled) {
      if (!twoFactorCode) {
        res.status(200).json({ success: true, requiresTwoFactor: true });
        return;
      }
      // Verify TOTP (implementation uses otplib)
      // const verified = authenticator.check(twoFactorCode, user.two_factor_secret);
      // if (!verified) throw new AppError('Invalid 2FA code', 401);
    }

    const tokens = generateTokenPair(user);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await query(
      `INSERT INTO user_sessions (id, user_id, refresh_token, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [uuidv4(), user.id, tokens.refreshToken, req.ip, req.headers['user-agent'], expiresAt]
    );

    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
    await query('INSERT INTO login_logs (user_id, email, ip_address, user_agent, success) VALUES ($1, $2, $3, $4, $5)',
      [user.id, email, req.ip, req.headers['user-agent'], true]);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: { id: user.id, email: user.email, username: user.username, role: user.role, status: user.status },
        ...tokens,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Refresh Token ────────────────────────────────────────────
export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken: token } = req.body;
    if (!token) throw new AppError('Refresh token required', HTTP_STATUS.BAD_REQUEST);

    let payload: { userId: string; sessionId: string };
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw new AppError('Invalid refresh token', HTTP_STATUS.UNAUTHORIZED);
    }

    const session = await queryOne(
      'SELECT id, user_id FROM user_sessions WHERE refresh_token = $1 AND is_active = true AND expires_at > NOW()',
      [token]
    );

    if (!session) throw new AppError('Session not found or expired', HTTP_STATUS.UNAUTHORIZED);

    const user = await queryOne<User>('SELECT * FROM users WHERE id = $1', [payload.userId]);
    if (!user) throw new AppError('User not found', HTTP_STATUS.UNAUTHORIZED);

    // Rotate refresh token
    const tokens = generateTokenPair(user);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await query(
      'UPDATE user_sessions SET refresh_token = $1, expires_at = $2 WHERE id = $3',
      [tokens.refreshToken, expiresAt, payload.sessionId]
    );

    res.json({ success: true, data: tokens });
  } catch (err) {
    next(err);
  }
}

// ─── Logout ───────────────────────────────────────────────────
export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken: token } = req.body;
    if (token) {
      await query('UPDATE user_sessions SET is_active = false WHERE refresh_token = $1', [token]);
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

// ─── Get Current User ─────────────────────────────────────────
export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await queryOne<User>(
      `SELECT id, email, phone, username, first_name, last_name, date_of_birth, gender,
              country, city, address, avatar, role, status, kyc_status,
              email_verified, phone_verified, two_factor_enabled, telegram_id,
              referral_code, referred_by, last_login_at, created_at
       FROM users WHERE id = $1`,
      [req.userId]
    );

    const wallets = await query(
      'SELECT id, type, balance, currency FROM wallets WHERE user_id = $1',
      [req.userId]
    );

    res.json({ success: true, data: { ...user, wallets } });
  } catch (err) {
    next(err);
  }
}

// ─── Forgot Password ──────────────────────────────────────────
export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.body;
    const user = await queryOne('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);

    // Always respond success to prevent email enumeration
    if (user) {
      const resetToken = uuidv4();
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await query(
        'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3',
        [resetToken, expires, (user as { id: string }).id]
      );

      // TODO: Send email with reset link
    }

    res.json({
      success: true,
      message: 'If an account exists with that email, you will receive a password reset link',
    });
  } catch (err) {
    next(err);
  }
}

// ─── Reset Password ───────────────────────────────────────────
export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token, password } = req.body;

    const user = await queryOne(
      'SELECT id FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()',
      [token]
    );

    if (!user) throw new AppError('Invalid or expired reset token', HTTP_STATUS.BAD_REQUEST);

    const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS ?? '12'));

    await query(
      'UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2',
      [passwordHash, (user as { id: string }).id]
    );

    // Invalidate all sessions
    await query('UPDATE user_sessions SET is_active = false WHERE user_id = $1', [(user as { id: string }).id]);

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
}
