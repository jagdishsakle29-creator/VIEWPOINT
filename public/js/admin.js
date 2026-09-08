/**
 * VIEWPOINT - Protected Admin Control Dashboard (admin.js)
 * Master PIN: 7777
 * Features:
 * 1. Security Pin Authentication
 * 2. Live Win-Rate / RTP House Edge Controls per Game
 * 3. Deposit & Withdrawal Request Management (Approve/Reject)
 * 4. User Balance Manager
 * 5. Instant Promo Code Generator
 */

(function(window) {
  'use strict';

  const DEFAULT_PIN = '7777';
  const STORAGE_KEYS = {
    ADMIN_PIN: 'vp_admin_pin',
    ADMIN_AUTH: 'vp_admin_authenticated',
    CUSTOM_CODES: 'vp_admin_custom_codes',
    PENDING_TXNS: 'vp_admin_pending_txns'
  };

  class AdminDashboard {
    constructor() {
      this.isAuthenticated = false;
      this.init();
    }

    init() {
      this.bindEvents();
      this.initDefaultTransactions();
      console.log('✅ [Admin] Dashboard module loaded.');
    }

    bindEvents() {
      // PIN Modal Verify Button
      const btnVerifyPin = document.getElementById('btnVerifyAdminPin');
      const inputPin = document.getElementById('inputAdminPin');

      if (btnVerifyPin) {
        btnVerifyPin.addEventListener('click', () => this.verifyPin());
      }
      if (inputPin) {
        inputPin.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') this.verifyPin();
        });
      }

      // RTP Selectors
      ['aviator', 'andarbahar', 'mines', 'crash', 'dragontiger'].forEach(game => {
        const sel = document.getElementById(`selAdminRtp_${game}`);
        if (sel) {
          const saved = localStorage.getItem(`vp_admin_rtp_${game}`) || 'fair';
          sel.value = saved;
          sel.addEventListener('change', (e) => {
            localStorage.setItem(`vp_admin_rtp_${game}`, e.target.value);
            this.notify(`RTP for ${game.toUpperCase()} updated to ${e.target.value.toUpperCase()}!`, 'success');
          });
        }
      });

      // Balance Adjuster
      const btnSetBal = document.getElementById('btnAdminSetBalance');
      const inputBal = document.getElementById('inputAdminSetBalance');
      if (btnSetBal && inputBal) {
        btnSetBal.addEventListener('click', () => {
          const val = parseFloat(inputBal.value);
          if (isNaN(val) || val < 0) {
            this.notify('Please enter a valid balance amount!', 'warning');
            return;
          }
          localStorage.setItem('vp_user_balance', val.toString());
          const el = document.getElementById('userBalance');
          if (el) el.innerText = '₹' + val.toFixed(2);
          this.notify(`Player balance manually updated to ₹${val.toFixed(2)}!`, 'success');
        });
      }

      // Promo Code Generator
      const btnCreateCode = document.getElementById('btnAdminCreateCode');
      const inputCodeName = document.getElementById('inputAdminNewCodeName');
      const inputCodeAmt = document.getElementById('inputAdminNewCodeAmt');

      if (btnCreateCode && inputCodeName && inputCodeAmt) {
        btnCreateCode.addEventListener('click', () => {
          const code = inputCodeName.value.trim().toUpperCase();
          const amt = parseFloat(inputCodeAmt.value);
          if (!code || isNaN(amt) || amt <= 0) {
            this.notify('Please provide valid Code Name and Amount!', 'warning');
            return;
          }

          let custom = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_CODES) || '{}');
          custom[code] = { amount: amt, title: `Admin Special Code (${code})` };
          localStorage.setItem(STORAGE_KEYS.CUSTOM_CODES, JSON.stringify(custom));

          this.notify(`🎁 Promo Code "${code}" for ₹${amt} created successfully!`, 'success');
          inputCodeName.value = '';
          inputCodeAmt.value = '';
          this.renderCustomCodesList();
        });
      }
    }

    openAdmin() {
      const pinModal = document.getElementById('modalAdminPin');
      const panelModal = document.getElementById('modalAdminPanel');
      const inputPin = document.getElementById('inputAdminPin');

      if (this.isAuthenticated) {
        if (panelModal) panelModal.classList.add('active');
        this.refreshAdminData();
      } else {
        if (pinModal) pinModal.classList.add('active');
        if (inputPin) {
          inputPin.value = '';
          setTimeout(() => inputPin.focus(), 150);
        }
      }
    }

    verifyPin() {
      const input = document.getElementById('inputAdminPin');
      if (!input) return;
      const entered = input.value.trim();
      const master = localStorage.getItem(STORAGE_KEYS.ADMIN_PIN) || DEFAULT_PIN;

      if (entered === master) {
        this.isAuthenticated = true;
        const pinModal = document.getElementById('modalAdminPin');
        const panelModal = document.getElementById('modalAdminPanel');

        if (pinModal) pinModal.classList.remove('active');
        if (panelModal) panelModal.classList.add('active');

        this.notify('🔓 Admin Access Granted!', 'success');
        this.refreshAdminData();
      } else {
        this.notify('❌ Incorrect Master PIN! (Default: 7777)', 'error');
      }
    }

    refreshAdminData() {
      this.renderPendingTransactions();
      this.renderCustomCodesList();

      const balInput = document.getElementById('inputAdminSetBalance');
      const curBal = parseFloat(localStorage.getItem('vp_user_balance') || '500');
      if (balInput) balInput.value = curBal;
    }

    initDefaultTransactions() {
      let txns = localStorage.getItem(STORAGE_KEYS.PENDING_TXNS);
      if (!txns) {
        const sample = [
          { id: 'TXN101', type: 'Deposit', method: 'PhonePe UPI', amount: 500, utr: '348920194821', status: 'Pending', time: '10 mins ago' },
          { id: 'TXN102', type: 'Withdrawal', method: 'IMPS Bank', amount: 1200, utr: 'SBIN0048291', status: 'Pending', time: '25 mins ago' },
          { id: 'TXN103', type: 'Deposit', method: 'GPay UPI', amount: 1000, utr: '492019482910', status: 'Pending', time: '1 hour ago' }
        ];
        localStorage.setItem(STORAGE_KEYS.PENDING_TXNS, JSON.stringify(sample));
      }
    }

    renderPendingTransactions() {
      const container = document.getElementById('adminPendingTxnList');
      if (!container) return;

      const txns = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING_TXNS) || '[]');
      if (txns.length === 0) {
        container.innerHTML = '<div style="color:#94a3b8; padding:12px; text-align:center;">No pending requests.</div>';
        return;
      }

      container.innerHTML = txns.map((t, idx) => `
        <div class="admin-txn-card">
          <div class="txn-info-col">
            <div class="txn-title">
              <span class="txn-badge ${t.type === 'Deposit' ? 'dep' : 'with'}">${t.type}</span>
              <span class="txn-amt">₹${t.amount}</span>
            </div>
            <div class="txn-sub">${t.method} | Ref: ${t.utr} (${t.time})</div>
          </div>
          <div class="txn-actions-col">
            <button class="btn-txn-action approve" onclick="window.adminDashboard.handleTxnAction(${idx}, 'approve')">Approve</button>
            <button class="btn-txn-action reject" onclick="window.adminDashboard.handleTxnAction(${idx}, 'reject')">Reject</button>
          </div>
        </div>
      `).join('');
    }

    handleTxnAction(idx, action) {
      let txns = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING_TXNS) || '[]');
      if (!txns[idx]) return;

      const txn = txns[idx];
      if (action === 'approve') {
        if (txn.type === 'Deposit') {
          let bal = parseFloat(localStorage.getItem('vp_user_balance') || '500') + txn.amount;
          localStorage.setItem('vp_user_balance', bal.toString());
          const el = document.getElementById('userBalance');
          if (el) el.innerText = '₹' + bal.toFixed(2);
        }
        this.notify(`✅ ${txn.type} of ₹${txn.amount} Approved!`, 'success');
      } else {
        this.notify(`❌ ${txn.type} of ₹${txn.amount} Rejected!`, 'warning');
      }

      txns.splice(idx, 1);
      localStorage.setItem(STORAGE_KEYS.PENDING_TXNS, JSON.stringify(txns));
      this.renderPendingTransactions();
    }

    renderCustomCodesList() {
      const container = document.getElementById('adminCustomCodesList');
      if (!container) return;

      const codes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_CODES) || '{}');
      const keys = Object.keys(codes);
      if (keys.length === 0) {
        container.innerHTML = '<span style="color:#94a3b8; font-size:0.85rem;">No custom codes created yet.</span>';
        return;
      }

      container.innerHTML = keys.map(k => `
        <div class="admin-code-pill">
          <span><strong>${k}</strong>: ₹${codes[k].amount}</span>
          <button class="btn-del-code" onclick="window.adminDashboard.deleteCode('${k}')">×</button>
        </div>
      `).join('');
    }

    deleteCode(code) {
      let codes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_CODES) || '{}');
      delete codes[code];
      localStorage.setItem(STORAGE_KEYS.CUSTOM_CODES, JSON.stringify(codes));
      this.renderCustomCodesList();
      this.notify(`Promo Code ${code} deleted!`, 'warning');
    }

    notify(msg, type) {
      if (window.app && window.app.showNotification) window.app.showNotification(msg, type);
      else alert(msg);
    }
  }

  window.AdminDashboard = AdminDashboard;

  document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
  });

})(window);
