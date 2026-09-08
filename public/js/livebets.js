/**
 * VIEWPOINT - Real-Time Live Bets & Win Stream (livebets.js)
 * Stake.com / 1xBet Style Live Winning Stream & High Rollers Feed
 */

(function(window) {
  'use strict';

  const USER_PREFIXES = ['98', '97', '99', '88', '87', '84', '70', '79', '93', '91', '80', '95', '82', '78', '96'];

  const GAMES_POOL = [
    { name: 'Aviator', icon: '✈️', minBet: 50, maxBet: 2500, minMult: 1.35, maxMult: 18.5, weight: 35 },
    { name: 'Mines', icon: '💣', minBet: 20, maxBet: 1200, minMult: 1.45, maxMult: 14.0, weight: 25 },
    { name: 'Andar Bahar', icon: '🃏', minBet: 100, maxBet: 5000, minMult: 1.95, maxMult: 2.0, weight: 20 },
    { name: 'Dragon Tiger', icon: '🐉', minBet: 50, maxBet: 3000, minMult: 1.95, maxMult: 8.0, weight: 15 },
    { name: 'Plinko', icon: '🎯', minBet: 20, maxBet: 800, minMult: 1.20, maxMult: 29.0, weight: 15 },
    { name: 'Crash', icon: '🚀', minBet: 50, maxBet: 1500, minMult: 1.40, maxMult: 15.0, weight: 15 },
    { name: 'Color Trading', icon: '🎨', minBet: 50, maxBet: 2000, minMult: 1.96, maxMult: 4.5, weight: 12 },
    { name: 'Limbo', icon: '⚡', minBet: 10, maxBet: 500, minMult: 2.0, maxMult: 45.0, weight: 10 }
  ];

  function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randomFloat(min, max, decimals = 2) {
    const val = Math.random() * (max - min) + min;
    return parseFloat(val.toFixed(decimals));
  }

  function generateMaskedUser() {
    const prefix = USER_PREFIXES[Math.floor(Math.random() * USER_PREFIXES.length)];
    const suffix = randomBetween(10, 99).toString();
    return `User ${prefix}***${suffix}`;
  }

  function pickRandomGame() {
    let totalWeight = GAMES_POOL.reduce((acc, g) => acc + g.weight, 0);
    let rand = Math.random() * totalWeight;
    for (let i = 0; i < GAMES_POOL.length; i++) {
      if (rand < GAMES_POOL[i].weight) return GAMES_POOL[i];
      rand -= GAMES_POOL[i].weight;
    }
    return GAMES_POOL[0];
  }

  function generateBetItem(override = null) {
    if (override) return override;

    const game = pickRandomGame();
    // Realistic bet amount rounded to 10s or 50s
    let bet = randomBetween(game.minBet, game.maxBet);
    bet = Math.round(bet / 10) * 10;

    // Multiplier calculation
    let mult = 1.0;
    const roll = Math.random();
    if (roll < 0.65) {
      // Common small wins (1.3x - 2.8x)
      mult = randomFloat(1.30, 2.80);
    } else if (roll < 0.90) {
      // Medium wins (2.8x - 6.5x)
      mult = randomFloat(2.80, 6.50);
    } else {
      // Big/High roller wins (6.5x - maxMult)
      mult = randomFloat(6.50, game.maxMult);
    }

    // Special case for binary games (Andar Bahar, Dragon Tiger)
    if (game.name === 'Andar Bahar') mult = 1.95;
    if (game.name === 'Dragon Tiger') mult = Math.random() < 0.1 ? 8.00 : 1.95;

    const payout = Math.round(bet * mult * 100) / 100;
    const user = generateMaskedUser();

    return {
      user: user,
      game: game.name,
      icon: game.icon,
      bet: bet,
      mult: mult,
      payout: payout,
      time: 'Just now',
      isHigh: bet >= 1000 || payout >= 3000,
      isLucky: mult >= 5.0
    };
  }

  const LiveBets = {
    currentFilter: 'all',
    betsHistory: [],
    maxHistory: 12,
    timerTicker: null,
    timerHide: null,
    timerFeed: null,

    init: function() {
      this.initInitialRows();
      this.startFloatingTicker();
      this.startFeedStream();
      console.log('✅ [LiveBets] Real-time winning stream initialized with delayed popup timing.');
    },

    initInitialRows: function() {
      const tbody = document.getElementById('liveBetsTableBody');
      if (!tbody) return;

      this.betsHistory = [];
      for (let i = 0; i < 8; i++) {
        const item = generateBetItem();
        item.time = `${(i + 1) * 3}s ago`;
        this.betsHistory.push(item);
      }
      this.renderTable();
    },

    renderTable: function() {
      const tbody = document.getElementById('liveBetsTableBody');
      if (!tbody) return;

      let filtered = this.betsHistory;
      if (this.currentFilter === 'high') {
        filtered = this.betsHistory.filter(b => b.isHigh);
      } else if (this.currentFilter === 'lucky') {
        filtered = this.betsHistory.filter(b => b.isLucky);
      }

      if (filtered.length === 0) {
        filtered = this.betsHistory.slice(0, 5);
      }

      tbody.innerHTML = filtered.map(item => `
        <tr class="live-bets-row">
          <td>
            <div class="tbl-game-cell">
              <span class="tbl-game-icon">${item.icon}</span>
              <span>${item.game}</span>
            </div>
          </td>
          <td><span class="tbl-user-cell ${item.user.includes('You') ? 'user-self' : ''}">${item.user}</span></td>
          <td><span class="tbl-time-cell">${item.time}</span></td>
          <td><span class="tbl-bet-cell">₹${item.bet.toLocaleString('en-IN')}</span></td>
          <td>
            <span class="tbl-mult-pill ${item.mult >= 5.0 ? 'high' : ''}">${item.mult.toFixed(2)}x</span>
          </td>
          <td class="tbl-payout-cell">+₹${item.payout.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      `).join('');
    },

    pushNewBet: function(betItem) {
      this.betsHistory.unshift(betItem);
      if (this.betsHistory.length > this.maxHistory) {
        this.betsHistory.pop();
      }

      const tbody = document.getElementById('liveBetsTableBody');
      if (!tbody) return;

      // Check if matches filter
      let shouldShow = true;
      if (this.currentFilter === 'high' && !betItem.isHigh) shouldShow = false;
      if (this.currentFilter === 'lucky' && !betItem.isLucky) shouldShow = false;

      if (shouldShow) {
        const tr = document.createElement('tr');
        tr.className = 'live-bets-row row-new';
        tr.innerHTML = `
          <td>
            <div class="tbl-game-cell">
              <span class="tbl-game-icon">${betItem.icon}</span>
              <span>${betItem.game}</span>
            </div>
          </td>
          <td><span class="tbl-user-cell ${betItem.user.includes('You') ? 'user-self' : ''}">${betItem.user}</span></td>
          <td><span class="tbl-time-cell">Just now</span></td>
          <td><span class="tbl-bet-cell">₹${betItem.bet.toLocaleString('en-IN')}</span></td>
          <td>
            <span class="tbl-mult-pill ${betItem.mult >= 5.0 ? 'high' : ''}">${betItem.mult.toFixed(2)}x</span>
          </td>
          <td class="tbl-payout-cell">+₹${betItem.payout.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        `;

        if (tbody.firstChild) {
          tbody.insertBefore(tr, tbody.firstChild);
        } else {
          tbody.appendChild(tr);
        }

        if (tbody.children.length > this.maxHistory) {
          tbody.removeChild(tbody.lastChild);
        }
      }
      // Note: Floating popup is deliberately NOT triggered on every background bet
      // to keep the experience clean, non-spammy, and properly delayed.
    },

    showFloatingWin: function(betItem, displayDuration = 5000) {
      const widget = document.getElementById('floatingLiveWinWidget');
      if (!widget) return;

      const userEl = document.getElementById('winTickerUser');
      const gameEl = document.getElementById('winTickerGame');
      const amtEl = document.getElementById('winTickerAmount');
      const multEl = document.getElementById('winTickerMult');

      if (userEl) userEl.innerText = betItem.user;
      if (gameEl) gameEl.innerText = `${betItem.icon} ${betItem.game}`;
      if (amtEl) amtEl.innerText = `+₹${betItem.payout.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      if (multEl) multEl.innerText = `(${betItem.mult.toFixed(2)}x)`;

      widget.classList.remove('anim-exit');
      widget.classList.add('anim-enter');

      // Auto-hide popup after display duration (5s standard, 7s for user win)
      if (this.timerHide) clearTimeout(this.timerHide);
      this.timerHide = setTimeout(() => {
        this.hideFloatingWin();
      }, displayDuration);
    },

    hideFloatingWin: function() {
      const widget = document.getElementById('floatingLiveWinWidget');
      if (!widget) return;
      widget.classList.remove('anim-enter');
      widget.classList.add('anim-exit');
    },

    dismissTicker: function(e) {
      if (e) e.stopPropagation();
      this.hideFloatingWin();
    },

    handleTickerClick: function(e) {
      // If clicked outside close button, scroll to feed table
      this.scrollToFeed();
    },

    startFeedStream: function() {
      const scheduleNext = () => {
        // Table stream adds background bets every 4s to 8s
        const delay = randomBetween(4000, 8000);
        this.timerFeed = setTimeout(() => {
          const bet = generateBetItem();
          this.pushNewBet(bet);
          scheduleNext();
        }, delay);
      };
      scheduleNext();
    },

    startFloatingTicker: function() {
      // Show first floating win with comfortable initial delay of 6.5s
      const scheduleNextPopup = (delayMs) => {
        if (this.timerTicker) clearTimeout(this.timerTicker);
        this.timerTicker = setTimeout(() => {
          // Pick high win / lucky multiplier or fresh exciting winner
          const pool = this.betsHistory.filter(b => b.isLucky || b.isHigh || b.mult >= 2.0);
          const bet = pool.length > 0
            ? pool[Math.floor(Math.random() * pool.length)]
            : generateBetItem();

          // Show for 5 seconds
          this.showFloatingWin(bet, 5000);

          // Delay next popup by 14s to 22s
          const nextWait = randomBetween(14000, 22000);
          scheduleNextPopup(nextWait + 5000);
        }, delayMs);
      };

      scheduleNextPopup(6500);
    },

    setFilter: function(filter) {
      this.currentFilter = filter;
      document.querySelectorAll('.live-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
      });
      this.renderTable();
    },

    scrollToFeed: function() {
      const el = document.getElementById('liveBetsSection');
      if (el && typeof el.scrollIntoView === 'function') {
        try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch(e) {}
      }
    },

    // Call this whenever real local player wins a round!
    recordUserWin: function(gameName, betAmount, multiplier, payoutAmount) {
      const gameObj = GAMES_POOL.find(g => g.name.toLowerCase() === gameName.toLowerCase()) || { name: gameName, icon: '🎰' };
      const item = {
        user: 'You 🏆',
        game: gameObj.name,
        icon: gameObj.icon,
        bet: betAmount,
        mult: multiplier,
        payout: payoutAmount,
        time: 'Just now',
        isHigh: betAmount >= 1000 || payoutAmount >= 3000,
        isLucky: multiplier >= 5.0
      };
      this.pushNewBet(item);

      // Immediately pop up with personal win and celebrate for 7 seconds!
      this.showFloatingWin(item, 7000);
    }
  };

  window.LiveBets = LiveBets;

  document.addEventListener('DOMContentLoaded', () => {
    LiveBets.init();
  });

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(() => LiveBets.init(), 150);
  }

})(window);
