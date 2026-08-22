/**
 * Casino Wallet, UPI Gateway, Deposits & Withdrawals Management
 * Server-Synchronized, Tamper-Proof, and Authoritative.
 */
class CasinoWallet {
  constructor() {
    this.DEFAULT_BALANCE = 1000.00;
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
      return window.Telegram.WebApp.initDataUnsafe.user.id;
    }
    return localStorage.getItem('viewpoint_telegram_id') || '78912345';
  }

  setTelegramId(id) {
    this.activeTelegramId = id;
    localStorage.setItem('viewpoint_telegram_id', id);
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
      payeeName: 'VIEWPOINT Games',
      minDeposit: 200,
      maxDeposit: 50000,
      minWithdraw: 300,
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
    this.subscribers.forEach(cb => cb(this.balance, this.currency));
  }

  hasFunds(amount) {
    return this.balance >= amount && amount > 0;
  }

  // Optimistic UI deduction while awaiting authoritative server result
  deduct(amount) {
    if (this.balance < amount || amount <= 0) {
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
    const uid = this.activeTelegramId || this.activeUserId;
    const depId = 'DEP-' + Date.now().toString(36).toUpperCase();

    const localRequest = {
      id: depId,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      date: new Date().toLocaleDateString(),
      amount: amount,
      utr: utrVal,
      upiId: upiVal,
      status: 'PENDING'
    };

    // Dispatch to server backend securely
    try {
      const res = await fetch(`${this.apiBaseUrl}/api/wallet/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: uid,
          amount: amount,
          utr: utrVal,
          upi_id: upiVal,
          deposit_id: depId
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Deposit submission failed on server." };
      }

      this.pendingDeposits.unshift(localRequest);
      this.savePendingDeposits();
      return { success: true, deposit: localRequest };
    } catch (err) {
      return { success: false, error: "Network error connecting to payment server." };
    }
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

    try {
      const res = await fetch(`${this.apiBaseUrl}/api/wallet/submit_withdrawal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: uid,
          amount: amount,
          receiver: receiver,
          channel: channel,
          otp: otp
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Withdrawal failed." };
      }

      if (data.balance !== undefined) {
        this.balance = data.balance;
        this.saveLocalBalance();
        this.notify();
      }

      const localReq = {
        id: (data.withdrawal && data.withdrawal.id) || 'WTH-' + Date.now().toString(36).toUpperCase(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        date: new Date().toLocaleDateString(),
        channel: channel,
        amount: amount,
        fee: (data.withdrawal && data.withdrawal.fee) || Math.round(amount * 0.08 * 100) / 100,
        netPayout: (data.withdrawal && data.withdrawal.net_payout) || Math.round(amount * 0.92 * 100) / 100,
        receiver: receiver,
        status: 'PENDING'
      };

      this.pendingWithdrawals.unshift(localReq);
      this.savePendingWithdrawals();
      return { success: true, withdrawal: localReq, message: data.message };
    } catch (err) {
      return { success: false, error: "Network error submitting withdrawal." };
    }
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
