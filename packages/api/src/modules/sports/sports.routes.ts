import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import { getSports, createSport, getLeagues, getTeams, getCountries } from './sports.controller.js';

const router = Router();

router.get('/', getSports);
router.post('/', authenticate, requireRole('admin', 'super_admin'), createSport);
router.get('/leagues', getLeagues);
router.get('/teams', getTeams);
router.get('/countries', getCountries);

export default router;
