import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import type { Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../../config/database.js';

const router = Router();

// Admin: Financial/Revenue Report
router.get('/revenue', authenticate, requireRole('admin', 'super_admin', 'finance_officer'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const params: unknown[] = [];
    let dateFilter = '';

    if (startDate && endDate) {
      params.push(startDate, endDate);
      dateFilter = 'WHERE created_at BETWEEN $1 AND $2';
    }

    const depositStats = await queryOne(
      `SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM deposits WHERE status = 'completed' ${dateFilter ? 'AND' + dateFilter.slice(5) : ''}`,
      params
    );

    const withdrawalStats = await queryOne(
      `SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM withdrawals WHERE status = 'completed' ${dateFilter ? 'AND' + dateFilter.slice(5) : ''}`,
      params
    );

    const betStats = await queryOne(
      `SELECT COALESCE(SUM(stake), 0) as total_stake,
              COALESCE(SUM(CASE WHEN status = 'won' THEN actual_win ELSE 0 END), 0) as total_payout,
              COUNT(*) as count
       FROM bets
       WHERE status IN ('won', 'lost') ${dateFilter ? 'AND' + dateFilter.slice(5) : ''}`,
      params
    );

    const netRevenue = (Number(betStats?.total_stake) || 0) - (Number(betStats?.total_payout) || 0);

    res.json({
      success: true,
      data: {
        deposits: depositStats,
        withdrawals: withdrawalStats,
        bets: {
          totalStakes: betStats?.total_stake || 0,
          totalPayouts: betStats?.total_payout || 0,
          netRevenue,
          totalBets: betStats?.count || 0
        }
      }
    });
  } catch (err) { next(err); }
});

// Admin: User Activity Report
router.get('/users', authenticate, requireRole('admin', 'super_admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await queryOne(
      `SELECT COUNT(*) as total_users,
              COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
              COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended_users,
              COUNT(CASE WHEN status = 'banned' THEN 1 END) as banned_users,
              COUNT(CASE WHEN kyc_status = 'approved' THEN 1 END) as verified_users
       FROM users`
    );
    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
});

export default router;
