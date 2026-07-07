// ─── Roles ─────────────────────────────────────────────────────────────────
export const ROLES = {
  GUEST: 'guest',
  CUSTOMER: 'customer',
  AGENT: 'agent',
  SUPPORT_STAFF: 'support_staff',
  FINANCE_OFFICER: 'finance_officer',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;

export type RoleKey = keyof typeof ROLES;
export type RoleValue = (typeof ROLES)[RoleKey];

// ─── Permissions ───────────────────────────────────────────────────────────
export const PERMISSIONS = {
  // User management
  USERS_READ: 'users:read',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  USERS_SUSPEND: 'users:suspend',
  USERS_BAN: 'users:ban',
  USERS_VERIFY: 'users:verify',
  USERS_WALLET_ADJUST: 'users:wallet_adjust',

  // Roles & Permissions
  ROLES_READ: 'roles:read',
  ROLES_MANAGE: 'roles:manage',

  // Sports management
  SPORTS_READ: 'sports:read',
  SPORTS_CREATE: 'sports:create',
  SPORTS_UPDATE: 'sports:update',
  SPORTS_DELETE: 'sports:delete',

  // Match management
  MATCHES_READ: 'matches:read',
  MATCHES_CREATE: 'matches:create',
  MATCHES_UPDATE: 'matches:update',
  MATCHES_DELETE: 'matches:delete',
  MATCHES_SETTLE: 'matches:settle',

  // Odds management
  ODDS_READ: 'odds:read',
  ODDS_UPDATE: 'odds:update',
  ODDS_SUSPEND: 'odds:suspend',

  // Bets management
  BETS_READ: 'bets:read',
  BETS_SETTLE: 'bets:settle',
  BETS_VOID: 'bets:void',
  BETS_CANCEL: 'bets:cancel',

  // Wallet management
  DEPOSITS_READ: 'deposits:read',
  DEPOSITS_APPROVE: 'deposits:approve',
  DEPOSITS_REJECT: 'deposits:reject',
  WITHDRAWALS_READ: 'withdrawals:read',
  WITHDRAWALS_APPROVE: 'withdrawals:approve',
  WITHDRAWALS_REJECT: 'withdrawals:reject',

  // Promotions
  PROMOTIONS_READ: 'promotions:read',
  PROMOTIONS_CREATE: 'promotions:create',
  PROMOTIONS_UPDATE: 'promotions:update',
  PROMOTIONS_DELETE: 'promotions:delete',

  // Support
  SUPPORT_READ: 'support:read',
  SUPPORT_REPLY: 'support:reply',
  SUPPORT_ASSIGN: 'support:assign',
  SUPPORT_CLOSE: 'support:close',

  // CMS
  CMS_READ: 'cms:read',
  CMS_MANAGE: 'cms:manage',

  // Reports
  REPORTS_READ: 'reports:read',
  REPORTS_EXPORT: 'reports:export',

  // Settings
  SETTINGS_READ: 'settings:read',
  SETTINGS_MANAGE: 'settings:manage',

  // Audit
  AUDIT_READ: 'audit:read',

  // Notifications
  NOTIFICATIONS_SEND: 'notifications:send',

  // Staff management
  STAFF_READ: 'staff:read',
  STAFF_MANAGE: 'staff:manage',
} as const;

// Default permissions per role
export const ROLE_PERMISSIONS: Record<RoleValue, string[]> = {
  guest: [],
  customer: [],
  agent: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.BETS_READ,
    PERMISSIONS.DEPOSITS_READ,
    PERMISSIONS.WITHDRAWALS_READ,
    PERMISSIONS.REPORTS_READ,
  ],
  support_staff: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.BETS_READ,
    PERMISSIONS.SUPPORT_READ,
    PERMISSIONS.SUPPORT_REPLY,
    PERMISSIONS.SUPPORT_ASSIGN,
    PERMISSIONS.SUPPORT_CLOSE,
  ],
  finance_officer: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.DEPOSITS_READ,
    PERMISSIONS.DEPOSITS_APPROVE,
    PERMISSIONS.DEPOSITS_REJECT,
    PERMISSIONS.WITHDRAWALS_READ,
    PERMISSIONS.WITHDRAWALS_APPROVE,
    PERMISSIONS.WITHDRAWALS_REJECT,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.REPORTS_EXPORT,
  ],
  admin: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_SUSPEND,
    PERMISSIONS.USERS_VERIFY,
    PERMISSIONS.USERS_WALLET_ADJUST,
    PERMISSIONS.SPORTS_READ,
    PERMISSIONS.SPORTS_CREATE,
    PERMISSIONS.SPORTS_UPDATE,
    PERMISSIONS.MATCHES_READ,
    PERMISSIONS.MATCHES_CREATE,
    PERMISSIONS.MATCHES_UPDATE,
    PERMISSIONS.MATCHES_SETTLE,
    PERMISSIONS.ODDS_READ,
    PERMISSIONS.ODDS_UPDATE,
    PERMISSIONS.ODDS_SUSPEND,
    PERMISSIONS.BETS_READ,
    PERMISSIONS.BETS_SETTLE,
    PERMISSIONS.BETS_VOID,
    PERMISSIONS.DEPOSITS_READ,
    PERMISSIONS.DEPOSITS_APPROVE,
    PERMISSIONS.DEPOSITS_REJECT,
    PERMISSIONS.WITHDRAWALS_READ,
    PERMISSIONS.WITHDRAWALS_APPROVE,
    PERMISSIONS.WITHDRAWALS_REJECT,
    PERMISSIONS.PROMOTIONS_READ,
    PERMISSIONS.PROMOTIONS_CREATE,
    PERMISSIONS.PROMOTIONS_UPDATE,
    PERMISSIONS.SUPPORT_READ,
    PERMISSIONS.SUPPORT_REPLY,
    PERMISSIONS.SUPPORT_ASSIGN,
    PERMISSIONS.CMS_READ,
    PERMISSIONS.CMS_MANAGE,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.NOTIFICATIONS_SEND,
    PERMISSIONS.STAFF_READ,
    PERMISSIONS.AUDIT_READ,
  ],
  super_admin: Object.values(PERMISSIONS),
};

