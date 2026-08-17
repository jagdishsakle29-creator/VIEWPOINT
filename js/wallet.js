/**
 * Casino Wallet, UPI Gateway, Deposits & Withdrawals Management
 */
class CasinoWallet {
  constructor() {
    this.DEFAULT_BALANCE = 1000.00;
    this.apiBaseUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:8000'
      : (window.BACKEND_API_URL || window.location.origin);
    this.currency = this.loadCurrency(); // '₹' or '$'
    this.balance = this.loadBalance();
    this.history = this.loadHistory();
    this.depositHistory = this.loadDepositHistory();
    this.pendingDeposits = this.loadPendingDeposits();
    this.withdrawHistory = this.loadWithdrawHistory();
    this.pendingWithdrawals = this.loadPendingWithdrawals();
    this.upiSettings = this.loadUpiSettings();
    this.telegramSettings = this.loadTelegramSettings();
    this.subscribers = [];
    this.activeTelegramId = this.detectTelegramId();
    if (this.activeTelegramId) {
      this.syncServerBalance();
    }
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
    if (!this.activeTelegramId) return;
    try {
      const res = await fetch(`${this.apiBaseUrl}/api/user?telegram_id=${this.activeTelegramId}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.user) {
          this.balance = parseFloat(data.user.balance) || this.balance;
          this.saveBalance();
          this.notify();
        }
      }
    } catch (e) {
      // Offline fallback
    }
  }

  setServerBalance(newBal) {
    if (typeof newBal === 'number' && !isNaN(newBal)) {
      this.balance = Math.max(0, newBal);
      this.saveBalance();
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
        if (parsed.upiId && parsed.upiId !== 'merchant@upi') return parsed;
      } catch (e) {}
    }
    const defaults = {
      upiId: 'adrenox1@axl',
      payeeName: 'VIEWPOINT Games',
      minDeposit: 200,
      maxDeposit: 50000,
      minWithdraw: 300,
      maxWithdraw: 50000,
      note: 'VIEWPOINT Deposit'
    };
    localStorage.setItem('stake_upi_settings', JSON.stringify(defaults));
    return defaults;
  }

  saveUpiSettings(settings) {
    this.upiSettings = { ...this.upiSettings, ...settings };
    localStorage.setItem('stake_upi_settings', JSON.stringify(this.upiSettings));
  }

  loadTelegramSettings() {
    const defaultSettings = {
      botToken: '8787525713:AAGbp7iUbvphivcL6W-ca9TDsZ_xXGv4a7M',
      chatId: '6527377657',
      username: 'VIEWPOINT78',
      isEnabled: true
    };
    const saved = localStorage.getItem('stake_telegram_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.username) parsed.username = 'VIEWPOINT78';
        if (!parsed.botToken) parsed.botToken = defaultSettings.botToken;
        if (!parsed.chatId) parsed.chatId = defaultSettings.chatId;
        return parsed;
      } catch (e) {}
    }
    return defaultSettings;
  }

  saveTelegramSettings(settings) {
    this.telegramSettings = { ...this.telegramSettings, ...settings };
    localStorage.setItem('stake_telegram_settings', JSON.stringify(this.telegramSettings));
  }

  loadBalance() {
    let key = 'stake_game_balance';
    if (this.activeUserId) {
      key = 'stake_balance_' + this.activeUserId;
    }
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= 0) return parsed;
    }
    // First time user: grant demo funds once
    localStorage.setItem(key, this.DEFAULT_BALANCE.toFixed(2));
    return this.DEFAULT_BALANCE;
  }

  saveBalance() {
    localStorage.setItem('stake_game_balance', this.balance.toFixed(2));
    if (this.activeUserId) {
      localStorage.setItem('stake_balance_' + this.activeUserId, this.balance.toFixed(2));
    }
    this.notify();
  }

  switchUser(userId) {
    this.activeUserId = userId || null;
    this.balance = this.loadBalance();
    this.saveBalance();
    this.notify();
  }

  loadHistory() {
    const saved = localStorage.getItem('stake_bet_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  }

  saveHistory() {
    localStorage.setItem('stake_bet_history', JSON.stringify(this.history.slice(0, 50)));
  }

  loadDepositHistory() {
    const saved = localStorage.getItem('stake_deposit_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  }

  saveDepositHistory() {
    localStorage.setItem('stake_deposit_history', JSON.stringify(this.depositHistory.slice(0, 50)));
  }

  loadPendingDeposits() {
    const saved = localStorage.getItem('stake_pending_deposits');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  }

  savePendingDeposits() {
    localStorage.setItem('stake_pending_deposits', JSON.stringify(this.pendingDeposits));
  }

  loadWithdrawHistory() {
    const saved = localStorage.getItem('stake_withdraw_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  }

  saveWithdrawHistory() {
    localStorage.setItem('stake_withdraw_history', JSON.stringify(this.withdrawHistory.slice(0, 50)));
  }

  loadPendingWithdrawals() {
    const saved = localStorage.getItem('stake_pending_withdrawals');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
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

  resetBalance(amount = this.DEFAULT_BALANCE) {
    this.balance = amount;
    this.saveBalance();
  }

  hasFunds(amount) {
    return this.balance >= amount && amount > 0;
  }

  deduct(amount) {
    if (this.balance < amount || amount <= 0) {
      return false;
    }
    this.balance = Math.max(0, this.balance - amount);
    this.saveBalance();
    return true;
  }

  addWin(amount) {
    if (amount <= 0) return;
    this.balance += amount;
    this.saveBalance();
  }

  add(amount) {
    return this.addWin(amount);
  }

  // Create a new deposit request requiring Admin Confirmation
  submitDepositRequest(amount, utr = '', upiId = '') {
    amount = parseFloat(amount);
    if (isNaN(amount) || amount <= 0) return null;

    const request = {
      id: 'DEP-' + Date.now().toString(36).toUpperCase(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      date: new Date().toLocaleDateString(),
      amount: amount,
      utr: utr || Math.floor(100000000000 + Math.random() * 900000000000).toString(),
      upiId: upiId || this.upiSettings.upiId,
      status: 'PENDING'
    };

    this.pendingDeposits.unshift(request);
    this.savePendingDeposits();

    // Optionally notify Telegram Bot if configured
    this.sendTelegramAlert(request, 'DEPOSIT');

    return request;
  }

  // Admin manually approves the pending deposit
  approveDeposit(depositId) {
    const idx = this.pendingDeposits.findIndex(d => d.id === depositId);
    if (idx === -1) return null;

    const [deposit] = this.pendingDeposits.splice(idx, 1);
    deposit.status = 'SUCCESS';
    deposit.approvedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    this.savePendingDeposits();

    // Credit balance
    this.balance += deposit.amount;
    this.saveBalance();

    // Log to deposit history
    this.depositHistory.unshift(deposit);
    this.saveDepositHistory();

    return deposit;
  }

  // Admin rejects the pending deposit
  rejectDeposit(depositId, reason = 'Payment not received in bank account') {
    const idx = this.pendingDeposits.findIndex(d => d.id === depositId);
    if (idx === -1) return null;

    const [deposit] = this.pendingDeposits.splice(idx, 1);
    deposit.status = 'REJECTED';
    deposit.rejectedReason = reason;
    deposit.rejectedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    this.savePendingDeposits();

    this.depositHistory.unshift(deposit);
    this.saveDepositHistory();

    return deposit;
  }

  // Submit Withdrawal Request (8% Platform Fee Applied)
  submitWithdrawRequest(data, fallbackUpi = '', fallbackName = 'Player') {
    let amount = typeof data === 'object' ? parseFloat(data.amount) : parseFloat(data);
    if (isNaN(amount) || amount <= 0 || this.balance < amount) return null;

    // Deduct gross amount immediately from balance for pending payout
    this.balance = Math.max(0, this.balance - amount);
    this.saveBalance();

    const channel = (typeof data === 'object' && data.channel) ? data.channel : 'UPI';
    const receiver = (typeof data === 'object' && (data.receiver || data.upiId)) ? (data.receiver || data.upiId) : (fallbackUpi || 'N/A');
    const accountName = (typeof data === 'object' && data.accountName) ? data.accountName : fallbackName;

    // 8% Platform Service Fee
    const feeRate = 0.08;
    const fee = Math.round(amount * feeRate * 100) / 100;
    const netPayout = Math.round((amount - fee) * 100) / 100;

    const request = {
      id: 'WTH-' + Date.now().toString(36).toUpperCase(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      date: new Date().toLocaleDateString(),
      channel: channel,
      amount: amount,
      fee: fee,
      netPayout: netPayout,
      receiver: receiver,
      upiId: receiver,
      accountName: accountName,
      details: typeof data === 'object' ? data : { channel, receiver, accountName },
      status: 'PENDING'
    };

    this.pendingWithdrawals.unshift(request);
    this.savePendingWithdrawals();

    this.sendTelegramAlert(request, 'WITHDRAW');
    return request;
  }

  // Admin approves withdrawal (Payout Sent)
  approveWithdrawal(withdrawId) {
    const idx = this.pendingWithdrawals.findIndex(w => w.id === withdrawId);
    if (idx === -1) return null;

    const [withdraw] = this.pendingWithdrawals.splice(idx, 1);
    withdraw.status = 'PAID';
    withdraw.approvedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    this.savePendingWithdrawals();

    this.withdrawHistory.unshift(withdraw);
    this.saveWithdrawHistory();

    return withdraw;
  }

  // Admin rejects withdrawal and refunds balance to player
  rejectWithdrawal(withdrawId, reason = 'Incorrect UPI ID or Account Details') {
    const idx = this.pendingWithdrawals.findIndex(w => w.id === withdrawId);
    if (idx === -1) return null;

    const [withdraw] = this.pendingWithdrawals.splice(idx, 1);
    withdraw.status = 'REFUNDED';
    withdraw.rejectedReason = reason;
    withdraw.rejectedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Refund funds back to balance
    this.balance += withdraw.amount;
    this.saveBalance();

    this.savePendingWithdrawals();

    this.withdrawHistory.unshift(withdraw);
    this.saveWithdrawHistory();

    return withdraw;
  }

  // Direct auto-deposit (Legacy / instant fallback)
  deposit(amount, utr = '', upiId = '') {
    amount = parseFloat(amount);
    if (isNaN(amount) || amount <= 0) return false;

    this.balance += amount;
    this.saveBalance();

    const record = {
      id: 'DEP-' + Date.now().toString(36).toUpperCase(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      date: new Date().toLocaleDateString(),
      amount: amount,
      utr: utr || 'AUTO-' + Math.floor(100000000000 + Math.random() * 900000000000),
      upiId: upiId || this.upiSettings.upiId,
      status: 'SUCCESS'
    };

    this.depositHistory.unshift(record);
    this.saveDepositHistory();
    return record;
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

  // Send Telegram Notification to Admin (@VIEWPOINT78)
  async sendTelegramAlert(item, type = 'DEPOSIT') {
    if (!this.telegramSettings.isEnabled || !this.telegramSettings.botToken || !this.telegramSettings.chatId) {
      return;
    }

    try {
      let msg = '';
      if (type === 'DEPOSIT') {
        msg = `🔔 *NEW UPI DEPOSIT REQUEST* 🔔\n\n` +
          `💰 *Amount:* ${this.currency}${item.amount.toFixed(2)}\n` +
          `🧾 *UTR:* \`${item.utr}\`\n` +
          `💳 *Receiver UPI:* \`${item.upiId}\`\n` +
          `⏰ *Time:* ${item.time}\n` +
          `🆔 *Order ID:* \`${item.id}\`\n\n` +
          `👉 *Admin Handle:* @VIEWPOINT78\n` +
          `Open VIEWPOINT Admin Settings to Approve/Reject.`;
      } else {
        msg = `💸 *NEW WITHDRAWAL REQUEST (8% Fee)* 💸\n\n` +
          `💰 *Gross Amount:* ${this.currency}${item.amount.toFixed(2)}\n` +
          `🏷️ *Platform Fee (8%):* -${this.currency}${(item.fee || item.amount * 0.08).toFixed(2)}\n` +
          `✅ *Net Payout to Send:* *${this.currency}${(item.netPayout || item.amount * 0.92).toFixed(2)}*\n\n` +
          `💳 *Receiver Info:* \`${item.receiver || item.upiId}\`\n` +
          `👤 *Name:* ${item.accountName}\n` +
          `📡 *Channel:* ${item.channel || 'UPI'}\n` +
          `⏰ *Time:* ${item.time}\n` +
          `🆔 *Order ID:* \`${item.id}\`\n\n` +
          `👉 *Admin Handle:* @VIEWPOINT78\n` +
          `Please send ${this.currency}${(item.netPayout || item.amount * 0.92).toFixed(2)} to player and click Approve in Admin.`;
      }

      const url = `https://api.telegram.org/bot${this.telegramSettings.botToken}/sendMessage`;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.telegramSettings.chatId,
          text: msg,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: "🚀 Open Admin Casino", url: "https://viewpoint-1.vercel.app" },
                { text: "💬 Support @VIEWPOINT78", url: "https://t.me/VIEWPOINT78" }
              ]
            ]
          }
        })
      });
    } catch (err) {
      console.warn("Telegram webhook notification error:", err);
    }
  }
}

window.wallet = new CasinoWallet();
