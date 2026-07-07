import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import type { Request, Response, NextFunction } from 'express';
import { query } from '../../config/database.js';

async function getNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const notifications = await query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.userId]
    );
    res.json({ success: true, data: notifications });
  } catch (err) { next(err); }
}

async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    await query('UPDATE notifications SET is_read = true WHERE user_id = $1 AND id = ANY($2)', [req.userId, req.body.ids]);
    res.json({ success: true });
  } catch (err) { next(err); }
}

async function markAllRead(req: Request, res: Response, next: NextFunction) {
  try {
    await query('UPDATE notifications SET is_read = true WHERE user_id = $1', [req.userId]);
    res.json({ success: true });
  } catch (err) { next(err); }
}

async function broadcast(req: Request, res: Response, next: NextFunction) {
  try {
    const { title, message, type, userIds } = req.body;
    if (userIds && Array.isArray(userIds)) {
      for (const uid of userIds) {
        await query(
          'INSERT INTO notifications (user_id, type, title, message) VALUES ($1, $2, $3, $4)',
          [uid, type ?? 'system', title, message]
        );
      }
    }
    res.json({ success: true, message: `Notification sent to ${userIds?.length ?? 0} users` });
  } catch (err) { next(err); }
}

const router = Router();
router.get('/', authenticate, getNotifications);
router.post('/read', authenticate, markRead);
router.post('/read-all', authenticate, markAllRead);
router.post('/broadcast', authenticate, requireRole('admin', 'super_admin'), broadcast);
export default router;
