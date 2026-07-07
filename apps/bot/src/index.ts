import 'dotenv/config';
import { Telegraf, Markup } from 'telegraf';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.warn('⚠️ TELEGRAM_BOT_TOKEN is missing. Bot service running in mock/dry mode.');
}

const bot = new Telegraf(token || 'dummy-token');

// ─── Welcome / Start ──────────────────────────────────────────
bot.start((ctx) => {
  const username = ctx.from.username || ctx.from.first_name;
  ctx.reply(
    `🇪🇹 Welcome to WaliaBet Bot, @${username}!\n\n` +
    `WaliaBet is Ethiopia's premium sportsbook platform. You can check odds, view matches, and deposit Birr directly using Telebirr or CBE Birr!\n\n` +
    `💡 Commands:\n` +
    `/login - Link your account\n` +
    `/balance - Check your wallets balance\n` +
    `/today - View today's match fixtures\n` +
    `/help - View help information`,
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
    `Please copy your Telegram Link Code from the WaliaBet app (under Profile > Security) and enter it here:\n\n` +
    `Format: \`/link [code]\``
  );
});

// ─── Link Code handler ────────────────────────────────────────
bot.command('link', (ctx) => {
  const code = ctx.payload;
  if (!code) {
    return ctx.reply('⚠️ Please provide a linking code. Example: `/link A8D3J2`');
  }
  ctx.reply(`✅ Successfully linked Telegram account to your WaliaBet wallet! You can now place bets using your balance.`);
});

// ─── Balance Check ────────────────────────────────────────────
bot.command('balance', (ctx) => {
  ctx.reply(
    `💰 WaliaBet Balances:\n\n` +
    `• Main Wallet: 0.00 Birr\n` +
    `• Bonus Wallet: 500.00 Birr\n` +
    `• Currency: ETB`
  );
});

bot.hears('💰 My Balance', (ctx) => {
  ctx.reply(
    `💰 WaliaBet Balances:\n\n` +
    `• Main Wallet: 0.00 Birr\n` +
    `• Bonus Wallet: 500.00 Birr\n` +
    `• Currency: ETB`
  );
});

// ─── Today's Fixtures ─────────────────────────────────────────
bot.command('today', (ctx) => {
  ctx.reply(
    `⚽ Today's Popular Fixtures:\n\n` +
    `1. Saint George vs Ethiopian Coffee (EPL)\n` +
    `   Odds: [1] 2.10 | [X] 3.20 | [2] 2.90\n\n` +
    `2. Arsenal vs Chelsea (ENG PL)\n` +
    `   Odds: [1] 1.80 | [X] 3.60 | [2] 3.80\n\n` +
    `💡 Use commands to navigate or check active sports sections.`,
    Markup.inlineKeyboard([
      [Markup.button.callback('Saint George vs Ethiopian Coffee', 'odds_match1')],
      [Markup.button.callback('Arsenal vs Chelsea', 'odds_match2')]
    ])
  );
});

bot.hears('⚽ Match Center', (ctx) => {
  ctx.reply(
    `⚽ Match Center Selection:\n` +
    `Click a category to view live odds:`,
    Markup.inlineKeyboard([
      [Markup.button.callback('⚽ Football Live', 'football_odds')],
      [Markup.button.callback('🏀 Basketball Upcoming', 'basketball_odds')]
    ])
  );
});

// ─── Support / Help ───────────────────────────────────────────
bot.command('help', (ctx) => {
  ctx.reply(
    `📞 Need Help?\n\n` +
    `If you have any issues with deposits or withdrawals via Telebirr or CBE, please contact us:\n` +
    `• Telegram Support: @WaliaBetSupport\n` +
    `• Phone: +251 911 223344\n` +
    `• Website: https://waliabet.com`
  );
});

bot.hears('📞 Support Contact', (ctx) => {
  ctx.reply(
    `📞 Need Help?\n\n` +
    `If you have any issues with deposits or withdrawals via Telebirr or CBE, please contact us:\n` +
    `• Telegram Support: @WaliaBetSupport\n` +
    `• Phone: +251 911 223344\n` +
    `• Website: https://waliabet.com`
  );
});

// ─── Callbacks ───────────────────────────────────────────────
bot.action('odds_match1', (ctx) => {
  ctx.answerCbQuery();
  ctx.reply(
    `Saint George vs Ethiopian Coffee odds:\n` +
    `• Saint George to Win: 2.10\n` +
    `• Draw: 3.20\n` +
    `• Ethiopian Coffee to Win: 2.90`
  );
});

bot.action('odds_match2', (ctx) => {
  ctx.answerCbQuery();
  ctx.reply(
    `Arsenal vs Chelsea odds:\n` +
    `• Arsenal to Win: 1.80\n` +
    `• Draw: 3.60\n` +
    `• Chelsea to Win: 3.80`
  );
});

bot.action('football_odds', (ctx) => {
  ctx.answerCbQuery();
  ctx.reply(
    `⚽ Live Football Odds:\n\n` +
    `Saint George SC (2.10) vs Ethiopian Coffee SC (2.90) | Draw: 3.20`
  );
});

// Launch Bot
if (token && token !== 'dummy-token') {
  bot.launch()
    .then(() => console.log('🚀 WaliaBet Telegram Bot listening for updates...'))
    .catch((err) => console.error('🛑 Failed to start bot:', err));
} else {
  console.log('🤖 WaliaBet Telegram Bot starting in mock/dry mode because token is missing.');
}

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
export {};
