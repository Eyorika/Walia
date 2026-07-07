import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validator.js';
import { placeBetSchema } from '@waliabet/shared';
import { placeBet, getMyBets, getBetById, settleBet } from './bet.controller.js';

const router = Router();

router.post('/', authenticate, validate(placeBetSchema), placeBet);
router.get('/my', authenticate, getMyBets);
router.get('/:id', authenticate, getBetById);
router.patch('/:betId/settle', authenticate, requireRole('admin', 'super_admin'), settleBet);

export default router;
