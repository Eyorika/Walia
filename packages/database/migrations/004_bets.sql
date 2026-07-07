-- ============================================================
-- WaliaBet Database Migration 004: Bets
-- ============================================================

-- ─── Bets ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(20) NOT NULL CHECK (type IN ('single', 'accumulator', 'system')),
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN (
    'pending', 'open', 'won', 'lost', 'void', 'cancelled', 'partially_won'
  )),
  stake DECIMAL(18, 2) NOT NULL,
  potential_win DECIMAL(18, 2) NOT NULL,
  actual_win DECIMAL(18, 2),
  currency VARCHAR(10) DEFAULT 'ETB',
  total_odds DECIMAL(10, 3) NOT NULL,
  system_size INT,
  wallet_type VARCHAR(20) DEFAULT 'main',
  use_bonus BOOLEAN DEFAULT false,
  settled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  settled_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bets_user_id ON bets(user_id);
CREATE INDEX idx_bets_status ON bets(status);
CREATE INDEX idx_bets_type ON bets(type);
CREATE INDEX idx_bets_created_at ON bets(created_at);

CREATE TRIGGER update_bets_updated_at
  BEFORE UPDATE ON bets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Bet Items ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bet_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bet_id UUID NOT NULL REFERENCES bets(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id),
  market_id UUID NOT NULL REFERENCES markets(id),
  odd_id UUID NOT NULL REFERENCES odds(id),
  odd_value DECIMAL(10, 3) NOT NULL,
  selection VARCHAR(200) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'void')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bet_items_bet_id ON bet_items(bet_id);
CREATE INDEX idx_bet_items_match_id ON bet_items(match_id);

-- ─── Results ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) UNIQUE,
  home_score INT NOT NULL DEFAULT 0,
  away_score INT NOT NULL DEFAULT 0,
  half_time_home INT,
  half_time_away INT,
  winner VARCHAR(10) CHECK (winner IN ('home', 'away', 'draw')),
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'disputed')),
  settled_markets INT DEFAULT 0,
  settled_by UUID REFERENCES users(id),
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_results_updated_at
  BEFORE UPDATE ON results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
