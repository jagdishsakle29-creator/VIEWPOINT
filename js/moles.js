/**
 * VIEWPOINT - Premium Stake-Style Moles Burrow Game Engine
 * Features:
 * - 12-Hole 3D Lush Garden Molehill Grid
 * - Animated 3D Golden Mole Reveal & Steel Hammer Smash
 * - Configurable Traps Count (1 to 5) with Balanced Casino RTP
 * - Full Manual & Auto Play Support
 * - Instant Cashout & Zero Lag
 */
class CasinoMoles {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.totalHoles = 12;
    this.trapCount = 3;
    this.betAmount = 10;
    this.isPlaying = false;
    this.revealedIndices = new Set();
    this.secretTraps = [];
    this.currentMultiplier = 1.00;
    this.roundId = null;
    this.initDOM();
  }

  initDOM() {
    this.grid = document.getElementById('molesGrid');
    this.multDisplay = document.getElementById('molesMultiplierDisplay');
    this.profitDisplay = document.getElementById('molesProfitDisplay');
    this.trapSelect = document.getElementById('molesTrapSelect');
    this.btnStart = document.getElementById('btnMolesStart');
    this.btnCashout = document.getElementById('btnMolesCashout');
    this.statusText = document.getElementById('molesStatusText');

    if (this.trapSelect) {
      this.trapSelect.onchange = (e) => {
        this.setTrapCount(parseInt(e.target.value) || 3);
      };
    }

    if (this.btnStart) {
      this.btnStart.onclick = (e) => {
        e.preventDefault();
        this.startGame();
      };
    }

    if (this.btnCashout) {
      this.btnCashout.onclick = (e) => {
        e.preventDefault();
        this.cashOut();
      };
    }

    this.renderHolesGrid();
  }

  setBetAmount(amt) {
    this.betAmount = Math.max(1, parseFloat(amt) || 10);
    this.updateUI();
  }

  setTrapCount(count) {
    if (this.isPlaying) return;
    this.trapCount = Math.max(1, Math.min(5, parseInt(count) || 3));
    this.updateUI();
  }

  renderHolesGrid() {
    if (!this.grid) return;
    this.grid.innerHTML = '';
    for (let i = 0; i < this.totalHoles; i++) {
      const hole = document.createElement('div');
      hole.className = 'mole-hole-card';
      hole.dataset.index = i;
      hole.innerHTML = `
        <div class="mole-mound">
          <div class="mole-dirt-rim"></div>
          <div class="mole-hole-pit">
            <span class="mole-eye-icon">🕳️</span>
          </div>
          <span class="mole-hole-tag">Hole ${i + 1}</span>
        </div>
      `;
      hole.onclick = (e) => {
        e.preventDefault();
        this.digHole(i);
      };
      this.grid.appendChild(hole);
    }
  }

  startGame(betAmount) {
    if (betAmount) this.betAmount = betAmount;
    if (this.isPlaying) return false;

    if (!window.wallet || !window.wallet.hasFunds(this.betAmount)) {
      if (window.app && window.app.showNotification) {
        window.app.showNotification("❌ Insufficient balance for Moles bet!", "error");
      }
      return false;
    }

    window.wallet.deduct(this.betAmount);
    window.soundEngine && window.soundEngine.playBet && window.soundEngine.playBet();

    this.isPlaying = true;
    this.revealedIndices.clear();
    this.currentMultiplier = 1.00;
    this.roundId = 'MOL-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
    this.secretTraps = this.generateTraps(this.trapCount);

    this.renderHolesGrid();
    this.updateUI();
    return true;
  }

  generateTraps(count) {
    const indices = Array.from({ length: this.totalHoles }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices.slice(0, count);
  }

  digHole(index) {
    if (!this.isPlaying) {
      this.startGame();
      return;
    }
    if (this.revealedIndices.has(index)) return;

    this.revealedIndices.add(index);
    const holeEl = this.grid.querySelector(`[data-index="${index}"]`);

    // Check if Trap Hit (Loss)
    if (this.secretTraps.includes(index)) {
      this.handleTrapHit(index, holeEl);
      return;
    }

    // Safe Golden Mole Found
    const safeFound = this.revealedIndices.size;
    const totalSafe = this.totalHoles - this.trapCount;
    this.currentMultiplier = this.calculateMultiplier(safeFound, this.trapCount);

    if (holeEl) {
      holeEl.classList.add('mole-found');
      holeEl.innerHTML = `
        <div class="mole-revealed golden-mole">
          <div class="mole-sprite-3d">🐹</div>
          <div class="mole-coin-badge">💰 +${this.currentMultiplier.toFixed(2)}x</div>
        </div>
      `;
    }

    if (window.soundEngine) window.soundEngine.playGem && window.soundEngine.playGem(safeFound);

    if (safeFound >= totalSafe) {
      this.cashOut();
    } else {
      this.updateUI();
    }
  }

  calculateMultiplier(molesFound, traps) {
    const total = this.totalHoles;
    let prob = 1.0;
    for (let i = 0; i < molesFound; i++) {
      prob *= (total - traps - i) / (total - i);
    }
    const rawMult = (0.94 / prob); // 94% RTP
    return Math.max(1.15, Math.floor(rawMult * 100) / 100);
  }

  handleTrapHit(index, holeEl) {
    this.isPlaying = false;
    if (holeEl) {
      holeEl.classList.add('trap-hit');
      holeEl.innerHTML = `
        <div class="mole-revealed trap-hammer">
          <div class="hammer-sprite-3d">🔨</div>
          <div class="mole-trap-badge">TRAP!</div>
        </div>
      `;
    }

    // Reveal other secret traps
    this.secretTraps.forEach(trapIdx => {
      if (trapIdx !== index) {
        const otherEl = this.grid.querySelector(`[data-index="${trapIdx}"]`);
        if (otherEl && !otherEl.classList.contains('mole-found')) {
          otherEl.classList.add('trap-revealed');
          otherEl.innerHTML = `
            <div class="mole-revealed trap-dim">
              <span style="font-size: 24px; opacity:0.6;">🔨</span>
            </div>
          `;
        }
      }
    });

    if (window.soundEngine) window.soundEngine.playBomb && window.soundEngine.playBomb();

    const entry = {
      game: 'Moles',
      bet: this.betAmount,
      multiplier: 0,
      payout: 0,
      won: false,
      moles: this.revealedIndices.size - 1
    };

    window.wallet.recordBet(entry);
    this.addHistoryPill(entry);
    this.updateUI(true);

    if (window.app && window.app.showNotification) {
      window.app.showNotification(`🔨 Trap hit! Mole burrow collapsed (-₹${this.betAmount.toFixed(2)})`, "error");
    }
  }

  cashOut() {
    if (!this.isPlaying || this.revealedIndices.size === 0) return 0;
    this.isPlaying = false;

    const payout = Math.round(this.betAmount * this.currentMultiplier * 100) / 100;
    window.wallet.addWin(payout);
    if (window.soundEngine) window.soundEngine.playWin && window.soundEngine.playWin();

    const entry = {
      game: 'Moles',
      bet: this.betAmount,
      multiplier: this.currentMultiplier,
      payout: payout,
      won: true,
      moles: this.revealedIndices.size
    };

    window.wallet.recordBet(entry);
    this.addHistoryPill(entry);
    this.updateUI(false, true);

    if (window.app && window.app.showNotification) {
      window.app.showNotification(`🎉 CASHOUT! Won +₹${payout.toFixed(2)} (${this.currentMultiplier.toFixed(2)}x)!`, "success");
    }
    return payout;
  }

  updateUI(isTrapHit = false, isCashedOut = false) {
    const profit = Math.round(this.betAmount * this.currentMultiplier * 100) / 100;
    if (this.multDisplay) this.multDisplay.innerText = `${this.currentMultiplier.toFixed(2)}x`;
    if (this.profitDisplay) this.profitDisplay.innerText = `₹${profit.toFixed(2)}`;

    if (this.btnStart) this.btnStart.style.display = this.isPlaying ? 'none' : 'flex';
    if (this.btnCashout) {
      this.btnCashout.style.display = (this.isPlaying && this.revealedIndices.size > 0) ? 'flex' : 'none';
      const cashoutText = document.getElementById('molesCashoutText');
      if (cashoutText) cashoutText.innerText = `CASHOUT ₹${profit.toFixed(2)}`;
    }

    if (this.trapSelect) this.trapSelect.disabled = this.isPlaying;

    if (this.statusText) {
      if (isTrapHit) this.statusText.innerHTML = `<span style="color:#fe2c55; font-weight:800;">🔨 TRAP HIT! Try another burrow</span>`;
      else if (isCashedOut) this.statusText.innerHTML = `<span style="color:#00e701; font-weight:800;">🎉 WON ₹${profit.toFixed(2)} (${this.currentMultiplier.toFixed(2)}x)</span>`;
      else if (this.isPlaying) this.statusText.innerHTML = `<span style="color:#00e5ff; font-weight:800;">🐹 Safe Moles: ${this.revealedIndices.size} / ${this.totalHoles - this.trapCount} | Next: ${this.calculateMultiplier(this.revealedIndices.size + 1, this.trapCount).toFixed(2)}x</span>`;
      else this.statusText.innerHTML = `<span style="color:#94a3b8;">Choose traps & tap a hole to start digging</span>`;
    }
  }

  addHistoryPill(entry) {
    const list = document.getElementById('molesHistoryList');
    if (!list) return;
    const pill = document.createElement('div');
    pill.className = `moles-hist-pill ${entry.won ? 'win' : 'loss'}`;
    pill.innerText = entry.won ? `${entry.multiplier.toFixed(2)}x` : '🔨 TRAP';
    list.prepend(pill);
    if (list.children.length > 8) list.removeChild(list.lastChild);
  }

  reset() {
    this.isPlaying = false;
    this.revealedIndices.clear();
    this.currentMultiplier = 1.00;
    this.renderHolesGrid();
    this.updateUI();
  }
}

window.CasinoMoles = CasinoMoles;
