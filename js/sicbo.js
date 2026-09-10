/**
 * VIEWPOINT Casino - Live Super Sic Bo
 * Authentic Live 3-Dice Glass Dome with Lightning Multipliers
 */

(function(window) {
  'use strict';

  class SicBoGame {
    constructor(options = {}) {
      this.options = options;
      this.selectedChip = 10;
      this.bets = {};
      this.totalBet = 0;
      this.dice = [1, 2, 3];
      this.gameState = 'betting'; // 'betting' | 'shaking' | 'settled'
      this.history = [];
      this.multipliers = {};
      this.roundId = this.generateRoundId();

      this.initDom();
      this.bindEvents();
    }

    generateRoundId() {
      const d = new Date();
      return 'SB-' + d.getFullYear().toString().slice(-2) +
        String(d.getMonth() + 1).padStart(2, '0') +
        String(d.getDate()).padStart(2, '0') + '-' +
        Math.floor(1000 + Math.random() * 9000);
    }

    initDom() {
      this.dom = {
        roundIdTag: document.getElementById('sbRoundIdTag'),
        statusText: document.getElementById('sbStatusText'),
        diceDome: document.getElementById('sbDiceDome'),
        die1: document.getElementById('sbDie1'),
        die2: document.getElementById('sbDie2'),
        die3: document.getElementById('sbDie3'),
        diceTotal: document.getElementById('sbDiceTotal'),
        btnRoll: document.getElementById('btnSbRoll'),
        btnClear: document.getElementById('btnSbClear'),
        btnDouble: document.getElementById('btnSbDouble'),
        historyRow: document.getElementById('sbHistoryRow'),
        winBanner: document.getElementById('sbWinBanner')
      };
      if (this.dom.roundIdTag) this.dom.roundIdTag.innerText = this.roundId;
    }

    bindEvents() {
      if (this.dom.btnRoll) {
        this.dom.btnRoll.addEventListener('click', () => this.rollDice());
      }
      if (this.dom.btnClear) {
        this.dom.btnClear.addEventListener('click', () => this.clearBets());
      }
      if (this.dom.btnDouble) {
        this.dom.btnDouble.addEventListener('click', () => this.doubleBets());
      }
    }

    setChip(amt) {
      this.selectedChip = amt;
      document.querySelectorAll('.sb-chip-btn').forEach(b => {
        b.classList.toggle('active', parseFloat(b.getAttribute('data-amount')) === amt);
      });
      if (window.soundEngine && window.soundEngine.playChip) window.soundEngine.playChip();
    }

    placeBet(spot) {
      if (this.gameState !== 'betting') return;

      const amt = this.selectedChip || 10;
      if (window.wallet && !window.wallet.hasSufficientBalance(this.totalBet + amt)) {
        if (window.app && window.app.showNotification) window.app.showNotification("Insufficient balance!", "error");
        return;
      }

      this.bets[spot] = (this.bets[spot] || 0) + amt;
      this.totalBet += amt;
      this.updateChipsDisplay();
      if (window.soundEngine && window.soundEngine.playChip) window.soundEngine.playChip();
    }

    clearBets() {
      if (this.gameState !== 'betting') return;
      this.bets = {};
      this.totalBet = 0;
      this.updateChipsDisplay();
    }

    doubleBets() {
      if (this.gameState !== 'betting' || this.totalBet === 0) return;
      if (window.wallet && !window.wallet.hasSufficientBalance(this.totalBet * 2)) {
        if (window.app && window.app.showNotification) window.app.showNotification("Insufficient balance to double!", "error");
        return;
      }
      for (const k in this.bets) {
        this.bets[k] *= 2;
      }
      this.totalBet *= 2;
      this.updateChipsDisplay();
      if (window.soundEngine && window.soundEngine.playChip) window.soundEngine.playChip();
    }

    updateChipsDisplay() {
      document.querySelectorAll('.sb-bet-spot').forEach(spotEl => {
        const spot = spotEl.getAttribute('data-spot');
        const amt = this.bets[spot] || 0;
        const badge = spotEl.querySelector('.sb-chip-badge');
        if (badge) {
          badge.style.display = amt > 0 ? 'inline-flex' : 'none';
          badge.innerText = `₹${amt}`;
        }
        spotEl.classList.toggle('has-bet', amt > 0);
      });

      if (this.dom.btnRoll) {
        this.dom.btnRoll.disabled = (this.totalBet === 0);
      }
    }

    rollDice() {
      if (this.gameState !== 'betting' || this.totalBet === 0) return;

      if (window.wallet && !window.wallet.hasSufficientBalance(this.totalBet)) {
        if (window.app && window.app.showNotification) window.app.showNotification("Insufficient balance!", "error");
        return;
      }
      if (window.wallet) window.wallet.deductBalance(this.totalBet, 'Super Sic Bo Bet');

      this.gameState = 'shaking';
      this.roundId = this.generateRoundId();
      if (this.dom.roundIdTag) this.dom.roundIdTag.innerText = this.roundId;

      if (this.dom.winBanner) this.dom.winBanner.style.display = 'none';
      if (this.dom.statusText) {
        this.dom.statusText.innerText = "⚡ LIGHTNING MULTIPLIERS APPLIED... SHAKING DOME!";
        this.dom.statusText.style.color = '#fbbf24';
      }

      // Generate random lightning multipliers
      this.generateLightningMultipliers();

      if (this.dom.diceDome) this.dom.diceDome.classList.add('shaking');
      if (window.soundEngine && window.soundEngine.playDiceRoll) window.soundEngine.playDiceRoll();

      // Shake animation
      let shakes = 0;
      const shakeInterval = setInterval(() => {
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        const d3 = Math.floor(Math.random() * 6) + 1;
        this.renderDice(d1, d2, d3, false);
        shakes++;
        if (shakes > 14) {
          clearInterval(shakeInterval);
          this.finalizeRoll();
        }
      }, 90);
    }

    generateLightningMultipliers() {
      this.multipliers = {};
      const spots = ['any_triple', 'triple_6', 'sum_4', 'sum_17', 'double_5', 'double_6'];
      spots.forEach(spot => {
        if (Math.random() < 0.45) {
          const mults = [10, 25, 50, 88, 100, 250, 500];
          this.multipliers[spot] = mults[Math.floor(Math.random() * mults.length)];
        }
      });

      document.querySelectorAll('.sb-lightning-badge').forEach(b => {
        const spot = b.getAttribute('data-spot');
        if (this.multipliers[spot]) {
          b.innerText = `⚡ ${this.multipliers[spot]}x`;
          b.style.display = 'inline-flex';
        } else {
          b.style.display = 'none';
        }
      });
    }

    finalizeRoll() {
      if (this.dom.diceDome) this.dom.diceDome.classList.remove('shaking');

      // Settled dice values
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      const d3 = Math.floor(Math.random() * 6) + 1;
      this.dice = [d1, d2, d3];
      this.renderDice(d1, d2, d3, true);

      this.settleRound();
    }

    renderDice(d1, d2, d3, showTotal) {
      const pipsMap = {
        1: '⚀', 2: '⚁', 3: '⚂', 4: '⚃', 5: '⚄', 6: '⚅'
      };
      if (this.dom.die1) this.dom.die1.innerText = pipsMap[d1] || d1;
      if (this.dom.die2) this.dom.die2.innerText = pipsMap[d2] || d2;
      if (this.dom.die3) this.dom.die3.innerText = pipsMap[d3] || d3;

      const sum = d1 + d2 + d3;
      if (this.dom.diceTotal && showTotal) {
        this.dom.diceTotal.innerText = `TOTAL: ${sum} (${sum <= 10 ? 'SMALL' : 'BIG'})`;
      }
    }

    settleRound() {
      this.gameState = 'settled';
      const [d1, d2, d3] = this.dice;
      const sum = d1 + d2 + d3;
      const isTriple = (d1 === d2 && d2 === d3);
      const isSmall = (sum >= 4 && sum <= 10 && !isTriple);
      const isBig = (sum >= 11 && sum <= 17 && !isTriple);
      const isOdd = (sum % 2 !== 0 && !isTriple);
      const isEven = (sum % 2 === 0 && !isTriple);

      let totalWin = 0;

      // Check Small / Big (1:1)
      if (isSmall && this.bets['small']) totalWin += this.bets['small'] * 2;
      if (isBig && this.bets['big']) totalWin += this.bets['big'] * 2;

      // Odd / Even (1:1)
      if (isOdd && this.bets['odd']) totalWin += this.bets['odd'] * 2;
      if (isEven && this.bets['even']) totalWin += this.bets['even'] * 2;

      // Specific Sum
      const sumSpot = `sum_${sum}`;
      if (this.bets[sumSpot]) {
        let defaultMult = 6;
        if (sum === 4 || sum === 17) defaultMult = 50;
        else if (sum === 5 || sum === 16) defaultMult = 30;
        else if (sum === 6 || sum === 15) defaultMult = 18;
        else if (sum === 7 || sum === 14) defaultMult = 12;
        else if (sum === 8 || sum === 13) defaultMult = 8;
        else if (sum === 9 || sum === 10 || sum === 11 || sum === 12) defaultMult = 6;

        const effectiveMult = this.multipliers[sumSpot] || defaultMult;
        totalWin += this.bets[sumSpot] * (effectiveMult + 1);
      }

      // Any Triple
      if (isTriple && this.bets['any_triple']) {
        const mult = this.multipliers['any_triple'] || 30;
        totalWin += this.bets['any_triple'] * (mult + 1);
      }

      // Specific Triple
      if (isTriple && this.bets[`triple_${d1}`]) {
        const spot = `triple_${d1}`;
        const mult = this.multipliers[spot] || 180;
        totalWin += this.bets[spot] * (mult + 1);
      }

      totalWin = Math.floor(totalWin * 100) / 100;

      const title = totalWin > 0 ? `DICE SETTLED: ${sum} — YOU WON! 🎉` : `DICE SETTLED: ${sum} — NO WIN 💔`;
      const color = totalWin > 0 ? '#10b981' : '#ef4444';

      if (this.dom.statusText) {
        this.dom.statusText.innerText = title;
        this.dom.statusText.style.color = color;
      }

      if (totalWin > 0 && window.wallet) {
        window.wallet.addBalance(totalWin, 'Super Sic Bo Payout');
        if (window.soundEngine && window.soundEngine.playWin) window.soundEngine.playWin();
      } else {
        if (window.soundEngine && window.soundEngine.playLose) window.soundEngine.playLose();
      }

      if (this.dom.winBanner) {
        this.dom.winBanner.style.display = 'block';
        this.dom.winBanner.innerHTML = `<span style="color: ${color}; font-weight: 800;">${title}</span> ${totalWin > 0 ? `+₹${totalWin.toFixed(2)}` : ''}`;
      }

      // Add to history road
      this.addHistoryBadge(sum, isSmall ? 'S' : (isBig ? 'B' : 'T'), isSmall ? '#3b82f6' : '#ef4444');

      setTimeout(() => {
        this.gameState = 'betting';
        this.clearBets();
      }, 2000);
    }

    addHistoryBadge(sum, tag, bg) {
      this.history.unshift({ sum, tag, bg });
      if (this.history.length > 20) this.history.pop();

      if (this.dom.historyRow) {
        this.dom.historyRow.innerHTML = this.history.map(h => 
          `<span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:6px;background:${h.bg};color:#fff;font-size:11px;font-weight:900;" title="Sum: ${h.sum}">${h.sum}</span>`
        ).join('');
      }
    }
  }

  window.SicBoGame = SicBoGame;
})(window);
