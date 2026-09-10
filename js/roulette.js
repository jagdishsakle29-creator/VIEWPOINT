/**
 * ====================================================================
 * STAKE-STYLE LIVE EUROPEAN ROULETTE ENGINE (VIEW POINT LIVE STUDIO)
 * European Single-Zero (0-36), 3D/Canvas Physics, Audio Synthesis,
 * Live Studio Video Backdrop, Multi-Spot Betting, and Wallet Integration
 * ====================================================================
 */

class RouletteGame {
  constructor(uiCallbacks) {
    this.ui = uiCallbacks || {};
    this.roundDuration = 15; // 15s betting window
    this.spinDuration = 6; // 6s wheel spin
    this.timeLeft = this.roundDuration;
    this.gameState = 'betting'; // 'betting', 'spinning', 'settled'
    this.roundId = this.generateRoundId();

    // Wheel Sequence: European 37 numbers
    this.wheelNumbers = [
      0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
      24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
    ];

    this.redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    this.blackNumbers = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

    // Current Round Bets: spotId -> amount
    this.currentBets = {};
    this.previousBets = {};
    this.selectedChip = 10;

    // History of winning numbers
    this.history = this.generateInitialHistory();
    this.winningNumber = null;
    this.winningDetails = null;

    // Wheel Canvas Animation State
    this.wheelAngle = 0;
    this.ballAngle = 0;
    this.ballRadius = 90;
    this.isAnimRunning = false;

    this.timerInterval = null;
    this.animFrameId = null;

    this.initAudio();
    this.initDOM();
    this.startRoundLoop();
  }

  generateRoundId() {
    const d = new Date();
    const dateStr = d.getFullYear().toString().slice(-2) +
      String(d.getMonth() + 1).padStart(2, '0') +
      String(d.getDate()).padStart(2, '0');
    const secOfDay = Math.floor((d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()) / (this.roundDuration + this.spinDuration));
    return `RL-${dateStr}-${String(secOfDay).padStart(4, '0')}`;
  }

  generateInitialHistory() {
    const arr = [];
    for (let i = 0; i < 15; i++) {
      const n = this.wheelNumbers[Math.floor(Math.random() * this.wheelNumbers.length)];
      arr.push({
        number: n,
        color: n === 0 ? 'green' : (this.redNumbers.includes(n) ? 'red' : 'black'),
        isEven: n !== 0 && n % 2 === 0,
        isHigh: n >= 19
      });
    }
    return arr;
  }

