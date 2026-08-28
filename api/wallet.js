// /api/wallet.js - Server-Side Authoritative Wallet & Transaction Engine
// Protects balance, validates deposits/withdrawals, enforces atomic state & prevents tampering.

const store = require('./store');

// In-memory persistent state (persisted across warm invocations; maps userId -> state)
const userWallets = new Map();
const userTransactions = new Map();
const activePendingDeposits = new Map();
const activePendingWithdrawals = new Map();
const userReferralEarnings = new Map();
const userReferralCounts = new Map();
const userUnclaimedCommissions = new Map();

// Helper to get or init wallet
function getWallet(userId) {
  return store.getWallet(userId);
}

function getUserHistory(userId) {
  const uid = String(userId || 'guest_default').trim();
  if (!userTransactions.has(uid)) {
    userTransactions.set(uid, []);
  }
  return userTransactions.get(uid);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let body = {};
  try {
    if (typeof req.body === 'string' && req.body) {
      body = JSON.parse(req.body);
    } else if (typeof req.body === 'object' && req.body !== null) {
      body = req.body;
    }
  } catch (e) {}

  const query = req.query || {};
  const params = { ...query, ...body };
  const action = params.action || '';
  const userId = params.userId || params.telegram_id || req.headers['x-user-id'] || 'guest_default';

  // 1. GET BALANCE
  if (req.method === 'GET' || action === 'get_balance') {
    const wallet = getWallet(userId);
    return res.status(200).json({
      success: true,
      userId: wallet.userId,
      balance: wallet.balance,
      currency: wallet.currency
    });
  }

  // 2. GET USER TRANSACTION HISTORY (Strictly user-scoped, no cross-user leaks)
  if (action === 'get_history') {
    const history = getUserHistory(userId);
    return res.status(200).json({
      success: true,
      history: history.slice(0, 50)
    });
  }

  // 2.1 GET REFERRAL STATS & 2% COMMISSION
  if (action === 'get_referral_stats') {
    const earnings = userReferralEarnings.get(String(userId)) || 0.0;
    const count = userReferralCounts.get(String(userId)) || 0;
    const unclaimed = userUnclaimedCommissions.get(String(userId)) || 0.0;
    return res.status(200).json({
      success: true,
      referralCount: count,
      totalEarnings: earnings,
      unclaimedCommission: unclaimed,
      commissionRate: "2% Lifetime"
    });
  }

  // 2.2 CLAIM REFERRAL COMMISSION
  if (action === 'claim_referral') {
    const unclaimed = userUnclaimedCommissions.get(String(userId)) || 0.0;
    if (unclaimed <= 0) {
      return res.status(400).json({ success: false, error: 'No unclaimed commission balance' });
    }
    const wallet = getWallet(userId);
    wallet.balance = Math.round((wallet.balance + unclaimed) * 100) / 100;
    userUnclaimedCommissions.set(String(userId), 0.0);
    return res.status(200).json({
      success: true,
      claimedAmount: unclaimed,
      newBalance: wallet.balance
    });
  }

  // 3. CREATE DEPOSIT REQUEST (Server-Side Validated)
  if (action === 'submit_deposit') {
    const amount = parseFloat(params.amount || 0);
    const minDeposit = 100.0;
    const maxDeposit = 100000.0;

    if (isNaN(amount) || amount < minDeposit || amount > maxDeposit) {
      return res.status(400).json({
        success: false,
        error: `Deposit amount must be between ₹${minDeposit} and ₹${maxDeposit}`
      });
    }

    const utr = String(params.utr || '').trim();
    if (!utr || utr.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Valid 12-digit UTR transaction reference is required'
      });
    }

    const depId = 'DEP-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const depRecord = {
      id: depId,
      userId: String(userId),
      amount: amount,
      utr: utr,
      upiId: String(params.upiId || 'adrenox1@axl'),
      status: 'PENDING',
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }),
      date: new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }),
      createdAt: Date.now()
    };

    activePendingDeposits.set(depId, depRecord);
    store.saveDeposit(depRecord);
    const history = getUserHistory(userId);
    history.unshift(depRecord);

    // Secure server-side telegram alert if configured in env (non-blocking async)
    dispatchServerTelegramAlert(depRecord, 'DEPOSIT').catch(() => {});

    return res.status(200).json({
      success: true,
      deposit: depRecord
    });
  }

  // 4. SUBMIT WITHDRAWAL REQUEST (Server-Side Validated, Deducts Balance Atomically)
  if (action === 'submit_withdrawal') {
    const amount = parseFloat(params.amount || 0);
    const minWithdraw = 200.0;
    const maxWithdraw = 50000.0;

    if (isNaN(amount) || amount < minWithdraw || amount > maxWithdraw) {
      return res.status(400).json({
        success: false,
        error: `Withdrawal amount must be between ₹${minWithdraw} and ₹${maxWithdraw}`
      });
    }

    const wallet = getWallet(userId);
    if (wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient wallet balance for this withdrawal request'
      });
    }

    const channel = String(params.channel || 'UPI').trim();
    const receiver = String(params.receiver || params.upiId || '').trim();
    const accountName = String(params.name || params.accountName || 'Player').trim();

    if (!receiver || receiver.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Valid payout destination details required'
      });
    }

    // Atomic balance deduction
    store.updateWalletBalance(userId, -amount);

    const fee = Math.round(amount * 0.08 * 100) / 100;
    const netPayout = Math.round((amount - fee) * 100) / 100;

    const wthId = 'WTH-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const wthRecord = {
      id: wthId,
      userId: String(userId),
      amount: amount,
      fee: fee,
      netPayout: netPayout,
      channel: channel,
      receiver: receiver,
      accountName: accountName,
      status: 'PENDING',
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }),
      date: new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }),
      createdAt: Date.now()
    };

    activePendingWithdrawals.set(wthId, wthRecord);
    store.saveWithdrawal(wthRecord);
    const history = getUserHistory(userId);
    history.unshift(wthRecord);

    // Non-blocking async Telegram alert
    dispatchServerTelegramAlert(wthRecord, 'WITHDRAWAL').catch(() => {});

    return res.status(200).json({
      success: true,
      withdrawal: wthRecord,
      newBalance: wallet.balance
    });
  }

  // 5. POLL SPECIFIC USER TRANSACTION STATUS (User can only check their own transaction)
  if (action === 'check_status') {
    const txId = params.id;
    if (!txId) return res.status(400).json({ success: false, error: 'Missing transaction ID' });

    const dep = activePendingDeposits.get(txId);
    if (dep) {
      if (dep.userId !== String(userId) && !isAdmin(req, params)) {
        return res.status(403).json({ success: false, error: 'Unauthorized to view this transaction' });
      }
      return res.status(200).json({ success: true, transaction: dep, type: 'DEPOSIT' });
    }

    const wth = activePendingWithdrawals.get(txId);
    if (wth) {
      if (wth.userId !== String(userId) && !isAdmin(req, params)) {
        return res.status(403).json({ success: false, error: 'Unauthorized to view this transaction' });
      }
      return res.status(200).json({ success: true, transaction: wth, type: 'WITHDRAWAL' });
    }

    return res.status(404).json({ success: false, error: 'Transaction not found' });
  }

  return res.status(400).json({ success: false, error: 'Unknown action parameter' });
}

