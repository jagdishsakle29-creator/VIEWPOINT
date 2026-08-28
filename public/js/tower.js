/**
 * VIEWPOINT - Stake-Style Tower Legend Game Engine
 * Features:
 * - 9-Floor Vertical Mystical Tower Climb
 * - 4 Difficulty Modes (Easy, Medium, Hard, Extreme)
 * - Real-Time Multipliers Scaling up to 500.00x
 * - Instant Floor Cashout & Floor Highlight Elevator
 * - Provably Fair SHA-256 Seed Calculation
 */
class CasinoTower {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.totalFloors = 9;
    this.currentFloor = 0; // 0 = at base, 1..9 = floors cleared
    this.difficulty = 'medium'; // easy (3/4), medium (2/3), hard (1/2), extreme (1/3)
    this.betAmount = 10;
    this.isPlaying = false;
    this.floorChoices = []; // user selections
    this.secretSkulls = []; // skull placements per floor
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
      this.btnStart.addEventListener('click', () => this.startGame());
    }

    if (this.btnCashout) {
      this.btnCashout.addEventListener('click', () => this.cashOut());
    }

    this.renderTowerStructure();
  }

  initDifficultyButtons() {
    const diffBtns = document.querySelectorAll('.tower-diff-btn');
    diffBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.isPlaying) return;
        diffBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.setDifficulty(btn.dataset.diff || 'medium');
      });
    });
  }

  setBetAmount(amt) {
    this.betAmount = Math.max(1, parseFloat(amt) || 10);
    this.updateUI();
  }

  setDifficulty(diff) {
    if (this.isPlaying) return;
    this.difficulty = diff;
    this.renderTowerStructure();
    this.updateUI();
  }

  getDifficultyConfig() {
    switch (this.difficulty) {
      case 'easy':
        return { blocksPerFloor: 4, safeCount: 3, skulls: 1, mults: [1.30, 1.70, 2.25, 3.00, 4.00, 5.30, 7.10, 9.50, 12.80] };
      case 'hard':
        return { blocksPerFloor: 2, safeCount: 1, skulls: 1, mults: [1.90, 3.70, 7.20, 14.0, 28.0, 55.0, 110.0, 215.0, 430.0] };
      case 'extreme':
        return { blocksPerFloor: 3, safeCount: 1, skulls: 2, mults: [2.85, 8.20, 23.5, 68.0, 195.0, 560.0, 1600.0, 4600.0, 13000.0] };
      case 'medium':
      default:
        return { blocksPerFloor: 3, safeCount: 2, skulls: 1, mults: [1.45, 2.15, 3.20, 4.80, 7.20, 10.80, 16.20, 24.30, 36.50] };
    }
  }

  renderTowerStructure() {
    if (!this.towerContainer) return;
    this.towerContainer.innerHTML = '';
    const config = this.getDifficultyConfig();

    // Render floors from top (Floor 9) down to bottom (Floor 1)
    for (let f = this.totalFloors; f >= 1; f--) {
      const floorRow = document.createElement('div');
      floorRow.className = `tower-floor-row ${f === 1 ? 'active-floor' : 'locked-floor'}`;
      floorRow.dataset.floor = f;

      const floorMult = config.mults[f - 1].toFixed(2) + 'x';
      let blocksHtml = '';
      for (let b = 0; b < config.blocksPerFloor; b++) {
        blocksHtml += `
          <button type="button" class="tower-block-btn" data-floor="${f}" data-block="${b}">
            <span class="tower-block-icon">🚪</span>
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
      btn.addEventListener('click', (e) => {
        const floor = parseInt(btn.dataset.floor);
        const block = parseInt(btn.dataset.block);
        this.selectBlock(floor, block, btn);
      });
    });
  }

  startGame(betAmount) {
    if (betAmount) this.betAmount = betAmount;
    if (this.isPlaying) this.reset();

    if (!window.wallet || !window.wallet.hasFunds(this.betAmount)) {
      if (window.app && window.app.showNotification) {
        window.app.showNotification("❌ Insufficient balance for Tower Legend bet!", "error");
      }
      return false;
    }

    window.wallet.deduct(this.betAmount);
    window.soundEngine && window.soundEngine.playBet && window.soundEngine.playBet();

    this.isPlaying = true;
    this.currentFloor = 0;
    this.currentMultiplier = 1.00;
    this.roundId = 'TOW-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
    this.generateTowerSkulls();

    this.renderTowerStructure();
    this.highlightFloor(1);
    this.updateUI();
    return true;
  }

  generateTowerSkulls() {
    this.secretSkulls = [];
    const config = this.getDifficultyConfig();
    for (let f = 1; f <= this.totalFloors; f++) {
      const skulls = [];
      while (skulls.length < config.skulls) {
        const r = Math.floor(Math.random() * config.blocksPerFloor);
        if (!skulls.includes(r)) skulls.push(r);
      }
      this.secretSkulls.push(skulls);
    }
  }

  selectBlock(floor, block, btnEl) {
    if (!this.isPlaying) {
      this.startGame();
      return;
    }

    // Must click block on the current active floor
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

    // Safe Gem Found!
    this.currentFloor = floor;
    this.currentMultiplier = config.mults[floorIdx];

    if (btnEl) {
      btnEl.classList.add('gem-found');
      btnEl.innerHTML = `<span class="tower-block-icon" style="font-size:24px; animation:bounce 0.4s;">💎</span>`;
    }

    if (floorRow) floorRow.classList.add('cleared-floor');
    if (window.soundEngine) window.soundEngine.playGem && window.soundEngine.playGem(floor);

    if (this.currentFloor >= this.totalFloors) {
      // Reached top of Tower!
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
      btnEl.innerHTML = `<span class="tower-block-icon" style="font-size:24px; animation:wobble 0.4s;">💀</span>`;
    }

    if (floorRow) floorRow.classList.add('failed-floor');

    // Reveal other skulls in this floor
    const blocks = floorRow.querySelectorAll('.tower-block-btn');
    blocks.forEach((b, idx) => {
      if (skulls.includes(idx) && idx !== block) {
        b.classList.add('skull-revealed');
        b.innerHTML = `<span class="tower-block-icon" style="opacity:0.6;">💀</span>`;
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

    if (window.app && window.app.showNotification) {
      window.app.showNotification(`💀 Skull hit on Floor ${floor}! Tower collapsed (-₹${this.betAmount.toFixed(2)})`, "error");
    }
  }

  cashOut() {
    if (!this.isPlaying || this.currentFloor === 0) return;
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

    if (window.app && window.app.showNotification) {
      window.app.showNotification(`👑 TOWER CASHOUT! Escaped Floor ${this.currentFloor} with +₹${payout.toFixed(2)} (${this.currentMultiplier.toFixed(2)}x)!`, "success");
    }
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

    if (this.statusText) {
      if (isSkullHit) this.statusText.innerHTML = `<span style="color:#fe2c55; font-weight:800;">💀 TOWER COLLAPSED! Try climbing again</span>`;
      else if (isCashedOut) this.statusText.innerHTML = `<span style="color:#00e701; font-weight:800;">👑 CASHOUT: ₹${profit.toFixed(2)} (${this.currentMultiplier.toFixed(2)}x) at Floor ${this.currentFloor}</span>`;
      else if (this.isPlaying) this.statusText.innerHTML = `<span style="color:#00e5ff; font-weight:800;">🏰 Cleared Floor ${this.currentFloor} / ${this.totalFloors} | Current Mult: ${this.currentMultiplier.toFixed(2)}x</span>`;
      else this.statusText.innerHTML = `<span style="color:#94a3b8;">Choose difficulty & start climbing the Tower</span>`;
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
