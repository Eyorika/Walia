import pg from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '.env') });

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL is missing in .env');
  process.exit(1);
}

// Hashed password for 'Password123' using bcrypt with 12 rounds
const HASHED_PASSWORD = '$2a$12$lOsn0H09c1ZshWp6R.Q6tOrzHh0G3Rj.h5T3Qk3Z7jBq/G9hE8v3O';

async function seed() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database for seeding...');

    console.log('Clearing existing data from all tables...');
    await client.query(`
      TRUNCATE roles, users, wallets, telegram_link_codes, sports, countries, leagues, teams, matches, markets, odds, odds_history, bet_items, bets, referrals, kyc_documents, user_sessions, login_logs, wallet_transactions, deposits CASCADE;
    `);

    // 1. Roles
    console.log('Inserting roles...');
    await client.query(`
      INSERT INTO roles (name, display_name, description, is_system) VALUES
      ('admin', 'Administrator', 'System administrator with full access', true),
      ('customer', 'Customer', 'End user account for placing bets', true),
      ('agent', 'Agent', 'Local betting shop agent', true);
    `);

    // 2. Default Countries
    console.log('Inserting countries...');
    const countryRes = await client.query(`
      INSERT INTO countries (name, code) VALUES
      ('Ethiopia', 'ET'),
      ('United Kingdom', 'GB'),
      ('United States', 'US')
      RETURNING id, code;
    `);
    const countries = countryRes.rows.reduce((acc: any, row: any) => {
      acc[row.code] = row.id;
      return acc;
    }, {});

    // 3. Test User
    console.log('Inserting test user...');
    const userRes = await client.query(`
      INSERT INTO users (email, phone, username, first_name, last_name, password_hash, role, status, email_verified, phone_verified)
      VALUES (
        'test@waliabet.com', 
        '+251911223344', 
        'testuser', 
        'Abebe', 
        'Kebede', 
        $1, 
        'customer', 
        'active', 
        true, 
        true
      )
      RETURNING id;
    `, [HASHED_PASSWORD]);
    
    const userId = userRes.rows[0].id;

    // 4. Test User Wallets
    console.log('Ensuring wallets exist for test user...');
    await client.query(`
      INSERT INTO wallets (user_id, type, balance, currency) VALUES
      ($1, 'main', 1000.00, 'ETB'),
      ($1, 'bonus', 500.00, 'ETB');
    `, [userId]);

    // 5. Telegram Link Code for Test User
    console.log('Creating telegram link code for test user...');
    const linkCode = 'A8D3J2';
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await client.query(`
      INSERT INTO telegram_link_codes (user_id, code, expires_at, used)
      VALUES ($1, $2, $3, false);
    `, [userId, linkCode, expiresAt]);

    // 6. Sports
    console.log('Inserting sports...');
    const sportRes = await client.query(`
      INSERT INTO sports (name, slug, icon, display_order, is_active) VALUES
      ('Football', 'football', 'soccer', 1, true),
      ('Basketball', 'basketball', 'basketball', 2, true)
      RETURNING id, slug;
    `);
    const sports = sportRes.rows.reduce((acc: any, row: any) => {
      acc[row.slug] = row.id;
      return acc;
    }, {});

    // 7. Leagues
    console.log('Inserting leagues...');
    const leagueRes = await client.query(`
      INSERT INTO leagues (sport_id, country_id, name, slug) VALUES
      ($1, $2, 'English Premier League', 'epl'),
      ($3, $4, 'Ethiopian Premier League', 'ethiopian-premier-league'),
      ($5, $6, 'NBA', 'nba')
      RETURNING id, slug;
    `, [
      sports['football'], countries['GB'],
      sports['football'], countries['ET'],
      sports['basketball'], countries['US']
    ]);
    const leagues = leagueRes.rows.reduce((acc: any, row: any) => {
      acc[row.slug] = row.id;
      return acc;
    }, {});

    // 8. Teams
    console.log('Inserting teams...');
    const teams = [
      { name: 'Arsenal', slug: 'arsenal', league: 'epl', country: 'GB' },
      { name: 'Chelsea', slug: 'chelsea', league: 'epl', country: 'GB' },
      { name: 'Saint George SC', slug: 'saint-george', league: 'ethiopian-premier-league', country: 'ET' },
      { name: 'Ethiopian Coffee SC', slug: 'ethiopian-coffee', league: 'ethiopian-premier-league', country: 'ET' },
      { name: 'LA Lakers', slug: 'lakers', league: 'nba', country: 'US' },
      { name: 'Boston Celtics', slug: 'celtics', league: 'nba', country: 'US' }
    ];

    const teamIds: any = {};
    for (const t of teams) {
      const res = await client.query(`
        INSERT INTO teams (league_id, country_id, name)
        VALUES ($1, $2, $3)
        RETURNING id;
      `, [leagues[t.league], countries[t.country], t.name]);
      teamIds[t.slug] = res.rows[0].id;
    }

    // 9. Clear existing matches/markets/odds to avoid constraint violations during reseeding
    await client.query(`TRUNCATE odds_history, bet_items, bets, odds, markets, matches CASCADE;`);

    // 10. Matches
    console.log('Inserting matches...');
    const now = new Date();
    
    // Match 1: Saint George vs Ethiopian Coffee (Today, Live in 1 hour)
    const kickoff1 = new Date(now.getTime() + 1 * 60 * 60 * 1000);
    const match1Res = await client.query(`
      INSERT INTO matches (league_id, home_team_id, away_team_id, kickoff_time, status)
      VALUES ($1, $2, $3, $4, 'scheduled')
      RETURNING id;
    `, [leagues['ethiopian-premier-league'], teamIds['saint-george'], teamIds['ethiopian-coffee'], kickoff1]);
    const match1Id = match1Res.rows[0].id;

    // Match 2: Arsenal vs Chelsea (Today, Live in 3 hours)
    const kickoff2 = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    const match2Res = await client.query(`
      INSERT INTO matches (league_id, home_team_id, away_team_id, kickoff_time, status)
      VALUES ($1, $2, $3, $4, 'scheduled')
      RETURNING id;
    `, [leagues['epl'], teamIds['arsenal'], teamIds['chelsea'], kickoff2]);
    const match2Id = match2Res.rows[0].id;

    // Match 3: LA Lakers vs Boston Celtics (Today, Live in 5 hours)
    const kickoff3 = new Date(now.getTime() + 5 * 60 * 60 * 1000);
    const match3Res = await client.query(`
      INSERT INTO matches (league_id, home_team_id, away_team_id, kickoff_time, status)
      VALUES ($1, $2, $3, $4, 'scheduled')
      RETURNING id;
    `, [leagues['nba'], teamIds['lakers'], teamIds['celtics'], kickoff3]);
    const match3Id = match3Res.rows[0].id;

    // 11. Markets & Odds
    console.log('Inserting markets and odds...');
    
    // Match 1 Markets
    const m1MarketRes = await client.query(`
      INSERT INTO markets (match_id, name, type, status)
      VALUES ($1, 'Match Result (1X2)', '1x2', 'open')
      RETURNING id;
    `, [match1Id]);
    const m1MarketId = m1MarketRes.rows[0].id;

    await client.query(`
      INSERT INTO odds (market_id, name, value) VALUES
      ($1, '1', 2.10),
      ($1, 'X', 3.20),
      ($1, '2', 2.90);
    `, [m1MarketId]);

    // Match 2 Markets
    const m2MarketRes = await client.query(`
      INSERT INTO markets (match_id, name, type, status)
      VALUES ($1, 'Match Result (1X2)', '1x2', 'open')
      RETURNING id;
    `, [match2Id]);
    const m2MarketId = m2MarketRes.rows[0].id;

    await client.query(`
      INSERT INTO odds (market_id, name, value) VALUES
      ($1, '1', 1.80),
      ($1, 'X', 3.60),
      ($1, '2', 3.80);
    `, [m2MarketId]);

    // Match 3 Markets
    const m3MarketRes = await client.query(`
      INSERT INTO markets (match_id, name, type, status)
      VALUES ($1, 'Moneyline (Winner)', 'winner', 'open')
      RETURNING id;
    `, [match3Id]);
    const m3MarketId = m3MarketRes.rows[0].id;

    await client.query(`
      INSERT INTO odds (market_id, name, value) VALUES
      ($1, '1', 1.65),
      ($1, '2', 2.25);
    `, [m3MarketId]);

    console.log('\n🎉 Seeding completed successfully!');
    console.log(`ℹ️ Test User Email: test@waliabet.com`);
    console.log(`ℹ️ Test User Username: testuser`);
    console.log(`ℹ️ Telegram Link Code: ${linkCode}`);

  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    await client.end();
  }
}

seed();
