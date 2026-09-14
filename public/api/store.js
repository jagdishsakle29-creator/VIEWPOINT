// /api/store.js - Shared Persistent Storage for VIEWPOINT Casino Functions
// Uses /tmp JSON persistence with fast in-memory caching to survive serverless scale & cold starts.

const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join('/tmp', 'viewpoint_state.json');

let inMemoryCache = null;

function loadStore() {
  if (inMemoryCache) return inMemoryCache;
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf8');
      inMemoryCache = JSON.parse(raw);
      if (!inMemoryCache.wallets) inMemoryCache.wallets = {};
      if (!inMemoryCache.deposits) inMemoryCache.deposits = {};
      if (!inMemoryCache.withdrawals) inMemoryCache.withdrawals = {};
      if (!inMemoryCache.history) inMemoryCache.history = {};
      if (!inMemoryCache.ledger) inMemoryCache.ledger = {};
      return inMemoryCache;
    }
  } catch (e) {}

  inMemoryCache = {
    wallets: {},
    deposits: {},
    withdrawals: {},
    history: {},
    referrals: {},
    ledger: {}
  };
  return inMemoryCache;
}

function saveStore() {
  if (!inMemoryCache) return;
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(inMemoryCache), 'utf8');
  } catch (e) {}
}

function setWalletBalance(userId, balance) {
  const store = loadStore();
  const uid = String(userId || 'user_default').trim();
  const bal = Math.max(0, Math.round(parseFloat(balance || 0) * 100) / 100);
  if (!store.wallets[uid]) {
    store.wallets[uid] = {
      userId: uid,
      balance: bal,
      totalDeposited: 0.00,
      totalWithdrawn: 0.00,
      currency: '₹',
      updatedAt: Date.now()
    };
  } else {
    store.wallets[uid].balance = bal;
    store.wallets[uid].updatedAt = Date.now();
  }
  saveStore();
  return store.wallets[uid];
}

function getWallet(userId) {
  const store = loadStore();
  const uid = String(userId || 'user_default').trim();
  if (!store.wallets[uid]) {
    store.wallets[uid] = {
      userId: uid,
      balance: 0.00,
      totalDeposited: 0.00,
      totalWithdrawn: 0.00,
      currency: '₹',
      updatedAt: Date.now()
    };
    saveStore();
  }
  return store.wallets[uid];
}

function updateWalletBalance(userId, amountDelta) {
  const store = loadStore();
  const wallet = getWallet(userId);
  wallet.balance = Math.max(0, Math.round((wallet.balance + amountDelta) * 100) / 100);
  if (amountDelta > 0) {
    wallet.totalDeposited = Math.round(((wallet.totalDeposited || 0) + amountDelta) * 100) / 100;
  }
  wallet.updatedAt = Date.now();
  saveStore();
  return wallet;
}

function getDeposit(depId) {
  const store = loadStore();
  return store.deposits[depId] || null;
}

function saveDeposit(depRecord) {
  const store = loadStore();
  store.deposits[depRecord.id] = depRecord;
  saveStore();
}

function approveDeposit(depId, amountOverride, userIdOverride, source = 'admin') {
  const store = loadStore();
  if (!store.ledger) store.ledger = {};

  // 1. Duplicate Credit Protection via Immutable Ledger
  if (store.ledger[depId]) {
    return {
      success: false,
      alreadyProcessed: true,
      error: 'ALREADY_PROCESSED: This payment was already credited in ledger',
      ledger: store.ledger[depId]
    };
  }

  let dep = store.deposits[depId];
  if (dep && dep.status === 'SUCCESS') {
    return {
      success: false,
      alreadyProcessed: true,
      error: 'ALREADY_PROCESSED: Deposit is already marked as SUCCESS'
    };
  }

  // 2. Single Source of Truth for Approved Amount (Exact 2-Decimal Precision)
  const requestedAmount = dep ? Math.round(parseFloat(dep.amount || 0) * 100) / 100 : 0;
  let approvedAmount = requestedAmount;
  if (amountOverride !== undefined && amountOverride !== null && !isNaN(parseFloat(amountOverride))) {
    approvedAmount = Math.round(parseFloat(amountOverride) * 100) / 100;
  }
  if (approvedAmount <= 0) {
    return { success: false, error: 'INVALID_AMOUNT: Approved amount must be greater than 0' };
  }

  const creditedAmount = approvedAmount;
  const uid = String(userIdOverride || (dep ? dep.userId : '') || 'guest_default').trim();

  // 3. Update Deposit Record
  const now = Date.now();
  if (!dep) {
    dep = {
      id: depId,
      userId: uid,
      requestedAmount: requestedAmount || approvedAmount,
      amount: approvedAmount,
      approvedAmount: approvedAmount,
      creditedAmount: creditedAmount,
      status: 'SUCCESS',
      approvedAt: now,
      source: source
    };
    store.deposits[depId] = dep;
  } else {
    dep.status = 'SUCCESS';
    dep.approvedAt = now;
    dep.requestedAmount = requestedAmount;
    dep.amount = approvedAmount;
    dep.approvedAmount = approvedAmount;
    dep.creditedAmount = creditedAmount;
    dep.source = source;
  }

  // 4. Record Immutable Ledger Entry
  const ledgerRecord = {
    id: 'LEDGER-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
    paymentId: depId,
    userId: uid,
    requestedAmount: requestedAmount,
    approvedAmount: approvedAmount,
    creditedAmount: creditedAmount,
    source: source,
    createdAt: now,
    status: 'SUCCESS'
  };
  store.ledger[depId] = ledgerRecord;

  // 5. Credit Authoritative Wallet Balance
  const updatedWallet = updateWalletBalance(uid, creditedAmount);
  saveStore();

  return {
    success: true,
    deposit: dep,
    ledger: ledgerRecord,
    creditedUser: uid,
    requestedAmount: requestedAmount,
    amount: approvedAmount,
    approvedAmount: approvedAmount,
    creditedAmount: creditedAmount,
    balance: updatedWallet.balance
  };
}

