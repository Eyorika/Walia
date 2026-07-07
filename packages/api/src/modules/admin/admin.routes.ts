import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import type { Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../../config/database.js';

const router = Router();

// Admin: System summary statistics
router.get('/dashboard-stats', authenticate, requireRole('admin', 'super_admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const revenueStats = await queryOne(
      `SELECT COALESCE(SUM(stake), 0) as stakes,
              COALESCE(SUM(CASE WHEN status = 'won' THEN actual_win ELSE 0 END), 0) as payouts
       FROM bets WHERE status IN ('won', 'lost')`
    );

    const activeUsers = await queryOne('SELECT COUNT(*) as count FROM users WHERE status = \'active\'');
    const pendingDeposits = await queryOne('SELECT COUNT(*) as count FROM deposits WHERE status = \'pending\'');
    const pendingWithdrawals = await queryOne('SELECT COUNT(*) as count FROM withdrawals WHERE status = \'pending\'');
    const activeBets = await queryOne('SELECT COUNT(*) as count FROM bets WHERE status = \'open\'');

    const stakes = Number(revenueStats?.stakes || 0);
    const payouts = Number(revenueStats?.payouts || 0);
    const profit = stakes - payouts;

    res.json({
      success: true,
      data: {
        activeUsers: activeUsers?.count || 0,
        pendingDeposits: pendingDeposits?.count || 0,
        pendingWithdrawals: pendingWithdrawals?.count || 0,
        activeBets: activeBets?.count || 0,
        totalStakes: stakes,
        totalPayouts: payouts,
        netProfit: profit,
        currency: 'ETB'
      }
    });
  } catch (err) { next(err); }
});

// Admin: Approve/Reject Deposit
router.patch('/deposits/:id/verify', authenticate, requireRole('admin', 'super_admin', 'finance_officer'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { action, rejectionReason } = req.body; // 'approve' or 'reject'

    const deposit = await queryOne<{ id: string; user_id: string; wallet_id: string; amount: number; status: string }>(
      'SELECT * FROM deposits WHERE id = $1',
      [id]
    );

    if (!deposit) return res.status(404).json({ success: false, error: 'Deposit not found' });
    if (deposit.status !== 'pending') return res.status(400).json({ success: false, error: 'Deposit is already processed' });

    if (action === 'approve') {
      // Begin transaction to update deposit and wallet
      const dbClient = await import('../../config/database.js');
      await dbClient.transaction(async (client) => {
        await client.query("UPDATE deposits SET status = 'completed', approved_by = $1, approved_at = NOW() WHERE id = $2", [req.userId, id]);

        const wallet = await client.query('SELECT balance FROM wallets WHERE id = $1 FOR UPDATE', [deposit.wallet_id]);
        const balanceBefore = Number(wallet.rows[0].balance);
        const balanceAfter = balanceBefore + Number(deposit.amount);

        await client.query('UPDATE wallets SET balance = balance + $1 WHERE id = $2', [deposit.amount, deposit.wallet_id]);

        await client.query(
          `INSERT INTO wallet_transactions (wallet_id, user_id, type, amount, balance_before, balance_after, currency, reference_id, description, status)
           VALUES ($1, $2, 'deposit', $3, $4, $5, 'ETB', $6, 'Deposit approved by admin', 'completed')`,
          [deposit.wallet_id, deposit.user_id, deposit.amount, balanceBefore, balanceAfter, id]
        );
      });
      res.json({ success: true, message: 'Deposit approved' });
    } else {
      await query("UPDATE deposits SET status = 'failed', rejection_reason = $1 WHERE id = $2", [rejectionReason || 'Rejected by admin', id]);
      res.json({ success: true, message: 'Deposit rejected' });
    }
  } catch (err) { next(err); }
});

// Admin: Approve/Reject Withdrawal
router.patch('/withdrawals/:id/verify', authenticate, requireRole('admin', 'super_admin', 'finance_officer'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { action, rejectionReason } = req.body; // 'approve' or 'reject'

    const withdrawal = await queryOne<{ id: string; user_id: string; wallet_id: string; amount: number; status: string }>(
      'SELECT * FROM withdrawals WHERE id = $1',
      [id]
    );

    if (!withdrawal) return res.status(404).json({ success: false, error: 'Withdrawal not found' });
    if (withdrawal.status !== 'pending') return res.status(400).json({ success: false, error: 'Withdrawal is already processed' });

    if (action === 'approve') {
      await query("UPDATE withdrawals SET status = 'completed', processed_by = $1, processed_at = NOW() WHERE id = $2", [req.userId, id]);
      // Note: wallet was already debited when withdrawal was requested.
      // Simply update the transaction record status to completed.
      await query("UPDATE wallet_transactions SET status = 'completed' WHERE reference_id = $1 AND type = 'withdrawal'", [id]);
      res.json({ success: true, message: 'Withdrawal approved' });
    } else {
      // Revert debited funds back to wallet
      const dbClient = await import('../../config/database.js');
      await dbClient.transaction(async (client) => {
        await client.query("UPDATE withdrawals SET status = 'failed', rejection_reason = $1 WHERE id = $2", [rejectionReason || 'Rejected by admin', id]);

        const wallet = await client.query('SELECT balance FROM wallets WHERE id = $1 FOR UPDATE', [withdrawal.wallet_id]);
        const balanceBefore = Number(wallet.rows[0].balance);
        const balanceAfter = balanceBefore + Number(withdrawal.amount);

        await client.query('UPDATE wallets SET balance = balance + $1 WHERE id = $2', [withdrawal.amount, withdrawal.wallet_id]);

        await client.query(
          `INSERT INTO wallet_transactions (wallet_id, user_id, type, amount, balance_before, balance_after, currency, reference_id, description, status)
           VALUES ($1, $2, 'manual_credit', $3, $4, $5, 'ETB', $6, 'Withdrawal rejected - funds returned', 'completed')`,
          [withdrawal.wallet_id, withdrawal.user_id, withdrawal.amount, balanceBefore, balanceAfter, id]
        );
      });
      res.json({ success: true, message: 'Withdrawal rejected & funds returned' });
    }
  } catch (err) { next(err); }
});

export default router;
