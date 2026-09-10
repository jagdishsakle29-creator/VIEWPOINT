/**
 * VIEWPOINT Casino - Live Teen Patti Studio
 * Authentic 3-Card Indian Live Poker with Ante, Play, and Pair Plus Bonus
 */

(function(window) {
  'use strict';

  class TeenPattiGame {
    constructor(options = {}) {
      this.options = options;
      this.selectedChip = 10;
      this.anteBet = 10;
      this.pairPlusBet = 0;
      this.gameState = 'betting'; // 'betting' | 'player_decision' | 'settled'
      this.playerHand = [];
      this.dealerHand = [];
      this.history = [];
      this.roundId = this.generateRoundId();

      this.suits = ['♠', '♥', '♦', '♣'];
      this.ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

      this.initDom();
      this.bindEvents();
    }

    generateRoundId() {
      const d = new Date();
      return 'TP-' + d.getFullYear().toString().slice(-2) +
        String(d.getMonth() + 1).padStart(2, '0') +
        String(d.getDate()).padStart(2, '0') + '-' +
        Math.floor(1000 + Math.random() * 9000);
    }

    initDom() {
      this.dom = {
        roundIdTag: document.getElementById('tpRoundIdTag'),
        statusText: document.getElementById('tpStatusText'),
        dealerCards: document.getElementById('tpDealerCards'),
        playerCards: document.getElementById('tpPlayerCards'),
        playerRankText: document.getElementById('tpPlayerRankText'),
        dealerRankText: document.getElementById('tpDealerRankText'),
        anteInput: document.getElementById('tpAnteInput'),
        pairPlusInput: document.getElementById('tpPairPlusInput'),
        btnDeal: document.getElementById('btnTpDeal'),
        btnPlay: document.getElementById('btnTpPlay'),
        btnFold: document.getElementById('btnTpFold'),
        bettingControls: document.getElementById('tpBettingControls'),
        decisionControls: document.getElementById('tpDecisionControls'),
        historyRow: document.getElementById('tpHistoryRow'),
        winBanner: document.getElementById('tpWinBanner')
      };
      if (this.dom.roundIdTag) this.dom.roundIdTag.innerText = this.roundId;
    }

    bindEvents() {
      if (this.dom.btnDeal) {
        this.dom.btnDeal.addEventListener('click', () => this.startDeal());
      }
      if (this.dom.btnPlay) {
        this.dom.btnPlay.addEventListener('click', () => this.playHand());
      }
      if (this.dom.btnFold) {
        this.dom.btnFold.addEventListener('click', () => this.foldHand());
      }
    }

    setChip(amt) {
      this.selectedChip = amt;
      if (this.dom.anteInput) this.dom.anteInput.value = amt;
      document.querySelectorAll('.tp-chip-btn').forEach(b => {
        b.classList.toggle('active', parseFloat(b.getAttribute('data-amount')) === amt);
      });
      if (window.soundEngine && window.soundEngine.playChip) window.soundEngine.playChip();
    }

    drawCard() {
      const suit = this.suits[Math.floor(Math.random() * this.suits.length)];
      const rank = this.ranks[Math.floor(Math.random() * this.ranks.length)];
      const isRed = (suit === '♥' || suit === '♦');
      const val = this.ranks.indexOf(rank) + 2;
      return { suit, rank, val, isRed, hidden: false };
    }

    evaluate3CardHand(hand) {
      const vals = hand.map(c => c.val).sort((a, b) => a - b);
      const isFlush = (hand[0].suit === hand[1].suit && hand[1].suit === hand[2].suit);
      const isStraight = (vals[2] - vals[1] === 1 && vals[1] - vals[0] === 1) ||
                         (vals[0] === 2 && vals[1] === 3 && vals[2] === 14); // A-2-3

      const isTrail = (vals[0] === vals[1] && vals[1] === vals[2]);
      const isPair = (vals[0] === vals[1] || vals[1] === vals[2] || vals[0] === vals[2]);

      let score = 0;
      let name = "High Card";

      if (isTrail) {
        score = 6000000 + vals[0];
        name = "Trail (Trio) 🔥";
      } else if (isFlush && isStraight) {
        score = 5000000 + vals[2];
        name = "Pure Sequence ⚡";
      } else if (isStraight) {
        score = 4000000 + vals[2];
        name = "Sequence (Straight) 🎯";
      } else if (isFlush) {
        score = 3000000 + vals[2];
        name = "Color (Flush) 🎨";
      } else if (isPair) {
        const pairVal = (vals[0] === vals[1]) ? vals[0] : vals[1];
        const kicker = (vals[0] === vals[1]) ? vals[2] : vals[0];
        score = 2000000 + pairVal * 100 + kicker;
        name = "Pair 🃏";
      } else {
        score = 1000000 + vals[2] * 400 + vals[1] * 20 + vals[0];
        name = `${hand.slice().sort((a,b)=>b.val-a.val)[0].rank} High`;
      }

      return { score, name, isPair, isFlush, isStraight, isTrail, highCard: vals[2] };
    }

    startDeal() {
      if (this.gameState === 'player_decision') return;

      const ante = parseFloat(this.dom.anteInput ? this.dom.anteInput.value : 10) || 10;
      const pairPlus = parseFloat(this.dom.pairPlusInput ? this.dom.pairPlusInput.value : 0) || 0;
      const totalRequired = ante + pairPlus;

      if (window.wallet && !window.wallet.hasSufficientBalance(totalRequired)) {
        if (window.app && window.app.showNotification) window.app.showNotification("Insufficient balance!", "error");
        return;
      }

      if (window.wallet) window.wallet.deductBalance(totalRequired, 'Teen Patti Ante & Bonus');
      this.anteBet = ante;
      this.pairPlusBet = pairPlus;
      this.gameState = 'player_decision';
      this.roundId = this.generateRoundId();
      if (this.dom.roundIdTag) this.dom.roundIdTag.innerText = this.roundId;

      if (this.dom.winBanner) this.dom.winBanner.style.display = 'none';
      if (this.dom.statusText) {
        this.dom.statusText.innerText = "PLAY (CALL) OR FOLD?";
        this.dom.statusText.style.color = '#fbbf24';
      }

      this.playerHand = [this.drawCard(), this.drawCard(), this.drawCard()];
      this.dealerHand = [
        { ...this.drawCard(), hidden: true },
        { ...this.drawCard(), hidden: true },
        { ...this.drawCard(), hidden: true }
      ];

      if (window.soundEngine && window.soundEngine.playDealCard) window.soundEngine.playDealCard();

      this.renderCards(true);
      const evalP = this.evaluate3CardHand(this.playerHand);
      if (this.dom.playerRankText) this.dom.playerRankText.innerText = evalP.name;
      if (this.dom.dealerRankText) this.dom.dealerRankText.innerText = "Hidden (3 Cards)";

      if (this.dom.bettingControls) this.dom.bettingControls.style.display = 'none';
      if (this.dom.decisionControls) this.dom.decisionControls.style.display = 'flex';
    }

    foldHand() {
      if (this.gameState !== 'player_decision') return;
      this.gameState = 'settled';

      this.revealDealerCards();
      if (this.dom.statusText) {
        this.dom.statusText.innerText = "FOLDED - DEALER WINS";
        this.dom.statusText.style.color = '#ef4444';
      }
      if (window.soundEngine && window.soundEngine.playLose) window.soundEngine.playLose();

      this.addHistoryBadge('F', '#ef4444');
      setTimeout(() => this.resetControls(), 1500);
    }

    playHand() {
      if (this.gameState !== 'player_decision') return;

      const playBet = this.anteBet;
      if (window.wallet && !window.wallet.hasSufficientBalance(playBet)) {
        if (window.app && window.app.showNotification) window.app.showNotification("Insufficient balance for Play bet!", "error");
        return;
      }
      if (window.wallet) window.wallet.deductBalance(playBet, 'Teen Patti Play Bet');

      this.gameState = 'settled';
      this.revealDealerCards();

      const evalP = this.evaluate3CardHand(this.playerHand);
      const evalD = this.evaluate3CardHand(this.dealerHand);

      if (this.dom.playerRankText) this.dom.playerRankText.innerText = evalP.name;
      if (this.dom.dealerRankText) this.dom.dealerRankText.innerText = evalD.name;

      // Dealer qualifies with Queen high (val >= 12)
      const dealerQualifies = (evalD.score >= 2000000 || evalD.highCard >= 12);

      let totalWin = 0;
      let title = "";
      let color = "#ef4444";

      // Pair Plus bonus resolution
      if (this.pairPlusBet > 0) {
        if (evalP.isTrail) totalWin += this.pairPlusBet * 31; // 30:1 + stake
        else if (evalP.isFlush && evalP.isStraight) totalWin += this.pairPlusBet * 21; // 20:1 + stake
        else if (evalP.isStraight) totalWin += this.pairPlusBet * 7; // 6:1 + stake
        else if (evalP.isFlush) totalWin += this.pairPlusBet * 4; // 3:1 + stake
        else if (evalP.isPair) totalWin += this.pairPlusBet * 2; // 1:1 + stake
      }

      if (!dealerQualifies) {
        // Dealer doesn't qualify: Ante pays 1:1, Play pushes
        totalWin += this.anteBet * 2;
        totalWin += playBet;
        title = `DEALER DOES NOT QUALIFY - YOU WIN! 🎉`;
        color = "#10b981";
      } else if (evalP.score > evalD.score) {
        // Player beats dealer
        totalWin += this.anteBet * 2;
        totalWin += playBet * 2;
        title = `YOU WIN! (${evalP.name} vs ${evalD.name}) 🎉`;
        color = "#10b981";
      } else if (evalP.score === evalD.score) {
        // Tie
        totalWin += this.anteBet + playBet;
        title = "TIE HAND (BETS REFUNDED) 🤝";
        color = "#fbbf24";
      } else {
        title = `DEALER WINS (${evalD.name}) 💔`;
        color = "#ef4444";
      }

      totalWin = Math.floor(totalWin * 100) / 100;

      if (totalWin > 0 && window.wallet) {
        window.wallet.addBalance(totalWin, 'Teen Patti Win');
        if (window.soundEngine && window.soundEngine.playWin) window.soundEngine.playWin();
      } else {
        if (window.soundEngine && window.soundEngine.playLose) window.soundEngine.playLose();
      }

      if (this.dom.statusText) {
        this.dom.statusText.innerText = title;
        this.dom.statusText.style.color = color;
      }

      if (this.dom.winBanner) {
        this.dom.winBanner.style.display = 'block';
        this.dom.winBanner.innerHTML = `<span style="color: ${color}; font-weight: 800;">${title}</span> ${totalWin > 0 ? `+₹${totalWin.toFixed(2)}` : ''}`;
      }

      this.addHistoryBadge(totalWin > (this.anteBet * 2) ? 'W' : (totalWin > 0 ? 'P' : 'L'), color);
      setTimeout(() => this.resetControls(), 2000);
    }

    revealDealerCards() {
      this.dealerHand.forEach(c => c.hidden = false);
      this.renderCards(false);
    }

    resetControls() {
      if (this.dom.decisionControls) this.dom.decisionControls.style.display = 'none';
      if (this.dom.bettingControls) this.dom.bettingControls.style.display = 'flex';
      this.gameState = 'betting';
    }

    addHistoryBadge(label, bg) {
      this.history.unshift({ label, bg });
      if (this.history.length > 16) this.history.pop();
      if (this.dom.historyRow) {
        this.dom.historyRow.innerHTML = this.history.map(h => 
          `<span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:${h.bg};color:#fff;font-size:10px;font-weight:800;">${h.label}</span>`
        ).join('');
      }
    }

    renderCards(hideDealer) {
      if (this.dom.playerCards) {
        this.dom.playerCards.innerHTML = this.playerHand.map(c => this.renderCardHtml(c, false)).join('');
      }
      if (this.dom.dealerCards) {
        this.dom.dealerCards.innerHTML = this.dealerHand.map(c => this.renderCardHtml(c, hideDealer && c.hidden)).join('');
      }
    }

    renderCardHtml(card, isHidden) {
      if (isHidden) {
        return `<div class="bj-card bj-card-back">
          <div class="bj-card-inner-pattern">👑</div>
        </div>`;
      }
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

  window.TeenPattiGame = TeenPattiGame;
})(window);
