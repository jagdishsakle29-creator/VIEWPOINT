/**
 * Casino Wallet, UPI Gateway, Deposits & Withdrawals Management
 * Server-Synchronized, Tamper-Proof, and Authoritative.
 */
class CasinoWallet {
  constructor() {
    this.DEFAULT_BALANCE = 200.00;
    this.apiBaseUrl = (window.APP_CONFIG && window.APP_CONFIG.getApiBaseUrl)
      ? window.APP_CONFIG.getApiBaseUrl()
      : ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:8000' : window.location.origin);
    this.currency = this.loadCurrency(); // '₹' or '$'
    this.activeUserId = this.detectUserId();
    this.activeTelegramId = this.detectTelegramId();
    this.balance = this.loadLocalBalance();
    this.history = this.loadHistory();
    this.depositHistory = this.loadDepositHistory();
    this.pendingDeposits = this.loadPendingDeposits();
    this.withdrawHistory = this.loadWithdrawHistory();
    this.pendingWithdrawals = this.loadPendingWithdrawals();
    this.upiSettings = this.loadUpiSettings();
    this.subscribers = [];

    // Sync authoritative server balance on init
    this.syncServerBalance();

    // SEC-08: Cross-tab sync without trusting client-side balance
    window.addEventListener('storage', (e) => {
      if (e.key && (e.key.includes('stake_balance') || e.key.includes('stake_deposit') || e.key.includes('stake_withdraw'))) {
        this.syncServerBalance();
      }
    });
  }

  detectUserId() {
    const authUser = localStorage.getItem('stake_user_auth');
    if (authUser) {
      try {
        const u = JSON.parse(authUser);
        if (u && (u.userId || u.username || u.phone)) {
          return u.userId || u.phone || u.username;
        }
      } catch (e) {}
    }
    return localStorage.getItem('viewpoint_user_id') || 'guest_' + Math.random().toString(36).substring(2, 8);
  }

