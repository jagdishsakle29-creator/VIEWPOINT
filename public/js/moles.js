/**
 * VIEWPOINT - Premium Stake-Style Moles Burrow Game Engine
 * Self-Contained, Zero-Scroll, 60fps Mobile-Ergonomic Experience
 * Features:
 * - 12-Hole 3D Lush Garden Molehill Grid
 * - Configurable Traps Count (1 to 5) with Balanced Casino RTP
 * - Built-in Direct Bet Controls & Chip Shortcuts
 * - Instant Cashout & Zero-Lag Animations
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
    this.statusText = document.getElementById('molesStatusText');
    this.trapsLabelHelper = document.getElementById('molesTrapsLabelHelper');
    this.btnStart = document.getElementById('btnMolesStart');
    this.btnCashout = document.getElementById('btnMolesCashout');
    this.betInput = document.getElementById('molesBetAmountInput');

    if (this.betInput) {
      this.betInput.oninput = (e) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val) && val > 0) {
          this.betAmount = val;
          this.updateChipsHighlight();
          this.updateMultiplierPreview();
        }
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
    this.updateMultiplierPreview();
  }

  setBetAmount(amt) {
    this.betAmount = Math.max(1, parseFloat(amt) || 10);
    if (this.betInput) {
      this.betInput.value = this.betAmount.toFixed(2);
    }
    this.updateChipsHighlight();
    this.updateMultiplierPreview();
  }

  halfBet() {
    if (this.isPlaying) return;
    this.setBetAmount(Math.max(1, Math.round((this.betAmount / 2) * 100) / 100));
  }

  doubleBet() {
    if (this.isPlaying) return;
    this.setBetAmount(Math.round((this.betAmount * 2) * 100) / 100);
  }

  maxBet() {
    if (this.isPlaying) return;
    const max = window.wallet ? Math.floor(window.wallet.balance) : 100;
    this.setBetAmount(Math.max(1, max));
  }

  updateChipsHighlight() {
    const chips = document.querySelectorAll('.moles-chip-btn');
    chips.forEach(chip => {
      const chipVal = parseFloat(chip.innerText.replace(/[^0-9.]/g, ''));
      if (Math.abs(chipVal - this.betAmount) < 0.01) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });
  }

  setTrapCount(count) {
    if (this.isPlaying) return;
    this.trapCount = Math.max(1, Math.min(5, parseInt(count) || 3));
    
    // Update active trap button
    const trapBtns = document.querySelectorAll('.btn-mole-trap');
    trapBtns.forEach(btn => {
      const t = parseInt(btn.dataset.traps);
      if (t === this.trapCount) btn.classList.add('active');
      else btn.classList.remove('active');
    });

    const safeCount = this.totalHoles - this.trapCount;
    if (this.trapsLabelHelper) {
      this.trapsLabelHelper.innerText = `${this.trapCount} Trap${this.trapCount > 1 ? 's' : ''} (${safeCount} Safe Moles)`;
    }

    this.updateMultiplierPreview();
  }

  updateMultiplierPreview() {
    const nextPreview = this.calculateMultiplier(1, this.trapCount);
    const profit = Math.round(this.betAmount * nextPreview * 100) / 100;
    if (this.multDisplay) this.multDisplay.innerText = `${nextPreview.toFixed(2)}x`;
    if (this.profitDisplay) this.profitDisplay.innerText = `${window.wallet ? window.wallet.currency : '₹'}${profit.toFixed(2)}`;
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
    if (betAmount) {
      this.betAmount = parseFloat(betAmount);
    } else if (this.betInput) {
      const val = parseFloat(this.betInput.value) || 10;
      this.betAmount = Math.max(1, val);
    }

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
    const currentProfit = Math.round(this.betAmount * this.currentMultiplier * 100) / 100;

    if (holeEl) {
      holeEl.classList.add('mole-found');
      holeEl.innerHTML = `
        <div class="mole-revealed golden-mole">
          <div class="mole-sprite-3d">🐹</div>
          <div class="mole-coin-badge">+${this.currentMultiplier.toFixed(2)}x</div>
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
    let baseCurves = {
      1: [1.08, 1.18, 1.30, 1.45, 1.65, 1.90, 2.20, 2.60, 3.10, 3.75, 4.60],
      2: [1.12, 1.28, 1.48, 1.75, 2.10, 2.60, 3.30, 4.30, 5.80, 8.20],
      3: [1.18, 1.42, 1.76, 2.25, 3.00, 4.15, 6.00, 9.20, 15.00],
      4: [1.32, 1.85, 2.70, 4.20, 7.00, 12.50, 24.00, 55.00],
      5: [1.55, 2.65, 5.00, 10.50, 24.00, 65.00, 200.00]
    };

    const curve = baseCurves[traps] || baseCurves[3];
    const idx = Math.max(0, Math.min(curve.length - 1, molesFound - 1));
    return curve[idx] || 1.18;
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
              <span style="font-size: 20px; opacity:0.6;">🔨</span>
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

    if (window.app) {
      window.app.showToast({ won: false, multiplier: 0, payout: 0 });
      window.app.renderHistoryTable && window.app.renderHistoryTable();
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

    if (window.app) {
      window.app.showToast({ won: true, multiplier: this.currentMultiplier, payout: payout });
      window.app.renderHistoryTable && window.app.renderHistoryTable();
    }
    return payout;
  }

  updateUI(isTrapHit = false, isCashedOut = false) {
    const profit = Math.round(this.betAmount * this.currentMultiplier * 100) / 100;
    const currency = window.wallet ? window.wallet.currency : '₹';

    if (this.multDisplay) this.multDisplay.innerText = `${this.currentMultiplier.toFixed(2)}x`;
    if (this.profitDisplay) this.profitDisplay.innerText = `${currency}${profit.toFixed(2)}`;

    if (this.btnStart) this.btnStart.style.display = this.isPlaying ? 'none' : 'flex';
    if (this.btnCashout) {
      this.btnCashout.style.display = (this.isPlaying && this.revealedIndices.size > 0) ? 'flex' : 'none';
      const cashoutText = document.getElementById('molesCashoutText');
      if (cashoutText) cashoutText.innerText = `💰 CASHOUT ${currency}${profit.toFixed(2)}`;
    }

    if (this.betInput) this.betInput.disabled = this.isPlaying;

    const trapBtns = document.querySelectorAll('.btn-mole-trap');
    trapBtns.forEach(btn => btn.disabled = this.isPlaying);

    const chipBtns = document.querySelectorAll('.moles-chip-btn');
    chipBtns.forEach(btn => btn.disabled = this.isPlaying);

    if (this.statusText) {
      if (isTrapHit) {
        this.statusText.innerHTML = `<span style="color:#fe2c55; font-weight:800;">🔨 TRAP HIT! Try another burrow</span>`;
      } else if (isCashedOut) {
        this.statusText.innerHTML = `<span style="color:#00e701; font-weight:800;">🎉 WON ${currency}${profit.toFixed(2)} (${this.currentMultiplier.toFixed(2)}x)</span>`;
      } else if (this.isPlaying) {
        const nextMult = this.calculateMultiplier(this.revealedIndices.size + 1, this.trapCount);
        this.statusText.innerHTML = `<span style="color:#00e5ff; font-weight:800;">🐹 Safe: ${this.revealedIndices.size}/${this.totalHoles - this.trapCount} | Next: ${nextMult.toFixed(2)}x</span>`;
      } else {
        this.statusText.innerHTML = `<span style="color:#94a3b8;">Choose traps & tap a hole to start digging</span>`;
      }
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
