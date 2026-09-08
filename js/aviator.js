/**
 * VIEWPOINT - Aviator Game Engine (aviator.js)
 * Features:
 * - HTML5 dynamic flight trajectory canvas with rising curve
 * - Animated high-resolution SVG red airplane with thruster trail
 * - Real-time multiplier scaling from 1.00x to 100.00x+
 * - Instant 1-click Cash Out button with live profit display
 * - Dual bet / Quick chips (₹10, ₹50, ₹100, ₹500, ₹1000)
 * - Auto-Cashout toggle
 * - Integrated sound effects and wallet balance sync
 */

(function(window) {
  'use strict';

  class AviatorGame {
    constructor() {
      this.canvas = null;
      this.ctx = null;
      this.gameState = 'IDLE'; // 'IDLE', 'COUNTDOWN', 'FLYING', 'CRASHED'
      this.multiplier = 1.00;
      this.crashMultiplier = 2.00;
      this.startTime = 0;
      this.animationFrameId = null;

      // Bet State
      this.betAmount = 50;
      this.hasBet = false;
      this.hasCashedOut = false;
      this.cashedOutMultiplier = 0;
      this.autoCashoutActive = false;
      this.autoCashoutAt = 2.00;

      // History
      this.history = [1.45, 2.80, 1.12, 5.64, 1.89, 3.21, 10.40, 1.05, 2.15];

      // Airplane Sprite parameters
      this.planeX = 40;
      this.planeY = 200;
      this.planeTrail = [];

      this.init();
    }

    init() {
      this.canvas = document.getElementById('aviatorCanvas');
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());

      this.bindEvents();
      this.renderHistory();
      this.drawIdleState();

      console.log('✅ [Aviator] Game initialized.');
    }

    resizeCanvas() {
      if (!this.canvas) return;
      const rect = this.canvas.parentElement.getBoundingClientRect();
      this.canvas.width = rect.width || 600;
      this.canvas.height = 320;
      if (this.gameState === 'IDLE') this.drawIdleState();
    }

    bindEvents() {
      const btnBet = document.getElementById('btnAviatorBet');
      const btnCashout = document.getElementById('btnAviatorCashout');
      const inputBet = document.getElementById('inputAviatorBet');
      const chipBtns = document.querySelectorAll('.aviator-chip-btn');
      const toggleAuto = document.getElementById('toggleAviatorAuto');
      const inputAuto = document.getElementById('inputAviatorAutoMult');

      if (btnBet) {
        btnBet.addEventListener('click', (e) => {
          e.preventDefault();
          this.placeBetAndStart();
        });
      }
      if (btnCashout) {
        const handleCashout = (e) => {
          if (e) e.preventDefault();
          this.cashOut();
        };
        btnCashout.addEventListener('click', handleCashout);
        btnCashout.addEventListener('pointerdown', handleCashout);
      }
      if (inputBet) {
        const updateAmt = (e) => {
          this.betAmount = Math.max(10, parseFloat(e.target.value) || 10);
          this.updateBetButtonText();
        };
        inputBet.addEventListener('change', updateAmt);
        inputBet.addEventListener('input', updateAmt);
      }
      chipBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const val = parseFloat(btn.dataset.val);
          if (inputBet) {
            inputBet.value = val;
            this.betAmount = val;
            this.updateBetButtonText();
          }
        });
      });
      if (toggleAuto) {
        toggleAuto.addEventListener('change', (e) => {
          this.autoCashoutActive = e.target.checked;
        });
      }
      if (inputAuto) {
        inputAuto.addEventListener('change', (e) => {
          this.autoCashoutAt = Math.max(1.05, parseFloat(e.target.value) || 2.00);
        });
      }
    }

    updateBetButtonText() {
      const btnBet = document.getElementById('btnAviatorBet');
      if (btnBet && (this.gameState === 'IDLE' || this.gameState === 'CRASHED')) {
        btnBet.innerText = `BET ₹${this.betAmount}`;
      }
    }

    placeBetAndStart() {
      if (this.gameState === 'FLYING' || this.gameState === 'COUNTDOWN') return;

      const inputBet = document.getElementById('inputAviatorBet');
      if (inputBet) this.betAmount = Math.max(10, parseFloat(inputBet.value) || 10);

      // Deduct balance
      let currentBal = this.getUserBalance();
      if (currentBal < this.betAmount) {
        this.notify('Insufficient balance! Please deposit to play.', 'warning');
        return;
      }

      this.deductBalance(this.betAmount, `Aviator Bet: ₹${this.betAmount}`);
      this.hasBet = true;
      this.hasCashedOut = false;

      this.startCountdown();
    }

    startCountdown() {
      this.gameState = 'COUNTDOWN';
      let count = 3;
      const overlay = document.getElementById('aviatorCountdownOverlay');
      const countNum = document.getElementById('aviatorCountdownNum');
      const btnBet = document.getElementById('btnAviatorBet');
      const btnCashout = document.getElementById('btnAviatorCashout');

      if (overlay) overlay.style.display = 'flex';
      if (btnBet) btnBet.style.display = 'none';
      if (btnCashout) {
        btnCashout.style.display = 'block';
        btnCashout.disabled = true;
        btnCashout.style.background = '';
        btnCashout.classList.remove('active-cashout');
        btnCashout.innerText = 'WAITING FOR TAKEOFF...';
      }

      if (window.soundEngine && window.soundEngine.playBet) window.soundEngine.playBet();
      else if (window.soundEngine && window.soundEngine.playClick) window.soundEngine.playClick();

      const timer = setInterval(() => {
        if (countNum) countNum.innerText = count;
        count--;
        if (count < 0) {
          clearInterval(timer);
          if (overlay) overlay.style.display = 'none';
          this.startFlight();
        }
      }, 700);
    }

    startFlight() {
      this.gameState = 'FLYING';
      this.multiplier = 1.00;
      this.startTime = performance.now();
      this.planeTrail = [];

      // Determine crash multiplier based on Admin RTP / Provably fair
      this.crashMultiplier = this.generateCrashMultiplier();

      const btnCashout = document.getElementById('btnAviatorCashout');
      if (btnCashout) {
        btnCashout.disabled = false;
        btnCashout.style.background = '';
        btnCashout.classList.add('active-cashout');
        const amtSpan = document.getElementById('aviatorCashoutPreview');
        if (amtSpan) {
          amtSpan.textContent = `₹${this.betAmount.toFixed(2)}`;
        } else {
          btnCashout.innerHTML = `CASHOUT <span class="cashout-amt" id="aviatorCashoutPreview">₹${this.betAmount.toFixed(2)}</span>`;
        }
      }

      if (window.soundEngine && window.soundEngine.playClick) window.soundEngine.playClick();

      this.loop(performance.now());
    }

    generateCrashMultiplier() {
      // Admin RTP tuning check
      const rtpSetting = localStorage.getItem('vp_admin_rtp_aviator') || 'fair';
      const rand = Math.random();

      if (rtpSetting === 'house_edge') {
        // High house edge: 50% crash under 1.40x
        if (rand < 0.50) return parseFloat((1.01 + Math.random() * 0.39).toFixed(2));
        if (rand < 0.85) return parseFloat((1.40 + Math.random() * 1.50).toFixed(2));
        return parseFloat((3.00 + Math.random() * 5.00).toFixed(2));
      } else if (rtpSetting === 'player_win') {
        // Generous mode: high multipliers
        if (rand < 0.15) return parseFloat((1.10 + Math.random() * 0.30).toFixed(2));
        if (rand < 0.60) return parseFloat((2.00 + Math.random() * 4.00).toFixed(2));
        return parseFloat((5.00 + Math.random() * 20.00).toFixed(2));
      } else {
        // Standard Fair Aviator algorithm: E = 0.97 / (1 - rand)
        if (rand < 0.04) return 1.00; // Instant 4% house edge crash
        const raw = 0.97 / (1 - rand);
        return Math.min(100.00, Math.max(1.01, parseFloat(raw.toFixed(2))));
      }
    }

    loop(now) {
      if (this.gameState !== 'FLYING') return;

      const elapsed = (now - this.startTime) / 1000; // seconds
      // Exponential curve: multiplier = e^(0.075 * elapsed^1.15)
      this.multiplier = parseFloat((Math.pow(Math.E, 0.075 * Math.pow(elapsed, 1.15))).toFixed(2));

      // Update multiplier display
      const multDisplay = document.getElementById('aviatorMultiplierText');
      if (multDisplay) multDisplay.innerText = `${this.multiplier.toFixed(2)}x`;

      // Update cashout button live amount safely without destroying inner DOM nodes
      const btnCashout = document.getElementById('btnAviatorCashout');
      if (btnCashout && this.hasBet && !this.hasCashedOut) {
        const potentialWin = (this.betAmount * this.multiplier).toFixed(2);
        const amtSpan = document.getElementById('aviatorCashoutPreview');
        if (amtSpan) {
          amtSpan.textContent = `₹${potentialWin}`;
        } else {
          btnCashout.innerHTML = `CASHOUT <span class="cashout-amt" id="aviatorCashoutPreview">₹${potentialWin}</span>`;
        }
      }

      // Check Auto-Cashout
      if (this.autoCashoutActive && !this.hasCashedOut && this.multiplier >= this.autoCashoutAt) {
        this.cashOut();
      }

      // Check Crash
      if (this.multiplier >= this.crashMultiplier) {
        this.triggerCrash();
        return;
      }

      // Draw frame
      this.drawFlightFrame(elapsed);
      this.animationFrameId = requestAnimationFrame((t) => this.loop(t));
    }

    cashOut() {
      if (this.gameState !== 'FLYING' || this.hasCashedOut || !this.hasBet) return;

      this.hasCashedOut = true;
      this.cashedOutMultiplier = this.multiplier;
      const winAmount = parseFloat((this.betAmount * this.cashedOutMultiplier).toFixed(2));

      this.awardBalance(winAmount, `Aviator Win: ${this.cashedOutMultiplier.toFixed(2)}x`);

      if (window.soundEngine) {
        if (window.soundEngine.playCashout) window.soundEngine.playCashout();
        else if (window.soundEngine.playWin) window.soundEngine.playWin();
      }
      if (window.app && window.app.showToast) {
        window.app.showToast({ won: true, payout: winAmount, multiplier: this.cashedOutMultiplier });
      }

      this.notify(`🎉 CASHED OUT! Won ₹${winAmount.toFixed(2)} at ${this.cashedOutMultiplier.toFixed(2)}x!`, 'success');

      const btnCashout = document.getElementById('btnAviatorCashout');
      if (btnCashout) {
        btnCashout.disabled = true;
        btnCashout.classList.remove('active-cashout');
        btnCashout.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        btnCashout.innerHTML = `WON ₹${winAmount.toFixed(2)} (${this.cashedOutMultiplier.toFixed(2)}x)`;
      }
    }

    triggerCrash() {
      this.gameState = 'CRASHED';
      if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);

      const finalMult = this.crashMultiplier;
      this.history.unshift(finalMult);
      if (this.history.length > 15) this.history.pop();
      this.renderHistory();

      const multDisplay = document.getElementById('aviatorMultiplierText');
      if (multDisplay) {
        multDisplay.innerText = `FLEW AWAY! (${finalMult.toFixed(2)}x)`;
        multDisplay.classList.add('crashed-text');
      }

      if (this.hasBet && !this.hasCashedOut) {
        if (window.soundEngine && window.soundEngine.playBomb) window.soundEngine.playBomb();
        this.notify(`💥 Plane flew away at ${finalMult.toFixed(2)}x! Better luck next round!`, 'error');
        if (window.app && window.app.showToast) {
          window.app.showToast({ won: false, payout: 0, multiplier: 0 });
        }
      }

      this.drawCrashedFrame();

      // Clean reset after 1.5 seconds
      setTimeout(() => {
        this.resetToIdle();
      }, 1500);
    }

    resetToIdle() {
      this.gameState = 'IDLE';
      this.hasBet = false;
      this.hasCashedOut = false;

      const btnBet = document.getElementById('btnAviatorBet');
      const btnCashout = document.getElementById('btnAviatorCashout');
      const multDisplay = document.getElementById('aviatorMultiplierText');

      if (btnBet) {
        btnBet.style.display = 'block';
        btnBet.disabled = false;
        btnBet.innerText = `BET ₹${this.betAmount}`;
      }
      if (btnCashout) {
        btnCashout.style.display = 'none';
        btnCashout.disabled = false;
        btnCashout.style.background = '';
        btnCashout.classList.remove('active-cashout');
        btnCashout.innerHTML = `CASHOUT <span class="cashout-amt" id="aviatorCashoutPreview">₹0.00</span>`;
      }
      if (multDisplay) {
        multDisplay.innerText = '1.00x';
        multDisplay.classList.remove('crashed-text');
      }

      this.drawIdleState();
    }

    drawIdleState() {
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      ctx.clearRect(0, 0, w, h);
      this.drawGrid(w, h);

      // Ground / baseline
      ctx.beginPath();
      ctx.moveTo(30, h - 30);
      ctx.lineTo(w - 20, h - 30);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Static plane waiting at origin
      this.drawPlane(50, h - 50, 0);
    }

    drawGrid(w, h) {
      const ctx = this.ctx;
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;

      // Horizontal grid lines
      for (let y = 30; y < h - 30; y += 40) {
        ctx.beginPath();
        ctx.moveTo(30, y);
        ctx.lineTo(w - 20, y);
        ctx.stroke();
      }
      // Vertical grid lines
      for (let x = 70; x < w - 20; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 20);
        ctx.lineTo(x, h - 30);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawFlightFrame(elapsed) {
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      ctx.clearRect(0, 0, w, h);
      this.drawGrid(w, h);

      const startX = 40;
      const startY = h - 40;

      // Plane coordinate progress
      const maxW = w - 80;
      const maxH = h - 80;

      const progressX = Math.min(1, elapsed / 8);
      const curX = startX + maxW * Math.pow(progressX, 0.9);

      // Curve rising up
      const progressY = Math.min(1, (this.multiplier - 1.0) / Math.max(2, this.crashMultiplier));
      const curY = startY - maxH * Math.min(0.9, Math.pow(progressY, 0.8));

      // Add to trail
      this.planeTrail.push({ x: curX, y: curY });
      if (this.planeTrail.length > 50) this.planeTrail.shift();

      // Draw red glowing area under curve
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      for (let i = 0; i < this.planeTrail.length; i++) {
        ctx.lineTo(this.planeTrail[i].x, this.planeTrail[i].y);
      }
      ctx.lineTo(curX, startY);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, curY, 0, startY);
      grad.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
      grad.addColorStop(1, 'rgba(239, 68, 68, 0.02)');
      ctx.fillStyle = grad;
      ctx.fill();

      // Draw red trajectory line
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      for (let i = 0; i < this.planeTrail.length; i++) {
        ctx.lineTo(this.planeTrail[i].x, this.planeTrail[i].y);
      }
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.restore();

      // Calculate angle
      let angle = -0.35;
      if (this.planeTrail.length > 2) {
        const p1 = this.planeTrail[this.planeTrail.length - 2];
        const p2 = this.planeTrail[this.planeTrail.length - 1];
        angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      }

      this.drawPlane(curX, curY, angle);

      // If player cashed out during flight, render victory badge on canvas
      if (this.hasCashedOut) {
        ctx.save();
        ctx.fillStyle = 'rgba(16, 185, 129, 0.92)';
        const bannerW = Math.min(w - 40, 260);
        const bannerH = 34;
        const bx = (w - bannerW) / 2;
        const by = 18;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bx, by, bannerW, bannerH, 8);
        else ctx.rect(bx, by, bannerW, bannerH);
        ctx.fill();
        ctx.font = 'bold 13px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const winAmt = (this.betAmount * this.cashedOutMultiplier).toFixed(2);
        ctx.fillText(`CASHED OUT @ ${this.cashedOutMultiplier.toFixed(2)}x (+₹${winAmt})`, w / 2, by + bannerH / 2);
        ctx.restore();
      }
    }

    drawPlane(x, y, angle) {
      const ctx = this.ctx;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Jet exhaust trail glow
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.lineTo(-35, -4);
      ctx.lineTo(-25, 0);
      ctx.lineTo(-35, 4);
      ctx.closePath();
      ctx.fillStyle = 'rgba(249, 115, 22, 0.75)';
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 8;
      ctx.fill();

      // Airplane Body (Stylized Jet)
      ctx.beginPath();
      ctx.moveTo(22, 0);       // Nose
      ctx.lineTo(-8, -9);      // Top wing edge
      ctx.lineTo(-18, -12);    // Top tail
      ctx.lineTo(-16, 0);      // Tail center
      ctx.lineTo(-18, 12);     // Bottom tail
      ctx.lineTo(-8, 9);       // Bottom wing edge
      ctx.closePath();
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 5;
      ctx.fill();

      // Cockpit window
      ctx.beginPath();
      ctx.arc(8, -2, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();

      // Wing Highlight
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-12, -15);
      ctx.lineTo(-16, -15);
      ctx.lineTo(-6, 0);
      ctx.fillStyle = '#b91c1c';
      ctx.fill();

      ctx.restore();
    }

    drawCrashedFrame() {
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      // Explosion flash
      ctx.save();
      ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
      ctx.fillRect(0, 0, w, h);

      // Crash icon in center
      ctx.font = 'bold 36px sans-serif';
      ctx.fillStyle = '#ef4444';
      ctx.textAlign = 'center';
      ctx.fillText('💥 FLEW AWAY', w / 2, h / 2 - 20);
      ctx.font = 'bold 20px sans-serif';
      ctx.fillStyle = '#ffd700';
      ctx.fillText(`@ ${this.crashMultiplier.toFixed(2)}x`, w / 2, h / 2 + 15);
      ctx.restore();
    }

    renderHistory() {
      const container = document.getElementById('aviatorHistoryList');
      if (!container) return;
      container.innerHTML = '';

      this.history.forEach(m => {
        const span = document.createElement('span');
        span.className = `history-pill ${m >= 2.0 ? 'high' : (m >= 1.5 ? 'mid' : 'low')}`;
        span.innerText = `${m.toFixed(2)}x`;
        container.appendChild(span);
      });
    }

    getUserBalance() {
      if (window.wallet && typeof window.wallet.balance === 'number') return window.wallet.balance;
      if (window.wallet && window.wallet.getBalance) return window.wallet.getBalance();
      return parseFloat(localStorage.getItem('vp_user_balance') || '500');
    }

    deductBalance(amount, reason) {
      if (window.wallet && window.wallet.deduct) {
        return window.wallet.deduct(amount);
      } else if (window.wallet && window.wallet.deductBalance) {
        window.wallet.deductBalance(amount, reason);
        return true;
      } else {
        let bal = this.getUserBalance() - amount;
        localStorage.setItem('vp_user_balance', bal.toString());
        const el = document.getElementById('walletBalance') || document.getElementById('userBalance');
        if (el) el.innerText = bal.toFixed(2);
        return true;
      }
    }

    awardBalance(amount, reason) {
      if (window.wallet && window.wallet.addWin) {
        window.wallet.addWin(amount);
      } else if (window.wallet && window.wallet.add) {
        window.wallet.add(amount);
      } else if (window.wallet && window.wallet.addBalance) {
        window.wallet.addBalance(amount, reason);
      } else {
        let bal = this.getUserBalance() + amount;
        localStorage.setItem('vp_user_balance', bal.toString());
        const el = document.getElementById('walletBalance') || document.getElementById('userBalance');
        if (el) el.innerText = bal.toFixed(2);
      }
    }

    notify(msg, type) {
      if (window.app && window.app.showNotification) window.app.showNotification(msg, type);
      else alert(msg);
    }
  }

  window.AviatorGame = AviatorGame;

  function initAviator() {
    if (!window.aviatorGame && document.getElementById('aviatorCanvas')) {
      window.aviatorGame = new AviatorGame();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAviator);
  } else {
    initAviator();
  }

})(window);
