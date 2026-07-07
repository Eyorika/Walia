import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import type { Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import { HTTP_STATUS } from '@waliabet/shared';

const router = Router();

// Get profile
router.get('/profile', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await queryOne(
      'SELECT id, email, phone, username, first_name, last_name, date_of_birth, gender, country, city, address, avatar, role, status, kyc_status, email_verified, phone_verified, two_factor_enabled, telegram_id, referral_code, created_at FROM users WHERE id = $1',
      [req.userId]
    );
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// Update profile
router.put('/profile', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, phone, dateOfBirth, gender, country, city, address } = req.body;
    const [user] = await query(
      `UPDATE users
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone),
           date_of_birth = COALESCE($4, date_of_birth),
           gender = COALESCE($5, gender),
           country = COALESCE($6, country),
           city = COALESCE($7, city),
           address = COALESCE($8, address),
           updated_at = NOW()
       WHERE id = $9
       RETURNING id, email, phone, username, first_name, last_name, date_of_birth, gender, country, city, address, avatar, role, status, kyc_status`,
      [firstName, lastName, phone, dateOfBirth || null, gender, country, city, address, req.userId]
    );
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// Upload KYC Document
router.post('/kyc', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, fileUrl } = req.body;
    if (!type || !fileUrl) throw new AppError('Type and file URL are required', HTTP_STATUS.BAD_REQUEST);

    const [doc] = await query(
      'INSERT INTO kyc_documents (user_id, type, file_url, status) VALUES ($1, $2, $3, \'pending\') RETURNING *',
      [req.userId, type, fileUrl]
    );

    await query('UPDATE users SET kyc_status = \'pending\' WHERE id = $1', [req.userId]);

    res.status(HTTP_STATUS.CREATED).json({ success: true, data: doc });
  } catch (err) { next(err); }
});

// Get users (Admin only)
router.get('/', authenticate, requireRole('admin', 'super_admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, role, status, limit = 20, page = 1 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(email ILIKE $${params.length} OR username ILIKE $${params.length} OR first_name ILIKE $${params.length} OR last_name ILIKE $${params.length})`);
    }
    if (role) {
      params.push(role);
      conditions.push(`role = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(Number(limit), offset);

    const users = await query(
      `SELECT id, email, phone, username, first_name, last_name, role, status, kyc_status, created_at
       FROM users
       ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({ success: true, data: users });
  } catch (err) { next(err); }
});

export default router;
