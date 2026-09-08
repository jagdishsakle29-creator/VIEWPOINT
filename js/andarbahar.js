/**
 * VIEWPOINT - Andar Bahar Card Game (andarbahar.js)
 * Classic Indian Casino Game:
 * 1. Joker card dealt in center
 * 2. Player bets on "Andar" or "Bahar"
 * 3. Cards dealt alternately to Andar & Bahar
 * 4. First card matching Joker rank wins 1.95x!
 */

(function(window) {
  'use strict';

  const SUITS = ['♠', '♥', '♦', '♣'];
  const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  class AndarBaharGame {
    constructor() {
      this.selectedSide = null; // 'ANDAR' or 'BAHAR'
      this.betAmount = 50;
      this.isPlaying = false;
      this.jokerCard = null;
      this.andarCards = [];
      this.baharCards = [];
      this.history = ['A', 'B', 'B', 'A', 'A', 'B', 'A'];

      this.init();
    }

    init() {
      this.bindEvents();
      this.renderHistory();
      console.log('✅ [AndarBahar] Game initialized.');
    }

    bindEvents() {
      const btnAndar = document.getElementById('btnBetAndar');
      const btnBahar = document.getElementById('btnBetBahar');
      const btnDeal = document.getElementById('btnAndarBaharDeal');
      const inputBet = document.getElementById('inputAndarBaharBet');
      const chipBtns = document.querySelectorAll('.ab-chip-btn');

      if (btnAndar) {
        btnAndar.addEventListener('click', () => this.selectSide('ANDAR'));
      }
      if (btnBahar) {
        btnBahar.addEventListener('click', () => this.selectSide('BAHAR'));
      }
      if (btnDeal) {
        btnDeal.addEventListener('click', () => this.startDeal());
      }
      if (inputBet) {
        inputBet.addEventListener('change', (e) => {
          this.betAmount = Math.max(10, parseFloat(e.target.value) || 10);
        });
      }
      chipBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const val = parseFloat(btn.dataset.val);
          if (inputBet) {
            inputBet.value = val;
            this.betAmount = val;
          }
        });
      });
    }

    selectSide(side) {
      if (this.isPlaying) return;
      this.selectedSide = side;

      const btnAndar = document.getElementById('btnBetAndar');
      const btnBahar = document.getElementById('btnBetBahar');

      if (btnAndar) btnAndar.classList.toggle('selected-side', side === 'ANDAR');
      if (btnBahar) btnBahar.classList.toggle('selected-side', side === 'BAHAR');

      if (window.soundEngine && window.soundEngine.playClick) window.soundEngine.playClick();
    }

    getRandomCard() {
      const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
      const rank = RANKS[Math.floor(Math.random() * RANKS.length)];
      const isRed = suit === '♥' || suit === '♦';
      return { suit, rank, isRed };
    }

    startDeal() {
      if (this.isPlaying) return;

      if (!this.selectedSide) {
        this.notify('Please select ANDAR or BAHAR to place your bet!', 'warning');
        return;
      }

      const inputBet = document.getElementById('inputAndarBaharBet');
      if (inputBet) this.betAmount = Math.max(10, parseFloat(inputBet.value) || 10);

      const currentBal = this.getUserBalance();
      if (currentBal < this.betAmount) {
        this.notify('Insufficient balance! Please deposit to play.', 'warning');
        return;
      }

      this.deductBalance(this.betAmount, `Andar Bahar Bet: ₹${this.betAmount} on ${this.selectedSide}`);
      this.isPlaying = true;

      const btnDeal = document.getElementById('btnAndarBaharDeal');
      if (btnDeal) {
        btnDeal.disabled = true;
        btnDeal.innerText = 'DEALING CARDS...';
      }

      if (window.soundEngine && window.soundEngine.playBet) window.soundEngine.playBet();

      // Reset card areas
      this.andarCards = [];
      this.baharCards = [];
      this.renderCards('andarCardsArea', []);
      this.renderCards('baharCardsArea', []);

      // 1. Deal Joker Card
      this.jokerCard = this.getRandomCard();
      this.renderJoker(this.jokerCard);

      if (window.soundEngine && window.soundEngine.playCardFlip) window.soundEngine.playCardFlip();

      // 2. Start alternating dealing
      let currentTurn = 'ANDAR';
      let cardsDealt = 0;
      const maxCards = 40;

      // Admin RTP tuning
      const rtpSetting = localStorage.getItem('vp_admin_rtp_andarbahar') || 'fair';
      let targetWinner = null;
      if (rtpSetting === 'house_edge') {
        // Player loses more often
        targetWinner = this.selectedSide === 'ANDAR' ? 'BAHAR' : 'ANDAR';
      } else if (rtpSetting === 'player_win') {
        // Player wins more often
        targetWinner = this.selectedSide;
      }

      const dealInterval = setInterval(() => {
        cardsDealt++;
        let card = this.getRandomCard();

        // Check if we force a match based on target or random limit
        const shouldMatchNow = (targetWinner && currentTurn === targetWinner && cardsDealt >= 4) ||
                               (!targetWinner && card.rank === this.jokerCard.rank) ||
                               (cardsDealt >= 12 && currentTurn === (targetWinner || 'ANDAR'));

        if (shouldMatchNow) {
          card = { ...this.jokerCard, suit: card.suit, isRed: card.isRed };
        }

        // Deal card to side
        if (currentTurn === 'ANDAR') {
          this.andarCards.push(card);
          this.renderCards('andarCardsArea', this.andarCards);
        } else {
          this.baharCards.push(card);
          this.renderCards('baharCardsArea', this.baharCards);
        }

        if (window.soundEngine && window.soundEngine.playCardFlip) window.soundEngine.playCardFlip();

        // Check if this card matches Joker
        if (card.rank === this.jokerCard.rank) {
          clearInterval(dealInterval);
          this.resolveGame(currentTurn);
          return;
        }

        // Alternate turn
        currentTurn = currentTurn === 'ANDAR' ? 'BAHAR' : 'ANDAR';

        if (cardsDealt >= maxCards) {
          clearInterval(dealInterval);
          this.resolveGame(currentTurn);
        }
      }, 450);
    }

    resolveGame(winningSide) {
      const won = this.selectedSide === winningSide;
      this.history.unshift(winningSide === 'ANDAR' ? 'A' : 'B');
      if (this.history.length > 15) this.history.pop();
      this.renderHistory();

      if (won) {
        const winAmount = parseFloat((this.betAmount * 1.95).toFixed(2));
        this.awardBalance(winAmount, `Andar Bahar Win (${winningSide})`);
        if (window.soundEngine && window.soundEngine.playWin) window.soundEngine.playWin();
        if (window.app && window.app.showToast) {
          window.app.showToast({ won: true, payout: winAmount, multiplier: 1.95 });
        }
        this.notify(`🎉 ${winningSide} MATCHED! You won ₹${winAmount.toFixed(2)}!`, 'success');
      } else {
        if (window.soundEngine && window.soundEngine.playBomb) window.soundEngine.playBomb();
        if (window.app && window.app.showToast) {
          window.app.showToast({ won: false, payout: 0, multiplier: 0 });
        }
        this.notify(`💔 ${winningSide} matched! Round lost: -₹${this.betAmount.toFixed(2)}.`, 'error');
      }

      // Re-enable deal button
      setTimeout(() => {
        this.isPlaying = false;
        const btnDeal = document.getElementById('btnAndarBaharDeal');
        if (btnDeal) {
          btnDeal.disabled = false;
          btnDeal.innerText = 'PLACE BET & DEAL';
        }
      }, 1200);
    }

    renderJoker(card) {
      const el = document.getElementById('jokerCardDisplay');
      if (!el) return;
      el.innerHTML = `
        <div class="ab-card ${card.isRed ? 'red-card' : 'black-card'} deal-anim">
          <span class="card-rank">${card.rank}</span>
          <span class="card-suit">${card.suit}</span>
        </div>
      `;
    }

    renderCards(containerId, cards) {
      const el = document.getElementById(containerId);
      if (!el) return;
      el.innerHTML = cards.map((c, idx) => `
        <div class="ab-card ${c.isRed ? 'red-card' : 'black-card'} ${idx === cards.length - 1 ? 'deal-anim' : ''}">
          <span class="card-rank">${c.rank}</span>
          <span class="card-suit">${c.suit}</span>
        </div>
      `).join('');
      el.scrollLeft = el.scrollWidth;
    }

    renderHistory() {
      const el = document.getElementById('andarBaharHistoryList');
      if (!el) return;
      el.innerHTML = this.history.map(h => `
        <span class="ab-history-pill ${h === 'A' ? 'andar-pill' : 'bahar-pill'}">${h}</span>
      `).join('');
    }

    getUserBalance() {
      if (window.wallet && typeof window.wallet.balance === 'number') return window.wallet.balance;
      if (window.wallet && window.wallet.getBalance) return window.wallet.getBalance();
      return parseFloat(localStorage.getItem('vp_user_balance') || '500');
    }

    deductBalance(amount, reason) {
      if (window.wallet && window.wallet.deduct) {
        return window.wallet.deduct(amount);
      } else if (window.wallet && window.wallet.deductBalance) {
        window.wallet.deductBalance(amount, reason);
        return true;
      } else {
        let bal = this.getUserBalance() - amount;
        localStorage.setItem('vp_user_balance', bal.toString());
        const el = document.getElementById('walletBalance') || document.getElementById('userBalance');
        if (el) el.innerText = bal.toFixed(2);
        return true;
      }
    }

    awardBalance(amount, reason) {
      if (window.wallet && window.wallet.addWin) {
        window.wallet.addWin(amount);
      } else if (window.wallet && window.wallet.add) {
        window.wallet.add(amount);
      } else if (window.wallet && window.wallet.addBalance) {
        window.wallet.addBalance(amount, reason);
      } else {
        let bal = this.getUserBalance() + amount;
        localStorage.setItem('vp_user_balance', bal.toString());
        const el = document.getElementById('walletBalance') || document.getElementById('userBalance');
        if (el) el.innerText = bal.toFixed(2);
      }
    }

    notify(msg, type) {
      if (window.app && window.app.showNotification) window.app.showNotification(msg, type);
      else alert(msg);
    }
  }

  window.AndarBaharGame = AndarBaharGame;

  function initAndarBahar() {
    if (!window.andarBaharGame && document.getElementById('btnAndarBaharDeal')) {
      window.andarBaharGame = new AndarBaharGame();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAndarBahar);
  } else {
    initAndarBahar();
  }

})(window);
