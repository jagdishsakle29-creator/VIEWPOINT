/**
 * VIEWPOINT Casino - Live 7 Up 7 Down Studio
 * Authentic Dual Dice Live Table with 2x and 5x Payouts
 */

(function(window) {
  'use strict';

  class SevenUpGame {
    constructor(options = {}) {
      this.options = options;
      this.selectedChip = 10;
      this.bets = { down: 0, seven: 0, up: 0 };
      this.totalBet = 0;
      this.isRolling = false;
      this.dice = [1, 6];
      this.history = [];
      this.roundId = this.generateRoundId();

      this.initDom();
      this.bindEvents();
    }

    generateRoundId() {
      const d = new Date();
      return '7U-' + d.getFullYear().toString().slice(-2) +
        String(d.getMonth() + 1).padStart(2, '0') +
        String(d.getDate()).padStart(2, '0') + '-' +
        Math.floor(1000 + Math.random() * 9000);
    }

    initDom() {
      this.dom = {
        roundIdTag: document.getElementById('suRoundIdTag'),
        statusText: document.getElementById('suStatusText'),
        die1: document.getElementById('suDie1'),
        die2: document.getElementById('suDie2'),
        diceTotal: document.getElementById('suDiceTotal'),
        btnRoll: document.getElementById('btnSuRoll'),
        btnClear: document.getElementById('btnSuClear'),
        btnDouble: document.getElementById('btnSuDouble'),
        historyRow: document.getElementById('suHistoryRow'),
        winBanner: document.getElementById('suWinBanner')
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
      document.querySelectorAll('.su-chip-btn').forEach(b => {
        b.classList.toggle('active', parseFloat(b.getAttribute('data-amount')) === amt);
      });
      if (window.soundEngine && window.soundEngine.playChip) window.soundEngine.playChip();
    }

    placeBet(spot) {
      if (this.isRolling) return;

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
      if (this.isRolling) return;
      this.bets = { down: 0, seven: 0, up: 0 };
      this.totalBet = 0;
      this.updateChipsDisplay();
    }

    doubleBets() {
      if (this.isRolling || this.totalBet === 0) return;
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
      ['down', 'seven', 'up'].forEach(spot => {
        const badge = document.getElementById(`suChipBadge_${spot}`);
        const spotEl = document.getElementById(`suBetSpot_${spot}`);
        const amt = this.bets[spot] || 0;
        if (badge) {
          badge.style.display = amt > 0 ? 'inline-flex' : 'none';
          badge.innerText = `₹${amt}`;
        }
        if (spotEl) {
          spotEl.classList.toggle('has-bet', amt > 0);
        }
      });
      if (this.dom.btnRoll) {
        this.dom.btnRoll.disabled = (this.totalBet === 0);
      }
    }

    rollDice() {
      if (this.isRolling || this.totalBet === 0) return;

      if (window.wallet && !window.wallet.hasSufficientBalance(this.totalBet)) {
        if (window.app && window.app.showNotification) window.app.showNotification("Insufficient balance!", "error");
        return;
      }
      if (window.wallet) window.wallet.deductBalance(this.totalBet, '7 Up 7 Down Bet');

      this.isRolling = true;
      this.roundId = this.generateRoundId();
      if (this.dom.roundIdTag) this.dom.roundIdTag.innerText = this.roundId;

      if (this.dom.winBanner) this.dom.winBanner.style.display = 'none';
      if (this.dom.statusText) {
        this.dom.statusText.innerText = "ROLLING LIVE DICE...";
        this.dom.statusText.style.color = '#fbbf24';
      }

      if (window.soundEngine && window.soundEngine.playDiceRoll) window.soundEngine.playDiceRoll();

      let ticks = 0;
      const interval = setInterval(() => {
        const r1 = Math.floor(Math.random() * 6) + 1;
        const r2 = Math.floor(Math.random() * 6) + 1;
        this.renderDice(r1, r2, false);
        ticks++;
        if (ticks > 12) {
          clearInterval(interval);
          this.finalizeRoll();
        }
      }, 90);
    }

    finalizeRoll() {
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      this.dice = [d1, d2];
      this.renderDice(d1, d2, true);
      this.settleRound();
    }

    renderDice(d1, d2, showTotal) {
      const pipsMap = { 1: '⚀', 2: '⚁', 3: '⚂', 4: '⚃', 5: '⚄', 6: '⚅' };
      if (this.dom.die1) this.dom.die1.innerText = pipsMap[d1] || d1;
      if (this.dom.die2) this.dom.die2.innerText = pipsMap[d2] || d2;

      const sum = d1 + d2;
      if (this.dom.diceTotal && showTotal) {
        let tag = "LUCKY 7 ✨";
        if (sum < 7) tag = "7 DOWN 🔵";
        else if (sum > 7) tag = "7 UP 🔴";
        this.dom.diceTotal.innerText = `SUM: ${sum} — ${tag}`;
      }
    }

    settleRound() {
      this.isRolling = false;
      const [d1, d2] = this.dice;
      const sum = d1 + d2;

      let winningSpot = 'seven';
      let multiplier = 5.0; // 5x on Lucky 7
      let tag = '7';
      let bg = '#fbbf24';

      if (sum < 7) {
        winningSpot = 'down';
        multiplier = 2.0; // 2x on 7 Down
        tag = '<7';
        bg = '#3b82f6';
      } else if (sum > 7) {
        winningSpot = 'up';
        multiplier = 2.0; // 2x on 7 Up
        tag = '>7';
        bg = '#ef4444';
      }

      const betOnWinner = this.bets[winningSpot] || 0;
      const totalWin = Math.floor(betOnWinner * multiplier * 100) / 100;

      const title = totalWin > 0 ? `DICE SUM ${sum} — YOU WON! 🎉` : `DICE SUM ${sum} 💔`;
      const color = totalWin > 0 ? '#10b981' : '#ef4444';

      if (this.dom.statusText) {
        this.dom.statusText.innerText = title;
        this.dom.statusText.style.color = color;
      }

      if (totalWin > 0 && window.wallet) {
        window.wallet.addBalance(totalWin, '7 Up 7 Down Payout');
        if (window.soundEngine && window.soundEngine.playWin) window.soundEngine.playWin();
      } else {
        if (window.soundEngine && window.soundEngine.playLose) window.soundEngine.playLose();
      }

      if (this.dom.winBanner) {
        this.dom.winBanner.style.display = 'block';
        this.dom.winBanner.innerHTML = `<span style="color: ${color}; font-weight: 800;">${title}</span> ${totalWin > 0 ? `+₹${totalWin.toFixed(2)}` : ''}`;
      }

      this.addHistoryBadge(sum, tag, bg);

      setTimeout(() => {
        this.clearBets();
      }, 2000);
    }

    addHistoryBadge(sum, tag, bg) {
      this.history.unshift({ sum, tag, bg });
      if (this.history.length > 20) this.history.pop();

      if (this.dom.historyRow) {
        this.dom.historyRow.innerHTML = this.history.map(h => 
          `<span style="display:inline-flex;align-items:center;justify-content:center;padding:4px 8px;border-radius:6px;background:${h.bg};color:#fff;font-size:11px;font-weight:900;" title="Sum ${h.sum}">${h.tag} (${h.sum})</span>`
        ).join('');
      }
    }
  }

  window.SevenUpGame = SevenUpGame;
})(window);
