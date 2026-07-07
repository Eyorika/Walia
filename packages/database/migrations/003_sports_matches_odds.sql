-- ============================================================
-- WaliaBet Database Migration 003: Sports, Leagues, Teams
-- ============================================================

-- ─── Sports ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  icon VARCHAR(100),
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_sports_updated_at
  BEFORE UPDATE ON sports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Countries ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS countries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10) UNIQUE NOT NULL,
  flag VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_countries_code ON countries(code);

-- ─── Leagues ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leagues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sport_id UUID NOT NULL REFERENCES sports(id),
  country_id UUID REFERENCES countries(id),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  logo VARCHAR(500),
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leagues_sport_id ON leagues(sport_id);
CREATE INDEX idx_leagues_country_id ON leagues(country_id);

CREATE TRIGGER update_leagues_updated_at
  BEFORE UPDATE ON leagues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Teams ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID REFERENCES leagues(id),
  country_id UUID REFERENCES countries(id),
  name VARCHAR(200) NOT NULL,
  short_name VARCHAR(10),
  logo VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_teams_league_id ON teams(league_id);
CREATE INDEX idx_teams_country_id ON teams(country_id);

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Venues ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  city VARCHAR(100),
  country_id UUID REFERENCES countries(id),
  capacity INT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Matches ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID NOT NULL REFERENCES leagues(id),
  home_team_id UUID NOT NULL REFERENCES teams(id),
  away_team_id UUID NOT NULL REFERENCES teams(id),
  venue_id UUID REFERENCES venues(id),
  kickoff_time TIMESTAMPTZ NOT NULL,
  status VARCHAR(30) DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'live', 'half_time', 'finished', 'postponed', 'cancelled', 'suspended'
  )),
  home_score INT,
  away_score INT,
  minute INT,
  period VARCHAR(20),
  officials JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_matches_league_id ON matches(league_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_kickoff_time ON matches(kickoff_time);
CREATE INDEX idx_matches_home_team ON matches(home_team_id);
CREATE INDEX idx_matches_away_team ON matches(away_team_id);

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Match Timeline ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS match_timelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  minute INT NOT NULL,
  type VARCHAR(30) NOT NULL CHECK (type IN ('goal', 'yellow_card', 'red_card', 'substitution', 'penalty', 'own_goal')),
  team_id UUID REFERENCES teams(id),
  player_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_timeline_match_id ON match_timelines(match_id);

-- ─── Markets ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS markets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(30) DEFAULT 'open' CHECK (status IN ('open', 'suspended', 'closed', 'settled')),
  is_locked BOOLEAN DEFAULT false,
  is_suspended BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_markets_match_id ON markets(match_id);
CREATE INDEX idx_markets_status ON markets(status);

CREATE TRIGGER update_markets_updated_at
  BEFORE UPDATE ON markets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Odds ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS odds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  value DECIMAL(10, 3) NOT NULL,
  previous_value DECIMAL(10, 3),
  is_active BOOLEAN DEFAULT true,
  is_suspended BOOLEAN DEFAULT false,
  result VARCHAR(10) CHECK (result IN ('win', 'lose', 'void')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_odds_market_id ON odds(market_id);

CREATE TRIGGER update_odds_updated_at
  BEFORE UPDATE ON odds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Odds History ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS odds_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  odd_id UUID NOT NULL REFERENCES odds(id) ON DELETE CASCADE,
  old_value DECIMAL(10, 3) NOT NULL,
  new_value DECIMAL(10, 3) NOT NULL,
  changed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_odds_history_odd_id ON odds_history(odd_id);
