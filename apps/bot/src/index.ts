import { config as dotenvConfig } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Load environment from the monorepo root .env
dotenvConfig({ path: resolve(__dirname, '..', '..', '..', '.env') });

import { Telegraf, Markup } from 'telegraf';
import { query, queryOne, transaction } from './db.js';
import { startAuthServer } from './server.js';
import axios from 'axios';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.warn('⚠️ TELEGRAM_BOT_TOKEN is missing. Bot will not start.');
  process.exit(1);
}

const bot = new Telegraf(token);

// ─── Helpers ──────────────────────────────────────────────────
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-ET', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Addis_Ababa',
  });
}

// ─── Welcome / Start ──────────────────────────────────────────
bot.start((ctx) => {
  const username = ctx.from.username || ctx.from.first_name;
  ctx.reply(
    `🇪🇹 Welcome to WaliaBet Bot, @${username}!\n\n` +
    `WaliaBet is Ethiopia's premium sportsbook platform. Check odds, view matches, and deposit Birr via Telebirr or CBE!\n\n` +
    `💡 Commands:\n` +
    `/login - Link your WaliaBet account\n` +
    `/balance - Check your wallet balance\n` +
    `/today - View today's match fixtures\n` +
    `/help - Get help`,
    Markup.keyboard([
      ['⚽ Match Center', '💰 My Balance'],
      ['🎟️ Place Bet', '📞 Support Contact']
    ]).resize()
  );
});

// ─── Login / Link via Telegram Widget ───────────────────────
const WEB_LOGIN_URL = process.env.APP_URL || 'http://localhost:3000';

bot.command('login', (ctx) => {
  const name = ctx.from.first_name;
  ctx.reply(
    `👋 Hi ${name}!\n\n` +
    `To link your WaliaBet account, use the Telegram Login on our website — it only takes one tap:\n\n` +
    `🌐 [Open WaliaBet Login](${WEB_LOGIN_URL}/login)\n\n` +
    `_Tap the link, click "Login with Telegram", and you're done. Your wallet will be ready instantly._`,
    {
      parse_mode: 'Markdown'
    }
  );
});

bot.command('link', async (ctx) => {
  const messageText = ctx.message?.text?.trim() || '';
  const parts = messageText.split(/\s+/);
  
  if (parts.length < 2) {
    return ctx.reply(
      `🔗 *How to link your WaliaBet account*:\n\n` +
      `1. Log in to the WaliaBet website.\n` +
      `2. Go to your Profile settings.\n` +
      `3. Copy your 6-digit Telegram Link Code.\n` +
      `4. Reply to this bot with: \`/link <your_code>\` (e.g., \`/link A8D3J2\`)\n\n` +
      `Alternatively, you can link directly via the website:\n` +
      `🌐 [Link via Telegram Login](${WEB_LOGIN_URL}/login)`,
      { parse_mode: 'Markdown' }
    );
  }

  const codeInput = parts[1].trim().toUpperCase();
  const telegramId = String(ctx.from.id);
  
  try {
    const linkCode = await queryOne<{ id: string; user_id: string; expires_at: Date; used: boolean }>(
      `SELECT id, user_id, expires_at, used FROM telegram_link_codes WHERE code = $1`,
      [codeInput]
    );

    if (!linkCode) {
      return ctx.reply(`❌ Invalid link code. Please check the code and try again.`);
    }

    if (linkCode.used) {
      return ctx.reply(`❌ This link code has already been used. Please generate a new one on the website.`);
    }

    if (new Date(linkCode.expires_at) < new Date()) {
      return ctx.reply(`❌ This link code has expired. Please generate a new one on the website.`);
    }

    const existingTgUser = await queryOne<{ id: string; username: string }>(
      `SELECT id, username FROM users WHERE telegram_id = $1`,
      [telegramId]
    );

    if (existingTgUser) {
      return ctx.reply(
        `⚠️ Your Telegram account is already linked to WaliaBet user *@${existingTgUser.username}*.\n\n` +
        `Use /balance to check your wallet balance.`,
        { parse_mode: 'Markdown' }
      );
    }

    const targetUser = await queryOne<{ id: string; username: string; telegram_id: string }>(
      `SELECT id, username, telegram_id FROM users WHERE id = $1`,
      [linkCode.user_id]
    );

    if (!targetUser) {
      return ctx.reply(`❌ Target user not found.`);
    }

    if (targetUser.telegram_id) {
      return ctx.reply(
        `⚠️ The target WaliaBet account is already linked to another Telegram ID.`,
        { parse_mode: 'Markdown' }
      );
    }

    await transaction(async (client) => {
      await client.query(
        `UPDATE users SET telegram_id = $1, updated_at = NOW() WHERE id = $2`,
        [telegramId, linkCode.user_id]
      );

      await client.query(
        `UPDATE telegram_link_codes SET used = true WHERE id = $1`,
        [linkCode.id]
      );
    });

    return ctx.reply(
      `🎉 *Success!* Your Telegram account has been successfully linked to WaliaBet account *@${targetUser.username}*.\n\n` +
      `You can now use /balance to check your wallet balance and view upcoming fixtures!`,
      { parse_mode: 'Markdown' }
    );

  } catch (err) {
    console.error('❌ /link error:', err);
    return ctx.reply(`⚠️ An error occurred while linking your account. Please try again later.`);
  }
});

