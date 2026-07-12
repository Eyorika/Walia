import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { query, queryOne } from './db.js';

const app = express();
const PORT = parseInt(process.env.PORT || process.env.AUTH_SERVER_PORT || '4001', 10);

// ─── CORS ─────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.APP_URL,
  process.env.ADMIN_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman) or from allowed origins
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));

app.use(express.json());

// ─── Telegram Auth Verification ───────────────────────────────
/**
 * Verifies the Telegram Login Widget payload.
 * See: https://core.telegram.org/widgets/login#checking-authorization
 */
function verifyTelegramAuth(data: Record<string, string>): boolean {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return false;

  const { hash, ...rest } = data;
  if (!hash) return false;

  // Check auth_date is not older than 24 hours
  const authDate = parseInt(rest.auth_date || '0', 10);
  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > 86400) return false;

  // Build the data-check string: sorted key=value pairs joined by \n
  const dataCheckString = Object.keys(rest)
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join('\n');

  // The secret key is SHA256 of the bot token
  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const expectedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  return expectedHash === hash;
}

// ─── POST /auth/telegram ──────────────────────────────────────
app.post('/auth/telegram', async (req, res) => {
  try {
    const data = req.body as Record<string, string>;

    if (!verifyTelegramAuth(data)) {
      res.status(401).json({ error: 'Invalid Telegram authentication data' });
      return;
    }

    const telegramId = String(data.id);
    const firstName = data.first_name || '';
    const lastName = data.last_name || '';
    const username = data.username || `tg_${telegramId}`;

    // Check if user with this telegram_id exists
    let user = await queryOne<{
      id: string;
      email: string;
      username: string;
      first_name: string;
      last_name: string;
      role: string;
      status: string;
    }>(`SELECT id, email, username, first_name, last_name, role, status FROM users WHERE telegram_id = $1`, [telegramId]);

    if (!user) {
      // Check if username is taken, generate a unique one
      let finalUsername = username;
      const existingByUsername = await queryOne(
        `SELECT id FROM users WHERE username = $1`,
        [finalUsername]
      );
      if (existingByUsername) {
        finalUsername = `${username}_${telegramId.slice(-4)}`;
      }

      // Ensure the 'customer' role exists (handles fresh/unseeded databases)
      await query(`
        INSERT INTO roles (name, display_name, description, is_system)
        VALUES ('customer', 'Customer', 'End user account for placing bets', true)
        ON CONFLICT (name) DO NOTHING
      `);

      // Create a new user account via Telegram
      const newUser = await queryOne<{
        id: string;
        email: string;
        username: string;
        first_name: string;
        last_name: string;
        role: string;
        status: string;
      }>(`
        INSERT INTO users (
          email, username, first_name, last_name,
          password_hash, telegram_id, role, status,
          email_verified, phone_verified
        ) VALUES (
          $1, $2, $3, $4,
          'telegram_oauth_no_password', $5, 'customer', 'active',
          false, false
        )
        RETURNING id, email, username, first_name, last_name, role, status
      `, [
        `tg_${telegramId}@waliabet.internal`, // placeholder email
        finalUsername,
        firstName || `User${telegramId.slice(-4)}`,
        lastName || '',
        telegramId,
      ]);

      if (!newUser) {
        res.status(500).json({ error: 'Failed to create user account' });
        return;
      }

      user = newUser;

      // Create main and bonus wallets for the new user (ON CONFLICT for safety)
      await query(`
        INSERT INTO wallets (user_id, type, balance, currency) VALUES
        ($1, 'main', 0.00, 'ETB'),
        ($1, 'bonus', 0.00, 'ETB')
        ON CONFLICT (user_id, type) DO NOTHING
      `, [user.id]);
    } else if (user.status === 'banned' || user.status === 'suspended') {
      res.status(403).json({ error: `Account is ${user.status}` });
      return;
    }

    // Issue JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      res.status(500).json({ error: 'Server configuration error' });
      return;
    }

    const sessionId = crypto.randomUUID();

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        sessionId,
      },
      jwtSecret,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any }
    );

    const refreshToken = jwt.sign(
      {
        userId: user.id,
        sessionId,
      },
      (process.env.JWT_REFRESH_SECRET || jwtSecret) as string,
      { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any }
    );

    // Insert session into DB to make token valid on API server
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await query(
      `INSERT INTO user_sessions (id, user_id, refresh_token, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [sessionId, user.id, refreshToken, req.ip, req.headers['user-agent'] || null, expiresAt]
    );

    res.json({
      token,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        telegram_id: telegramId,
        photo_url: data.photo_url || null,
      },
    });
  } catch (err: any) {
    console.error('❌ /auth/telegram error:', err?.message || err);
    if (err?.detail) console.error('  DB detail:', err.detail);
    if (err?.code) console.error('  DB code:', err.code);
    res.status(500).json({ error: 'Internal server error', detail: err?.message });
  }
});

// ─── GET /health ──────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'WaliaBet Auth Server', port: PORT });
});

// ─── Start ────────────────────────────────────────────────────
export function startAuthServer() {
  app.listen(PORT, () => {
    console.log(`🔐 WaliaBet Auth Server running on http://localhost:${PORT}`);
  });
}