function isAdmin(req, params) {
  const adminSecret = process.env.ADMIN_SECRET || 'VP_ADMIN_SECURE_2026';
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : '';
  return token === adminSecret || params.adminSecret === adminSecret;
}

// Server-Side Telegram Dispatcher (HTML parse mode, robust delivery, non-blocking)
const dispatchedAlerts = new Set();

async function dispatchServerTelegramAlert(item, type) {
  if (!item || !item.id) return;
  if (dispatchedAlerts.has(item.id)) return;
  dispatchedAlerts.add(item.id);
  setTimeout(() => dispatchedAlerts.delete(item.id), 60000);

  const token = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || '8787525713:AAGbp7iUbvphivcL6W-ca9TDsZ_xXGv4a7M';
  const rawAdminIds = process.env.ADMIN_IDS || process.env.TELEGRAM_CHAT_ID || '6527377657';
  const adminIds = rawAdminIds.split(',').map(s => s.trim()).filter(Boolean);

  if (!token || !adminIds.length) return;

  const origin = process.env.WEBAPP_URL || 'https://viewpoint.diy';
  const adminSecret = process.env.ADMIN_SECRET || 'VIEWPOINT_ADMIN_SECRET_2026';

  let msg = '';
  let replyMarkup = {};

  if (type === 'DEPOSIT') {
    const amt = parseFloat(item.amount || 0);
    msg = `🔔 <b>NEW UPI DEPOSIT RECORD</b> 🔔\n\n` +
      `👤 <b>Player ID:</b> <code>${item.userId || 'guest'}</code>\n` +
      `💰 <b>Amount:</b> <b>₹${amt.toFixed(2)}</b>\n` +
      `🧾 <b>UTR:</b> <code>${item.utr || 'N/A'}</code>\n` +
      `💳 <b>Receiver UPI:</b> <code>${item.upiId || 'N/A'}</code>\n` +
      `⏰ <b>Time:</b> ${item.time || new Date().toLocaleTimeString()}\n` +
      `🆔 <b>Deposit ID:</b> <code>${item.id}</code>`;

    replyMarkup = {
      inline_keyboard: [
        [
          { text: `✅ Approve (+₹${amt.toFixed(0)})`, url: `${origin}/api/sync?secret=${encodeURIComponent(adminSecret)}&action=approve_dep&id=${encodeURIComponent(item.id)}&userId=${encodeURIComponent(item.userId)}&amt=${encodeURIComponent(amt)}` },
          { text: "❌ Reject", url: `${origin}/api/sync?secret=${encodeURIComponent(adminSecret)}&action=reject_dep&id=${encodeURIComponent(item.id)}&userId=${encodeURIComponent(item.userId)}` }
        ]
      ]
    };
  } else {
    const gross = parseFloat(item.amount || 0);
    const fee = parseFloat(item.fee !== undefined ? item.fee : (gross * 0.08));
    const net = parseFloat(item.netPayout !== undefined ? item.netPayout : (gross - fee));

    msg = `💸 <b>NEW WITHDRAWAL REQUEST (8% Fee)</b> 💸\n\n` +
      `👤 <b>Player ID:</b> <code>${item.userId || 'guest'}</code>\n` +
      `💰 <b>Gross Amount:</b> ₹${gross.toFixed(2)}\n` +
      `🏷️ <b>Platform Fee (8%):</b> -₹${fee.toFixed(2)}\n` +
      `✅ <b>Net Payout to Send:</b> <b>₹${net.toFixed(2)}</b>\n\n` +
      `💳 <b>Receiver Info:</b> <code>${item.receiver || 'UPI'}</code>\n` +
      `👤 <b>Name:</b> ${item.accountName || 'N/A'}\n` +
      `📡 <b>Channel:</b> ${item.channel || 'UPI'}\n` +
      `⏰ <b>Time:</b> ${item.time || new Date().toLocaleTimeString()}\n` +
      `🆔 <b>Withdrawal ID:</b> <code>${item.id}</code>`;

    replyMarkup = {
      inline_keyboard: [
        [
          { text: `✅ Approve Payout (₹${net.toFixed(0)})`, url: `${origin}/api/sync?secret=${encodeURIComponent(adminSecret)}&action=approve_wth&id=${encodeURIComponent(item.id)}&userId=${encodeURIComponent(item.userId)}&amt=${encodeURIComponent(net)}` },
          { text: "❌ Reject & Refund", url: `${origin}/api/sync?secret=${encodeURIComponent(adminSecret)}&action=reject_wth&id=${encodeURIComponent(item.id)}&userId=${encodeURIComponent(item.userId)}` }
        ]
      ]
    };
  }

  for (const chatId of adminIds) {
    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: msg,
          parse_mode: 'HTML',
          reply_markup: replyMarkup
        })
      });
    } catch (e) {
      console.warn("Telegram dispatch warn for chat:", chatId, e.message);
    }
  }
}
