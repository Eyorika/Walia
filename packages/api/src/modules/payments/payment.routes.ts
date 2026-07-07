import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import type { Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../../config/database.js';

const router = Router();

// Retrieve payment status
router.get('/status/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deposit = await queryOne(
      'SELECT id, amount, provider, status, created_at FROM deposits WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (!deposit) return res.status(404).json({ success: false, error: 'Transaction not found' });
    res.json({ success: true, data: deposit });
  } catch (err) { next(err); }
});

// Chapa Webhook callback (duplicate if needed for payments module fallback)
router.post('/chapa/webhook', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tx_ref, status } = req.body;
    const deposit = await queryOne<{ id: string; user_id: string; wallet_id: string; net_amount: number }>(
      'SELECT * FROM deposits WHERE provider_ref = $1',
      [tx_ref]
    );

    if (deposit && status === 'success') {
      await query("UPDATE deposits SET status = 'completed', approved_at = NOW() WHERE id = $1", [deposit.id]);
      await query('UPDATE wallets SET balance = balance + $1 WHERE id = $2', [deposit.net_amount, deposit.wallet_id]);
    }
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
