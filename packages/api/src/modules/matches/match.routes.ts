import { Router } from 'express';
import { authenticate, requireRole, optionalAuth } from '../../middleware/auth.middleware.js';
import { getMatches, getLiveMatches, getMatchById, createMatch, updateMatchResult } from './match.controller.js';

const router = Router();

router.get('/', optionalAuth, getMatches);
router.get('/live', getLiveMatches);
router.get('/:id', optionalAuth, getMatchById);
router.post('/', authenticate, requireRole('admin', 'super_admin'), createMatch);
router.patch('/:id/result', authenticate, requireRole('admin', 'super_admin'), updateMatchResult);

export default router;
