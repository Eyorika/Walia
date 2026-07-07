import type { Request, Response, NextFunction } from 'express';
import { query, queryOne, transaction } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import { HTTP_STATUS } from '@waliabet/shared';

// ─── Get Wallet Balance ───────────────────────────────────────
export async function getBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const wallets = await query(
      'SELECT id, type, balance, currency FROM wallets WHERE user_id = $1',
      [req.userId]
    );

    res.json({ success: true, data: wallets });
  } catch (err) {
    next(err);
  }
}

// ─── Initiate Deposit ─────────────────────────────────────────
export async function initiateDeposit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { amount, provider, phoneNumber } = req.body;

    const wallet = await queryOne<{ id: string }>(
      'SELECT id FROM wallets WHERE user_id = $1 AND type = $2',
      [req.userId, 'main']
    );

    if (!wallet) throw new AppError('Wallet not found', HTTP_STATUS.NOT_FOUND);

    // Create pending deposit record
    const [deposit] = await query<{ id: string; amount: number; provider: string }>(
      `INSERT INTO deposits (user_id, wallet_id, amount, fee, net_amount, currency, provider, phone_number, status)
       VALUES ($1, $2, $3, 0, $3, 'ETB', $4, $5, 'pending')
       RETURNING id, amount, provider, status`,
      [req.userId, wallet.id, amount, provider, phoneNumber]
    );

    // Trigger provider-specific flow
    let paymentUrl: string | null = null;
    let providerRef: string | null = null;

    switch (provider) {
      case 'chapa':
        ({ paymentUrl, providerRef } = await initiateChapaDeposit(deposit, req));
        break;
      case 'telebirr':
        providerRef = `TELEBIRR-${deposit.id.slice(0, 8).toUpperCase()}`;
        break;
      case 'mpesa':
        providerRef = `MPESA-${deposit.id.slice(0, 8).toUpperCase()}`;
        break;
      case 'cbe':
        providerRef = `CBE-${deposit.id.slice(0, 8).toUpperCase()}`;
        break;
    }

    if (providerRef) {
      await query('UPDATE deposits SET provider_ref = $1 WHERE id = $2', [providerRef, deposit.id]);
    }

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Deposit initiated',
      data: {
        depositId: deposit.id,
        amount,
        provider,
        providerRef,
        paymentUrl,
        instructions: getDepositInstructions(provider, amount, providerRef),
      },
    });
  } catch (err) {
    next(err);
  }
}

async function initiateChapaDeposit(
  deposit: { id: string; amount: number },
  req: Request
): Promise<{ paymentUrl: string | null; providerRef: string }> {
  // Chapa integration
  const txRef = `WALIABET-${deposit.id.slice(0, 12)}`;
  // In production: call Chapa API to initialize payment
  return {
    paymentUrl: `${process.env.CHAPA_BASE_URL}/pay/${txRef}`,
    providerRef: txRef,
  };
}

function getDepositInstructions(provider: string, amount: number, ref: string | null): string {
  const instructions: Record<string, string> = {
    telebirr: `Send ${amount} ETB to *127*6# or Telebirr App. Reference: ${ref}`,
    chapa: `Click the payment link to complete your deposit of ${amount} ETB`,
    mpesa: `Send ${amount} ETB to M-Pesa. Merchant Code: ${process.env.MPESA_SHORTCODE}. Ref: ${ref}`,
    cbe: `Transfer ${amount} ETB via CBE Birr App. Reference: ${ref}`,
  };
  return instructions[provider] ?? 'Follow the payment instructions provided';
}

