/**
 * VIEWPOINT Casino - Live Blackjack (Classic 21)
 * Authentic Stake-style live dealer blackjack table
 */

(function(window) {
  'use strict';

  class BlackjackGame {
    constructor(options = {}) {
      this.options = options;
      this.currentBet = 10;
      this.selectedChip = 10;
      this.gameState = 'betting'; // 'betting' | 'player_turn' | 'dealer_turn' | 'settled'
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
      return 'BJ-' + d.getFullYear().toString().slice(-2) +
        String(d.getMonth() + 1).padStart(2, '0') +
        String(d.getDate()).padStart(2, '0') + '-' +
        Math.floor(1000 + Math.random() * 9000);
    }

    initDom() {
      this.dom = {
        roundIdTag: document.getElementById('bjRoundIdTag'),
        statusText: document.getElementById('bjStatusText'),
        dealerCards: document.getElementById('bjDealerCards'),
        playerCards: document.getElementById('bjPlayerCards'),
        dealerScore: document.getElementById('bjDealerScore'),
        playerScore: document.getElementById('bjPlayerScore'),
        betAmountInput: document.getElementById('bjBetAmountInput'),
        btnDeal: document.getElementById('btnBjDeal'),
        btnHit: document.getElementById('btnBjHit'),
        btnStand: document.getElementById('btnBjStand'),
        btnDouble: document.getElementById('btnBjDouble'),
        actionControls: document.getElementById('bjActionControls'),
        bettingControls: document.getElementById('bjBettingControls'),
        historyRow: document.getElementById('bjHistoryRow'),
        winBanner: document.getElementById('bjWinBanner')
      };
      if (this.dom.roundIdTag) this.dom.roundIdTag.innerText = this.roundId;
    }

    bindEvents() {
      if (this.dom.btnDeal) {
        this.dom.btnDeal.addEventListener('click', () => this.startDeal());
      }
      if (this.dom.btnHit) {
        this.dom.btnHit.addEventListener('click', () => this.hit());
      }
      if (this.dom.btnStand) {
        this.dom.btnStand.addEventListener('click', () => this.stand());
      }
      if (this.dom.btnDouble) {
        this.dom.btnDouble.addEventListener('click', () => this.doubleDown());
      }
    }

    drawCard() {
      const suit = this.suits[Math.floor(Math.random() * this.suits.length)];
      const rank = this.ranks[Math.floor(Math.random() * this.ranks.length)];
      const isRed = (suit === '♥' || suit === '♦');
      return { suit, rank, isRed, hidden: false };
    }

    calculateScore(hand, hideDealerHole = false) {
      let score = 0;
      let aces = 0;

      for (let i = 0; i < hand.length; i++) {
        const card = hand[i];
        if (hideDealerHole && card.hidden) continue;

        if (card.rank === 'A') {
          aces++;
          score += 11;
        } else if (['K', 'Q', 'J', '10'].includes(card.rank)) {
          score += 10;
        } else {
          score += parseInt(card.rank, 10);
        }
      }

      while (score > 21 && aces > 0) {
        score -= 10;
        aces--;
      }

      return score;
    }

    setChip(amt) {
      this.selectedChip = amt;
      if (this.dom.betAmountInput) this.dom.betAmountInput.value = amt;
      document.querySelectorAll('.bj-chip-btn').forEach(b => {
        b.classList.toggle('active', parseFloat(b.getAttribute('data-amount')) === amt);
      });
      if (window.soundEngine && window.soundEngine.playChip) window.soundEngine.playChip();
    }

    startDeal() {
      if (this.gameState === 'player_turn' || this.gameState === 'dealer_turn') return;

      const amt = parseFloat(this.dom.betAmountInput ? this.dom.betAmountInput.value : this.selectedChip) || 10;
      if (amt <= 0) return;

      // Deduct from wallet
      if (window.wallet && !window.wallet.hasSufficientBalance(amt)) {
        if (window.app && window.app.showNotification) window.app.showNotification("Insufficient balance!", "error");
        return;
      }
      if (window.wallet) window.wallet.deductBalance(amt, 'Live Blackjack Bet');

      this.currentBet = amt;
      this.roundId = this.generateRoundId();
      if (this.dom.roundIdTag) this.dom.roundIdTag.innerText = this.roundId;

      this.playerHand = [];
      this.dealerHand = [];
      this.gameState = 'player_turn';

      if (this.dom.winBanner) this.dom.winBanner.style.display = 'none';
      if (this.dom.statusText) {
        this.dom.statusText.innerText = "PLAYER'S TURN";
        this.dom.statusText.style.color = '#fbbf24';
      }

      if (this.dom.bettingControls) this.dom.bettingControls.style.display = 'none';
      if (this.dom.actionControls) this.dom.actionControls.style.display = 'flex';
      if (this.dom.btnDouble) this.dom.btnDouble.disabled = false;

      if (window.soundEngine && window.soundEngine.playDealCard) window.soundEngine.playDealCard();

      // Initial deal: Player, Dealer, Player, Dealer (hole card)
      this.playerHand.push(this.drawCard());
      this.dealerHand.push(this.drawCard());
      this.playerHand.push(this.drawCard());
      const holeCard = this.drawCard();
      holeCard.hidden = true;
      this.dealerHand.push(holeCard);

      this.renderCards(true);

      // Check initial player Blackjack
      const pScore = this.calculateScore(this.playerHand);
      if (pScore === 21) {
        setTimeout(() => this.stand(), 600);
      }
    }

    hit() {
      if (this.gameState !== 'player_turn') return;
      if (this.dom.btnDouble) this.dom.btnDouble.disabled = true;

      this.playerHand.push(this.drawCard());
      if (window.soundEngine && window.soundEngine.playDealCard) window.soundEngine.playDealCard();

      this.renderCards(true);
      const score = this.calculateScore(this.playerHand);

      if (score > 21) {
        this.revealDealerHole();
        this.settleRound('bust');
      } else if (score === 21) {
        this.stand();
      }
    }

    doubleDown() {
      if (this.gameState !== 'player_turn' || this.playerHand.length !== 2) return;

      if (window.wallet && !window.wallet.hasSufficientBalance(this.currentBet)) {
        if (window.app && window.app.showNotification) window.app.showNotification("Insufficient balance to double!", "error");
        return;
      }
      if (window.wallet) window.wallet.deductBalance(this.currentBet, 'Blackjack Double Down');
      this.currentBet *= 2;

      this.playerHand.push(this.drawCard());
      this.renderCards(true);

      const score = this.calculateScore(this.playerHand);
      if (score > 21) {
        this.revealDealerHole();
        this.settleRound('bust');
      } else {
        this.stand();
      }
    }

    stand() {
      if (this.gameState !== 'player_turn') return;
      this.gameState = 'dealer_turn';

      if (this.dom.statusText) {
        this.dom.statusText.innerText = "DEALER'S TURN";
        this.dom.statusText.style.color = '#38bdf8';
      }

      this.revealDealerHole();
      this.dealerPlayLoop();
    }

    revealDealerHole() {
      if (this.dealerHand.length >= 2) {
        this.dealerHand[1].hidden = false;
        this.renderCards(false);
      }
    }

    dealerPlayLoop() {
      const pScore = this.calculateScore(this.playerHand);
      if (pScore > 21) {
        this.settleRound('bust');
        return;
      }

      let dScore = this.calculateScore(this.dealerHand, false);

      const step = () => {
        dScore = this.calculateScore(this.dealerHand, false);
        if (dScore < 17) {
          this.dealerHand.push(this.drawCard());
          if (window.soundEngine && window.soundEngine.playDealCard) window.soundEngine.playDealCard();
          this.renderCards(false);
          setTimeout(step, 650);
        } else {
          this.determineOutcome(pScore, dScore);
        }
      };

      setTimeout(step, 500);
    }

    determineOutcome(pScore, dScore) {
      const isPlayerBJ = (pScore === 21 && this.playerHand.length === 2);
      const isDealerBJ = (dScore === 21 && this.dealerHand.length === 2);

      if (isPlayerBJ && !isDealerBJ) {
        this.settleRound('blackjack');
      } else if (dScore > 21) {
        this.settleRound('dealer_bust');
      } else if (pScore > dScore) {
        this.settleRound('win');
      } else if (pScore < dScore) {
        this.settleRound('lose');
      } else {
        this.settleRound('push');
      }
    }

    settleRound(outcome) {
      this.gameState = 'settled';
      let winMultiplier = 0;
      let title = "";
      let color = "#ef4444";

      if (outcome === 'blackjack') {
        winMultiplier = 2.5; // 3:2 payout + principal = 2.5x
        title = "BLACKJACK! PAYS 3:2 🎉";
        color = "#10b981";
      } else if (outcome === 'win' || outcome === 'dealer_bust') {
        winMultiplier = 2.0; // 1:1 payout
        title = outcome === 'dealer_bust' ? "DEALER BUSTS! YOU WIN 🎉" : "YOU WIN! 🎉";
        color = "#10b981";
      } else if (outcome === 'push') {
        winMultiplier = 1.0; // Refund
        title = "PUSH / TIE (BET RETURNED) 🤝";
        color = "#fbbf24";
      } else if (outcome === 'bust') {
        winMultiplier = 0;
        title = "BUST! YOU LOSE 💥";
        color = "#ef4444";
      } else {
        winMultiplier = 0;
        title = "DEALER WINS 💔";
        color = "#ef4444";
      }

      const payout = Math.floor(this.currentBet * winMultiplier * 100) / 100;
      if (payout > 0 && window.wallet) {
        window.wallet.addBalance(payout, 'Blackjack Payout');
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
        this.dom.winBanner.innerHTML = `<span style="color: ${color}; font-weight: 800;">${title}</span> ${payout > 0 ? `+₹${payout.toFixed(2)}` : ''}`;
      }

      this.addHistoryBadge(outcome);

      setTimeout(() => {
        if (this.dom.actionControls) this.dom.actionControls.style.display = 'none';
        if (this.dom.bettingControls) this.dom.bettingControls.style.display = 'flex';
      }, 1200);
    }

    addHistoryBadge(outcome) {
      const map = {
        'blackjack': { text: 'BJ', bg: '#10b981' },
        'win': { text: 'W', bg: '#10b981' },
        'dealer_bust': { text: 'W', bg: '#10b981' },
        'push': { text: 'P', bg: '#fbbf24' },
        'bust': { text: 'L', bg: '#ef4444' },
        'lose': { text: 'L', bg: '#ef4444' }
      };
      const badge = map[outcome] || { text: 'L', bg: '#ef4444' };
      this.history.unshift(badge);
      if (this.history.length > 16) this.history.pop();

      if (this.dom.historyRow) {
        this.dom.historyRow.innerHTML = this.history.map(h => 
          `<span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:${h.bg};color:#fff;font-size:10px;font-weight:800;">${h.text}</span>`
        ).join('');
      }
    }

    renderCards(hideDealerHole) {
      if (this.dom.dealerCards) {
        this.dom.dealerCards.innerHTML = this.dealerHand.map(card => this.renderCardHtml(card, hideDealerHole && card.hidden)).join('');
      }
      if (this.dom.playerCards) {
        this.dom.playerCards.innerHTML = this.playerHand.map(card => this.renderCardHtml(card, false)).join('');
      }

      const dScore = this.calculateScore(this.dealerHand, hideDealerHole);
      const pScore = this.calculateScore(this.playerHand, false);

      if (this.dom.dealerScore) this.dom.dealerScore.innerText = (hideDealerHole && this.dealerHand.length > 1 && this.dealerHand[1].hidden) ? (this.calculateScore([this.dealerHand[0]]) + ' + ?') : dScore;
      if (this.dom.playerScore) this.dom.playerScore.innerText = pScore;
    }

    renderCardHtml(card, isHidden) {
      if (isHidden) {
        return `<div class="bj-card bj-card-back">
          <div class="bj-card-inner-pattern">⚡</div>
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

  window.BlackjackGame = BlackjackGame;
})(window);
