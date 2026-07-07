-- ============================================================
-- WaliaBet Database Migration 005: Promotions & Referrals
-- ============================================================

-- ─── Promotions ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'welcome_bonus', 'deposit_bonus', 'cashback', 'free_bet', 'referral', 'loyalty'
  )),
  status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'upcoming')),
  value DECIMAL(18, 2) NOT NULL,
  value_type VARCHAR(20) DEFAULT 'percentage' CHECK (value_type IN ('percentage', 'fixed')),
  min_deposit DECIMAL(18, 2),
  max_bonus DECIMAL(18, 2),
  wagering_requirement DECIMAL(10, 2) DEFAULT 1.0,
  min_odds DECIMAL(10, 3),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  image VARCHAR(500),
  terms_conditions TEXT,
  is_recurring BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_promotions_status ON promotions(status);
CREATE INDEX idx_promotions_type ON promotions(type);

CREATE TRIGGER update_promotions_updated_at
  BEFORE UPDATE ON promotions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Promo Codes ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  code VARCHAR(30) UNIQUE NOT NULL,
  usage_limit INT,
  usage_count INT DEFAULT 0,
  per_user_limit INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_promo_codes_code ON promo_codes(code);

-- ─── User Promotions ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  promotion_id UUID NOT NULL REFERENCES promotions(id),
  promo_code_id UUID REFERENCES promo_codes(id),
  bonus_amount DECIMAL(18, 2) NOT NULL,
  wagering_remaining DECIMAL(18, 2),
  status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, promotion_id)
);

CREATE INDEX idx_user_promotions_user_id ON user_promotions(user_id);

-- ─── Referrals ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES users(id),
  referee_id UUID NOT NULL REFERENCES users(id) UNIQUE,
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paid')),
  commission_rate DECIMAL(5, 2) DEFAULT 5.00,
  total_earned DECIMAL(18, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);

-- ─── Commissions ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_id UUID NOT NULL REFERENCES referrals(id),
  agent_id UUID NOT NULL REFERENCES users(id),
  source_user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(30) CHECK (type IN ('bet', 'deposit')),
  gross_amount DECIMAL(18, 2) NOT NULL,
  commission_rate DECIMAL(5, 2) NOT NULL,
  commission_amount DECIMAL(18, 2) NOT NULL,
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_commissions_agent_id ON commissions(agent_id);
CREATE INDEX idx_commissions_referral_id ON commissions(referral_id);

-- ─── Loyalty Points ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loyalty_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) UNIQUE,
  points INT DEFAULT 0,
  lifetime_points INT DEFAULT 0,
  tier VARCHAR(30) DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loyalty_user_id ON loyalty_points(user_id);
