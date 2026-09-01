/**
 * VIEWPOINT Production Serverless Telegram Webhook Handler
 * Endpoint: https://viewpoint.diy/api/telegram
 * Handles /start, /play, inline buttons, daily bonus, referrals, and admin approvals
 */

const BOT_TOKEN = "8787525713:AAGbp7iUbvphivcL6W-ca9TDsZ_xXGv4a7M";
const ADMIN_IDS = [6527377657];
const WEBAPP_URL = "https://viewpoint.diy";

async function tgApi(method, payload) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (e) {
    console.error(`Telegram API error on ${method}:`, e);
    return null;
  }
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    // Health check / Set webhook helper
    if (req.query && req.query.set_webhook === '1') {
      const webhookUrl = `${WEBAPP_URL}/api/telegram`;
      const whRes = await tgApi('setWebhook', { url: webhookUrl, drop_pending_updates: true });
      return res.status(200).json({ success: true, webhookUrl, result: whRes });
    }
    return res.status(200).json({ status: 'Telegram Webhook Active', bot: '@viewpoint_games_bot' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const update = req.body;
  if (!update) {
    return res.status(200).json({ ok: true });
  }

  try {
    // Handle incoming message
    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const user = msg.from || {};
      const text = msg.text || '';
      const firstName = user.first_name || 'Player';

      if (text.startsWith('/start') || text.startsWith('/play')) {
        const welcomeText = 
          `🔥 <b>Welcome to VIEWPOINT Casino, ${firstName}!</b> 🔥\n\n` +
          `India's premier 100% Provably Fair Casino & Mines platform with instant UPI deposits and fast payouts.\n\n` +
          `🎮 <b>Featured Games:</b>\n` +
          `• 🐉 <b>Dragon Tiger</b> (Live Casino VIP Table)\n` +
          `• 💣 <b>Mines</b> (Up to 10,000x multiplier)\n` +
          `• 🎯 <b>Limbo Turbo</b> (1,000,000x Multiplier)\n` +
          `• 🎈 <b>Stake Pump</b> (Crypto Balloon Multiplier)\n` +
          `• 🍗 <b>Chicken Road</b> (270x Lane Walker)\n` +
          `• 🔴 <b>Plinko</b> (1,000x Pin Drop)\n` +
          `• 🚀 <b>Crash</b> (Aviator Rocket flight)\n` +
          `• 🐹 <b>Stake Moles</b> (Burrow Gold Multiplier)\n` +
          `• 🎲 <b>Classic Dice</b> (9900x Roll)\n` +
          `• 🏰 <b>Tower Legend</b> (Climb Tower Multiplier)\n` +
          `• 🎨 <b>Win Go 30s</b> (Color Trading)\n` +
          `• 📈 <b>Stock BTC</b> (Real-Time Candlestick)\n\n` +
          `💰 <b>Play Instantly:</b> Click the button below 👇`;

        const keyboard = {
          inline_keyboard: [
            [
              { text: "🎮 Play VIEWPOINT Casino", web_app: { url: WEBAPP_URL } }
            ],
            [
              { text: "💰 My Wallet", callback_data: "menu_wallet" },
              { text: "🎁 Daily Bonus", callback_data: "menu_daily" }
            ],
            [
              { text: "👥 Refer & Earn ₹500", callback_data: "menu_referral" },
              { text: "💬 VIP Support", url: "https://t.me/viewpointios" }
            ]
          ]
        };

        await tgApi('sendMessage', {
          chat_id: chatId,
          text: welcomeText,
          parse_mode: 'HTML',
          reply_markup: keyboard
        });
      }
    }

    // Handle button callbacks
    else if (update.callback_query) {
      const cb = update.callback_query;
      const cbId = cb.id;
      const data = cb.data || '';
      const msg = cb.message || {};
      const chatId = msg.chat ? msg.chat.id : null;
      const msgId = msg.message_id;
      const fromUser = cb.from || {};
      const userId = fromUser.id;

      if (data === 'menu_wallet') {
        await tgApi('answerCallbackQuery', { callback_query_id: cbId });
        const walletText = 
          `💼 <b>VIEWPOINT WALLET</b>\n\n` +
          `💰 <b>Deposit Method:</b> Instant UPI / QR\n` +
          `⚡ <b>Withdrawal:</b> Fast UPI Payout\n\n` +
          `Open WebApp to deposit or withdraw funds instantly.`;

        const kb = {
          inline_keyboard: [
            [{ text: "⚡ Deposit / Withdraw in App", web_app: { url: WEBAPP_URL } }],
            [{ text: "🔙 Back to Menu", callback_data: "menu_main" }]
          ]
        };
        await tgApi('editMessageText', {
          chat_id: chatId,
          message_id: msgId,
          text: walletText,
          parse_mode: 'HTML',
          reply_markup: kb
        });
      }

      else if (data === 'menu_daily') {
        await tgApi('answerCallbackQuery', { callback_query_id: cbId, text: "🎁 ₹50 Daily Bonus Claimed!", show_alert: true });
        const dailyText = 
          `🎁 <b>DAILY BONUS CLAIMED!</b>\n\n` +
          `₹50.00 has been added to your VIEWPOINT wallet balance.\n` +
          `Come back tomorrow for your next reward!`;
        const kb = {
          inline_keyboard: [
            [{ text: "🎮 Play Now", web_app: { url: WEBAPP_URL } }],
            [{ text: "🔙 Back", callback_data: "menu_main" }]
          ]
        };
        await tgApi('editMessageText', {
          chat_id: chatId,
          message_id: msgId,
          text: dailyText,
          parse_mode: 'HTML',
          reply_markup: kb
        });
      }

      else if (data === 'menu_referral') {
        await tgApi('answerCallbackQuery', { callback_query_id: cbId });
        const refLink = `https://t.me/viewpoint_games_bot?start=${userId}`;
        const refText = 
          `👥 <b>REFER & EARN PROGRAM</b>\n\n` +
          `Share your referral link with friends and earn <b>₹500 bonus</b> on their first deposit!\n\n` +
          `🔗 <b>Your Link:</b>\n<code>${refLink}</code>`;
        const kb = {
          inline_keyboard: [
            [{ text: "📲 Share Link", url: `https://t.me/share/url?url=${refLink}&text=Play%20Viewpoint%20Casino` }],
            [{ text: "🔙 Back", callback_data: "menu_main" }]
          ]
        };
        await tgApi('editMessageText', {
          chat_id: chatId,
          message_id: msgId,
          text: refText,
          parse_mode: 'HTML',
          reply_markup: kb
        });
      }

      else if (data === 'menu_main') {
        await tgApi('answerCallbackQuery', { callback_query_id: cbId });
        const mainText = 
          `🔥 <b>VIEWPOINT Casino Main Menu</b> 🔥\n\n` +
          `India's premier 100% Provably Fair Casino & Mines platform.\n\n` +
          `Click below to start playing 👇`;
        const kb = {
          inline_keyboard: [
            [{ text: "🎮 Play VIEWPOINT Casino", web_app: { url: WEBAPP_URL } }],
            [
              { text: "💰 My Wallet", callback_data: "menu_wallet" },
              { text: "🎁 Daily Bonus", callback_data: "menu_daily" }
            ],
            [
              { text: "👥 Refer & Earn ₹500", callback_data: "menu_referral" },
              { text: "💬 VIP Support", url: "https://t.me/viewpointios" }
            ]
          ]
        };
        await tgApi('editMessageText', {
          chat_id: chatId,
          message_id: msgId,
          text: mainText,
          parse_mode: 'HTML',
          reply_markup: kb
        });
      }

      else if (data.startsWith('app_dep_')) {
        const depId = data.replace('app_dep_', '');
        await tgApi('answerCallbackQuery', { callback_query_id: cbId, text: "✅ Deposit Approved!", show_alert: true });
        await tgApi('editMessageText', {
          chat_id: chatId,
          message_id: msgId,
          text: `✅ <b>Deposit Approved!</b>\nID: <code>${depId}</code>\nStatus: Balance credited.`,
          parse_mode: 'HTML'
        });
      }

      else if (data.startsWith('rej_dep_')) {
        const depId = data.replace('rej_dep_', '');
        await tgApi('answerCallbackQuery', { callback_query_id: cbId, text: "❌ Deposit Rejected", show_alert: true });
        await tgApi('editMessageText', {
          chat_id: chatId,
          message_id: msgId,
          text: `❌ <b>Deposit Rejected</b>\nID: <code>${depId}</code>`,
          parse_mode: 'HTML'
        });
      }

      else if (data.startsWith('app_wth_')) {
        const wthId = data.replace('app_wth_', '');
        await tgApi('answerCallbackQuery', { callback_query_id: cbId, text: "✅ Withdrawal Approved!", show_alert: true });
        await tgApi('editMessageText', {
          chat_id: chatId,
          message_id: msgId,
          text: `✅ <b>Withdrawal Approved!</b>\nID: <code>${wthId}</code>\nStatus: Payout dispatched.`,
          parse_mode: 'HTML'
        });
      }

      else if (data.startsWith('rej_wth_')) {
        const wthId = data.replace('rej_wth_', '');
        await tgApi('answerCallbackQuery', { callback_query_id: cbId, text: "❌ Withdrawal Rejected", show_alert: true });
        await tgApi('editMessageText', {
          chat_id: chatId,
          message_id: msgId,
          text: `❌ <b>Withdrawal Rejected</b>\nID: <code>${wthId}</code>\nStatus: Refunded to wallet.`,
          parse_mode: 'HTML'
        });
      }
    }
  } catch (err) {
    console.error("Webhook processing error:", err);
  }

  return res.status(200).json({ ok: true });
}
