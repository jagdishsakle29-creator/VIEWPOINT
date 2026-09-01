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
      return inMemoryCache;
    }
  } catch (e) {}

  inMemoryCache = {
    wallets: {},
    deposits: {},
    withdrawals: {},
    history: {},
    referrals: {}
  };
  return inMemoryCache;
}

function saveStore() {
  if (!inMemoryCache) return;
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(inMemoryCache), 'utf8');
  } catch (e) {}
}

function getWallet(userId) {
  const store = loadStore();
  const uid = String(userId || 'user_default').trim();
  if (!store.wallets[uid]) {
    store.wallets[uid] = {
      userId: uid,
      balance: 200.00,
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

function approveDeposit(depId, amountOverride, userIdOverride) {
  const store = loadStore();
  let dep = store.deposits[depId];
  const amt = parseFloat(amountOverride) || (dep ? dep.amount : 200.0);
  const uid = String(userIdOverride || (dep ? dep.userId : '')).trim();

  if (!dep) {
    dep = {
      id: depId,
      userId: uid || 'guest_default',
      amount: amt,
      status: 'SUCCESS',
      approvedAt: Date.now()
    };
    store.deposits[depId] = dep;
  } else {
    dep.status = 'SUCCESS';
    dep.approvedAt = Date.now();
    if (amt) dep.amount = amt;
  }

  // Credit user's wallet
  if (uid) {
    updateWalletBalance(uid, amt);
  }

  saveStore();
  return { success: true, deposit: dep, creditedUser: uid, amount: amt };
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

module.exports = {
  loadStore,
  saveStore,
  getWallet,
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
};