// ─── Balance Check ────────────────────────────────────────────

async function sendBalance(ctx: any) {
  const telegramId = String(ctx.from.id);

  try {
    const user = await queryOne<{ id: string; username: string; first_name: string }>(
      `SELECT id, username, first_name FROM users WHERE telegram_id = $1`,
      [telegramId]
    );

    if (!user) {
      return ctx.reply(
        `🔗 Your Telegram account is not linked to a WaliaBet account.\n\n` +
        `Use /login to get started.`
      );
    }

    const wallets = await query<{ type: string; balance: string; currency: string }>(
      `SELECT type, balance, currency FROM wallets WHERE user_id = $1 ORDER BY type`,
      [user.id]
    );

    if (wallets.length === 0) {
      return ctx.reply(`⚠️ No wallets found for your account. Please contact support.`);
    }

    const lines = wallets.map((w) => {
      const label = w.type === 'main' ? '💵 Main Wallet' : '🎁 Bonus Wallet';
      return `${label}: *${parseFloat(w.balance).toFixed(2)} ${w.currency}*`;
    });

    ctx.reply(
      `💰 WaliaBet Balances for *@${user.username}*:\n\n` +
      lines.join('\n') + '\n\n' +
      `Use /today to view upcoming matches!`,
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    console.error('❌ /balance error:', err);
    ctx.reply('⚠️ Could not fetch balance. Please try again.');
  }
}

bot.command('balance', sendBalance);
bot.hears('💰 My Balance', sendBalance);

// ─── Today's Fixtures ─────────────────────────────────────────
async function sendToday(ctx: any) {
  try {
    const rows = await query<{
      match_id: string;
      home_team: string;
      away_team: string;
      league: string;
      kickoff_time: Date;
      market_id: string;
      market_type: string;
      odd_name: string;
      odd_value: string;
    }>(`
      SELECT
        m.id AS match_id,
        ht.name AS home_team,
        at.name AS away_team,
        l.name AS league,
        m.kickoff_time,
        mk.id AS market_id,
        mk.type AS market_type,
        o.name AS odd_name,
        o.value AS odd_value
      FROM matches m
      JOIN leagues l ON l.id = m.league_id
      JOIN teams ht ON ht.id = m.home_team_id
      JOIN teams at ON at.id = m.away_team_id
      JOIN markets mk ON mk.match_id = m.id AND mk.status = 'open'
      JOIN odds o ON o.market_id = mk.id AND o.is_active = true
      WHERE
        m.kickoff_time >= NOW()
        AND m.kickoff_time < NOW() + INTERVAL '24 hours'
        AND m.status IN ('scheduled', 'live')
      ORDER BY m.kickoff_time ASC, o.name ASC
    `);

    if (rows.length === 0) {
      return ctx.reply('📭 No matches scheduled for today. Check back later!');
    }

    // Group by match
    const matchMap = new Map<string, typeof rows>();
    for (const row of rows) {
      if (!matchMap.has(row.match_id)) matchMap.set(row.match_id, []);
      matchMap.get(row.match_id)!.push(row);
    }

    const matchIds = [...matchMap.keys()];
    let text = `⚽ Today's Fixtures (${matchIds.length} match${matchIds.length !== 1 ? 'es' : ''}):\n\n`;
    const inlineButtons: ReturnType<typeof Markup.button.callback>[][] = [];

    matchIds.forEach((matchId, idx) => {
      const matchRows = matchMap.get(matchId)!;
      const first = matchRows[0];
      const kickoff = formatTime(new Date(first.kickoff_time));

      // Build odds string
      const oddsStr = matchRows.map((r) => `[${r.odd_name}] ${parseFloat(r.odd_value).toFixed(2)}`).join(' | ');

      text +=
        `${idx + 1}. *${first.home_team}* vs *${first.away_team}*\n` +
        `   🏆 ${first.league} — ⏰ ${kickoff}\n` +
        `   📊 ${oddsStr}\n\n`;

      inlineButtons.push([
        Markup.button.callback(
          `📊 ${first.home_team} vs ${first.away_team}`,
          `odds_${matchId.slice(0, 8)}`
        )
      ]);
    });

    // Dynamic actions registration removed to prevent memory leaks and handle restarts.
    // Captured by global bot.action handler below.

    ctx.reply(text, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(inlineButtons),
    });
  } catch (err) {
    console.error('❌ /today error:', err);
    ctx.reply('⚠️ Could not load today\'s fixtures. Please try again.');
  }
}

