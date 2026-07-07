import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import type { Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import { HTTP_STATUS } from '@waliabet/shared';

async function createTicket(req: Request, res: Response, next: NextFunction) {
  try {
    const { subject, category, priority, message } = req.body;
    const [ticket] = await query(
      "INSERT INTO support_tickets (user_id, subject, category, priority, status) VALUES ($1, $2, $3, $4, 'open') RETURNING *",
      [req.userId, subject, category, priority ?? 'medium']
    );
    await query(
      'INSERT INTO ticket_messages (ticket_id, sender_id, message) VALUES ($1, $2, $3)',
      [(ticket as {id: string}).id, req.userId, message]
    );
    res.status(201).json({ success: true, data: ticket });
  } catch (err) { next(err); }
}

async function getMyTickets(req: Request, res: Response, next: NextFunction) {
  try {
    const tickets = await query(
      'SELECT * FROM support_tickets WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json({ success: true, data: tickets });
  } catch (err) { next(err); }
}

async function getTicket(req: Request, res: Response, next: NextFunction) {
  try {
    const ticket = await queryOne('SELECT * FROM support_tickets WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    if (!ticket) throw new AppError('Ticket not found', HTTP_STATUS.NOT_FOUND);
    const messages = await query(
      `SELECT tm.*, u.username, u.first_name, u.last_name FROM ticket_messages tm
       JOIN users u ON tm.sender_id = u.id
       WHERE tm.ticket_id = $1 AND (tm.is_internal = false OR $2 IN ('admin','super_admin'))
       ORDER BY tm.created_at ASC`,
      [req.params.id, req.user?.role ?? 'customer']
    );
    res.json({ success: true, data: { ...ticket, messages } });
  } catch (err) { next(err); }
}

async function replyTicket(req: Request, res: Response, next: NextFunction) {
  try {
    const { message, isInternal } = req.body;
    await query(
      'INSERT INTO ticket_messages (ticket_id, sender_id, message, is_internal) VALUES ($1, $2, $3, $4)',
      [req.params.id, req.userId, message, isInternal ?? false]
    );
    await query("UPDATE support_tickets SET status = 'in_progress', updated_at = NOW() WHERE id = $1", [req.params.id]);
    res.json({ success: true, message: 'Reply sent' });
  } catch (err) { next(err); }
}

async function getAllTickets(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const where = status ? `WHERE st.status = '${status}'` : '';
    const tickets = await query(
      `SELECT st.*, u.username, u.email FROM support_tickets st JOIN users u ON st.user_id = u.id ${where} ORDER BY st.created_at DESC LIMIT $1 OFFSET $2`,
      [Number(limit), offset]
    );
    res.json({ success: true, data: tickets });
  } catch (err) { next(err); }
}

const router = Router();
router.post('/', authenticate, createTicket);
router.get('/my', authenticate, getMyTickets);
router.get('/all', authenticate, requireRole('admin', 'super_admin', 'support_staff'), getAllTickets);
router.get('/:id', authenticate, getTicket);
router.post('/:id/reply', authenticate, replyTicket);
export default router;
