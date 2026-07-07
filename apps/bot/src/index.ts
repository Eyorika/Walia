import { config as dotenvConfig } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Load environment from the monorepo root .env
dotenvConfig({ path: resolve(__dirname, '..', '..', '..', '.env') });

import { Telegraf, Markup } from 'telegraf';
import { query, queryOne, transaction } from './db.js';

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

// ─── Login Command ────────────────────────────────────────────
bot.command('login', (ctx) => {
  ctx.reply(
    `🔐 Account Link Setup:\n\n` +
    `Copy your Telegram Link Code from the WaliaBet app (Profile › Security) and enter it here:\n\n` +
    `Format: \`/link [code]\`\n\n` +
    `_Codes expire after 24 hours._`,
    { parse_mode: 'Markdown' }
  );
});

// ─── Link Code Handler ────────────────────────────────────────
bot.command('link', async (ctx): Promise<void> => {
  const code = ctx.payload?.trim().toUpperCase();
  const telegramId = String(ctx.from.id);

  if (!code) {
    ctx.reply('⚠️ Please provide a linking code.\n\nExample: `/link A8D3J2`', {
      parse_mode: 'Markdown',
    });
    return;
  }

  try {
    // Check if this Telegram account is already linked
    const existingUser = await queryOne<{ id: string; username: string }>(
      `SELECT id, username FROM users WHERE telegram_id = $1`,
      [telegramId]
    );

    if (existingUser) {
      ctx.reply(
        `✅ Your Telegram is already linked to account *@${existingUser.username}*.\n` +
        `Use /balance to check your wallet.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Look up the link code
    const linkCode = await queryOne<{
      id: string;
      user_id: string;
      expires_at: string;
      used: boolean;
    }>(
      `SELECT id, user_id, expires_at, used FROM telegram_link_codes WHERE code = $1`,
      [code]
    );

    if (!linkCode) {
      ctx.reply('❌ Invalid link code. Please generate a new one from the WaliaBet app.');
      return;
    }

    if (linkCode.used) {
      ctx.reply('❌ This link code has already been used. Please generate a new one.');
      return;
    }

    if (new Date(linkCode.expires_at) < new Date()) {
      ctx.reply('❌ This link code has expired. Please generate a new one from the WaliaBet app.');
      return;
    }

    // Perform the link in a transaction
    await transaction(async (client) => {
      // Link Telegram ID to user
      await client.query(
        `UPDATE users SET telegram_id = $1, updated_at = NOW() WHERE id = $2`,
        [telegramId, linkCode.user_id]
      );
      // Mark code as used
      await client.query(
        `UPDATE telegram_link_codes SET used = true WHERE id = $1`,
        [linkCode.id]
      );
    });

    // Fetch the user details to confirm
    const user = await queryOne<{ username: string; first_name: string }>(
      `SELECT username, first_name FROM users WHERE id = $1`,
      [linkCode.user_id]
    );

    ctx.reply(
      `🎉 Success! Your Telegram is now linked to WaliaBet account *@${user?.username}*.\n\n` +
      `You can now use:\n` +
      `/balance - Check wallet balance\n` +
      `/today - View today's fixtures`,
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    console.error('❌ /link error:', err);
    ctx.reply('⚠️ Something went wrong. Please try again later.');
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

    // Store match data in a quick cache via action callbacks
    // We register dynamic action handlers for each match
    matchIds.forEach((matchId) => {
      const matchRows = matchMap.get(matchId)!;
      const first = matchRows[0];
      const callbackId = `odds_${matchId.slice(0, 8)}`;

      // Re-register only if not already registered (Telegraf handles this gracefully)
      bot.action(callbackId, async (actionCtx) => {
        await actionCtx.answerCbQuery();
        const oddsLines = matchRows
          .map((r) => `• ${r.odd_name === '1' ? `${first.home_team} Win` : r.odd_name === '2' ? `${first.away_team} Win` : 'Draw'}: *${parseFloat(r.odd_value).toFixed(2)}*`)
          .join('\n');
        actionCtx.reply(
          `📊 *${first.home_team}* vs *${first.away_team}*\n` +
          `🏆 ${first.league}\n\n` +
          `Match Odds:\n${oddsLines}`,
          { parse_mode: 'Markdown' }
        );
      });
    });

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

// ─── Launch Bot ───────────────────────────────────────────────
bot.launch()
  .then(() => console.log('🚀 WaliaBet Telegram Bot listening for updates...'))
  .catch((err) => console.error('🛑 Failed to start bot:', err));

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

export {};
