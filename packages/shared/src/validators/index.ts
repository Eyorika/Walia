import { z } from 'zod';

// ─── Auth Validators ──────────────────────────────────────────────────────────
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/(?=.*\d)/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  dateOfBirth: z.string().optional(),
  referralCode: z.string().optional(),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  twoFactorCode: z.string().length(6, 'Invalid 2FA code').optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/(?=.*[a-z])/, 'Must contain lowercase')
    .regex(/(?=.*[A-Z])/, 'Must contain uppercase')
    .regex(/(?=.*\d)/, 'Must contain number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// ─── Bet Validators ───────────────────────────────────────────────────────────
export const placeBetSchema = z.object({
  type: z.enum(['single', 'accumulator', 'system']),
  stake: z.number().positive('Stake must be positive').min(10, 'Minimum stake is 10 ETB'),
  systemSize: z.number().int().positive().optional(),
  items: z.array(z.object({
    matchId: z.string().uuid(),
    marketId: z.string().uuid(),
    oddId: z.string().uuid(),
    oddValue: z.number().positive(),
    selection: z.string(),
  })).min(1, 'At least one selection is required'),
  useBonus: z.boolean().default(false),
});

// ─── Deposit Validators ────────────────────────────────────────────────────────
export const depositSchema = z.object({
  amount: z.number().positive().min(100, 'Minimum deposit is 100 ETB').max(500000),
  provider: z.enum(['telebirr', 'chapa', 'mpesa', 'cbe']),
  phoneNumber: z.string().optional(),
  transactionRef: z.string().optional(),
});

export const withdrawalSchema = z.object({
  amount: z.number().positive().min(200, 'Minimum withdrawal is 200 ETB').max(100000),
  provider: z.enum(['telebirr', 'chapa', 'mpesa', 'cbe']),
  accountNumber: z.string().min(5, 'Invalid account number'),
  accountName: z.string().min(2, 'Account name is required'),
});

// ─── Match Validators ─────────────────────────────────────────────────────────
export const createMatchSchema = z.object({
  leagueId: z.string().uuid(),
  homeTeamId: z.string().uuid(),
  awayTeamId: z.string().uuid(),
  venueId: z.string().uuid().optional(),
  kickoffTime: z.string().datetime(),
});

export const updateMatchResultSchema = z.object({
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
  status: z.enum(['finished']),
});

// ─── Pagination Validator ─────────────────────────────────────────────────────
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ─── Promo Validators ─────────────────────────────────────────────────────────
export const applyPromoCodeSchema = z.object({
  code: z.string().min(3, 'Invalid promo code').max(20),
});

// ─── Profile Validators ───────────────────────────────────────────────────────
export const updateProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
});

// ─── Support Validators ───────────────────────────────────────────────────────
export const createTicketSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200),
  category: z.string(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  message: z.string().min(20, 'Message must be at least 20 characters'),
});

export const sendMessageSchema = z.object({
  message: z.string().min(1).max(5000),
  isInternal: z.boolean().default(false),
});

// ─── Exported Types ───────────────────────────────────────────────────────────
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type PlaceBetInput = z.infer<typeof placeBetSchema>;
export type DepositInput = z.infer<typeof depositSchema>;
export type WithdrawalInput = z.infer<typeof withdrawalSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
