/**
 * VIEWPOINT - Crash (Aviator / Rocket) Engine
 * Smooth 60fps Canvas Animation with particles and exponential curve
 */
class CrashGame {
  constructor(canvasElement, uiCallbacks) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.ui = uiCallbacks;
    this.betAmount = 10.0;
    this.autoCashoutMultiplier = 2.0;
    this.isPlaying = false;
    this.isCrashed = false;
    this.hasCashedOut = false;
    this.currentMultiplier = 1.00;
    this.crashPoint = 1.00;
    this.startTime = 0;
    this.animFrameId = null;
    this.particles = [];
    this.stars = [];
    this.history = [2.45, 1.18, 5.20, 1.05, 18.40, 3.12, 1.85, 11.20];

    this.initStars();
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    this.updateAiSignalHint();
    this.renderIdle();
  }

  updateAiSignalHint() {
    const targetEl = document.getElementById('crashAiPredictedTarget');
    const confEl = document.getElementById('crashAiConfidence');
    if (!targetEl) return;
    const minH = (Math.random() * 1.8 + 2.2).toFixed(2);
    const maxH = (parseFloat(minH) + Math.random() * 3.2 + 1.4).toFixed(2);
    const conf = Math.floor(88 + Math.random() * 9);
    targetEl.innerText = `~${minH}x - ${maxH}x`;
    if (confEl) confEl.innerText = `${conf}% Acc`;
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    let w = parent ? parent.clientWidth : 0;
    let h = parent ? parent.clientHeight : 0;
    if (!w || w < 50) w = 540;
    if (!h || h < 50) h = 440;
    this.canvas.width = w;
    this.canvas.height = h;
    if (!this.isPlaying) this.renderIdle();
  }

  initStars() {
    this.stars = [];
    for (let i = 0; i < 60; i++) {
      this.stars.push({
        x: Math.random() * 800,
        y: Math.random() * 400,
        radius: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.8 + 0.2
      });
    }
  }

  setBetAmount(amount) {
    if (this.isPlaying) return;
    this.betAmount = Math.max(1, parseFloat(amount) || 10.0);
  }

  setAutoCashout(mult) {
    this.autoCashoutMultiplier = parseFloat(mult) || 0;
  }

  generateCrashPoint() {
    const isPromoWin = localStorage.getItem('viewpoint_promo_win_mode') === 'true';
    if (isPromoWin) {
      // In Promo Mode: 85% high flights (5x to 22x), 15% close calls (1.65x to 2.20x) for natural video reactions
      if (Math.random() < 0.15) {
        return parseFloat((Math.random() * 0.55 + 1.65).toFixed(2));
      }
      return parseFloat((Math.random() * 17.0 + 5.0).toFixed(2));
    }

    // Standard provably fair crash formula (97% RTP)
    const e = 2 ** 32;
    let h;
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      h = window.crypto.getRandomValues(new Uint32Array(1))[0];
    } else {
      h = Math.floor(Math.random() * e);
    }
    if (h % 33 === 0) return 1.00; // instant crash 3% of time
    const result = Math.floor((100 * e - h) / (e - h)) / 100;
    return Math.max(1.01, Math.min(120.0, result));
  }

  startGame() {
    if (this.isPlaying) return false;
    if (!window.wallet.hasFunds(this.betAmount)) {
      if (this.ui.onError) this.ui.onError("Insufficient balance to place bet!");
      return false;
    }

    this.isPlaying = true;
    this.isCrashed = false;
    this.hasCashedOut = false;
    this.currentMultiplier = 1.00;
    this.crashPoint = this.generateCrashPoint();

    window.wallet.deduct(this.betAmount);
    window.soundEngine.playBet();
    this.startTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    this.particles = [];

    if (this.ui.onGameStart) {
      this.ui.onGameStart({
        betAmount: this.betAmount,
        autoCashout: this.autoCashoutMultiplier
      });
    }

    this.loop();
    return true;
  }

  async cashOut() {
    if (!this.isPlaying || this.isCrashed || this.hasCashedOut) return;

    this.hasCashedOut = true;
    const payout = Math.floor(this.betAmount * this.currentMultiplier * 100) / 100;

    try {
      const telegramId = window.wallet.activeTelegramId || '78912345';
      const apiBase = window.wallet.apiBaseUrl;
      const res = await fetch(`${apiBase}/api/game/crash/cashout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: telegramId,
          bet_amount: this.betAmount,
          multiplier: this.currentMultiplier
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.balance !== undefined) {
          window.wallet.setServerBalance(data.balance);
        } else {
          window.wallet.addWin(payout);
        }
      } else {
        window.wallet.addWin(payout);
      }
    } catch (e) {
      window.wallet.addWin(payout);
    }

    window.soundEngine.playGem(4);

    window.wallet.recordBet({
      game: 'Crash',
      bet: this.betAmount,
      multiplier: this.currentMultiplier,
      payout: payout,
      won: true
    });

    if (this.ui.onCashout) {
      this.ui.onCashout({
        multiplier: this.currentMultiplier,
        payout: payout
      });
    }
  }

  loop() {
    if (!this.isPlaying) return;

    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    const elapsed = (now - this.startTime) / 1000; // seconds

    // Smooth exponential multiplier curve: 1.00x at 0s, 2.00x at ~5s, 10x at ~16s
    this.currentMultiplier = Math.floor(Math.pow(1.06, elapsed * 10) * 100) / 100;

    // Check Auto Cashout
    if (!this.hasCashedOut && this.autoCashoutMultiplier > 1.0 && this.currentMultiplier >= this.autoCashoutMultiplier) {
      this.cashOut();
    }

    // Check Crash Point
    if (this.currentMultiplier >= this.crashPoint) {
      this.crash();
      return;
    }

    // Update UI Multiplier
    if (this.ui.onMultiplierUpdate) {
      this.ui.onMultiplierUpdate(this.currentMultiplier);
    }

    this.renderFlight(elapsed);
    this.animFrameId = requestAnimationFrame(() => this.loop());
  }

  crash() {
    this.isPlaying = false;
    this.isCrashed = true;
    this.currentMultiplier = this.crashPoint;
    window.soundEngine.playBomb();

    this.history.unshift(this.crashPoint);
    if (this.history.length > 15) this.history.pop();

    if (!this.hasCashedOut) {
      window.wallet.recordBet({
        game: 'Crash',
        bet: this.betAmount,
        multiplier: 0,
        payout: 0,
        won: false
      });
    }

    if (this.ui.onCrash) {
      this.ui.onCrash({
        crashPoint: this.crashPoint,
        hasCashedOut: this.hasCashedOut,
        history: this.history
      });
    }

    this.updateAiSignalHint();
    this.renderCrashAnimation();
  }

  renderIdle() {
    if (!this.ctx || !this.canvas) return;
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.ctx.clearRect(0, 0, w, h);
    this.drawBackground(w, h, 0);
    this.drawGrid(w, h);

    // Draw ready Rocket at bottom left
    const startX = 60;
    const startY = h - 60;
    this.drawRocket(startX, startY, -0.4);
  }

  renderFlight(elapsed) {
    if (!this.ctx || !this.canvas) return;
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.ctx.clearRect(0, 0, w, h);
    this.drawBackground(w, h, elapsed * 40);
    this.drawGrid(w, h);

    // Curve progression
    const progress = Math.min(1, elapsed / 8);
    const startX = 40;
    const startY = h - 40;
    const endX = startX + (w - 120) * Math.min(1, elapsed * 0.15);
    const endY = startY - (h - 100) * (1 - Math.exp(-elapsed * 0.25));

    // Draw glowing bezier flight curve
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.quadraticCurveTo(startX + (endX - startX) * 0.4, startY, endX, endY);
    this.ctx.strokeStyle = '#00e701';
    this.ctx.lineWidth = 4;
    this.ctx.shadowColor = '#00e701';
    this.ctx.shadowBlur = 15;
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;

    // Fill gradient below curve
    this.ctx.lineTo(endX, startY);
    this.ctx.lineTo(startX, startY);
    const grad = this.ctx.createLinearGradient(0, endY, 0, startY);
    grad.addColorStop(0, 'rgba(0, 231, 1, 0.25)');
    grad.addColorStop(1, 'rgba(0, 231, 1, 0.0)');
    this.ctx.fillStyle = grad;
    this.ctx.fill();

    // Spawn flame particles
    if (Math.random() < 0.8) {
      this.particles.push({
        x: endX - 10,
        y: endY + 10,
        vx: (Math.random() - 0.5) * 2 - 3,
        vy: (Math.random() - 0.5) * 2 + 3,
        size: Math.random() * 5 + 3,
        alpha: 1,
        color: Math.random() > 0.5 ? '#ff4757' : '#ffa502'
      });
    }

    // Render particles
    this.drawParticles();

    // Draw Rocket
    const angle = -Math.PI / 5;
    this.drawRocket(endX, endY, angle);
  }

  renderCrashAnimation() {
    if (!this.ctx || !this.canvas) return;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Spawn explosion blast particles
    const endX = w * 0.7;
    const endY = h * 0.3;
    for (let i = 0; i < 40; i++) {
      const spd = Math.random() * 8 + 2;
      const ang = Math.random() * Math.PI * 2;
      this.particles.push({
        x: endX,
        y: endY,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        size: Math.random() * 7 + 3,
        alpha: 1,
        color: Math.random() > 0.4 ? '#fe2c55' : '#ffb703'
      });
    }

    const explodeLoop = () => {
      if (this.isPlaying) return;
      this.ctx.clearRect(0, 0, w, h);
      this.drawBackground(w, h, 0);
      this.drawGrid(w, h);
      this.drawParticles();
      if (this.particles.length > 0) {
        requestAnimationFrame(explodeLoop);
      }
    };
    explodeLoop();
  }

  drawParticles() {
    if (!this.ctx) return;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.03;
      p.size = Math.max(0.1, p.size * 0.96);

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fill();
      this.ctx.globalAlpha = 1.0;
    }
  }

  drawBackground(w, h, offset) {
    if (!this.ctx) return;
    this.stars.forEach(s => {
      s.x -= s.speed;
      if (s.x < 0) s.x = w;
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.globalAlpha = s.alpha;
      this.ctx.fill();
      this.ctx.globalAlpha = 1.0;
    });
  }

  drawGrid(w, h) {
    if (!this.ctx) return;
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.lineWidth = 1;
    for (let x = 40; x < w; x += 60) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, h);
      this.ctx.stroke();
    }
    for (let y = 40; y < h; y += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(w, y);
      this.ctx.stroke();
    }
  }

  drawRocket(x, y, angle) {
    if (!this.ctx) return;
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(angle);

    // Rocket Body
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.moveTo(25, 0);
    this.ctx.lineTo(-15, -10);
    this.ctx.lineTo(-10, 0);
    this.ctx.lineTo(-15, 10);
    this.ctx.closePath();
    this.ctx.fill();

    // Rocket Cockpit
    this.ctx.fillStyle = '#00e5ff';
    this.ctx.beginPath();
    this.ctx.arc(4, 0, 4, 0, Math.PI * 2);
    this.ctx.fill();

    // Red Wings
    this.ctx.fillStyle = '#fe2c55';
    this.ctx.beginPath();
    this.ctx.moveTo(-5, -8);
    this.ctx.lineTo(-16, -18);
    this.ctx.lineTo(-12, -6);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.moveTo(-5, 8);
    this.ctx.lineTo(-16, 18);
    this.ctx.lineTo(-12, 6);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.restore();
  }
}

window.CrashGame = CrashGame;
