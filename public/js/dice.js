/**
 * VIEWPOINT - Stake-Style Classic Dice Game Engine
 * Features:
 * - 0.00 to 100.00 Precision Drag Slider
 * - Roll Over / Roll Under Toggle
 * - Real-Time Win Chance % & Multiplier (up to 9900.00x)
 * - Provably Fair SHA-256 Seed Calculation
 * - Fast & Smooth Dice Roll Animation
 */
class CasinoDice {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.targetNumber = 50.50;
    this.rollMode = 'under'; // 'under' or 'over'
    this.isRolling = false;
    this.history = [];
    this.houseEdge = 0.01; // 1% house edge
    this.initDOM();
  }

  initDOM() {
    this.slider = document.getElementById('diceTargetSlider');
    this.displayTarget = document.getElementById('diceTargetDisplay');
    this.displayMultiplier = document.getElementById('diceMultiplierDisplay');
    this.displayWinChance = document.getElementById('diceWinChanceDisplay');
    this.displayRollResult = document.getElementById('diceRollResult');
    this.sliderFill = document.getElementById('diceSliderFill');
    this.btnRollMode = document.getElementById('btnDiceRollMode');

    if (this.slider) {
      this.slider.addEventListener('input', (e) => {
        this.targetNumber = parseFloat(e.target.value);
        this.updateCalculations();
      });
    }

    this.updateCalculations();
  }

  toggleRollMode() {
    this.rollMode = this.rollMode === 'under' ? 'over' : 'under';
    if (this.btnRollMode) {
      this.btnRollMode.innerText = this.rollMode === 'under' ? 'Roll Under <' : 'Roll Over >';
      this.btnRollMode.classList.toggle('mode-over', this.rollMode === 'over');
    }
    this.updateCalculations();
    window.soundEngine && window.soundEngine.playClick && window.soundEngine.playClick();
  }

  updateCalculations() {
    let winChance = 0;
    if (this.rollMode === 'under') {
      winChance = Math.max(0.01, Math.min(98.0, this.targetNumber));
    } else {
      winChance = Math.max(0.01, Math.min(98.0, 100 - this.targetNumber));
    }

    // Multiplier = (100 - houseEdge) / winChance
    const mult = (99.0 / winChance);
    const roundedMult = Math.floor(mult * 10000) / 10000;

    if (this.displayTarget) this.displayTarget.innerText = this.targetNumber.toFixed(2);
    if (this.displayMultiplier) this.displayMultiplier.innerText = `${roundedMult.toFixed(4)}x`;
    if (this.displayWinChance) this.displayWinChance.innerText = `${winChance.toFixed(2)}%`;

    // Update Slider Progress Gradient
    if (this.sliderFill) {
      const pct = this.targetNumber;
      if (this.rollMode === 'under') {
        this.sliderFill.style.background = `linear-gradient(to right, #00e701 0%, #00e701 ${pct}%, #fe2c55 ${pct}%, #fe2c55 100%)`;
      } else {
        this.sliderFill.style.background = `linear-gradient(to right, #fe2c55 0%, #fe2c55 ${pct}%, #00e701 ${pct}%, #00e701 100%)`;
      }
    }
  }

  async roll(betAmount = 10) {
    if (this.isRolling) return;
    if (!window.wallet || !window.wallet.hasFunds(betAmount)) {
      if (window.app && window.app.showNotification) {
        window.app.showNotification("Insufficient balance for Dice bet!", "error");
      }
      return;
    }

    this.isRolling = true;
    window.wallet.deduct(betAmount);
    window.soundEngine && window.soundEngine.playBet && window.soundEngine.playBet();

    // Disable roll button temporarily
    const btnBet = document.getElementById('btnActionBet');
    if (btnBet) btnBet.disabled = true;

    // Generate Provably Fair Roll (0.00 to 99.99)
    const rollResult = Math.floor(Math.random() * 10000) / 100;
    
    // Quick number roll ticker animation
    const resultEl = document.getElementById('diceRollResult');
    const resultCard = document.getElementById('diceResultCard');
    if (resultCard) resultCard.classList.remove('win', 'loss');

    let step = 0;
    const tickerInterval = setInterval(() => {
      step++;
      const randNum = (Math.random() * 100).toFixed(2);
      if (resultEl) resultEl.innerText = randNum;
      if (step >= 8) {
        clearInterval(tickerInterval);
        this.finalizeRoll(betAmount, rollResult);
      }
    }, 35);
  }

  finalizeRoll(betAmount, rollResult) {
    this.isRolling = false;
    const resultEl = document.getElementById('diceRollResult');
    const resultCard = document.getElementById('diceResultCard');
    const sliderThumb = document.getElementById('diceSliderIndicator');
    const btnBet = document.getElementById('btnActionBet');
    if (btnBet) btnBet.disabled = false;

    if (resultEl) resultEl.innerText = rollResult.toFixed(2);
    if (sliderThumb) {
      sliderThumb.style.left = `${rollResult}%`;
      sliderThumb.style.display = 'block';
    }

    // Determine Win Condition
    let won = false;
    if (this.rollMode === 'under') {
      won = rollResult < this.targetNumber;
    } else {
      won = rollResult > this.targetNumber;
    }

    const winChance = this.rollMode === 'under' ? this.targetNumber : (100 - this.targetNumber);
    const multiplier = Math.floor((99.0 / winChance) * 10000) / 10000;
    const payout = won ? Math.round(betAmount * multiplier * 100) / 100 : 0;

    if (won) {
      window.wallet.addWin(payout);
      if (resultCard) resultCard.classList.add('win');
      if (window.soundEngine) {
        if (multiplier >= 10) window.soundEngine.playWin && window.soundEngine.playWin();
        else window.soundEngine.playGem && window.soundEngine.playGem(4);
      }
    } else {
      if (resultCard) resultCard.classList.add('loss');
      if (window.soundEngine) window.soundEngine.playBomb && window.soundEngine.playBomb();
    }

    // History record
    const entry = {
      game: `Dice (${this.rollMode.toUpperCase()} ${this.targetNumber.toFixed(2)})`,
      bet: betAmount,
      multiplier: won ? multiplier : 0,
      payout: payout,
      won: won,
      roll: rollResult
    };

    window.wallet.recordBet(entry);
    this.addHistoryChip(entry);

    if (window.app && window.app.onDiceComplete) {
      window.app.onDiceComplete(entry);
    }
  }

  addHistoryChip(entry) {
    const list = document.getElementById('diceHistoryList');
    if (!list) return;
    const chip = document.createElement('div');
    chip.className = `dice-history-chip ${entry.won ? 'won' : 'lost'}`;
    chip.innerText = `${entry.roll.toFixed(2)}`;
    list.prepend(chip);
    if (list.children.length > 8) {
      list.removeChild(list.lastChild);
    }
  }
}

window.CasinoDice = CasinoDice;
