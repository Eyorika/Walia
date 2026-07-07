// ─── User Types ─────────────────────────────────────────────────────────────
export type UserRole =
  | 'guest'
  | 'customer'
  | 'agent'
  | 'support_staff'
  | 'finance_officer'
  | 'admin'
  | 'super_admin';

export type UserStatus = 'active' | 'suspended' | 'banned' | 'pending_verification';
export type KycStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';
export type Gender = 'male' | 'female' | 'other';

export interface User {
  id: string;
  email: string;
  phone?: string;
  username: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: Gender;
  country?: string;
  city?: string;
  address?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  kycStatus: KycStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  telegramId?: string;
  referralCode: string;
  referredBy?: string;
  agentId?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  ipAddress: string;
  userAgent: string;
  device?: string;
  location?: string;
  expiresAt: string;
  createdAt: string;
}

export interface LoginHistory {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  failureReason?: string;
  createdAt: string;
}

// ─── Wallet Types ────────────────────────────────────────────────────────────
export type WalletType = 'main' | 'bonus';
export type TransactionType =
  | 'deposit'
  | 'withdrawal'
  | 'bet_placed'
  | 'bet_won'
  | 'bet_refund'
  | 'bonus_credit'
  | 'referral_earning'
  | 'manual_credit'
  | 'manual_debit'
  | 'commission';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'reversed';

export interface Wallet {
  id: string;
  userId: string;
  type: WalletType;
  balance: number;
  currency: string;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  userId: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  currency: string;
  referenceId?: string;
  referenceType?: string;
  description: string;
  metadata?: Record<string, unknown>;
  status: TransactionStatus;
  createdAt: string;
}

// ─── Payment Types ────────────────────────────────────────────────────────────
export type PaymentProvider = 'telebirr' | 'chapa' | 'mpesa' | 'cbe' | 'manual';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'expired' | 'cancelled';

export interface Deposit {
  id: string;
  userId: string;
  walletId: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  providerRef?: string;
  providerResponse?: Record<string, unknown>;
  status: PaymentStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  screenshot?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Withdrawal {
  id: string;
  userId: string;
  walletId: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  accountNumber: string;
  accountName: string;
  providerRef?: string;
  status: PaymentStatus;
  processedBy?: string;
  processedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Sports Types ─────────────────────────────────────────────────────────────
export interface Sport {
  id: string;
  name: string;
  slug: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Country {
  id: string;
  name: string;
  code: string;
  flag?: string;
  isActive: boolean;
  createdAt: string;
}

export interface League {
  id: string;
  sportId: string;
  countryId: string;
  name: string;
  slug: string;
  logo?: string;
  displayOrder: number;
  isActive: boolean;
  sport?: Sport;
  country?: Country;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  leagueId?: string;
  countryId?: string;
  name: string;
  shortName?: string;
  logo?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Venue {
  id: string;
  name: string;
  city?: string;
  countryId?: string;
  capacity?: number;
  isActive: boolean;
  createdAt: string;
}

// ─── Match Types ──────────────────────────────────────────────────────────────
export type MatchStatus =
  | 'scheduled'
  | 'live'
  | 'half_time'
  | 'finished'
  | 'postponed'
  | 'cancelled'
  | 'suspended';

export interface Match {
  id: string;
  leagueId: string;
  homeTeamId: string;
  awayTeamId: string;
  venueId?: string;
  kickoffTime: string;
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
  minute?: number;
  period?: string;
  league?: League;
  homeTeam?: Team;
  awayTeam?: Team;
  venue?: Venue;
  markets?: Market[];
  createdAt: string;
  updatedAt: string;
}

export interface MatchTimeline {
  id: string;
  matchId: string;
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'penalty' | 'own_goal';
  teamId: string;
  playerId?: string;
  description?: string;
  createdAt: string;
}

// ─── Market & Odds Types ──────────────────────────────────────────────────────
export type MarketStatus = 'open' | 'suspended' | 'closed' | 'settled';

export interface Market {
  id: string;
  matchId: string;
  name: string;
  type: string;
  status: MarketStatus;
  isLocked: boolean;
  isSuspended: boolean;
  odds?: Odd[];
  createdAt: string;
  updatedAt: string;
}

export interface Odd {
  id: string;
  marketId: string;
  name: string;
  value: number;
  previousValue?: number;
  isActive: boolean;
  isSuspended: boolean;
  result?: 'win' | 'lose' | 'void';
  createdAt: string;
  updatedAt: string;
}

// ─── Bet Types ────────────────────────────────────────────────────────────────
export type BetType = 'single' | 'accumulator' | 'system';
export type BetStatus = 'pending' | 'open' | 'won' | 'lost' | 'void' | 'cancelled' | 'partially_won';

export interface Bet {
  id: string;
  userId: string;
  type: BetType;
  status: BetStatus;
  stake: number;
  potentialWin: number;
  actualWin?: number;
  currency: string;
  totalOdds: number;
  systemSize?: number;
  items: BetItem[];
  settledAt?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BetItem {
  id: string;
  betId: string;
  matchId: string;
  marketId: string;
  oddId: string;
  oddValue: number;
  selection: string;
  status: 'pending' | 'won' | 'lost' | 'void';
  match?: Match;
  createdAt: string;
}

// ─── Promotion Types ──────────────────────────────────────────────────────────
export type PromoType = 'welcome_bonus' | 'deposit_bonus' | 'cashback' | 'free_bet' | 'referral' | 'loyalty';
export type PromoStatus = 'active' | 'inactive' | 'expired' | 'upcoming';

export interface Promotion {
  id: string;
  name: string;
  description: string;
  type: PromoType;
  status: PromoStatus;
  value: number;
  valueType: 'percentage' | 'fixed';
  minDeposit?: number;
  maxBonus?: number;
  wageringRequirement?: number;
  startDate: string;
  endDate?: string;
  image?: string;
  termsConditions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromoCode {
  id: string;
  promotionId: string;
  code: string;
  usageLimit?: number;
  usageCount: number;
  perUserLimit: number;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface Referral {
  id: string;
  referrerId: string;
  refereeId: string;
  status: 'pending' | 'active' | 'paid';
  commissionRate: number;
  totalEarned: number;
  createdAt: string;
}

// ─── Notification Types ────────────────────────────────────────────────────────
export type NotificationType =
  | 'bet_won'
  | 'bet_lost'
  | 'bet_placed'
  | 'deposit_success'
  | 'deposit_rejected'
  | 'withdrawal_approved'
  | 'withdrawal_rejected'
  | 'promotion'
  | 'system'
  | 'kyc_approved'
  | 'kyc_rejected'
  | 'goal'
  | 'match_start';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}

// ─── Support Types ────────────────────────────────────────────────────────────
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  assignedTo?: string;
  messages?: TicketMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  message: string;
  isInternal: boolean;
  attachments?: string[];
  createdAt: string;
}

// ─── CMS Types ────────────────────────────────────────────────────────────────
export interface CmsPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  isPublished: boolean;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  position: 'hero' | 'sidebar' | 'popup' | 'footer';
  displayOrder: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

// ─── API Response Types ────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ─── Dashboard Types ───────────────────────────────────────────────────────────
export interface AdminStats {
  totalRevenue: number;
  totalProfit: number;
  totalLoss: number;
  activeUsers: number;
  onlineUsers: number;
  todayBets: number;
  pendingBets: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  currency: string;
}

export interface RevenueChart {
  date: string;
  revenue: number;
  profit: number;
  bets: number;
}
