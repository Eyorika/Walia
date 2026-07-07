-- ============================================================
-- WaliaBet Database Migration 002: Wallets & Payments
-- ============================================================

-- ─── Wallets ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) DEFAULT 'main' CHECK (type IN ('main', 'bonus')),
  balance DECIMAL(18, 2) DEFAULT 0.00,
  currency VARCHAR(10) DEFAULT 'ETB',
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, type)
);

CREATE INDEX idx_wallets_user_id ON wallets(user_id);

CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Wallet Transactions ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES wallets(id),
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'deposit', 'withdrawal', 'bet_placed', 'bet_won', 'bet_refund',
    'bonus_credit', 'referral_earning', 'manual_credit', 'manual_debit', 'commission'
  )),
  amount DECIMAL(18, 2) NOT NULL,
  balance_before DECIMAL(18, 2) NOT NULL,
  balance_after DECIMAL(18, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'ETB',
  reference_id UUID,
  reference_type VARCHAR(50),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  status VARCHAR(30) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wallet_txns_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_txns_user_id ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_txns_type ON wallet_transactions(type);
CREATE INDEX idx_wallet_txns_created_at ON wallet_transactions(created_at);

-- ─── Payment Methods ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('telebirr', 'chapa', 'mpesa', 'cbe', 'manual')),
  logo VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  min_amount DECIMAL(18, 2) DEFAULT 100.00,
  max_amount DECIMAL(18, 2) DEFAULT 500000.00,
  deposit_fee_percent DECIMAL(5, 2) DEFAULT 0.00,
  withdrawal_fee_percent DECIMAL(5, 2) DEFAULT 0.00,
  instructions TEXT,
  metadata JSONB DEFAULT '{}',
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Deposits ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deposits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  wallet_id UUID NOT NULL REFERENCES wallets(id),
  amount DECIMAL(18, 2) NOT NULL,
  fee DECIMAL(18, 2) DEFAULT 0.00,
  net_amount DECIMAL(18, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'ETB',
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('telebirr', 'chapa', 'mpesa', 'cbe', 'manual')),
  provider_ref VARCHAR(200),
  provider_response JSONB DEFAULT '{}',
  phone_number VARCHAR(20),
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired', 'cancelled')),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  screenshot VARCHAR(500),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deposits_user_id ON deposits(user_id);
CREATE INDEX idx_deposits_status ON deposits(status);
CREATE INDEX idx_deposits_provider ON deposits(provider);
CREATE INDEX idx_deposits_created_at ON deposits(created_at);

CREATE TRIGGER update_deposits_updated_at
  BEFORE UPDATE ON deposits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Withdrawals ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  wallet_id UUID NOT NULL REFERENCES wallets(id),
  amount DECIMAL(18, 2) NOT NULL,
  fee DECIMAL(18, 2) DEFAULT 0.00,
  net_amount DECIMAL(18, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'ETB',
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('telebirr', 'chapa', 'mpesa', 'cbe', 'manual')),
  account_number VARCHAR(50) NOT NULL,
  account_name VARCHAR(200) NOT NULL,
  provider_ref VARCHAR(200),
  provider_response JSONB DEFAULT '{}',
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired', 'cancelled')),
  processed_by UUID REFERENCES users(id),
  processed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);
CREATE INDEX idx_withdrawals_created_at ON withdrawals(created_at);

CREATE TRIGGER update_withdrawals_updated_at
  BEFORE UPDATE ON withdrawals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
