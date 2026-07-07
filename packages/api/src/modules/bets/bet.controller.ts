import type { Request, Response, NextFunction } from 'express';
import { query, queryOne, transaction } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import { HTTP_STATUS } from '@waliabet/shared';

// ─── Place Bet ────────────────────────────────────────────────
export async function placeBet(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { type, stake, items, useBonus = false } = req.body;

    // Validate min/max stake
    const minBet = parseFloat(process.env.MIN_BET ?? '10');
    const maxBet = parseFloat(process.env.MAX_BET ?? '100000');
    if (stake < minBet || stake > maxBet) {
      throw new AppError(`Stake must be between ${minBet} and ${maxBet} ETB`, HTTP_STATUS.BAD_REQUEST);
    }

    // Get wallet
    const walletType = useBonus ? 'bonus' : 'main';
    const wallet = await queryOne<{ id: string; balance: number }>(
      'SELECT id, balance FROM wallets WHERE user_id = $1 AND type = $2',
      [req.userId, walletType]
    );

    if (!wallet || wallet.balance < stake) {
      throw new AppError('Insufficient balance', HTTP_STATUS.BAD_REQUEST);
    }

    // Validate all odds still exist and are active
    const validatedItems = await Promise.all(
      items.map(async (item: { oddId: string; marketId: string; matchId: string; oddValue: number; selection: string }) => {
        const odd = await queryOne<{ id: string; value: number; is_suspended: boolean; market_status: string }>(
          `SELECT o.id, o.value, o.is_suspended, m.status as market_status
           FROM odds o JOIN markets m ON o.market_id = m.id
           WHERE o.id = $1 AND o.is_active = true`,
          [item.oddId]
        );

        if (!odd) throw new AppError(`Odd ${item.oddId} not found or unavailable`, HTTP_STATUS.BAD_REQUEST);
        if (odd.is_suspended || odd.market_status === 'suspended') {
          throw new AppError('One or more selections is suspended', HTTP_STATUS.BAD_REQUEST);
        }

        return { ...item, currentOddValue: odd.value };
      })
    );

    // Calculate total odds
    const totalOdds = validatedItems.reduce((acc, item) => acc * item.currentOddValue, 1);
    const potentialWin = parseFloat((stake * totalOdds).toFixed(2));

    await transaction(async (client) => {
      // Debit wallet
      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore - stake;

      await client.query('UPDATE wallets SET balance = balance - $1 WHERE id = $2', [stake, wallet.id]);

      // Create bet
      const betResult = await client.query(
        `INSERT INTO bets (user_id, type, status, stake, potential_win, currency, total_odds, system_size, wallet_type, use_bonus)
         VALUES ($1, $2, 'open', $3, $4, 'ETB', $5, $6, $7, $8) RETURNING id`,
        [req.userId, type, stake, potentialWin, totalOdds, req.body.systemSize ?? null, walletType, useBonus]
      );

      const betId = betResult.rows[0].id;

      // Create bet items
      for (const item of validatedItems) {
        await client.query(
          `INSERT INTO bet_items (bet_id, match_id, market_id, odd_id, odd_value, selection, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
          [betId, item.matchId, item.marketId, item.oddId, item.currentOddValue, item.selection]
        );
      }

      // Record wallet transaction
      await client.query(
        `INSERT INTO wallet_transactions (wallet_id, user_id, type, amount, balance_before, balance_after, currency, reference_id, reference_type, description, status)
         VALUES ($1, $2, 'bet_placed', $3, $4, $5, 'ETB', $6, 'bet', $7, 'completed')`,
        [wallet.id, req.userId, stake, balanceBefore, balanceAfter, betId, `Bet placed - ${type}`]
      );

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Bet placed successfully',
        data: {
          betId,
          stake,
          potentialWin,
          totalOdds,
          currency: 'ETB',
          selections: items.length,
        },
      });
    });
  } catch (err) {
    next(err);
  }
}

// ─── Get User Bets ────────────────────────────────────────────
export async function getMyBets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const params: unknown[] = [req.userId];

    let where = 'WHERE b.user_id = $1';
    if (status) { params.push(status); where += ` AND b.status = $${params.length}`; }

    params.push(Number(limit), offset);

    const bets = await query(
      `SELECT b.*,
              json_agg(
                json_build_object(
                  'id', bi.id, 'selection', bi.selection, 'oddValue', bi.odd_value,
                  'status', bi.status, 'matchId', bi.match_id,
                  'homeTeam', ht.name, 'awayTeam', at.name,
                  'kickoffTime', m.kickoff_time, 'leagueName', l.name
                ) ORDER BY bi.id
              ) as items
       FROM bets b
       LEFT JOIN bet_items bi ON b.id = bi.bet_id
       LEFT JOIN matches m ON bi.match_id = m.id
       LEFT JOIN teams ht ON m.home_team_id = ht.id
       LEFT JOIN teams at ON m.away_team_id = at.id
       LEFT JOIN leagues l ON m.league_id = l.id
       ${where}
       GROUP BY b.id
       ORDER BY b.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({ success: true, data: bets });
  } catch (err) { next(err); }
}

// ─── Get Bet By ID ────────────────────────────────────────────
export async function getBetById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const bet = await queryOne(
      'SELECT * FROM bets WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (!bet) throw new AppError('Bet not found', HTTP_STATUS.NOT_FOUND);

    const items = await query(
      `SELECT bi.*, m.kickoff_time, ht.name as home_team, at.name as away_team,
              l.name as league_name, mk.name as market_name
       FROM bet_items bi
       JOIN matches m ON bi.match_id = m.id
       JOIN teams ht ON m.home_team_id = ht.id
       JOIN teams at ON m.away_team_id = at.id
       JOIN leagues l ON m.league_id = l.id
       JOIN markets mk ON bi.market_id = mk.id
       WHERE bi.bet_id = $1`,
      [req.params.id]
    );

    res.json({ success: true, data: { ...bet, items } });
  } catch (err) { next(err); }
}

// ─── Admin: Settle Bets ───────────────────────────────────────
export async function settleBet(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { betId } = req.params;
    const { status } = req.body;

    const bet = await queryOne<{ id: string; user_id: string; stake: number; potential_win: number; wallet_type: string }>(
      "SELECT * FROM bets WHERE id = $1 AND status = 'open'",
      [betId]
    );

    if (!bet) throw new AppError('Bet not found or already settled', HTTP_STATUS.NOT_FOUND);

    await transaction(async (client) => {
      await client.query(
        'UPDATE bets SET status = $1, settled_at = NOW(), settled_by = $2 WHERE id = $3',
        [status, req.userId, betId]
      );

      if (status === 'won') {
        const wallet = await queryOne<{ id: string; balance: number }>(
          'SELECT id, balance FROM wallets WHERE user_id = $1 AND type = $2',
          [bet.user_id, bet.wallet_type]
        );

        if (wallet) {
          const winAmount = bet.potential_win;
          await client.query('UPDATE wallets SET balance = balance + $1 WHERE id = $2', [winAmount, wallet.id]);
          await client.query(
            `INSERT INTO wallet_transactions (wallet_id, user_id, type, amount, balance_before, balance_after, currency, reference_id, description, status)
             VALUES ($1, $2, 'bet_won', $3, $4, $5, 'ETB', $6, 'Bet won', 'completed')`,
            [wallet.id, bet.user_id, winAmount, wallet.balance, wallet.balance + winAmount, betId]
          );
          await client.query('UPDATE bets SET actual_win = $1 WHERE id = $2', [winAmount, betId]);
        }
      }
    });

    res.json({ success: true, message: `Bet ${status}` });
  } catch (err) { next(err); }
}