bot.command('today', sendToday);

bot.hears('⚽ Match Center', (ctx) => {
  ctx.reply(
    `⚽ Match Center:\nClick below to see today's live odds:`,
    Markup.inlineKeyboard([
      [Markup.button.callback('📅 Today\'s Fixtures', 'view_today')]
    ])
  );
});

bot.action('view_today', async (ctx) => {
  await ctx.answerCbQuery();
  sendToday(ctx);
});

// ─── Support / Help ───────────────────────────────────────────
function sendHelp(ctx: any) {
  ctx.reply(
    `📞 Need Help?\n\n` +
    `• Telegram Support: @WaliaBetSupport\n` +
    `• Phone: +251 911 223344\n` +
    `• Website: https://waliabet.com\n\n` +
    `If you have issues with deposits or withdrawals via Telebirr or CBE, please contact us directly.`
  );
}

bot.command('help', sendHelp);
bot.hears('📞 Support Contact', sendHelp);

// ─── Place Bet Placeholder ────────────────────────────────────
bot.hears('🎟️ Place Bet', (ctx) => {
  ctx.reply(
    `🎟️ Place Bet\n\n` +
    `To place bets, please visit the WaliaBet website:\n` +
    `🌐 https://waliabet.com\n\n` +
    `Telegram betting is coming soon! 🚀`
  );
});

// ─── Odds Button Callback ─────────────────────────────────────
bot.action(/^odds_(.+)$/, async (ctx) => {
  const matchIdPrefix = ctx.match[1];

  try {
    const rows = await query<{
      match_id: string;
      home_team: string;
      away_team: string;
      league: string;
      kickoff_time: Date;
      odd_name: string;
      odd_value: string;
    }>(`
      SELECT
        m.id AS match_id,
        ht.name AS home_team,
        at.name AS away_team,
        l.name AS league,
        m.kickoff_time,
        o.name AS odd_name,
        o.value AS odd_value
      FROM matches m
      JOIN leagues l ON l.id = m.league_id
      JOIN teams ht ON ht.id = m.home_team_id
      JOIN teams at ON at.id = m.away_team_id
      JOIN markets mk ON mk.match_id = m.id AND mk.status = 'open'
      JOIN odds o ON o.market_id = mk.id AND o.is_active = true
      WHERE CAST(m.id AS TEXT) LIKE $1 || '%'
      ORDER BY o.name ASC
    `, [matchIdPrefix]);

    await ctx.answerCbQuery();

    if (rows.length === 0) {
      return ctx.reply('📭 Odds details not found or market is closed.');
    }

    const first = rows[0];
    const oddsLines = rows
      .map((r) => `• ${r.odd_name === '1' ? `${first.home_team} Win` : r.odd_name === '2' ? `${first.away_team} Win` : 'Draw'}: *${parseFloat(r.odd_value).toFixed(2)}*`)
      .join('\n');

    return ctx.reply(
      `📊 *${first.home_team}* vs *${first.away_team}*\n` +
      `🏆 ${first.league}\n\n` +
      `Match Odds:\n${oddsLines}`,
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    console.error('❌ callback error:', err);
    return ctx.reply('⚠️ Could not load match odds. Please try again.');
  }
});

// ─── Start Auth Server + Bot ─────────────────────────────────
startAuthServer();

const checkTelegramConnection = async (botToken: string): Promise<boolean> => {
  try {
    const res = await axios.get(`https://api.telegram.org/bot${botToken}/getMe`, {
      timeout: 3000,
    });
    return res.status === 200;
  } catch (err) {
    console.warn('⚠️ Telegram API is unreachable or token is invalid.');
    return false;
  }
};

const isOnline = await checkTelegramConnection(token);
if (isOnline) {
  bot.launch()
    .then(() => console.log('🚀 WaliaBet Telegram Bot listening for updates...'))
    .catch((err) => console.error('🛑 Failed to start bot:', err));
} else {
  console.log('📡 Bot running in AUTH-ONLY mode (Telegram connection offline).');
}

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

export {};
