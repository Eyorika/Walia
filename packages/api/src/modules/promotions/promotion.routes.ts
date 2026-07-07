import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import type { Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';

async function getPromotions(_req: Request, res: Response, next: NextFunction) {
  try {
    const promos = await query(
      "SELECT * FROM promotions WHERE status = 'active' AND (end_date IS NULL OR end_date > NOW()) ORDER BY created_at DESC"
    );
    res.json({ success: true, data: promos });
  } catch (err) { next(err); }
}

async function applyPromoCode(req: Request, res: Response, next: NextFunction) {
  try {
    const { code } = req.body;
    const promo = await queryOne<{ id: string; promotion_id: string; is_active: boolean; usage_limit: number; usage_count: number }>(
      'SELECT pc.*, p.name, p.value, p.value_type, p.max_bonus FROM promo_codes pc JOIN promotions p ON pc.promotion_id = p.id WHERE pc.code = $1',
      [code.toUpperCase()]
    );
    if (!promo || !promo.is_active) throw new AppError('Invalid or expired promo code', 400);
    if (promo.usage_limit && promo.usage_count >= promo.usage_limit) throw new AppError('Promo code usage limit reached', 400);
    res.json({ success: true, data: promo });
  } catch (err) { next(err); }
}

async function getReferralInfo(req: Request, res: Response, next: NextFunction) {
  try {
    const [user] = await query('SELECT referral_code FROM users WHERE id = $1', [req.userId]);
    const referrals = await query(
      `SELECT r.*, u.username, u.first_name, u.last_name, u.created_at as joined_at
       FROM referrals r JOIN users u ON r.referee_id = u.id
       WHERE r.referrer_id = $1 ORDER BY r.created_at DESC`,
      [req.userId]
    );
    const earnings = await query(
      "SELECT COALESCE(SUM(commission_amount), 0) as total FROM commissions WHERE agent_id = $1",
      [req.userId]
    );
    res.json({ success: true, data: { referralCode: (user as {referral_code: string}).referral_code, referrals, totalEarnings: earnings[0] } });
  } catch (err) { next(err); }
}

const router = Router();
router.get('/', getPromotions);
router.post('/apply-code', authenticate, applyPromoCode);
router.get('/referral', authenticate, getReferralInfo);
export default router;
