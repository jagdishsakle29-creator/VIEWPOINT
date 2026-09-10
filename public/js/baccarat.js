/**
 * VIEWPOINT Casino - Live Baccarat Studio
 * Authentic Stake-style live dealer baccarat with Player, Banker, Tie, Pairs & Bead Road
 */

(function(window) {
  'use strict';

  class BaccaratGame {
    constructor(options = {}) {
      this.options = options;
      this.selectedChip = 10;
      this.bets = { player: 0, banker: 0, tie: 0, playerPair: 0, bankerPair: 0 };
      this.totalBet = 0;
      this.gameState = 'betting'; // 'betting' | 'dealing' | 'settled'
      this.playerHand = [];
      this.bankerHand = [];
      this.history = [];
      this.roundId = this.generateRoundId();

      this.suits = ['♠', '♥', '♦', '♣'];
      this.ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

      this.initDom();
      this.bindEvents();
    }

    generateRoundId() {
      const d = new Date();
      return 'BAC-' + d.getFullYear().toString().slice(-2) +
        String(d.getMonth() + 1).padStart(2, '0') +
        String(d.getDate()).padStart(2, '0') + '-' +
        Math.floor(1000 + Math.random() * 9000);
    }

    initDom() {
      this.dom = {
        roundIdTag: document.getElementById('bacRoundIdTag'),
        statusText: document.getElementById('bacStatusText'),
        playerCards: document.getElementById('bacPlayerCards'),
        bankerCards: document.getElementById('bacBankerCards'),
        playerScore: document.getElementById('bacPlayerScore'),
        bankerScore: document.getElementById('bacBankerScore'),
        btnDeal: document.getElementById('btnBacDeal'),
        btnClear: document.getElementById('btnBacClear'),
        btnDouble: document.getElementById('btnBacDouble'),
        beadRoad: document.getElementById('bacBeadRoad'),
        winBanner: document.getElementById('bacWinBanner')
      };
      if (this.dom.roundIdTag) this.dom.roundIdTag.innerText = this.roundId;
    }

    bindEvents() {
      if (this.dom.btnDeal) {
        this.dom.btnDeal.addEventListener('click', () => this.startDeal());
      }
      if (this.dom.btnClear) {
        this.dom.btnClear.addEventListener('click', () => this.clearBets());
      }
      if (this.dom.btnDouble) {
        this.dom.btnDouble.addEventListener('click', () => this.doubleBets());
      }
    }

    drawCard() {
      const suit = this.suits[Math.floor(Math.random() * this.suits.length)];
      const rank = this.ranks[Math.floor(Math.random() * this.ranks.length)];
      const isRed = (suit === '♥' || suit === '♦');
      let val = 0;
      if (rank === 'A') val = 1;
      else if (['10', 'J', 'Q', 'K'].includes(rank)) val = 0;
      else val = parseInt(rank, 10);
      return { suit, rank, val, isRed };
    }

    calculateScore(hand) {
      const sum = hand.reduce((acc, c) => acc + c.val, 0);
      return sum % 10;
    }

    setChip(amt) {
      this.selectedChip = amt;
      document.querySelectorAll('.bac-chip-btn').forEach(b => {
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

      this.updateBetChipsDisplay();
      if (window.soundEngine && window.soundEngine.playChip) window.soundEngine.playChip();
    }

    clearBets() {
      if (this.gameState !== 'betting') return;
      this.bets = { player: 0, banker: 0, tie: 0, playerPair: 0, bankerPair: 0 };
      this.totalBet = 0;
      this.updateBetChipsDisplay();
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
      this.updateBetChipsDisplay();
      if (window.soundEngine && window.soundEngine.playChip) window.soundEngine.playChip();
    }

    updateBetChipsDisplay() {
      ['player', 'banker', 'tie', 'playerPair', 'bankerPair'].forEach(spot => {
        const badge = document.getElementById(`bacChipBadge_${spot}`);
        const spotEl = document.getElementById(`bacBetSpot_${spot}`);
        const amt = this.bets[spot] || 0;
        if (badge) {
          badge.style.display = amt > 0 ? 'inline-flex' : 'none';
          badge.innerText = `₹${amt}`;
        }
        if (spotEl) {
          spotEl.classList.toggle('has-bet', amt > 0);
        }
      });
      if (this.dom.btnDeal) {
        this.dom.btnDeal.disabled = (this.totalBet === 0);
      }
    }

    startDeal() {
      if (this.gameState !== 'betting' || this.totalBet === 0) return;

      if (window.wallet && !window.wallet.hasSufficientBalance(this.totalBet)) {
        if (window.app && window.app.showNotification) window.app.showNotification("Insufficient balance!", "error");
        return;
      }
      if (window.wallet) window.wallet.deductBalance(this.totalBet, 'Live Baccarat Bet');

      this.gameState = 'dealing';
      this.roundId = this.generateRoundId();
      if (this.dom.roundIdTag) this.dom.roundIdTag.innerText = this.roundId;

      if (this.dom.winBanner) this.dom.winBanner.style.display = 'none';
      if (this.dom.statusText) {
        this.dom.statusText.innerText = "DEALING CARDS...";
        this.dom.statusText.style.color = '#38bdf8';
      }

      this.playerHand = [];
      this.bankerHand = [];

      // Initial deal: Player 1, Banker 1, Player 2, Banker 2
      this.playerHand.push(this.drawCard());
      this.bankerHand.push(this.drawCard());
      this.playerHand.push(this.drawCard());
      this.bankerHand.push(this.drawCard());

      if (window.soundEngine && window.soundEngine.playDealCard) window.soundEngine.playDealCard();
      this.renderCards();

      // Check Naturals (8 or 9)
      const pScore = this.calculateScore(this.playerHand);
      const bScore = this.calculateScore(this.bankerHand);

      if (pScore >= 8 || bScore >= 8) {
        setTimeout(() => this.settleRound(), 1000);
        return;
      }

      // Standard Baccarat Third Card Rules
      let playerThirdCardVal = null;
      if (pScore <= 5) {
        const p3 = this.drawCard();
        this.playerHand.push(p3);
        playerThirdCardVal = p3.val;
      }

      // Banker third card rules
      let bankerDraws = false;
      if (playerThirdCardVal === null) {
        if (bScore <= 5) bankerDraws = true;
      } else {
        if (bScore <= 2) bankerDraws = true;
        else if (bScore === 3 && playerThirdCardVal !== 8) bankerDraws = true;
        else if (bScore === 4 && [2, 3, 4, 5, 6, 7].includes(playerThirdCardVal)) bankerDraws = true;
        else if (bScore === 5 && [4, 5, 6, 7].includes(playerThirdCardVal)) bankerDraws = true;
        else if (bScore === 6 && [6, 7].includes(playerThirdCardVal)) bankerDraws = true;
      }

      setTimeout(() => {
        if (bankerDraws) {
          this.bankerHand.push(this.drawCard());
          if (window.soundEngine && window.soundEngine.playDealCard) window.soundEngine.playDealCard();
        }
        this.renderCards();
        setTimeout(() => this.settleRound(), 900);
      }, 800);
    }

    settleRound() {
      this.gameState = 'settled';
      const pScore = this.calculateScore(this.playerHand);
      const bScore = this.calculateScore(this.bankerHand);

      let winner = 'tie';
      if (pScore > bScore) winner = 'player';
      else if (bScore > pScore) winner = 'banker';

      // Pair checks
      const isPlayerPair = (this.playerHand.length >= 2 && this.playerHand[0].rank === this.playerHand[1].rank);
      const isBankerPair = (this.bankerHand.length >= 2 && this.bankerHand[0].rank === this.bankerHand[1].rank);

      let totalWin = 0;

      // Payout calculations
      if (winner === 'player' && this.bets.player > 0) {
        totalWin += this.bets.player * 2; // 1:1
      }
      if (winner === 'banker' && this.bets.banker > 0) {
        totalWin += this.bets.banker * 1.95; // 0.95:1 (5% commission)
      }
      if (winner === 'tie') {
        if (this.bets.tie > 0) totalWin += this.bets.tie * 9; // 8:1 + stake
        // In tie, player and banker bets are returned
        totalWin += (this.bets.player || 0);
        totalWin += (this.bets.banker || 0);
      }
      if (isPlayerPair && this.bets.playerPair > 0) {
        totalWin += this.bets.playerPair * 12; // 11:1 + stake
      }
      if (isBankerPair && this.bets.bankerPair > 0) {
        totalWin += this.bets.bankerPair * 12; // 11:1 + stake
      }

      totalWin = Math.floor(totalWin * 100) / 100;

      let title = "";
      let color = "#ef4444";
      if (winner === 'player') {
        title = `PLAYER WINS (${pScore} vs ${bScore}) 🔵`;
        color = "#3b82f6";
      } else if (winner === 'banker') {
        title = `BANKER WINS (${bScore} vs ${pScore}) 🔴`;
        color = "#ef4444";
      } else {
        title = `TIE GAME (${pScore} - ${bScore}) 🟢`;
        color = "#10b981";
      }

      if (this.dom.statusText) {
        this.dom.statusText.innerText = title;
        this.dom.statusText.style.color = color;
      }

      if (totalWin > 0 && window.wallet) {
        window.wallet.addBalance(totalWin, 'Live Baccarat Payout');
        if (window.soundEngine && window.soundEngine.playWin) window.soundEngine.playWin();
      } else {
        if (window.soundEngine && window.soundEngine.playLose) window.soundEngine.playLose();
      }

      if (this.dom.winBanner) {
        this.dom.winBanner.style.display = 'block';
        this.dom.winBanner.innerHTML = `<span style="color: ${color}; font-weight: 800;">${title}</span> ${totalWin > 0 ? `+₹${totalWin.toFixed(2)}` : ''}`;
      }

      this.addBeadRoadEntry(winner, pScore, bScore);

      setTimeout(() => {
        this.gameState = 'betting';
        this.clearBets();
      }, 1800);
    }

    addBeadRoadEntry(winner, pScore, bScore) {
      const item = { winner, pScore, bScore };
      this.history.unshift(item);
      if (this.history.length > 24) this.history.pop();

      if (this.dom.beadRoad) {
        this.dom.beadRoad.innerHTML = this.history.map(h => {
          let bg = '#3b82f6';
          let letter = 'P';
          if (h.winner === 'banker') { bg = '#ef4444'; letter = 'B'; }
          else if (h.winner === 'tie') { bg = '#10b981'; letter = 'T'; }
          return `<span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:${bg};color:#fff;font-size:11px;font-weight:900;box-shadow:0 2px 6px rgba(0,0,0,0.4);" title="${h.winner.toUpperCase()} (${h.pScore}-${h.bScore})">${letter}</span>`;
        }).join('');
      }
    }

    renderCards() {
      if (this.dom.playerCards) {
        this.dom.playerCards.innerHTML = this.playerHand.map(card => this.renderCardHtml(card)).join('');
      }
      if (this.dom.bankerCards) {
        this.dom.bankerCards.innerHTML = this.bankerHand.map(card => this.renderCardHtml(card)).join('');
      }

      if (this.dom.playerScore) this.dom.playerScore.innerText = this.calculateScore(this.playerHand);
      if (this.dom.bankerScore) this.dom.bankerScore.innerText = this.calculateScore(this.bankerHand);
    }

    renderCardHtml(card) {
      const color = card.isRed ? '#ef4444' : '#f8fafc';
      return `<div class="bj-card" style="color: ${color};">
        <div class="bj-card-corner top-left">
          <span>${card.rank}</span>
          <span style="font-size: 11px;">${card.suit}</span>
        </div>
        <div class="bj-card-center-suit">${card.suit}</div>
        <div class="bj-card-corner bottom-right">
          <span>${card.rank}</span>
          <span style="font-size: 11px;">${card.suit}</span>
        </div>
      </div>`;
    }
  }

  window.BaccaratGame = BaccaratGame;
})(window);
