/**
 * VIEWPOINT - Premium Stake-Style Tower Legend Game Engine
 * Features:
 * - 8-Floor Neon Cyberpunk Tower Climb
 * - 4 Difficulty Modes (Easy, Medium, Hard, Extreme)
 * - 💎 Radiant Gem Unveils & 💀 Skull Trap Explosions
 * - Elevator Scan Tracker & Real-Time Cashout
 * - Full Manual & Auto Play Support
 */
class CasinoTower {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.totalFloors = 8;
    this.currentFloor = 0; // 0 = at base
    this.difficulty = 'medium';
    this.betAmount = 10;
    this.isPlaying = false;
    this.floorChoices = [];
    this.secretSkulls = [];
    this.currentMultiplier = 1.00;
    this.roundId = null;
    this.initDOM();
  }

  initDOM() {
    this.towerContainer = document.getElementById('towerFloorsContainer');
    this.multDisplay = document.getElementById('towerMultiplierDisplay');
    this.profitDisplay = document.getElementById('towerProfitDisplay');
    this.btnStart = document.getElementById('btnTowerStart');
    this.btnCashout = document.getElementById('btnTowerCashout');
    this.statusText = document.getElementById('towerStatusText');

    this.initDifficultyButtons();

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

    this.renderTowerStructure();
  }

  initDifficultyButtons() {
    const diffBtns = document.querySelectorAll('.tower-diff-btn');
    diffBtns.forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        if (this.isPlaying) return;
        diffBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.setDifficulty(btn.dataset.diff || 'medium');
      };
    });
  }

  setBetAmount(amt) {
    this.betAmount = Math.max(1, parseFloat(amt) || 10);
    this.updateUI();
  }

  setDifficulty(diff) {
    if (this.isPlaying) return;
    this.difficulty = diff || 'medium';
    if (!this.towerContainer) this.towerContainer = document.getElementById('towerFloorsContainer');
    this.renderTowerStructure();
    this.updateUI();
  }

  getDifficultyConfig() {
    switch (this.difficulty) {
      case 'easy':
        return { blocksPerFloor: 4, safeCount: 3, skulls: 1, mults: [1.28, 1.65, 2.15, 2.80, 3.70, 4.90, 6.50, 8.80], label: '🟢 EASY (4 Doors/Floor: 3💎 1💀)' };
      case 'hard':
        return { blocksPerFloor: 2, safeCount: 1, skulls: 1, mults: [1.94, 3.80, 7.50, 15.00, 30.00, 60.00, 120.00, 240.00], label: '🔴 HARD (2 Doors/Floor: 1💎 1💀)' };
      case 'medium':
      default:
        return { blocksPerFloor: 3, safeCount: 2, skulls: 1, mults: [1.45, 2.15, 3.20, 4.80, 7.20, 10.80, 16.20, 24.50], label: '🟡 MEDIUM (3 Doors/Floor: 2💎 1💀)' };
    }
  }

  renderTowerStructure() {
    if (!this.towerContainer) this.towerContainer = document.getElementById('towerFloorsContainer');
    if (!this.towerContainer) return;
    this.towerContainer.innerHTML = '';
    const config = this.getDifficultyConfig();

    // Render floors from Floor 8 down to Floor 1
    for (let f = this.totalFloors; f >= 1; f--) {
      const floorRow = document.createElement('div');
      floorRow.className = `tower-floor-row ${f === 1 ? 'active-floor' : 'locked-floor'}`;
      floorRow.dataset.floor = f;

      const floorMult = config.mults[f - 1].toFixed(2) + 'x';
      let blocksHtml = '';
      for (let b = 0; b < config.blocksPerFloor; b++) {
        blocksHtml += `
          <button type="button" class="tower-block-btn" data-floor="${f}" data-block="${b}">
            <div class="tower-door-frame">
              <span class="tower-door-icon">🚪</span>
            </div>
          </button>
        `;
      }

      floorRow.innerHTML = `
        <div class="tower-floor-badge">
          <span class="tower-floor-num">F${f}</span>
          <span class="tower-floor-mult">${floorMult}</span>
        </div>
        <div class="tower-blocks-group">
          ${blocksHtml}
        </div>
      `;

      this.towerContainer.appendChild(floorRow);
    }

    // Attach click listeners
    const allBlocks = this.towerContainer.querySelectorAll('.tower-block-btn');
    allBlocks.forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        const floor = parseInt(btn.dataset.floor);
        const block = parseInt(btn.dataset.block);
        this.selectBlock(floor, block, btn);
      };
    });

    if (this.statusText && !this.isPlaying) {
      this.statusText.innerHTML = `<span style="display:inline-block; background:rgba(0,229,255,0.12); border:1px solid #00e5ff; padding:4px 12px; border-radius:8px; color:#00e5ff; font-weight:800; font-size:12px;">Active: <b>${config.label}</b></span>`;
    }
  }

  startGame(betAmount) {
    if (betAmount) {
      this.betAmount = parseFloat(betAmount);
    } else {
      const bInput = document.getElementById('betAmountInput');
      const val = parseFloat(bInput ? bInput.value : 10) || 10;
      this.betAmount = Math.max(1, val);
    }
    if (this.isPlaying) return false;

    if (!window.wallet || !window.wallet.hasFunds(this.betAmount)) {
      if (window.app && window.app.showNotification) {
        window.app.showNotification("❌ Insufficient balance for Tower bet!", "error");
      }
      return false;
    }

    window.wallet.deduct(this.betAmount);
    window.soundEngine && window.soundEngine.playBet && window.soundEngine.playBet();

    this.isPlaying = true;
    this.currentFloor = 0;
    this.currentMultiplier = 1.00;
    this.roundId = 'TWR-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
    this.secretSkulls = this.generateSkulls();

    this.renderTowerStructure();
    this.highlightFloor(1);
    this.updateUI();

    if (window.app && window.app.dom) {
      if (window.app.dom.btnActionBet) window.app.dom.btnActionBet.style.display = 'none';
      if (window.app.dom.btnActionCashout) {
        window.app.dom.btnActionCashout.style.display = 'flex';
        window.app.dom.btnActionCashout.disabled = true;
      }
    }
    return true;
  }

  generateSkulls() {
    const config = this.getDifficultyConfig();
    const result = [];
    for (let f = 0; f < this.totalFloors; f++) {
      const indices = Array.from({ length: config.blocksPerFloor }, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      result.push(indices.slice(0, config.skulls));
    }
    return result;
  }

  selectBlock(floor, block, btnEl) {
    if (!this.isPlaying) {
      this.startGame();
      return;
    }

    if (floor !== (this.currentFloor + 1)) return;

    const floorIdx = floor - 1;
    const skulls = this.secretSkulls[floorIdx] || [];
    const isSkull = skulls.includes(block);

    const config = this.getDifficultyConfig();
    const floorRow = this.towerContainer.querySelector(`.tower-floor-row[data-floor="${floor}"]`);

    if (isSkull) {
      this.handleTowerCollapse(floor, block, btnEl, floorRow, skulls);
      return;
    }

    // Safe Gem Found
    this.currentFloor = floor;
    this.currentMultiplier = config.mults[floorIdx];
    const currentProfit = Math.round(this.betAmount * this.currentMultiplier * 100) / 100;

    if (btnEl) {
      btnEl.classList.add('gem-found');
      btnEl.innerHTML = `<div class="tower-gem-wrapper">💎<span class="tower-step-mult">${this.currentMultiplier.toFixed(2)}x</span></div>`;
    }

    // Sync to bottom global cashout bar
    if (window.app) {
      const amtDisp = document.getElementById('cashoutAmountDisplay');
      const multDisp = document.getElementById('cashoutMultiplierDisplay');
      if (amtDisp) amtDisp.innerText = `${window.wallet.currency}${currentProfit.toFixed(2)}`;
      if (multDisp) multDisp.innerText = `${this.currentMultiplier.toFixed(2)}x`;
      if (window.app.dom && window.app.dom.btnActionCashout) {
        window.app.dom.btnActionCashout.disabled = false;
        window.app.dom.btnActionCashout.style.display = 'flex';
      }
      if (window.app.dom && window.app.dom.btnActionBet) {
        window.app.dom.btnActionBet.style.display = 'none';
      }
    }

    if (floorRow) floorRow.classList.add('cleared-floor');
    if (window.soundEngine) window.soundEngine.playGem && window.soundEngine.playGem(floor);

    if (this.currentFloor >= this.totalFloors) {
      this.cashOut();
    } else {
      this.highlightFloor(this.currentFloor + 1);
      this.updateUI();
    }
  }

  highlightFloor(floorNum) {
    const allRows = this.towerContainer.querySelectorAll('.tower-floor-row');
    allRows.forEach(row => {
      const f = parseInt(row.dataset.floor);
      if (f === floorNum) {
        row.classList.add('active-floor');
        row.classList.remove('locked-floor');
      } else if (f < floorNum) {
        row.classList.add('cleared-floor');
        row.classList.remove('active-floor', 'locked-floor');
      } else {
        row.classList.add('locked-floor');
        row.classList.remove('active-floor');
      }
    });
  }

  handleTowerCollapse(floor, block, btnEl, floorRow, skulls) {
    this.isPlaying = false;
    if (btnEl) {
      btnEl.classList.add('skull-hit');
      btnEl.innerHTML = `<div class="tower-skull-wrapper">💀<span class="tower-trap-label">BOOM!</span></div>`;
    }

    if (floorRow) floorRow.classList.add('failed-floor');

    // Reveal other skulls in this floor
    const blocks = floorRow.querySelectorAll('.tower-block-btn');
    blocks.forEach((b, idx) => {
      if (skulls.includes(idx) && idx !== block) {
        b.classList.add('skull-revealed');
        b.innerHTML = `<span style="opacity:0.6; font-size:20px;">💀</span>`;
      }
    });

    if (window.soundEngine) window.soundEngine.playBomb && window.soundEngine.playBomb();

    const entry = {
      game: 'Tower Legend',
      bet: this.betAmount,
      multiplier: 0,
      payout: 0,
      won: false,
      floor: this.currentFloor
    };

    window.wallet.recordBet(entry);
    this.addHistoryPill(entry);
    this.updateUI(true);

    if (window.app) {
      if (window.app.dom && window.app.dom.btnActionCashout) window.app.dom.btnActionCashout.style.display = 'none';
      if (window.app.dom && window.app.dom.btnActionBet) {
        window.app.dom.btnActionBet.style.display = 'flex';
        window.app.dom.btnActionBet.disabled = false;
      }
      window.app.showToast({ won: false, multiplier: 0, payout: 0 });
      window.app.renderHistoryTable();
    }
  }

  cashOut() {
    if (!this.isPlaying || this.currentFloor === 0) return 0;
    this.isPlaying = false;

    const payout = Math.round(this.betAmount * this.currentMultiplier * 100) / 100;
    window.wallet.addWin(payout);
    if (window.soundEngine) window.soundEngine.playWin && window.soundEngine.playWin();

    const entry = {
      game: 'Tower Legend',
      bet: this.betAmount,
      multiplier: this.currentMultiplier,
      payout: payout,
      won: true,
      floor: this.currentFloor
    };

    window.wallet.recordBet(entry);
    this.addHistoryPill(entry);
    this.updateUI(false, true);

    if (window.app) {
      if (window.app.dom && window.app.dom.btnActionCashout) window.app.dom.btnActionCashout.style.display = 'none';
      if (window.app.dom && window.app.dom.btnActionBet) {
        window.app.dom.btnActionBet.style.display = 'flex';
        window.app.dom.btnActionBet.disabled = false;
      }
      window.app.showToast({ won: true, multiplier: this.currentMultiplier, payout: payout });
      window.app.renderHistoryTable();
    }
    return payout;
  }

  updateUI(isSkullHit = false, isCashedOut = false) {
    const profit = Math.round(this.betAmount * this.currentMultiplier * 100) / 100;
    if (this.multDisplay) this.multDisplay.innerText = `${this.currentMultiplier.toFixed(2)}x`;
    if (this.profitDisplay) this.profitDisplay.innerText = `₹${profit.toFixed(2)}`;

    if (this.btnStart) this.btnStart.style.display = this.isPlaying ? 'none' : 'flex';
    if (this.btnCashout) {
      this.btnCashout.style.display = (this.isPlaying && this.currentFloor > 0) ? 'flex' : 'none';
      const cashoutText = document.getElementById('towerCashoutText');
      if (cashoutText) cashoutText.innerText = `CASHOUT ₹${profit.toFixed(2)}`;
    }

    // Dynamic Next Floor Multiplier & Profit Preview
    const config = this.getDifficultyConfig();
    const nextFloor = this.isPlaying ? (this.currentFloor + 1) : 1;
    const nextMult = (nextFloor <= this.totalFloors) ? config.mults[nextFloor - 1] : config.mults[this.totalFloors - 1];
    const nextProfit = Math.round(this.betAmount * nextMult * 100) / 100;
    const nextMultTag = document.getElementById('towerNextMultTag');
    const nextProfitTag = document.getElementById('towerNextProfitTag');
    if (nextMultTag) nextMultTag.innerText = `F${nextFloor}: ${nextMult.toFixed(2)}x`;
    if (nextProfitTag) nextProfitTag.innerText = `Profit: +₹${nextProfit.toFixed(2)}`;

    if (this.statusText) {
      if (isSkullHit) this.statusText.innerHTML = `<span style="color:#fe2c55; font-weight:800;">💀 TOWER COLLAPSED! Try climbing again</span>`;
      else if (isCashedOut) this.statusText.innerHTML = `<span style="color:#00e701; font-weight:800;">👑 CASHOUT: ₹${profit.toFixed(2)} (${this.currentMultiplier.toFixed(2)}x) at Floor ${this.currentFloor}</span>`;
      else if (this.isPlaying) this.statusText.innerHTML = `<span style="color:#00e5ff; font-weight:800;">🏰 Cleared Floor ${this.currentFloor} / ${this.totalFloors} | Next: ${nextMult.toFixed(2)}x</span>`;
      else this.statusText.innerHTML = `<span style="display:inline-block; background:rgba(0,229,255,0.12); border:1px solid #00e5ff; padding:4px 12px; border-radius:8px; color:#00e5ff; font-weight:800; font-size:12px;">Active: <b>${config.label}</b></span>`;
    }
  }

  addHistoryPill(entry) {
    const list = document.getElementById('towerHistoryList');
    if (!list) return;
    const pill = document.createElement('div');
    pill.className = `tower-hist-pill ${entry.won ? 'win' : 'loss'}`;
    pill.innerText = entry.won ? `${entry.multiplier.toFixed(2)}x` : '💀 F' + (entry.floor + 1);
    list.prepend(pill);
    if (list.children.length > 8) list.removeChild(list.lastChild);
  }

  reset() {
    this.isPlaying = false;
    this.currentFloor = 0;
    this.currentMultiplier = 1.00;
    this.renderTowerStructure();
    this.updateUI();
  }
}

window.CasinoTower = CasinoTower;
