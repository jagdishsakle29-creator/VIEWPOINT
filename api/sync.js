// /api/sync.js - Real-Time Cross-Device Approval & Polling Sync for Vercel

let globalDeposits = {};
let globalWithdrawals = {};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const query = req.query || {};
  let body = {};
  try {
    if (typeof req.body === 'string') {
      body = JSON.parse(req.body);
    } else if (typeof req.body === 'object' && req.body !== null) {
      body = req.body;
    }
  } catch(e) {}

  const params = { ...query, ...body };
  const action = params.action || params.admin_action || '';
  const id = params.id || '';
  const secret = params.secret || '';
  const phone = params.phone || '';
  const amt = parseFloat(params.amt || params.amount || 0);

  // 1. Create Deposit Record
  if (action === 'create_deposit') {
    if (!id) return res.status(400).json({ error: 'Missing deposit ID' });
    globalDeposits[id] = {
      id: id,
      amount: amt || 199,
      utr: params.utr || '',
      phone: phone || '',
      name: params.name || 'Player',
      upiId: params.upiId || '',
      status: 'PENDING',
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }),
      createdAt: Date.now()
    };
    return res.status(200).json({ success: true, deposit: globalDeposits[id] });
  }

  // 2. Admin Approves Deposit via Telegram Link
  if (action === 'approve_dep') {
    if (secret !== '9630_7878' && secret !== '7878') {
      return res.status(403).send('<h1>❌ 403 Forbidden: Invalid Secret Passcode</h1>');
    }
    if (!globalDeposits[id]) {
      globalDeposits[id] = {
        id: id,
        amount: amt || 200,
        utr: params.utr || 'TELEGRAM-APPROVED',
        status: 'SUCCESS',
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })
      };
    } else {
      globalDeposits[id].status = 'SUCCESS';
      globalDeposits[id].approvedAt = Date.now();
      if (amt) globalDeposits[id].amount = amt;
    }

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
          .btn { display: inline-block; background: #00e701; color: #000; font-weight: 800; padding: 12px 24px; border-radius: 10px; text-decoration: none; margin-top: 16px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div style="font-size: 50px;">✅</div>
          <h1>Deposit Approved!</h1>
          <div class="badge">+₹${(amt || (globalDeposits[id] && globalDeposits[id].amount) || 200).toFixed(2)} CREDITED</div>
          <p>Deposit ID: <strong style="color:#00e5ff;">${id}</strong><br>Status updated to <strong>SUCCESS</strong>. Player's wallet is credited.</p>
          <a href="/?secret=9630_7878" class="btn">Open Admin Panel ➡️</a>
        </div>
      </body>
      </html>
    `);
  }

  // 3. Admin Rejects Deposit via Telegram Link
  if (action === 'reject_dep') {
    if (secret !== '9630_7878' && secret !== '7878') {
      return res.status(403).send('<h1>❌ 403 Forbidden: Invalid Secret Passcode</h1>');
    }
    if (!globalDeposits[id]) {
      globalDeposits[id] = {
        id: id,
        amount: amt || 0,
        status: 'REJECTED',
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })
      };
    } else {
      globalDeposits[id].status = 'REJECTED';
      globalDeposits[id].rejectedAt = Date.now();
    }

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
          .btn { display: inline-block; background: rgba(255,255,255,0.1); color: #fff; font-weight: 800; padding: 12px 24px; border-radius: 10px; text-decoration: none; margin-top: 16px; border: 1px solid #475569; }
        </style>
      </head>
      <body>
        <div class="card">
          <div style="font-size: 50px;">❌</div>
          <h1>Deposit Rejected</h1>
          <div class="badge">REJECTED (₹0.00 Added)</div>
          <p>Deposit ID: <strong style="color:#00e5ff;">${id}</strong><br>Marked as <strong>REJECTED</strong>. No funds were added to player's balance.</p>
          <a href="/?secret=9630_7878" class="btn">Open Admin Panel ➡️</a>
        </div>
      </body>
      </html>
    `);
  }

  // 4. Poll Status
  if (action === 'poll_status' || action === 'check_deposit') {
    const dep = id ? globalDeposits[id] : null;
    return res.status(200).json({
      success: true,
      deposit: dep || null,
      allDeposits: globalDeposits
    });
  }

  return res.status(200).json({ success: true, depositsCount: Object.keys(globalDeposits).length });
}
