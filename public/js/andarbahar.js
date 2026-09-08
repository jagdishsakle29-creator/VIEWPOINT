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

    createShuffledDeck() {
      const deck = [];
      for (const suit of SUITS) {
        for (const rank of RANKS) {
          const isRed = (suit === '♥' || suit === '♦');
          deck.push({ suit, rank, isRed });
        }
      }
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
      return deck;
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

      // Create standard shuffled deck
      const deck = this.createShuffledDeck();

      // 1. Deal Trump Joker Card from top of deck
      this.jokerCard = deck.pop();
      this.renderJoker(this.jokerCard);

      if (window.soundEngine && window.soundEngine.playCardFlip) window.soundEngine.playCardFlip();

      // 2. Start alternating dealing:
      // Authentic rule: Black Joker starts with ANDAR, Red Joker starts with BAHAR
      let currentTurn = this.jokerCard.isRed ? 'BAHAR' : 'ANDAR';
      let cardsDealt = 0;

      // Admin RTP tuning
      const rtpSetting = localStorage.getItem('vp_admin_rtp_andarbahar') || 'fair';
      let forceWinner = null;
      if (rtpSetting === 'house_edge') {
        forceWinner = this.selectedSide === 'ANDAR' ? 'BAHAR' : 'ANDAR';
      } else if (rtpSetting === 'player_win') {
        forceWinner = this.selectedSide;
      }

      const dealInterval = setInterval(() => {
        cardsDealt++;
        let card = deck.length > 0 ? deck.pop() : this.getRandomCard();

        // Optional admin RTP tuning override
        if (forceWinner && currentTurn === forceWinner && cardsDealt >= 4 && Math.random() < 0.35) {
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

        // Check if this card matches Joker rank
        if (card.rank === this.jokerCard.rank) {
          clearInterval(dealInterval);
          this.resolveGame(currentTurn);
          return;
        }

        // Alternate turn between ANDAR and BAHAR
        currentTurn = currentTurn === 'ANDAR' ? 'BAHAR' : 'ANDAR';

        if (cardsDealt >= 48) {
          clearInterval(dealInterval);
          // Fair 50/50 resolution if deck runs low
          const finalWinner = Math.random() < 0.5 ? 'ANDAR' : 'BAHAR';
          this.resolveGame(finalWinner);
        }
      }, this.turboMode ? 190 : 420);
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
        if (window.LiveBets && window.LiveBets.recordUserWin) {
          window.LiveBets.recordUserWin('Andar Bahar', this.betAmount, 1.95, winAmount);
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
      }, this.turboMode ? 600 : 1200);
    }

    toggleTurbo() {
      this.turboMode = !this.turboMode;
      const btn = document.getElementById('btnAndarTurboToggle');
      if (btn) {
        btn.innerHTML = this.turboMode ? '⚡ Turbo: ON' : '⚡ Turbo: OFF';
        btn.style.color = this.turboMode ? '#00e701' : '#fbbf24';
        btn.style.borderColor = this.turboMode ? '#00e701' : '#f59e0b';
        btn.style.background = this.turboMode ? 'rgba(0,231,1,0.2)' : 'rgba(245,158,11,0.18)';
      }
      if (window.soundEngine && window.soundEngine.playClick) window.soundEngine.playClick();
      if (window.app && window.app.showNotification) {
        window.app.showNotification(this.turboMode ? '⚡ Turbo Mode ON: Fast 2x card deals active' : 'Turbo Mode OFF: Normal deal speed', 'info');
      }
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