function rejectDeposit(depId) {
  const store = loadStore();
  let dep = store.deposits[depId];
  if (!dep) {
    dep = { id: depId, status: 'REJECTED', rejectedAt: Date.now() };
    store.deposits[depId] = dep;
  } else {
    dep.status = 'REJECTED';
    dep.rejectedAt = Date.now();
  }
  saveStore();
  return { success: true, deposit: dep };
}

function getWithdrawal(wthId) {
  const store = loadStore();
  return store.withdrawals[wthId] || null;
}

function saveWithdrawal(wthRecord) {
  const store = loadStore();
  store.withdrawals[wthRecord.id] = wthRecord;
  saveStore();
}

function approveWithdrawal(wthId) {
  const store = loadStore();
  let wth = store.withdrawals[wthId];
  if (!wth) {
    wth = { id: wthId, status: 'APPROVED', approvedAt: Date.now() };
    store.withdrawals[wthId] = wth;
  } else {
    wth.status = 'APPROVED';
    wth.approvedAt = Date.now();
  }
  saveStore();
  return { success: true, withdrawal: wth };
}

function rejectWithdrawal(wthId) {
  const store = loadStore();
  let wth = store.withdrawals[wthId];
  if (!wth) {
    wth = { id: wthId, status: 'REJECTED', rejectedAt: Date.now() };
    store.withdrawals[wthId] = wth;
  } else {
    wth.status = 'REJECTED';
    wth.rejectedAt = Date.now();
    // Refund balance to user
    if (wth.userId && wth.amount) {
      updateWalletBalance(wth.userId, wth.amount);
    }
  }
  saveStore();
  return { success: true, withdrawal: wth };
}

function claimNotificationLock(notifKey) {
  const store = loadStore();
  if (!store.notifications) store.notifications = {};
  const current = store.notifications[notifKey];
  if (current && (current.status === 'SENT' || current.status === 'PROCESSING')) {
    if (Date.now() - (current.time || 0) < 300000) {
      return false; // Lock active: already claimed or sent
    }
  }
  store.notifications[notifKey] = { status: 'PROCESSING', time: Date.now() };
  saveStore();
  return true; // Lock successfully claimed
}

function markNotificationSent(notifKey, messageId = null) {
  const store = loadStore();
  if (!store.notifications) store.notifications = {};
  store.notifications[notifKey] = { status: 'SENT', time: Date.now(), messageId };
  saveStore();
}

function isNotificationSent(notifKey) {
  const store = loadStore();
  if (!store.notifications) store.notifications = {};
  const current = store.notifications[notifKey];
  return current && current.status === 'SENT';
}

function handler(req, res) {
  if (res && typeof res.status === 'function') {
    return res.status(200).json({ ok: true, service: 'store' });
  }
}

module.exports = Object.assign(handler, {
  loadStore,
  saveStore,
  getWallet,
  setWalletBalance,
  updateWalletBalance,
  getDeposit,
  saveDeposit,
  approveDeposit,
  rejectDeposit,
  getWithdrawal,
  saveWithdrawal,
  approveWithdrawal,
  rejectWithdrawal,
  claimNotificationLock,
  markNotificationSent,
  isNotificationSent
});
