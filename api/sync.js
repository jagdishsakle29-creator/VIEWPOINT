// /api/sync.js - Secure Real-Time Cross-Device Approval & Polling Sync for Vercel
// Connects Telegram Admin approvals directly with persistent wallet store.

const store = require('./store');

function verifyAdminAuth(req, params) {
  const adminSecret = process.env.ADMIN_SECRET || 'VIEWPOINT_ADMIN_SECRET_2026';
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : '';
  const secret = params.secret || params.admin_secret || '';
  return token === adminSecret || secret === adminSecret;
}

async function dispatchTelegramSyncAlert(item, type) {
  const token = process.env.BOT_TOKEN || '8787525713:AAGbp7iUbvphivcL6W-ca9TDsZ_xXGv4a7M';
  const adminIds = (process.env.ADMIN_IDS || '6527377657').split(',');
  if (!token || !adminIds.length) return;

  const origin = process.env.WEBAPP_URL || 'https://viewpoint.diy';
  const adminSecret = process.env.ADMIN_SECRET || 'VIEWPOINT_ADMIN_SECRET_2026';

  let text = '';
  let inline_keyboard = [];

  if (type === 'DEPOSIT') {
    text = `🔔 <b>NEW DEPOSIT REQUEST</b> 🔔\n\n` +
      `👤 <b>Player ID:</b> <code>${item.userId}</code>\n` +
      `💰 <b>Amount:</b> <b>₹${parseFloat(item.amount || 0).toFixed(2)}</b>\n` +
      `🧾 <b>UTR:</b> <code>${item.utr || 'N/A'}</code>\n` +
      `💳 <b>UPI:</b> <code>${item.upiId || 'N/A'}</code>\n` +
      `🆔 <b>ID:</b> <code>${item.id}</code>`;

    inline_keyboard = [
      [
        { text: `✅ Approve (+₹${parseFloat(item.amount || 0).toFixed(0)})`, url: `${origin}/api/sync?secret=${encodeURIComponent(adminSecret)}&action=approve_dep&id=${encodeURIComponent(item.id)}&userId=${encodeURIComponent(item.userId)}&amt=${encodeURIComponent(item.amount)}` },
        { text: "❌ Reject", url: `${origin}/api/sync?secret=${encodeURIComponent(adminSecret)}&action=reject_dep&id=${encodeURIComponent(item.id)}&userId=${encodeURIComponent(item.userId)}` }
      ]
    ];
  } else {
    const fee = parseFloat(item.fee || (item.amount * 0.08) || 0);
    const net = parseFloat(item.netPayout || (item.amount - fee) || 0);
    text = `💸 <b>NEW WITHDRAWAL REQUEST</b> 💸\n\n` +
      `👤 <b>Player ID:</b> <code>${item.userId}</code>\n` +
      `💰 <b>Gross:</b> ₹${parseFloat(item.amount || 0).toFixed(2)}\n` +
      `⚡ <b>Fee (8%):</b> -₹${fee.toFixed(2)}\n` +
      `💵 <b>Net Payout:</b> <b>₹${net.toFixed(2)}</b>\n` +
      `🏦 <b>Transfer To:</b> <code>${item.receiver || 'UPI'}</code>\n` +
      `🆔 <b>ID:</b> <code>${item.id}</code>`;

    inline_keyboard = [
      [
        { text: `✅ Mark Paid (₹${net.toFixed(0)})`, url: `${origin}/api/sync?secret=${encodeURIComponent(adminSecret)}&action=approve_wth&id=${encodeURIComponent(item.id)}` },
        { text: "❌ Reject & Refund", url: `${origin}/api/sync?secret=${encodeURIComponent(adminSecret)}&action=reject_wth&id=${encodeURIComponent(item.id)}` }
      ]
    ];
  }

  for (const adminId of adminIds) {
    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: adminId.trim(),
          text: text,
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard }
        })
      });
    } catch (e) {}
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const query = req.query || {};
  let body = {};
  try {
    if (typeof req.body === 'string' && req.body) {
      body = JSON.parse(req.body);
    } else if (typeof req.body === 'object' && req.body !== null) {
      body = req.body;
    }
  } catch(e) {}

  const params = { ...query, ...body };
  const action = params.action || params.admin_action || '';
  const id = params.id || '';
  const userId = params.userId || params.phone || params.uid || '';
  const amt = parseFloat(params.amt || params.amount || 0);

  // 1. Create Deposit Record
  if (action === 'create_deposit') {
    if (!id) return res.status(400).json({ error: 'Missing deposit ID' });
    const depRecord = {
      id: id,
      userId: userId || 'Player',
      amount: amt || 199,
      utr: params.utr || '',
      phone: params.phone || '',
      name: params.name || 'Player',
      upiId: params.upiId || '',
      status: 'PENDING',
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }),
      createdAt: Date.now()
    };
    store.saveDeposit(depRecord);
    await dispatchTelegramSyncAlert(depRecord, 'DEPOSIT');
    return res.status(200).json({ success: true, deposit: depRecord });
  }

  // 2. Admin Approves Deposit via Telegram Link (Authenticated & Credited)
  if (action === 'approve_dep') {
    if (!verifyAdminAuth(req, params)) {
      return res.status(403).send('<h1>❌ 403 Forbidden: Unauthorized Admin Action</h1>');
    }
    const result = store.approveDeposit(id, amt, userId);

    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Deposit Approved - VIEWPOINT</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
          .card { background: #151d30; border: 2px solid #00e701; border-radius: 16px; padding: 30px 24px; text-align: center; max-width: 400px; width: 100%; box-shadow: 0 0 40px rgba(0, 231, 1, 0.25); }
          h1 { color: #00e701; font-size: 24px; margin-bottom: 8px; }
          p { color: #94a3b8; font-size: 14px; line-height: 1.5; }
          .badge { display: inline-block; background: rgba(0,231,1,0.15); color: #00e701; padding: 6px 14px; border-radius: 8px; font-weight: 800; font-size: 18px; margin: 16px 0; border: 1px solid #00e701; }
        </style>
      </head>
      <body>
        <div class="card">
          <div style="font-size: 50px;">✅</div>
          <h1>Deposit Approved!</h1>
          <div class="badge">+₹${result.amount.toFixed(2)} CREDITED</div>
          <p>Deposit ID: <strong style="color:#00e5ff;">${id}</strong><br>Player: <strong style="color:#00e701;">${result.creditedUser || 'Player'}</strong><br>Status updated to <strong>SUCCESS</strong>. Player's wallet is credited.</p>
        </div>
      </body>
      </html>
    `);
  }

  // 3. Admin Rejects Deposit via Telegram Link (Authenticated)
  if (action === 'reject_dep') {
    if (!verifyAdminAuth(req, params)) {
      return res.status(403).send('<h1>❌ 403 Forbidden: Unauthorized Admin Action</h1>');
    }
    store.rejectDeposit(id);

    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Deposit Rejected - VIEWPOINT</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
          .card { background: #151d30; border: 2px solid #ef4444; border-radius: 16px; padding: 30px 24px; text-align: center; max-width: 400px; width: 100%; box-shadow: 0 0 40px rgba(239, 68, 68, 0.25); }
          h1 { color: #ef4444; font-size: 24px; margin-bottom: 8px; }
          p { color: #94a3b8; font-size: 14px; line-height: 1.5; }
          .badge { display: inline-block; background: rgba(239,68,68,0.15); color: #ef4444; padding: 6px 14px; border-radius: 8px; font-weight: 800; font-size: 18px; margin: 16px 0; border: 1px solid #ef4444; }
        </style>
      </head>
      <body>
        <div class="card">
          <div style="font-size: 50px;">❌</div>
          <h1>Deposit Rejected</h1>
          <div class="badge">REJECTED (₹0.00 Added)</div>
          <p>Deposit ID: <strong style="color:#00e5ff;">${id}</strong><br>Marked as <strong>REJECTED</strong>. No funds were added to player's balance.</p>
        </div>
      </body>
      </html>
    `);
  }

  // 4. Create Withdrawal Record
  if (action === 'create_withdrawal') {
    if (!id) return res.status(400).json({ error: 'Missing withdrawal ID' });
    const wthRecord = {
      id: id,
      userId: userId || 'Player',
      amount: amt || 500,
      netPayout: parseFloat(params.net || params.netPayout || (amt * 0.92)),
      channel: params.channel || 'UPI',
      receiver: params.receiver || params.upiId || 'N/A',
      name: params.name || 'Player',
      status: 'PENDING',
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }),
      createdAt: Date.now()
    };
    store.saveWithdrawal(wthRecord);
    return res.status(200).json({ success: true, withdrawal: wthRecord });
  }

  // 5. Admin Approves Withdrawal via Telegram Link (Authenticated)
  if (action === 'approve_wth') {
    if (!verifyAdminAuth(req, params)) {
      return res.status(403).send('<h1>❌ 403 Forbidden: Unauthorized Admin Action</h1>');
    }
    const result = store.approveWithdrawal(id);
    const netVal = (result.withdrawal && result.withdrawal.netPayout) || (amt * 0.92) || 460;

    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Withdrawal Approved - VIEWPOINT</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
          .card { background: #151d30; border: 2px solid #00e701; border-radius: 16px; padding: 30px 24px; text-align: center; max-width: 400px; width: 100%; box-shadow: 0 0 40px rgba(0, 231, 1, 0.25); }
          h1 { color: #00e701; font-size: 24px; margin-bottom: 8px; }
          p { color: #94a3b8; font-size: 14px; line-height: 1.5; }
          .badge { display: inline-block; background: rgba(0,231,1,0.15); color: #00e701; padding: 6px 14px; border-radius: 8px; font-weight: 800; font-size: 18px; margin: 16px 0; border: 1px solid #00e701; }
        </style>
      </head>
      <body>
        <div class="card">
          <div style="font-size: 50px;">✅</div>
          <h1>Withdrawal Approved!</h1>
          <div class="badge">₹${netVal.toFixed(2)} APPROVED</div>
          <p>Withdrawal ID: <strong style="color:#00e5ff;">${id}</strong><br>Player is notified: Payout accepted and will be credited.</p>
        </div>
      </body>
      </html>
    `);
  }

  // 6. Admin Rejects Withdrawal via Telegram Link (Authenticated)
  if (action === 'reject_wth') {
    if (!verifyAdminAuth(req, params)) {
      return res.status(403).send('<h1>❌ 403 Forbidden: Unauthorized Admin Action</h1>');
    }
    store.rejectWithdrawal(id);

    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Withdrawal Rejected - VIEWPOINT</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
          .card { background: #151d30; border: 2px solid #ef4444; border-radius: 16px; padding: 30px 24px; text-align: center; max-width: 400px; width: 100%; box-shadow: 0 0 40px rgba(239, 68, 68, 0.25); }
          h1 { color: #ef4444; font-size: 24px; margin-bottom: 8px; }
          p { color: #94a3b8; font-size: 14px; line-height: 1.5; }
          .badge { display: inline-block; background: rgba(239,68,68,0.15); color: #ef4444; padding: 6px 14px; border-radius: 8px; font-weight: 800; font-size: 18px; margin: 16px 0; border: 1px solid #ef4444; }
        </style>
      </head>
      <body>
        <div class="card">
          <div style="font-size: 50px;">❌</div>
          <h1>Withdrawal Rejected</h1>
          <div class="badge">REJECTED & REFUNDED</div>
          <p>Withdrawal ID: <strong style="color:#00e5ff;">${id}</strong><br>Player has been refunded.</p>
        </div>
      </body>
      </html>
    `);
  }

  // 7. Poll Specific Deposit or Withdrawal Status (Scoped strictly to query ID)
  if (action === 'check_withdrawal') {
    const wth = id ? store.getWithdrawal(id) : null;
    return res.status(200).json({
      success: true,
      withdrawal: wth || null
    });
  }

  if (action === 'poll_status' || action === 'check_deposit') {
    const dep = id ? store.getDeposit(id) : null;
    return res.status(200).json({
      success: true,
      deposit: dep || null
    });
  }

  // 8. Admin queries pending items (Requires admin auth)
  if (action === 'admin_get_pending') {
    if (!verifyAdminAuth(req, params)) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    const st = store.loadStore();
    return res.status(200).json({
      success: true,
      deposits: Object.values(st.deposits || {}).filter(d => d.status === 'PENDING'),
      withdrawals: Object.values(st.withdrawals || {}).filter(w => w.status === 'PENDING')
    });
  }

  // 9. Get Members List (Admin Authentication Enforced)
  if (action === 'get_members' || action === 'list_users') {
    if (!verifyAdminAuth(req, params)) {
      return res.status(403).json({ success: false, error: 'Unauthorized: Admin authentication required.' });
    }
    const st = store.loadStore();
    const members = Object.values(st.users || st.wallets || {}).map(u => ({
      userId: u.userId || u.telegram_id,
      username: u.username || 'Player',
      name: u.name || u.first_name || u.username || 'Player',
      balance: u.balance || 0,
      totalDeposited: u.totalDeposited || u.total_deposited || 0,
      authProvider: u.authProvider || 'mobile',
      createdAt: u.createdAt || u.joined_at || new Date().toISOString()
    }));
    return res.status(200).json({
      success: true,
      members: members,
      total: members.length
    });
  }

  return res.status(200).json({
    success: true,
    status: 'ok'
  });
}
