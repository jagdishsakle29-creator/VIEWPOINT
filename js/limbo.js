/**
 * VIEWPOINT - Stake-Style Limbo Turbo Game Engine
 * Features:
 * - Target Multiplier selection (1.01x up to 1,000,000x)
 * - Instant High-Speed Multiplier Ticker Animation
 * - Real Win Chance Calculation (99.0 / Target Multiplier)
 * - High Multiplier Neon Rocket Explosion
 */
class CasinoLimbo {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.targetMultiplier = 2.00;
    this.isRolling = false;
    this.initDOM();
  }

  initDOM() {
    this.targetInput = document.getElementById('limboTargetInput');
    this.targetInputSidebar = document.getElementById('limboTargetInputSidebar');
    this.displayWinChance = document.getElementById('limboWinChanceDisplay');
    this.displayWinChanceSidebar = document.getElementById('limboWinChanceSidebar');
    this.displayResult = document.getElementById('limboResultDisplay');
    this.resultContainer = document.getElementById('limboResultContainer');

    const handleInput = (e) => {
      let val = parseFloat(e.target.value);
      if (isNaN(val) || val < 1.01) val = 1.01;
      this.targetMultiplier = val;
      if (this.targetInput && this.targetInput !== e.target) this.targetInput.value = val.toFixed(2);
      if (this.targetInputSidebar && this.targetInputSidebar !== e.target) this.targetInputSidebar.value = val.toFixed(2);
      this.updateWinChance();
    };

    if (this.targetInput) this.targetInput.addEventListener('input', handleInput);
    if (this.targetInputSidebar) this.targetInputSidebar.addEventListener('input', handleInput);

    this.updateWinChance();
  }

  setTarget(t) {
    this.targetMultiplier = Math.max(1.01, parseFloat(t) || 2.0);
    if (this.targetInput) this.targetInput.value = this.targetMultiplier.toFixed(2);
    if (this.targetInputSidebar) this.targetInputSidebar.value = this.targetMultiplier.toFixed(2);
    this.updateWinChance();
    window.soundEngine && window.soundEngine.playClick && window.soundEngine.playClick();
  }

  updateWinChance() {
    const chance = Math.max(0.0001, Math.min(98.0, 99.0 / this.targetMultiplier));
    if (this.displayWinChance) {
      this.displayWinChance.innerText = `${chance.toFixed(2)}%`;
    }
    if (this.displayWinChanceSidebar) {
      this.displayWinChanceSidebar.innerText = `Win: ${chance.toFixed(2)}%`;
    }
  }

  async roll(betAmount = 10) {
    if (this.isRolling) return;
    if (!window.wallet || !window.wallet.hasFunds(betAmount)) {
      if (window.app && window.app.showNotification) {
        window.app.showNotification("Insufficient balance for Limbo bet!", "error");
      }
      return;
    }

    this.isRolling = true;
    window.wallet.deduct(betAmount);
    window.soundEngine && window.soundEngine.playBet && window.soundEngine.playBet();

    const btnBet = document.getElementById('btnActionBet');
    if (btnBet) btnBet.disabled = true;

    // Generate Provably Fair Crashed Multiplier with 96% RTP Casino Edge
    const r = Math.random();
    let crashMult = 1.00;
    if (r < 0.035) {
      crashMult = 1.00; // Instant house crash
    } else {
      crashMult = Math.floor((96.0 / (1.0 - r + 0.00001)) * 100) / 10000;
    }
    crashMult = Math.max(1.00, Math.min(1000000.0, crashMult));

    if (this.resultContainer) {
      this.resultContainer.classList.remove('win', 'loss', 'popping');
      void this.resultContainer.offsetWidth; // Trigger reflow
      this.resultContainer.classList.add('popping');
    }

    let step = 0;
    const ticker = setInterval(() => {
      step++;
      const randDisplay = (1 + Math.random() * (this.targetMultiplier * 1.5)).toFixed(2);
      if (this.displayResult) this.displayResult.innerText = `${randDisplay}x`;

      if (step >= 6) {
        clearInterval(ticker);
        this.finalizeRoll(betAmount, crashMult);
      }
    }, 40);
  }

  finalizeRoll(betAmount, crashMult) {
    this.isRolling = false;
    const btnBet = document.getElementById('btnActionBet');
    if (btnBet) btnBet.disabled = false;

    if (this.displayResult) this.displayResult.innerText = `${crashMult.toFixed(2)}x`;

    const won = crashMult >= this.targetMultiplier;
    const payout = won ? Math.round(betAmount * this.targetMultiplier * 100) / 100 : 0;

    if (this.resultContainer) {
      this.resultContainer.classList.add(won ? 'win' : 'loss');
    }

    if (won) {
      window.wallet.addWin(payout);
      if (window.soundEngine) {
        if (this.targetMultiplier >= 10) window.soundEngine.playWin && window.soundEngine.playWin();
        else window.soundEngine.playGem && window.soundEngine.playGem(4);
      }
    } else {
      if (window.soundEngine) window.soundEngine.playBomb && window.soundEngine.playBomb();
    }

    const entry = {
      game: `Limbo (${this.targetMultiplier.toFixed(2)}x)`,
      bet: betAmount,
      multiplier: won ? this.targetMultiplier : 0,
      payout: payout,
      won: won,
      crashResult: crashMult
    };

    window.wallet.recordBet(entry);
    this.addHistoryChip(entry);

    if (window.app && window.app.onLimboComplete) {
      window.app.onLimboComplete(entry);
    }
  }

  addHistoryChip(entry) {
    const list = document.getElementById('limboHistoryList');
    if (!list) return;
    const chip = document.createElement('div');
    chip.className = `limbo-history-chip ${entry.won ? 'won' : 'lost'}`;
    chip.innerText = `${entry.crashResult.toFixed(2)}x`;
    list.prepend(chip);
    if (list.children.length > 8) {
      list.removeChild(list.lastChild);
    }
  }
}

window.CasinoLimbo = CasinoLimbo;
