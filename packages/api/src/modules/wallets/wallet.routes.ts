import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validator.js';
import { depositSchema, withdrawalSchema } from '@waliabet/shared';
import { getBalance, initiateDeposit, initiateWithdrawal, getTransactions, chapaWebhook } from './wallet.controller.js';

const router = Router();

router.get('/balance', authenticate, getBalance);
router.post('/deposit', authenticate, validate(depositSchema), initiateDeposit);
router.post('/withdraw', authenticate, validate(withdrawalSchema), initiateWithdrawal);
router.get('/transactions', authenticate, getTransactions);
router.post('/callbacks/chapa', chapaWebhook);

export default router;