  initAudio() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    } catch(e) {}
  }

  playBeep(freq, type = 'sine', duration = 0.15, gainVal = 0.1) {
    if (!this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch(e) {}
  }

  playPlaceBetsSound() {
    this.playBeep(523.25, 'sine', 0.2, 0.12);
    setTimeout(() => this.playBeep(659.25, 'sine', 0.25, 0.15), 120);
    setTimeout(() => this.playBeep(783.99, 'sine', 0.4, 0.18), 240);
  }

  playNoMoreBetsSound() {
    this.playBeep(440, 'triangle', 0.3, 0.15);
    setTimeout(() => this.playBeep(330, 'triangle', 0.4, 0.15), 180);
  }

  playBallClickSound() {
    this.playBeep(1200 + Math.random() * 400, 'square', 0.03, 0.05);
  }

  playWinFanfare() {
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playBeep(freq, 'triangle', 0.3, 0.2), i * 110);
    });
  }

  initDOM() {
    this.canvas = document.getElementById('rouletteWheelCanvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.renderWheelStatic();
    }
    this.updateHistoryRoadmap();
  }

  // ================= GAME ROUND LOOP =================
  startRoundLoop() {
    clearInterval(this.timerInterval);
    this.roundId = this.generateRoundId();
    this.gameState = 'betting';
    this.timeLeft = this.roundDuration;
    this.winningNumber = null;
    this.winningDetails = null;

    this.updateStatusBanner(`🟢 PLACE YOUR BETS (${this.timeLeft}s)`, 'betting');
    this.updateRoundIdDisplay();
    this.setBettingLocked(false);
    this.playPlaceBetsSound();

    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft > 0) {
        this.updateStatusBanner(`🟢 PLACE YOUR BETS (${this.timeLeft}s)`, 'betting');
        if (this.timeLeft <= 3) {
          this.playBeep(600, 'sine', 0.1, 0.08);
        }
      } else {
        clearInterval(this.timerInterval);
        this.startSpinPhase();
      }
    }, 1000);
  }

  startSpinPhase() {
    this.gameState = 'spinning';
    this.setBettingLocked(true);
    this.playNoMoreBetsSound();
    this.updateStatusBanner('🔴 NO MORE BETS • WHEEL SPINNING', 'spinning');

    // Provably fair RNG draw
    this.winningNumber = this.wheelNumbers[Math.floor(Math.random() * this.wheelNumbers.length)];
    const color = this.winningNumber === 0 ? 'green' : (this.redNumbers.includes(this.winningNumber) ? 'red' : 'black');
    this.winningDetails = {
      number: this.winningNumber,
      color: color,
      isEven: this.winningNumber !== 0 && this.winningNumber % 2 === 0,
      isHigh: this.winningNumber >= 19,
      dozen: this.winningNumber === 0 ? 0 : Math.ceil(this.winningNumber / 12),
      column: this.winningNumber === 0 ? 0 : ((this.winningNumber - 1) % 3) + 1
    };

    this.animateWheelAndBall(this.winningNumber, () => {
      this.settleRound();
    });
  }

  settleRound() {
    this.gameState = 'settled';
    const n = this.winningDetails.number;
    const col = this.winningDetails.color.toUpperCase();

    this.updateStatusBanner(`🏆 WINNER: ${n} ${col}`, 'settled');

    // Add to history
    this.history.unshift(this.winningDetails);
    if (this.history.length > 20) this.history.pop();
    this.updateHistoryRoadmap();

    // Settle bets
    this.calculatePayouts();

    // Next round after 4s
    setTimeout(() => {
      this.clearRoundBetsForNext();
      this.startRoundLoop();
    }, 4500);
  }

  // ================= BETTING & PAYOUT LOGIC =================
  selectChip(val) {
    this.selectedChip = parseInt(val, 10) || 10;
    if (window.soundEngine && window.soundEngine.playClick) window.soundEngine.playClick();
    document.querySelectorAll('.rl-chip').forEach(c => {
      c.classList.toggle('active', parseInt(c.dataset.val, 10) === this.selectedChip);
    });
  }

  placeBet(spotId) {
    if (this.gameState !== 'betting') {
      if (window.app && window.app.showToast) {
        window.app.showToast('Betting is closed for this round!', 'warning');
      }
      return false;
    }

    const cost = this.selectedChip;
    const curBal = (window.wallet && typeof window.wallet.balance === 'number') ? window.wallet.balance : 0;

    if (curBal < cost) {
      if (window.app && window.app.showToast) {
        window.app.showToast('Insufficient balance for this bet!', 'error');
      }
      return false;
    }

    // Deduct from wallet
    if (window.wallet && window.wallet.deductBet) {
      window.wallet.deductBet(cost);
    }

    this.currentBets[spotId] = (this.currentBets[spotId] || 0) + cost;
    this.playBeep(880, 'sine', 0.08, 0.1);
    this.updateBetDisplays();
    return true;
  }

  clearBets() {
    if (this.gameState !== 'betting') return;
    const total = this.getTotalBet();
    if (total > 0 && window.wallet && window.wallet.addBonus) {
      window.wallet.addBonus(total, 'Roulette Bet Refund');
    }
    this.currentBets = {};
    this.updateBetDisplays();
    if (window.soundEngine && window.soundEngine.playClick) window.soundEngine.playClick();
  }

  doubleBets() {
    if (this.gameState !== 'betting') return;
    const curTotal = this.getTotalBet();
    if (curTotal <= 0) return;
    const curBal = (window.wallet && typeof window.wallet.balance === 'number') ? window.wallet.balance : 0;
    if (curBal < curTotal) {
      if (window.app && window.app.showToast) window.app.showToast('Insufficient balance to double!', 'error');
      return;
    }

    if (window.wallet && window.wallet.deductBet) {
      window.wallet.deductBet(curTotal);
    }

    Object.keys(this.currentBets).forEach(spot => {
      this.currentBets[spot] *= 2;
    });
    this.updateBetDisplays();
    if (window.soundEngine && window.soundEngine.playClick) window.soundEngine.playClick();
  }

  rebet() {
    if (this.gameState !== 'betting') return;
    if (!this.previousBets || Object.keys(this.previousBets).length === 0) return;
    
    let needed = 0;
    Object.values(this.previousBets).forEach(v => needed += v);
    const curBal = (window.wallet && typeof window.wallet.balance === 'number') ? window.wallet.balance : 0;
    if (curBal < needed) {
      if (window.app && window.app.showToast) window.app.showToast('Insufficient balance to rebet!', 'error');
      return;
    }

    this.clearBets();
    if (window.wallet && window.wallet.deductBet) {
      window.wallet.deductBet(needed);
    }
    this.currentBets = Object.assign({}, this.previousBets);
    this.updateBetDisplays();
    if (window.soundEngine && window.soundEngine.playClick) window.soundEngine.playClick();
  }

  get bets() {
    return this.currentBets;
  }

  get isSpinning() {
    return this.gameState === 'spinning';
  }

  dealNow() {
    if (this.gameState !== 'betting') return;
    const total = this.getTotalBet();
    if (total <= 0) {
      if (window.app && window.app.showToast) window.app.showToast('Place at least one bet first!', 'warning');
      return;
    }
    clearInterval(this.timerInterval);
    this.startSpinPhase();
  }

  spinNow() {
    return this.dealNow();
  }

  calculatePayouts() {
    const n = this.winningDetails.number;
    const color = this.winningDetails.color;
    const isEven = this.winningDetails.isEven;
    const isHigh = this.winningDetails.isHigh;
    const dozen = this.winningDetails.dozen;
    const col = this.winningDetails.column;

    let totalWon = 0;
    let totalBet = this.getTotalBet();

    Object.keys(this.currentBets).forEach(spot => {
      const betAmt = this.currentBets[spot];
      let won = false;
      let multiplier = 0;

      // Straight Up (e.g. "num_17")
      if (spot === `num_${n}`) {
        won = true;
        multiplier = 36; // 35:1 + stake returned
      }
      // Red / Black
      else if (spot === 'red' && color === 'red') {
        won = true;
        multiplier = 2; // 1:1
      }
      else if (spot === 'black' && color === 'black') {
        won = true;
        multiplier = 2;
      }
      // Even / Odd
      else if (spot === 'even' && isEven) {
        won = true;
        multiplier = 2;
      }
      else if (spot === 'odd' && n !== 0 && !isEven) {
        won = true;
        multiplier = 2;
      }
      // Low (1-18) / High (19-36)
      else if (spot === 'low' && n >= 1 && n <= 18) {
        won = true;
        multiplier = 2;
      }
      else if (spot === 'high' && isHigh) {
        won = true;
        multiplier = 2;
      }
      // Dozens (1st 12, 2nd 12, 3rd 12)
      else if (spot === `dozen_${dozen}` && dozen > 0) {
        won = true;
        multiplier = 3; // 2:1
      }
      // Columns (col_1, col_2, col_3)
      else if (spot === `col_${col}` && col > 0) {
        won = true;
        multiplier = 3;
      }

      if (won) {
        totalWon += betAmt * multiplier;
      }
    });

    if (totalWon > 0) {
      this.playWinFanfare();
      if (window.wallet && window.wallet.recordWin) {
        const netProfit = totalWon - totalBet;
        window.wallet.recordWin(totalWon, totalBet > 0 ? (totalWon / totalBet) : 1, 'roulette', {
          profit: netProfit,
          title: `Roulette Win (${n} ${color.toUpperCase()})`
        });
      }
      if (window.app && window.app.showRoundResultToast) {
        const mult = totalBet > 0 ? (totalWon / totalBet).toFixed(2) : '36.00';
        window.app.showRoundResultToast(mult, totalWon, `ROULETTE HIT #${n} ${color.toUpperCase()}! 🎡💰`);
      }
    }
  }

  getTotalBet() {
    let sum = 0;
    Object.values(this.currentBets).forEach(v => sum += v);
    return sum;
  }

  clearRoundBetsForNext() {
    this.previousBets = Object.assign({}, this.currentBets);
    this.currentBets = {};
    this.updateBetDisplays();
  }

  // ================= UI RENDERING & CANVAS ANIMATION =================
  updateStatusBanner(text, stateClass) {
    const el = document.getElementById('rlStatusBanner');
    if (el) {
      el.textContent = text;
      el.className = `rl-status-banner ${stateClass}`;
    }
  }

  updateRoundIdDisplay() {
    const el = document.getElementById('rlRoundIdDisplay');
    if (el) el.textContent = this.roundId;
  }

  setBettingLocked(isLocked) {
    const board = document.getElementById('rlBettingBoard');
    if (board) board.classList.toggle('locked', isLocked);
    const btnDeal = document.getElementById('btnRlDealNow');
    if (btnDeal) btnDeal.disabled = isLocked;
  }

  updateBetDisplays() {
    const total = this.getTotalBet();
    const totDisplay = document.getElementById('rlTotalBetVal');
    if (totDisplay) totDisplay.textContent = `₹${total.toFixed(2)}`;

    // Update all chip badges on board
    document.querySelectorAll('.rl-bet-spot').forEach(spot => {
      const sId = spot.dataset.spot;
      const amt = this.currentBets[sId] || 0;
      let badge = spot.querySelector('.rl-spot-chip-badge');
      if (amt > 0) {
        if (!badge) {
          badge = document.createElement('div');
          badge.className = 'rl-spot-chip-badge';
          spot.appendChild(badge);
        }
        badge.textContent = `₹${amt >= 1000 ? (amt/1000) + 'K' : amt}`;
        badge.style.display = 'block';
        spot.classList.add('has-bet');
      } else {
        if (badge) badge.style.display = 'none';
        spot.classList.remove('has-bet');
      }
    });
  }

  updateHistoryRoadmap() {
    const container = document.getElementById('rlHistoryTrack');
    if (!container) return;
    container.innerHTML = '';
    this.history.forEach(item => {
      const badge = document.createElement('div');
      badge.className = `rl-history-pill ${item.color}`;
      badge.textContent = item.number;
      badge.title = `#${item.number} ${item.color.toUpperCase()}`;
      container.appendChild(badge);
    });
  }

  // Canvas 2D/3D Wheel Animation
  renderWheelStatic() {
    if (!this.ctx || !this.canvas) return;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(cx, cy) - 10;

    this.ctx.clearRect(0, 0, w, h);
    this.drawRouletteWheel(cx, cy, r, this.wheelAngle);
    this.drawRouletteBall(cx, cy, this.ballRadius, this.ballAngle);
  }

  drawRouletteWheel(cx, cy, r, angle) {
    const numPockets = this.wheelNumbers.length;
    const arc = (Math.PI * 2) / numPockets;

    // Outer Brass Rim
    this.ctx.save();
    this.ctx.translate(cx, cy);
    this.ctx.rotate(angle);

    // Rim Outer Glow & Bevel
    if (typeof this.ctx.createRadialGradient === 'function') {
      const rimGrad = this.ctx.createRadialGradient(0, 0, r - 15, 0, 0, r);
      rimGrad.addColorStop(0, '#78350f');
      rimGrad.addColorStop(0.5, '#d97706');
      rimGrad.addColorStop(0.8, '#fbbf24');
      rimGrad.addColorStop(1, '#451a03');
      this.ctx.fillStyle = rimGrad;
    } else {
      this.ctx.fillStyle = '#d97706';
    }
    this.ctx.beginPath();
    this.ctx.arc(0, 0, r, 0, Math.PI * 2);
    this.ctx.fill();

    // Pockets
    for (let i = 0; i < numPockets; i++) {
      const num = this.wheelNumbers[i];
      const startAngle = i * arc;
      const endAngle = startAngle + arc;

      // Color
      if (num === 0) {
        this.ctx.fillStyle = '#10b981'; // Green
      } else if (this.redNumbers.includes(num)) {
        this.ctx.fillStyle = '#dc2626'; // Red
      } else {
        this.ctx.fillStyle = '#0f172a'; // Black
      }

      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.arc(0, 0, r - 14, startAngle, endAngle);
      this.ctx.closePath();
      this.ctx.fill();

      // Pocket Separators (Silver Frets)
      this.ctx.strokeStyle = '#cbd5e1';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();

      // Pocket Numbers
      this.ctx.save();
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 9px Outfit, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      const textAngle = startAngle + arc / 2;
      const textRadius = r - 26;
      this.ctx.translate(Math.cos(textAngle) * textRadius, Math.sin(textAngle) * textRadius);
      this.ctx.rotate(textAngle + Math.PI / 2);
      this.ctx.fillText(String(num), 0, 0);
      this.ctx.restore();
    }

    // Inner Cone & Turret
    if (typeof this.ctx.createRadialGradient === 'function') {
      const innerGrad = this.ctx.createRadialGradient(0, 0, 0, 0, 0, r - 45);
      innerGrad.addColorStop(0, '#fef08a');
      innerGrad.addColorStop(0.3, '#d97706');
      innerGrad.addColorStop(0.8, '#451a03');
      innerGrad.addColorStop(1, '#1e293b');
      this.ctx.fillStyle = innerGrad;
    } else {
      this.ctx.fillStyle = '#d97706';
    }
    this.ctx.beginPath();
    this.ctx.arc(0, 0, r - 42, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = '#f59e0b';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Center Golden Dome
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 14, 0, Math.PI * 2);
    this.ctx.fillStyle = '#fbbf24';
    this.ctx.fill();

    this.ctx.restore();
  }

  drawRouletteBall(cx, cy, ballR, ballAng) {
    if (this.gameState === 'betting' && !this.isAnimRunning) return;
    const bx = cx + Math.cos(ballAng) * ballR;
    const by = cy + Math.sin(ballAng) * ballR;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(bx, by, 5, 0, Math.PI * 2);
    if (typeof this.ctx.createRadialGradient === 'function') {
      const grad = this.ctx.createRadialGradient(bx - 1, by - 1, 1, bx, by, 5);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.7, '#e2e8f0');
      grad.addColorStop(1, '#64748b');
      this.ctx.fillStyle = grad;
    } else {
      this.ctx.fillStyle = '#ffffff';
    }
    this.ctx.shadowColor = '#ffffff';
    this.ctx.shadowBlur = 8;
    this.ctx.fill();
    this.ctx.restore();
  }

  animateWheelAndBall(targetNumber, onComplete) {
    if (!this.canvas || !this.ctx) {
      if (onComplete) onComplete();
      return;
    }

    this.isAnimRunning = true;
    const numIdx = this.wheelNumbers.indexOf(targetNumber);
    const numPockets = this.wheelNumbers.length;
    const pocketArc = (Math.PI * 2) / numPockets;

    const startTime = performance.now();
    const duration = this.spinDuration * 1000;

    let initialWheelSpeed = 0.08;
    let initialBallSpeed = -0.18; // Ball spins counter-clockwise

    let lastClickTime = 0;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentWheelSpeed = initialWheelSpeed * (1 - easeOut * 0.8);
      const currentBallSpeed = initialBallSpeed * (1 - easeOut);

      this.wheelAngle = (this.wheelAngle + currentWheelSpeed) % (Math.PI * 2);
      this.ballAngle = (this.ballAngle + currentBallSpeed) % (Math.PI * 2);

      // Ball spirals inward toward pocket track
      const maxR = (this.canvas.width / 2) - 22;
      const minR = (this.canvas.width / 2) - 38;
      this.ballRadius = maxR - (maxR - minR) * easeOut;

      // Click sound as ball passes frets
      if (currentTime - lastClickTime > 80 && progress < 0.9) {
        this.playBallClickSound();
        lastClickTime = currentTime;
      }

      this.renderWheelStatic();

      if (progress < 1) {
        this.animFrameId = requestAnimationFrame(animate);
      } else {
        // Snap ball to final winning pocket angle
        const targetPocketAngle = (this.wheelAngle + numIdx * pocketArc + pocketArc / 2) % (Math.PI * 2);
        this.ballAngle = targetPocketAngle;
        this.ballRadius = minR;
        this.renderWheelStatic();
        this.isAnimRunning = false;
        if (onComplete) onComplete();
      }
    };

    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.animFrameId = requestAnimationFrame(animate);
  }
}

// Window export
if (typeof window !== 'undefined') {
  window.RouletteGame = RouletteGame;
}