// ─── Payment Callbacks ────────────────────────────────────────
export async function chapaWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tx_ref, status } = req.body;

    const deposit = await queryOne<{ id: string; user_id: string; wallet_id: string; net_amount: number }>(
      "SELECT * FROM deposits WHERE provider_ref = $1",
      [tx_ref]
    );

    if (!deposit) {
      res.json({ success: false });
      return;
    }

    if (status === 'success') {
      await creditWallet(deposit.user_id, deposit.wallet_id, deposit.net_amount, deposit.id, 'deposit');
      await query("UPDATE deposits SET status = 'completed', approved_at = NOW() WHERE id = $1", [deposit.id]);
    } else {
      await query("UPDATE deposits SET status = 'failed' WHERE id = $1", [deposit.id]);
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// ─── Initiate Withdrawal ──────────────────────────────────────
export async function initiateWithdrawal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { amount, provider, accountNumber, accountName } = req.body;

    const wallet = await queryOne<{ id: string; balance: number }>(
      'SELECT id, balance FROM wallets WHERE user_id = $1 AND type = $2',
      [req.userId, 'main']
    );

    if (!wallet) throw new AppError('Wallet not found', HTTP_STATUS.NOT_FOUND);
    if (wallet.balance < amount) throw new AppError('Insufficient balance', HTTP_STATUS.BAD_REQUEST);

    await transaction(async (client) => {
      // Debit wallet first
      await client.query(
        'UPDATE wallets SET balance = balance - $1 WHERE id = $2',
        [amount, wallet.id]
      );

      // Record transaction
      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore - amount;

      await client.query(
        `INSERT INTO wallet_transactions (wallet_id, user_id, type, amount, balance_before, balance_after, currency, description, status)
         VALUES ($1, $2, 'withdrawal', $3, $4, $5, 'ETB', $6, 'pending')`,
        [wallet.id, req.userId, amount, balanceBefore, balanceAfter, `Withdrawal via ${provider}`]
      );

      // Create withdrawal record
      await client.query(
        `INSERT INTO withdrawals (user_id, wallet_id, amount, fee, net_amount, currency, provider, account_number, account_name, status)
         VALUES ($1, $2, $3, 0, $3, 'ETB', $4, $5, $6, 'pending')`,
        [req.userId, wallet.id, amount, provider, accountNumber, accountName]
      );
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Withdrawal request submitted. It will be processed within 24 hours.',
    });
  } catch (err) {
    next(err);
  }
}

// ─── Transaction History ──────────────────────────────────────
export async function getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const whereClause = type ? 'AND wt.type = $4' : '';
    const params: unknown[] = [req.userId, Number(limit), offset];
    if (type) params.push(type);

    const transactions = await query(
      `SELECT wt.*, w.type as wallet_type
       FROM wallet_transactions wt
       JOIN wallets w ON wt.wallet_id = w.id
       WHERE wt.user_id = $1 ${whereClause}
       ORDER BY wt.created_at DESC
       LIMIT $2 OFFSET $3`,
      params
    );

    const [countRow] = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM wallet_transactions WHERE user_id = $1 ${type ? 'AND type = $2' : ''}`,
      type ? [req.userId, type] : [req.userId]
    );

    res.json({
      success: true,
      data: transactions,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: parseInt(countRow.count),
        totalPages: Math.ceil(parseInt(countRow.count) / Number(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Helper: Credit Wallet ────────────────────────────────────
async function creditWallet(
  userId: string,
  walletId: string,
  amount: number,
  referenceId: string,
  type: string
): Promise<void> {
  const wallet = await queryOne<{ balance: number }>(
    'SELECT balance FROM wallets WHERE id = $1 FOR UPDATE',
    [walletId]
  );

  if (!wallet) return;

  const balanceBefore = wallet.balance;
  const balanceAfter = balanceBefore + amount;

  await query('UPDATE wallets SET balance = balance + $1 WHERE id = $2', [amount, walletId]);

  await query(
    `INSERT INTO wallet_transactions (wallet_id, user_id, type, amount, balance_before, balance_after, currency, reference_id, description, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'ETB', $7, $8, 'completed')`,
    [walletId, userId, type, amount, balanceBefore, balanceAfter, referenceId, `${type} of ${amount} ETB`]
  );
}