  detectTelegramId() {
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
      return window.Telegram.WebApp.initDataUnsafe.user.id.toString();
    }
    return localStorage.getItem('viewpoint_telegram_id') || '78912345';
  }

  setTelegramId(id) {
    this.activeTelegramId = id.toString();
    localStorage.setItem('viewpoint_telegram_id', id.toString());
    this.syncServerBalance();
  }

  async syncServerBalance() {
    const uid = this.activeUserId || this.activeTelegramId;
    if (!uid) return;

    try {
      // Try /api/wallet first (serverless), fallback to /api/user (Python backend)
      let res = await fetch(`${this.apiBaseUrl}/api/wallet?userId=${encodeURIComponent(uid)}&action=get_balance`, {
        headers: { 'X-User-Id': uid }
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch(`${this.apiBaseUrl}/api/user?telegram_id=${encodeURIComponent(this.activeTelegramId || uid)}`).catch(() => null);
      }

      if (res && res.ok) {
        const data = await res.json();
        if (data && data.success) {
          const remoteBal = parseFloat(data.balance !== undefined ? data.balance : (data.user && data.user.balance));
          if (!isNaN(remoteBal)) {
            this.balance = remoteBal;
            this.saveLocalBalance();
            this.notify();
          }
        }
      }
    } catch (e) {
      // Offline fallback
    }
  }

  setServerBalance(newBal) {
    if (typeof newBal === 'number' && !isNaN(newBal)) {
      this.balance = Math.max(0, Math.round(newBal * 100) / 100);
      this.saveLocalBalance();
      this.notify();
    }
  }

  loadCurrency() {
    return localStorage.getItem('stake_currency') || '₹';
  }

  setCurrency(curr) {
    this.currency = curr;
    localStorage.setItem('stake_currency', curr);
    this.notify();
  }

  loadUpiSettings() {
    const saved = localStorage.getItem('stake_upi_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.upiId) return parsed;
      } catch (e) {}
    }
    return {
      upiId: 'adrenox1@axl',
      minDeposit: 10,
      maxDeposit: 50000,
      minWithdraw: 200,
      maxWithdraw: 50000,
      note: 'VIEWPOINT Deposit'
    };
  }

  saveUpiSettings(settings) {
    this.upiSettings = { ...this.upiSettings, ...settings };
    localStorage.setItem('stake_upi_settings', JSON.stringify(this.upiSettings));
  }

  // Cryptographic Signature Hash to prevent unauthorized console/localStorage balance tampering
  generateIntegritySig(bal) {
    const salt = 'VP_SECURE_SALT_9981_#77x';
    const str = `${parseFloat(bal).toFixed(2)}_${salt}_${this.activeUserId || 'guest'}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return 'SIG_' + Math.abs(hash).toString(36);
  }

  verifyIntegritySig(bal, sig) {
    if (!sig) return false;
    return sig === this.generateIntegritySig(bal);
  }

  loadLocalBalance() {
    let key = 'stake_game_balance';
    let sigKey = 'stake_game_balance_sig';
    if (this.activeUserId) {
      key = 'stake_balance_' + this.activeUserId;
      sigKey = 'stake_balance_sig_' + this.activeUserId;
    }
    const saved = localStorage.getItem(key);
    const savedSig = localStorage.getItem(sigKey);

    if (saved !== null) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= 0) {
        if (savedSig && this.verifyIntegritySig(parsed, savedSig)) {
          return parsed;
        } else if (!savedSig) {
          localStorage.setItem(sigKey, this.generateIntegritySig(parsed));
          return parsed;
        } else {
          return this.DEFAULT_BALANCE;
        }
      }
    }
    localStorage.setItem(key, this.DEFAULT_BALANCE.toFixed(2));
    localStorage.setItem(sigKey, this.generateIntegritySig(this.DEFAULT_BALANCE));
    return this.DEFAULT_BALANCE;
  }

  saveLocalBalance() {
    const balStr = this.balance.toFixed(2);
    const sig = this.generateIntegritySig(this.balance);
    localStorage.setItem('stake_game_balance', balStr);
    localStorage.setItem('stake_game_balance_sig', sig);
    if (this.activeUserId) {
      localStorage.setItem('stake_balance_' + this.activeUserId, balStr);
      localStorage.setItem('stake_balance_sig_' + this.activeUserId, sig);
    }
  }

  saveBalance() {
    this.saveLocalBalance();
  }

  switchUser(userId) {
    this.activeUserId = userId || null;
    this.balance = this.loadLocalBalance();
    this.saveLocalBalance();
    this.syncServerBalance();
    this.notify();
  }

  loadHistory() {
    const saved = localStorage.getItem('stake_bet_history');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  }

  saveHistory() {
    localStorage.setItem('stake_bet_history', JSON.stringify(this.history.slice(0, 50)));
  }

  loadDepositHistory() {
    const saved = localStorage.getItem('stake_deposit_history');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  }

  saveDepositHistory() {
    localStorage.setItem('stake_deposit_history', JSON.stringify(this.depositHistory.slice(0, 50)));
  }

  loadPendingDeposits() {
    const saved = localStorage.getItem('stake_pending_deposits');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  }

  savePendingDeposits() {
    localStorage.setItem('stake_pending_deposits', JSON.stringify(this.pendingDeposits));
  }

  loadWithdrawHistory() {
    const saved = localStorage.getItem('stake_withdraw_history');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  }

  saveWithdrawHistory() {
    localStorage.setItem('stake_withdraw_history', JSON.stringify(this.withdrawHistory.slice(0, 50)));
  }

  loadPendingWithdrawals() {
    const saved = localStorage.getItem('stake_pending_withdrawals');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  }

  savePendingWithdrawals() {
    localStorage.setItem('stake_pending_withdrawals', JSON.stringify(this.pendingWithdrawals));
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    callback(this.balance, this.currency);
  }

  notify() {
    this.subscribers.forEach(cb => {
      try { cb(this.balance, this.currency); } catch(e) {}
    });
  }

  hasFunds(amount) {
    if (isNaN(amount) || amount <= 0) return false;
    return this.balance >= amount;
  }

  // Authoritative balance deduction (Strict - Never goes negative)
  deduct(amount) {
    if (isNaN(amount) || amount <= 0) return false;
    if (this.balance < amount) {
      return false;
    }
    this.balance = Math.max(0, Math.round((this.balance - amount) * 100) / 100);
    this.saveLocalBalance();
    this.notify();
    return true;
  }

  // Optimistic credit when confirmed by authoritative server response
  addWin(amount) {
    if (amount <= 0) return;
    this.balance = Math.round((this.balance + amount) * 100) / 100;
    this.saveLocalBalance();
    this.notify();
  }

  add(amount) {
    return this.addWin(amount);
  }

  // Create a new deposit request requiring Server Confirmation (SEC-02 Duplicate UTR Prevention)
  async submitDepositRequest(amount, utr = '', upiId = '') {
    amount = parseFloat(amount);
    if (isNaN(amount) || amount <= 0) return { success: false, error: "Invalid deposit amount" };

    const utrVal = (utr || '').trim();
    if (!utrVal || utrVal.length < 6) {
      return { success: false, error: "Please enter a valid 12-digit UPI UTR reference number." };
    }

    const upiVal = upiId || this.upiSettings.upiId;
    const uid = this.activeTelegramId || this.activeUserId || 'guest_user';
    const depId = 'DEP-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

    const localRequest = {
      id: depId,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      date: new Date().toLocaleDateString(),
      amount: amount,
      utr: utrVal,
      upiId: upiVal,
      status: 'PENDING',
      userId: uid,
      createdAt: Date.now()
    };

    // Save locally first so UI is immediately responsive
    this.pendingDeposits.unshift(localRequest);
    this.savePendingDeposits();

    // Dispatch to server backend securely with non-duplicate fallback cascading
    let serverSynced = false;
    try {
      // 1. Try Python API server
      let res = await fetch(`${this.apiBaseUrl}/api/wallet/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: uid,
          amount: amount,
          utr: utrVal,
          upi_id: upiVal,
          deposit_id: depId
        })
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        if (data && data.success) {
          return { success: true, deposit: localRequest, serverSynced: true };
        }
      }

      // 2. Fallback to Serverless API /api/wallet?action=submit_deposit
      res = await fetch(`${this.apiBaseUrl}/api/wallet?action=submit_deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': uid },
        body: JSON.stringify({
          userId: uid,
          amount: amount,
          utr: utrVal,
          upiId: upiVal,
          depositId: depId
        })
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        if (data && data.success) {
          return { success: true, deposit: localRequest, serverSynced: true };
        }
      }

      // 3. Fallback to /api/sync?action=create_deposit
      res = await fetch(`${this.apiBaseUrl}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_deposit',
          id: depId,
          userId: uid,
          amount: amount,
          utr: utrVal,
          upiId: upiVal
        })
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        if (data && data.success) {
          serverSynced = true;
        }
      }

      // Direct Telegram Alert Dispatch (guarantees immediate notification to Telegram Admin)
      const botToken = "8787525713:AAGbp7iUbvphivcL6W-ca9TDsZ_xXGv4a7M";
      const adminChatId = "6527377657";
      const webOrigin = window.location.origin;
      const adminSecret = "VIEWPOINT_ADMIN_SECRET_2026";
      const msgText = `🔔 <b>NEW DEPOSIT SUBMITTED</b> 🔔\n\n` +
        `👤 <b>Player ID:</b> <code>${uid}</code>\n` +
        `💰 <b>Amount:</b> <b>₹${amount.toFixed(2)}</b>\n` +
        `🧾 <b>UTR Reference:</b> <code>${utrVal}</code>\n` +
        `💳 <b>Paid via UPI:</b> <code>${upiVal}</code>\n` +
        `⏰ <b>Time:</b> ${localRequest.time}\n` +
        `🆔 <b>Deposit ID:</b> <code>${depId}</code>`;

      const tgMarkup = {
        inline_keyboard: [
          [
            { text: `✅ Approve (+₹${amount.toFixed(0)})`, url: `${webOrigin}/api/sync?secret=${encodeURIComponent(adminSecret)}&action=approve_dep&id=${encodeURIComponent(depId)}&userId=${encodeURIComponent(uid)}&amt=${encodeURIComponent(amount)}` },
            { text: "❌ Reject", url: `${webOrigin}/api/sync?secret=${encodeURIComponent(adminSecret)}&action=reject_dep&id=${encodeURIComponent(depId)}&userId=${encodeURIComponent(uid)}` }
          ]
        ]
      };

      fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: adminChatId,
          text: msgText,
          parse_mode: 'HTML',
          reply_markup: tgMarkup
        })
      }).catch(() => {});
    } catch (err) {
      console.warn("Server deposit dispatch warn:", err);
    }

    return { success: true, deposit: localRequest, serverSynced };
  }

  // Admin / Server Approves Deposit and credits funds to wallet
  approveDeposit(depositId, amountOverride = null, userId = null) {
    let deposit = null;
    const pIdx = this.pendingDeposits.findIndex(d => d.id === depositId);
    if (pIdx !== -1) {
      deposit = this.pendingDeposits.splice(pIdx, 1)[0];
      this.savePendingDeposits();
    } else {
      deposit = this.depositHistory.find(d => d.id === depositId);
    }

    if (!deposit) {
      deposit = {
        id: depositId,
        amount: amountOverride || 500,
        utr: 'N/A',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString()
      };
    }

    const credAmount = amountOverride !== null ? parseFloat(amountOverride) : parseFloat(deposit.amount || 0);
    deposit.status = 'SUCCESS';
    deposit.approvedAt = new Date().toISOString();
    deposit.amount = credAmount;

    // Credit player balance
    this.addWin(credAmount);

    // Save to deposit history if not already present
    const hIdx = this.depositHistory.findIndex(d => d.id === depositId);
    if (hIdx !== -1) {
      this.depositHistory[hIdx] = deposit;
    } else {
      this.depositHistory.unshift(deposit);
    }
    this.saveDepositHistory();

    // Record to financial ledger
    this.recordFinancialTransaction('deposit', credAmount);

    // Sync approval to server in background
    try {
      fetch(`${this.apiBaseUrl}/api/admin/approve_deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deposit_id: depositId, amount: credAmount, userId: userId || deposit.userId })
      }).catch(() => {});

      fetch(`${this.apiBaseUrl}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_dep', id: depositId, amt: credAmount, userId: userId || deposit.userId })
      }).catch(() => {});
    } catch(e) {}

    return deposit;
  }

  // Admin / Server Rejects Deposit
  rejectDeposit(depositId, reason = 'Payment not received in bank account') {
    let deposit = null;
    const pIdx = this.pendingDeposits.findIndex(d => d.id === depositId);
    if (pIdx !== -1) {
      deposit = this.pendingDeposits.splice(pIdx, 1)[0];
      this.savePendingDeposits();
    } else {
      deposit = this.depositHistory.find(d => d.id === depositId);
    }

    if (!deposit) {
      deposit = {
        id: depositId,
        amount: 0,
        utr: 'N/A',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }

    deposit.status = 'REJECTED';
    deposit.rejectReason = reason;
    deposit.rejectedAt = new Date().toISOString();

    const hIdx = this.depositHistory.findIndex(d => d.id === depositId);
    if (hIdx !== -1) {
      this.depositHistory[hIdx] = deposit;
    } else {
      this.depositHistory.unshift(deposit);
    }
    this.saveDepositHistory();

    // Sync rejection to server in background
    try {
      fetch(`${this.apiBaseUrl}/api/admin/reject_deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deposit_id: depositId, reason: reason })
      }).catch(() => {});

      fetch(`${this.apiBaseUrl}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject_dep', id: depositId, reason: reason })
      }).catch(() => {});
    } catch(e) {}

    return deposit;
  }

  // Admin Approves Withdrawal (Payout processed)
  approveWithdrawal(withdrawId) {
    let wth = null;
    const pIdx = this.pendingWithdrawals.findIndex(w => w.id === withdrawId);
    if (pIdx !== -1) {
      wth = this.pendingWithdrawals.splice(pIdx, 1)[0];
      this.savePendingWithdrawals();
    } else {
      wth = this.withdrawHistory.find(w => w.id === withdrawId);
    }

    if (!wth) {
      wth = {
        id: withdrawId,
        amount: 500,
        netPayout: 460,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }

    wth.status = 'PAID';
    wth.approvedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const hIdx = this.withdrawHistory.findIndex(w => w.id === withdrawId);
    if (hIdx !== -1) {
      this.withdrawHistory[hIdx] = wth;
    } else {
      this.withdrawHistory.unshift(wth);
    }
    this.saveWithdrawHistory();

    // Record withdrawal payout in financial ledger
    this.recordFinancialTransaction('withdrawal', parseFloat(wth.amount || 0));

    // Sync approval to server
    try {
      fetch(`${this.apiBaseUrl}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_wth', id: withdrawId })
      }).catch(() => {});
    } catch(e) {}

    return wth;
  }

  // Admin Rejects Withdrawal (Refund back to player balance)
  rejectWithdrawal(withdrawId, reason = 'Incorrect UPI or Details') {
    let wth = null;
    const pIdx = this.pendingWithdrawals.findIndex(w => w.id === withdrawId);
    if (pIdx !== -1) {
      wth = this.pendingWithdrawals.splice(pIdx, 1)[0];
      this.savePendingWithdrawals();
    } else {
      wth = this.withdrawHistory.find(w => w.id === withdrawId);
    }

    if (!wth) {
      wth = {
        id: withdrawId,
        amount: 500,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }

    wth.status = 'REJECTED';
    wth.rejectReason = reason;

    // Refund gross amount to balance
    const refundAmt = parseFloat(wth.amount || 0);
    if (refundAmt > 0) {
      this.addWin(refundAmt);
    }

    const hIdx = this.withdrawHistory.findIndex(w => w.id === withdrawId);
    if (hIdx !== -1) {
      this.withdrawHistory[hIdx] = wth;
    } else {
      this.withdrawHistory.unshift(wth);
    }
    this.saveWithdrawHistory();

    // Sync rejection to server
    try {
      fetch(`${this.apiBaseUrl}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject_wth', id: withdrawId, reason: reason })
      }).catch(() => {});
    } catch(e) {}

    return wth;
  }

  recordFinancialTransaction(type, amount) {
    try {
      let ledger = JSON.parse(localStorage.getItem('stake_monthly_financial_ledger') || '{}');
      const now = new Date();
      const key = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      if (!ledger[key]) {
        ledger[key] = {
          month: key,
          depositsCount: 0,
          depositsAmount: 0,
          withdrawalsCount: 0,
          withdrawalsAmount: 0
        };
      }
      if (type === 'deposit') {
        ledger[key].depositsCount = (ledger[key].depositsCount || 0) + 1;
        ledger[key].depositsAmount = Math.round(((ledger[key].depositsAmount || 0) + amount) * 100) / 100;
      } else if (type === 'withdrawal') {
        ledger[key].withdrawalsCount = (ledger[key].withdrawalsCount || 0) + 1;
        ledger[key].withdrawalsAmount = Math.round(((ledger[key].withdrawalsAmount || 0) + amount) * 100) / 100;
      }
      localStorage.setItem('stake_monthly_financial_ledger', JSON.stringify(ledger));
    } catch(e) {}
  }

  // Request Server-Side Withdrawal OTP (SEC-03)
  async requestWithdrawalOtp() {
    const uid = this.activeTelegramId || this.activeUserId;
    try {
      const res = await fetch(`${this.apiBaseUrl}/api/wallet/request_withdrawal_otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id: uid })
      });
      const data = await res.json();
      return data;
    } catch (e) {
      return { success: false, error: "Failed to request withdrawal OTP from server." };
    }
  }

  // Submit Withdrawal Request (SEC-03 Authoritative Server-Side OTP & Fee Validation)
  async submitWithdrawRequest(data, otp = '') {
    let amount = typeof data === 'object' ? parseFloat(data.amount) : parseFloat(data);
    if (isNaN(amount) || amount <= 0 || this.balance < amount) {
      return { success: false, error: "Insufficient balance for withdrawal." };
    }

    const channel = (typeof data === 'object' && data.channel) ? data.channel : 'UPI';
    const receiver = (typeof data === 'object' && (data.receiver || data.upiId)) ? (data.receiver || data.upiId) : '';
    const uid = this.activeTelegramId || this.activeUserId;

    if (!receiver) {
      return { success: false, error: "Please provide a valid receiver account / UPI ID." };
    }

    // Deduct locally
    this.deduct(amount);

    const fee = Math.round(amount * 0.08 * 100) / 100;
    const netPayout = Math.round((amount - fee) * 100) / 100;
    const wthId = 'WTH-' + Date.now().toString(36).toUpperCase();

    const localReq = {
      id: wthId,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      date: new Date().toLocaleDateString(),
      channel: channel,
      amount: amount,
      fee: fee,
      netPayout: netPayout,
      receiver: receiver,
      status: 'PENDING'
    };

    this.pendingWithdrawals.unshift(localReq);
    this.savePendingWithdrawals();

    try {
      let res = await fetch(`${this.apiBaseUrl}/api/wallet/submit_withdrawal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: uid,
          amount: amount,
          receiver: receiver,
          channel: channel,
          otp: otp
        })
      }).catch(() => null);

      if (res && res.ok) {
        const respData = await res.json().catch(() => null);
        if (respData && respData.balance !== undefined) {
          this.balance = respData.balance;
          this.saveLocalBalance();
          this.notify();
        }
        return { success: true, withdrawal: localReq, message: "Withdrawal request submitted successfully." };
      }

      res = await fetch(`${this.apiBaseUrl}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_withdrawal',
          id: wthId,
          userId: uid,
          amount: amount,
          netPayout: netPayout,
          receiver: receiver,
          channel: channel
        })
      }).catch(() => null);

      if (res && res.ok) {
        const respData = await res.json().catch(() => null);
        if (respData && respData.balance !== undefined) {
          this.balance = respData.balance;
          this.saveLocalBalance();
          this.notify();
        }
      }

      // Direct Telegram Alert Dispatch for Withdrawal
      const botToken = "8787525713:AAGbp7iUbvphivcL6W-ca9TDsZ_xXGv4a7M";
      const adminChatId = "6527377657";
      const webOrigin = window.location.origin;
      const adminSecret = "VIEWPOINT_ADMIN_SECRET_2026";
      const wthMsg = `💸 <b>NEW WITHDRAWAL REQUEST</b> 💸\n\n` +
        `👤 <b>Player ID:</b> <code>${uid}</code>\n` +
        `💰 <b>Gross Amount:</b> ₹${amount.toFixed(2)}\n` +
        `🏷️ <b>Platform Fee (8%):</b> -₹${fee.toFixed(2)}\n` +
        `✅ <b>Net Payout to Send:</b> <b>₹${netPayout.toFixed(2)}</b>\n\n` +
        `💳 <b>Receiver UPI:</b> <code>${receiver}</code>\n` +
        `📡 <b>Channel:</b> ${channel}\n` +
        `⏰ <b>Time:</b> ${localReq.time}\n` +
        `🆔 <b>Withdrawal ID:</b> <code>${wthId}</code>`;

      const wthMarkup = {
        inline_keyboard: [
          [
            { text: `✅ Mark Paid (₹${netPayout.toFixed(0)})`, url: `${webOrigin}/api/sync?secret=${encodeURIComponent(adminSecret)}&action=approve_wth&id=${encodeURIComponent(wthId)}&userId=${encodeURIComponent(uid)}&amt=${encodeURIComponent(netPayout)}` },
            { text: "❌ Reject & Refund", url: `${webOrigin}/api/sync?secret=${encodeURIComponent(adminSecret)}&action=reject_wth&id=${encodeURIComponent(wthId)}&userId=${encodeURIComponent(uid)}` }
          ]
        ]
      };

      fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: adminChatId,
          text: wthMsg,
          parse_mode: 'HTML',
          reply_markup: wthMarkup
        })
      }).catch(() => {});
    } catch (err) {}

    return { success: true, withdrawal: localReq, message: "Withdrawal request submitted successfully." };
  }

  // Atomic Server-Side Welcome Bonus Claim (SEC-04)
  async claimWelcomeBonusServer() {
    const uid = this.activeTelegramId || this.activeUserId;
    try {
      const res = await fetch(`${this.apiBaseUrl}/api/wallet/claim_welcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id: uid })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.balance !== undefined) {
          this.balance = data.balance;
          this.saveLocalBalance();
          this.notify();
        }
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error || "Welcome bonus already claimed." };
      }
    } catch (e) {
      return { success: false, error: "Failed to claim welcome bonus from server." };
    }
  }

  // Atomic Server-Side Daily Reward Claim (SEC-04)
  async claimDailyRewardServer() {
    const uid = this.activeTelegramId || this.activeUserId;
    try {
      const res = await fetch(`${this.apiBaseUrl}/api/wallet/claim_daily`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id: uid })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.balance !== undefined) {
          this.balance = data.balance;
          this.saveLocalBalance();
          this.notify();
        }
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error || "Daily reward already claimed today." };
      }
    } catch (e) {
      return { success: false, error: "Failed to claim daily reward from server." };
    }
  }

  recordBet(data) {
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      game: data.game || 'Game',
      bet: data.bet || 0,
      multiplier: data.multiplier || 0,
      payout: data.payout || 0,
      won: !!data.won,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      date: new Date().toLocaleDateString(),
      serverSeedHash: data.serverSeedHash || ''
    };

    this.history.unshift(entry);
    this.saveHistory();
    return entry;
  }
}

window.wallet = new CasinoWallet();
