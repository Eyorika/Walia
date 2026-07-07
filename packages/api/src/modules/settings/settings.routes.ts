import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import type { Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../../config/database.js';

const router = Router();

// Public: Get public settings
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await query("SELECT key, value, type, category FROM settings WHERE is_public = true");
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
});

// Admin: Get all settings
router.get('/all', authenticate, requireRole('admin', 'super_admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await query("SELECT * FROM settings ORDER BY category, key");
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
});

// Admin: Update setting
router.put('/:key', authenticate, requireRole('admin', 'super_admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const [setting] = await query(
      "UPDATE settings SET value = $1, updated_by = $2, updated_at = NOW() WHERE key = $3 RETURNING *",
      [value, req.userId, key]
    );
    res.json({ success: true, data: setting });
  } catch (err) { next(err); }
});

export default router;
