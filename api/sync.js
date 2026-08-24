// /api/sync.js - Secure Real-Time Cross-Device Approval & Polling Sync for Vercel
// Connects Telegram Admin approvals directly with persistent wallet store.

const store = require('./store');

function verifyAdminAuth(req, params) {
  const adminSecret = process.env.ADMIN_SECRET || 'VP_ADMIN_SECURE_2026';
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : '';
  const secret = params.secret || params.admin_secret || '';
  return token === adminSecret || secret === adminSecret;
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

  return res.status(200).json({
    success: true,
    status: 'ok'
  });
}
