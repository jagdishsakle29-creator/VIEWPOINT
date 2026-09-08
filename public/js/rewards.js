/**
 * VIEWPOINT - Retention & Rewards System (Rewards.js)
 * Features:
 * 1. Daily Lucky Spin & Win Wheel (Canvas Animation, 24hr cooldown, audio, wallet credit)
 * 2. 7-Day Daily Login Streak Bonus (Escalating rewards, daily claim check)
 * 3. Referral & Earn Affiliate System (Unique link, stats, 1-click WhatsApp/Telegram share)
 * 4. Promo Code / Voucher Redeemer (Instant wallet credit with validation)
 */

(function(window) {
  'use strict';

  const STORAGE_KEYS = {
    SPIN_LAST: 'vp_rewards_last_spin',
    STREAK_DAY: 'vp_rewards_streak_day',
    STREAK_LAST: 'vp_rewards_streak_last',
    REFERRAL_CODE: 'vp_referral_code',
    REFERRAL_STATS: 'vp_referral_stats',
    REDEEMED_CODES: 'vp_redeemed_codes'
  };

  // Pre-configured promo codes
  const PROMO_CODES = {
    'WELCOME500': { amount: 500, title: 'Welcome Bonus' },
    'VIP100': { amount: 100, title: 'VIP Reward' },
    'FREE50': { amount: 50, title: 'Free Starter Chips' },
    'LUCKY777': { amount: 777, title: 'Lucky 777 Bonus' },
    'BONUS250': { amount: 250, title: 'Telegram Special Bonus' }
  };

  // Lucky Wheel Prizes (8 slices)
  const WHEEL_PRIZES = [
    { label: '₹10', amount: 10, color: '#1e293b', textColor: '#38bdf8' },
    { label: '₹50', amount: 50, color: '#0f172a', textColor: '#eab308' },
    { label: '₹25', amount: 25, color: '#1e293b', textColor: '#22c55e' },
    { label: '₹100', amount: 100, color: '#0f172a', textColor: '#f97316' },
    { label: '₹5', amount: 5, color: '#1e293b', textColor: '#a855f7' },
    { label: '₹250', amount: 250, color: '#0f172a', textColor: '#ec4899' },
    { label: '₹20', amount: 20, color: '#1e293b', textColor: '#10b981' },
    { label: '₹500', amount: 500, color: '#0f172a', textColor: '#fbbf24' }
  ];

  // 7-Day Streak Rewards
  const STREAK_REWARDS = [
    { day: 1, amount: 10 },
    { day: 2, amount: 25 },
    { day: 3, amount: 50 },
    { day: 4, amount: 75 },
    { day: 5, amount: 100 },
    { day: 6, amount: 150 },
    { day: 7, amount: 300 }
  ];

  const Rewards = {
    wheelCanvas: null,
    wheelCtx: null,
    isSpinning: false,
    currentRotation: 0,

    init: function() {
      this.initReferralCode();
      this.initLuckyWheelCanvas();
      this.updateTimers();
      setInterval(() => this.updateTimers(), 1000);
      console.log('✅ [Rewards] Retention & Rewards System initialized.');
    },

    openLuckySpinModal: function() {
      const modal = document.getElementById('modalLuckySpin');
      if (!modal) return;
      modal.classList.add('open');
      modal.style.display = 'flex';
      this.initLuckyWheelCanvas();
      this.drawWheel(this.currentRotation);
      this.updateTimers();
      if (window.soundEngine && window.soundEngine.playClick) {
        window.soundEngine.playClick();
      }
    },

    closeLuckySpinModal: function() {
      const modal = document.getElementById('modalLuckySpin');
      if (modal) {
        modal.classList.remove('open');
        modal.style.display = 'none';
      }
    },

    openDailyStreakModal: function() {
      const modal = document.getElementById('modalDailyStreak');
      if (!modal) return;
      modal.classList.add('open');
      modal.style.display = 'flex';
      this.renderDailyStreakUI();
      if (window.soundEngine && window.soundEngine.playClick) {
        window.soundEngine.playClick();
      }
    },

    closeDailyStreakModal: function() {
      const modal = document.getElementById('modalDailyStreak');
      if (modal) {
        modal.classList.remove('open');
        modal.style.display = 'none';
      }
    },

    resetCooldown: function() {
      localStorage.removeItem(STORAGE_KEYS.SPIN_LAST);
      localStorage.removeItem(STORAGE_KEYS.STREAK_LAST);
      this.updateTimers();
      this.notify('Daily bonuses and lucky spin cooldown reset!', 'success');
    },

    // -------------------------------------------------------------
    // 1. LUCKY SPIN & WIN
    // -------------------------------------------------------------
    initLuckyWheelCanvas: function() {
      const canvas = document.getElementById('luckyWheelCanvas');
      if (!canvas) return;
      this.wheelCanvas = canvas;
      this.wheelCtx = canvas.getContext('2d');
      this.drawWheel(this.currentRotation);
    },

    drawWheel: function(deg) {
      if (!this.wheelCanvas) {
        this.initLuckyWheelCanvas();
      }
      const canvas = this.wheelCanvas;
      if (!canvas) return;
      const ctx = this.wheelCtx;
      const width = canvas.width;
      const height = canvas.height;
      const center = width / 2;
      const radius = center - 12;
      const numSlices = WHEEL_PRIZES.length;
      const sliceAngle = (2 * Math.PI) / numSlices;

      ctx.clearRect(0, 0, width, height);

      // Save context for rotation
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate((deg * Math.PI) / 180);

      for (let i = 0; i < numSlices; i++) {
        const angle = i * sliceAngle;
        const prize = WHEEL_PRIZES[i];

        // Slice Background
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, angle, angle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = prize.color;
        ctx.fill();

        // Border
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
        ctx.stroke();

        // Text
        ctx.save();
        ctx.rotate(angle + sliceAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = prize.textColor;
        ctx.font = 'bold 15px sans-serif';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(prize.label, radius - 20, 5);
        ctx.restore();
      }

      // Outer Glowing Ring
      ctx.restore();
      ctx.beginPath();
      ctx.arc(center, center, radius + 4, 0, 2 * Math.PI);
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 5;
      ctx.stroke();

      // Center Pin / Cap
      ctx.beginPath();
      ctx.arc(center, center, 24, 0, 2 * Math.PI);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Star in center
      ctx.fillStyle = '#ffd700';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', center, center);
    },

    canSpin: function() {
      const last = localStorage.getItem(STORAGE_KEYS.SPIN_LAST);
      if (!last) return true;
      const elapsed = Date.now() - parseInt(last, 10);
      return elapsed >= 24 * 60 * 60 * 1000;
    },

    getTimeUntilSpin: function() {
      const last = localStorage.getItem(STORAGE_KEYS.SPIN_LAST);
      if (!last) return 0;
      const elapsed = Date.now() - parseInt(last, 10);
      const remaining = 24 * 60 * 60 * 1000 - elapsed;
      return remaining > 0 ? remaining : 0;
    },

    spinWheel: function() {
      if (this.isSpinning) return;
      if (!this.canSpin()) {
        const rem = this.getTimeUntilSpin();
        const hrs = Math.floor(rem / 3600000);
        const mins = Math.floor((rem % 3600000) / 60000);
        const secs = Math.floor((rem % 60000) / 1000);
        this.notify(`Next free spin available in ${hrs}h ${mins}m ${secs}s!`, 'warning');
        return;
      }

      this.isSpinning = true;
      const spinBtn = document.getElementById('btnSpinWheelAction');
      if (spinBtn) {
        spinBtn.disabled = true;
        spinBtn.innerText = 'Spinning...';
      }

      // Determine winning index (weighted for fun)
      const prizeWeights = [30, 20, 25, 12, 35, 5, 20, 3]; // index 7 (₹500) has weight 3
      let totalWeight = prizeWeights.reduce((a, b) => a + b, 0);
      let rand = Math.random() * totalWeight;
      let winningIndex = 0;
      for (let i = 0; i < prizeWeights.length; i++) {
        if (rand < prizeWeights[i]) {
          winningIndex = i;
          break;
        }
        rand -= prizeWeights[i];
      }

      const numSlices = WHEEL_PRIZES.length;
      const sliceDeg = 360 / numSlices;
      // Target rotation: top pointer points at top (270 deg)
      // Winning slice angle must align with 270 deg
      const targetSliceCenter = winningIndex * sliceDeg + sliceDeg / 2;
      const finalDeg = (270 - targetSliceCenter + 360) % 360;

      const currentMod = ((this.currentRotation % 360) + 360) % 360;
      const diff = ((finalDeg - currentMod) % 360 + 360) % 360;
      const totalDelta = 360 * 5 + diff; // 5 full revolutions + exact offset to slice
      const startRot = this.currentRotation;

      const startTime = performance.now();
      const duration = 4500;
      let lastSliceTick = -1;

      if (window.soundEngine && window.soundEngine.playClick) {
        window.soundEngine.playClick();
      } else if (window.audio && window.audio.play) {
        window.audio.play('click');
      }

      const animate = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = startRot + totalDelta * ease;

        this.currentRotation = current;
        this.drawWheel(current);

        // Sound clicks on slice boundaries
        const curSlice = Math.floor((((270 - (current % 360) + 360) % 360)) / sliceDeg);
        if (curSlice !== lastSliceTick) {
          lastSliceTick = curSlice;
          if (window.soundEngine && window.soundEngine.playClick) {
            window.soundEngine.playClick();
          }
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.isSpinning = false;
          localStorage.setItem(STORAGE_KEYS.SPIN_LAST, Date.now().toString());

          const prize = WHEEL_PRIZES[winningIndex];
          this.awardBalance(prize.amount, `Daily Lucky Spin Win: ${prize.label}`);

          if (window.soundEngine && window.soundEngine.playWin) {
            window.soundEngine.playWin();
          } else if (window.audio && window.audio.play) {
            window.audio.play('win');
          }
          this.notify(`🎉 CONGRATULATIONS! You won ${prize.label} in Lucky Spin!`, 'success');

          if (spinBtn) {
            spinBtn.innerText = 'Claimed Today';
            spinBtn.disabled = true;
          }
          this.updateTimers();
        }
      };

      requestAnimationFrame(animate);
    },

    // -------------------------------------------------------------
    // 2. DAILY 7-DAY LOGIN STREAK
    // -------------------------------------------------------------
    getStreakStatus: function() {
      const lastStr = localStorage.getItem(STORAGE_KEYS.STREAK_LAST);
      let currentDay = parseInt(localStorage.getItem(STORAGE_KEYS.STREAK_DAY) || '1', 10);

      if (!lastStr) {
        return { currentDay: 1, canClaim: true };
      }

      const lastDate = new Date(parseInt(lastStr, 10));
      const now = new Date();

      // Check calendar day difference
      const lastDayStart = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate()).getTime();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const dayDiff = Math.round((todayStart - lastDayStart) / (24 * 60 * 60 * 1000));

      if (dayDiff === 0) {
        // Already claimed today
        return { currentDay, canClaim: false };
      } else if (dayDiff === 1) {
        // Consecutive day
        const nextDay = currentDay >= 7 ? 1 : currentDay + 1;
        return { currentDay: nextDay, canClaim: true };
      } else {
        // Streak broken, reset to Day 1
        return { currentDay: 1, canClaim: true };
      }
    },

    claimDailyStreak: function() {
      const status = this.getStreakStatus();
      if (!status.canClaim) {
        this.notify('You have already claimed your daily bonus today! Come back tomorrow.', 'warning');
        return;
      }

      const reward = STREAK_REWARDS[status.currentDay - 1];
      localStorage.setItem(STORAGE_KEYS.STREAK_DAY, status.currentDay.toString());
      localStorage.setItem(STORAGE_KEYS.STREAK_LAST, Date.now().toString());

      this.awardBalance(reward.amount, `Day ${status.currentDay} Login Streak Reward`);
      if (window.audio && window.audio.play) window.audio.play('win');
      this.notify(`🎁 Day ${status.currentDay} Claimed! ₹${reward.amount} added to your wallet!`, 'success');

      this.renderDailyStreakUI();
    },

    renderDailyStreakUI: function() {
      const container = document.getElementById('dailyStreakGrid');
      if (!container) return;

      const status = this.getStreakStatus();
      container.innerHTML = '';

      STREAK_REWARDS.forEach((r) => {
        const isCurrent = r.day === status.currentDay;
        const isCompleted = r.day < status.currentDay || (!status.canClaim && isCurrent);
        const card = document.createElement('div');
        card.className = `streak-card ${isCurrent ? 'active' : ''} ${isCompleted ? 'completed' : ''}`;
        card.innerHTML = `
          <div class="streak-day">Day ${r.day}</div>
          <div class="streak-icon">${isCompleted ? '✅' : '🎁'}</div>
          <div class="streak-reward">₹${r.amount}</div>
          <div class="streak-badge">${isCompleted ? 'Claimed' : (isCurrent && status.canClaim ? 'Claim Now' : 'Locked')}</div>
        `;
        container.appendChild(card);
      });

      const btnClaim = document.getElementById('btnClaimStreakAction');
      if (btnClaim) {
        btnClaim.disabled = !status.canClaim;
        btnClaim.innerText = status.canClaim ? `Claim Day ${status.currentDay} (₹${STREAK_REWARDS[status.currentDay - 1].amount})` : 'Claimed for Today';
      }
    },

    // -------------------------------------------------------------
    // 3. REFERRAL & AFFILIATE SYSTEM
    // -------------------------------------------------------------
    initReferralCode: function() {
      let code = localStorage.getItem(STORAGE_KEYS.REFERRAL_CODE);
      if (!code) {
        code = 'VP' + Math.floor(100000 + Math.random() * 900000);
        localStorage.setItem(STORAGE_KEYS.REFERRAL_CODE, code);
      }

      let stats = JSON.parse(localStorage.getItem(STORAGE_KEYS.REFERRAL_STATS) || '{"invited": 3, "earned": 450}');
      localStorage.setItem(STORAGE_KEYS.REFERRAL_STATS, JSON.stringify(stats));
    },

    getReferralUrl: function() {
      const code = localStorage.getItem(STORAGE_KEYS.REFERRAL_CODE) || 'VP123456';
      const base = window.location.origin + window.location.pathname;
      return `${base}?ref=${code}`;
    },

    renderReferralUI: function() {
      const code = localStorage.getItem(STORAGE_KEYS.REFERRAL_CODE) || 'VP123456';
      const url = this.getReferralUrl();
      const stats = JSON.parse(localStorage.getItem(STORAGE_KEYS.REFERRAL_STATS) || '{"invited": 3, "earned": 450}');

      const codeEl = document.getElementById('referralMyCode');
      const urlEl = document.getElementById('referralMyUrl');
      const countEl = document.getElementById('referralTotalCount');
      const earnedEl = document.getElementById('referralTotalEarned');

      if (codeEl) codeEl.innerText = code;
      if (urlEl) urlEl.value = url;
      if (countEl) countEl.innerText = stats.invited;
      if (earnedEl) earnedEl.innerText = '₹' + stats.earned;
    },

    copyReferralLink: function() {
      const url = this.getReferralUrl();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
          this.notify('📋 Referral link copied to clipboard!', 'success');
        });
      } else {
        const input = document.getElementById('referralMyUrl');
        if (input) {
          input.select();
          document.execCommand('copy');
          this.notify('📋 Referral link copied!', 'success');
        }
      }
    },

    shareToWhatsApp: function() {
      const url = this.getReferralUrl();
      const text = encodeURIComponent(`🎮 Play & Win Real Cash on VIEWPOINT Casino! Use my invite link to get ₹500 Free Welcome Bonus: ${url}`);
      window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    },

    shareToTelegram: function() {
      const url = this.getReferralUrl();
      const text = encodeURIComponent(`🎮 Play & Win Real Cash on VIEWPOINT Casino! Free ₹500 Bonus:`);
      window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${text}`, '_blank');
    },

    // -------------------------------------------------------------
    // 4. PROMO CODE / VOUCHER REDEEMER
    // -------------------------------------------------------------
    redeemPromoCode: function(codeStr) {
      if (!codeStr || !codeStr.trim()) {
        this.notify('Please enter a valid promo code!', 'warning');
        return;
      }

      const cleanCode = codeStr.trim().toUpperCase();
      let redeemed = JSON.parse(localStorage.getItem(STORAGE_KEYS.REDEEMED_CODES) || '[]');

      if (redeemed.includes(cleanCode)) {
        this.notify('You have already redeemed this promo code!', 'warning');
        return;
      }

      // Check admin dynamic custom codes from localStorage
      let customCodes = JSON.parse(localStorage.getItem('vp_admin_custom_codes') || '{}');
      const promoInfo = PROMO_CODES[cleanCode] || customCodes[cleanCode];

      if (!promoInfo) {
        this.notify('❌ Invalid or expired promo code!', 'error');
        return;
      }

      redeemed.push(cleanCode);
      localStorage.setItem(STORAGE_KEYS.REDEEMED_CODES, JSON.stringify(redeemed));

      this.awardBalance(promoInfo.amount, `Promo Code Redeemed: ${cleanCode}`);
      if (window.audio && window.audio.play) window.audio.play('win');
      this.notify(`🎉 Code Applied! ₹${promoInfo.amount} (${promoInfo.title}) added to your wallet!`, 'success');

      const input = document.getElementById('inputPromoCodeText');
      if (input) input.value = '';

      if (window.app && window.app.closeModal) window.app.closeModal('modalPromoCode');
    },

    // -------------------------------------------------------------
    // HELPER: AWARD BALANCE & NOTIFICATIONS
    // -------------------------------------------------------------
    awardBalance: function(amount, reason) {
      if (window.wallet && typeof window.wallet.addWin === 'function') {
        window.wallet.addWin(amount);
      } else if (window.wallet && typeof window.wallet.add === 'function') {
        window.wallet.add(amount);
      } else if (window.wallet && typeof window.wallet.addBalance === 'function') {
        window.wallet.addBalance(amount, reason);
      } else if (window.app && window.app.wallet && window.app.wallet.addBalance) {
        window.app.wallet.addBalance(amount, reason);
      } else {
        let current = parseFloat(localStorage.getItem('vp_user_balance') || '500');
        current += amount;
        localStorage.setItem('vp_user_balance', current.toString());
        const el = document.getElementById('userBalance');
        if (el) el.innerText = '₹' + current.toFixed(2);
      }
    },

    notify: function(msg, type) {
      if (window.app && typeof window.app.showNotification === 'function') {
        window.app.showNotification(msg, type);
      } else if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast({ won: type === 'success', payout: 0, multiplier: 0, msg: msg });
      } else {
        alert(msg);
      }
    },

    updateTimers: function() {
      const spinTimerEl = document.getElementById('spinCooldownTimer');
      const spinBtn = document.getElementById('btnSpinWheelAction');

      if (this.canSpin()) {
        if (spinTimerEl) {
          spinTimerEl.innerText = 'Ready to Spin! 1 Free Daily Spin';
          spinTimerEl.style.color = '#22c55e';
        }
        if (spinBtn && !this.isSpinning) {
          spinBtn.disabled = false;
          spinBtn.innerText = 'SPIN WHEEL FREE';
          spinBtn.style.opacity = '1';
          spinBtn.style.cursor = 'pointer';
        }
      } else {
        const rem = this.getTimeUntilSpin();
        const hrs = Math.floor(rem / 3600000);
        const mins = Math.floor((rem % 3600000) / 60000);
        const secs = Math.floor((rem % 60000) / 1000);
        const timeStr = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        if (spinTimerEl) {
          spinTimerEl.innerText = `Next Spin in ${timeStr}`;
          spinTimerEl.style.color = '#f59e0b';
        }
        if (spinBtn && !this.isSpinning) {
          spinBtn.disabled = true;
          spinBtn.innerText = `Wait (${timeStr})`;
          spinBtn.style.opacity = '0.6';
          spinBtn.style.cursor = 'not-allowed';
        }
      }
    }
  };

  window.Rewards = Rewards;

  // Global window helpers for direct button onclicks
  window.openLuckySpinModal = function() {
    if (window.Rewards && window.Rewards.openLuckySpinModal) {
      window.Rewards.openLuckySpinModal();
    } else {
      var m = document.getElementById('modalLuckySpin');
      if (m) { m.classList.add('open'); m.style.display = 'flex'; }
      if (window.Rewards && window.Rewards.drawWheel) window.Rewards.drawWheel(window.Rewards.currentRotation || 0);
    }
  };

  window.closeLuckySpinModal = function() {
    if (window.Rewards && window.Rewards.closeLuckySpinModal) {
      window.Rewards.closeLuckySpinModal();
    } else {
      var m = document.getElementById('modalLuckySpin');
      if (m) { m.classList.remove('open'); m.style.display = 'none'; }
    }
  };

  window.openDailyStreakModal = function() {
    if (window.Rewards && window.Rewards.openDailyStreakModal) {
      window.Rewards.openDailyStreakModal();
    } else {
      var m = document.getElementById('modalDailyStreak');
      if (m) { m.classList.add('open'); m.style.display = 'flex'; }
      if (window.Rewards && window.Rewards.renderDailyStreakUI) window.Rewards.renderDailyStreakUI();
    }
  };

  window.closeDailyStreakModal = function() {
    if (window.Rewards && window.Rewards.closeDailyStreakModal) {
      window.Rewards.closeDailyStreakModal();
    } else {
      var m = document.getElementById('modalDailyStreak');
      if (m) { m.classList.remove('open'); m.style.display = 'none'; }
    }
  };

  window.spinLuckyWheel = function() {
    if (window.Rewards && window.Rewards.spinWheel) {
      window.Rewards.spinWheel();
    }
  };

  // Auto-init on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    Rewards.init();
  });

  // Also init immediately if document is already loaded
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(() => Rewards.init(), 100);
  }

})(window);