// ─── Currency Constants ─────────────────────────────────────────────────────
export const CURRENCY = {
  CODE: 'ETB',
  SYMBOL: 'Birr',
  NAME: 'Ethiopian Birr',
  DECIMALS: 2,
} as const;

export const PAYMENT_PROVIDERS = {
  TELEBIRR: 'telebirr',
  CHAPA: 'chapa',
  MPESA: 'mpesa',
  CBE: 'cbe',
  MANUAL: 'manual',
} as const;

export const PAYMENT_LIMITS = {
  MIN_DEPOSIT: 100,
  MAX_DEPOSIT: 500000,
  MIN_WITHDRAWAL: 200,
  MAX_WITHDRAWAL: 100000,
  MIN_BET: 10,
  MAX_BET: 100000,
} as const;

// ─── Sports Constants ───────────────────────────────────────────────────────
export const SPORTS = [
  { name: 'Football', slug: 'football', icon: '⚽' },
  { name: 'Basketball', slug: 'basketball', icon: '🏀' },
  { name: 'Tennis', slug: 'tennis', icon: '🎾' },
  { name: 'Volleyball', slug: 'volleyball', icon: '🏐' },
  { name: 'UFC / MMA', slug: 'ufc', icon: '🥊' },
  { name: 'Boxing', slug: 'boxing', icon: '🥋' },
  { name: 'eSports', slug: 'esports', icon: '🎮' },
  { name: 'Virtual Sports', slug: 'virtual', icon: '💻' },
] as const;

// ─── Market Types ───────────────────────────────────────────────────────────
export const MARKET_TYPES = {
  MATCH_WINNER: 'match_winner',
  DOUBLE_CHANCE: 'double_chance',
  DRAW_NO_BET: 'draw_no_bet',
  OVER_UNDER: 'over_under',
  BOTH_TEAMS_SCORE: 'both_teams_score',
  HALF_TIME: 'half_time',
  CORRECT_SCORE: 'correct_score',
  CORNERS: 'corners',
  CARDS: 'cards',
  PLAYER_MARKET: 'player_market',
  SPECIAL: 'special',
} as const;

// ─── Status Constants ───────────────────────────────────────────────────────
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
} as const;
