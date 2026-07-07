import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import type { Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../../config/database.js';

async function getOdds(req: Request, res: Response, next: NextFunction) {
  try {
    const { matchId } = req.query;
    const markets = await query(
      `SELECT m.*, json_agg(o ORDER BY o.name) as odds
       FROM markets m LEFT JOIN odds o ON m.id = o.market_id AND o.is_active = true
       WHERE m.match_id = $1 GROUP BY m.id ORDER BY m.name`,
      [matchId]
    );
    res.json({ success: true, data: markets });
  } catch (err) { next(err); }
}

async function updateOdds(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { value } = req.body;
    const [odd] = await query(
      'UPDATE odds SET previous_value = value, value = $1 WHERE id = $2 RETURNING *',
      [value, id]
    );
    res.json({ success: true, data: odd });
  } catch (err) { next(err); }
}

async function createMarket(req: Request, res: Response, next: NextFunction) {
  try {
    const { matchId, name, type, oddsData } = req.body;
    const [market] = await query(
      'INSERT INTO markets (match_id, name, type) VALUES ($1, $2, $3) RETURNING *',
      [matchId, name, type]
    );
    if (oddsData && Array.isArray(oddsData)) {
      for (const o of oddsData) {
        await query('INSERT INTO odds (market_id, name, value) VALUES ($1, $2, $3)', [market.id, o.name, o.value]);
      }
    }
    res.status(201).json({ success: true, data: market });
  } catch (err) { next(err); }
}

const router = Router();
router.get('/', getOdds);
router.post('/markets', authenticate, requireRole('admin', 'super_admin'), createMarket);
router.patch('/:id', authenticate, requireRole('admin', 'super_admin'), updateOdds);
export default router;
