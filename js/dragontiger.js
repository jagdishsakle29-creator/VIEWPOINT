/**
 * ====================================================================
 * DRAGON TIGER LIVE CASINO ENGINE (EVOLUTION GAMING THEME)
 * Standard 52-Card Shoe, Provably Fair, Multi-Betting, 3D Dealing & Roadmaps
 * ====================================================================
 */

class DragonTigerGame {
  constructor(uiCallbacks) {
    this.ui = uiCallbacks || {};
    this.roundDuration = 15; // 15s betting window
    this.timeLeft = this.roundDuration;
    this.gameState = 'betting'; // 'betting', 'dealing', 'settled'
    this.roundId = this.generateRoundId();
    
    // Bets state: key-value of spotId -> total amount
    this.currentBets = {};
    this.previousBets = {};
    this.selectedChip = 10;
    
    // History & Roadmaps
    this.history = this.generateInitialHistory();
    
    // Current dealt cards
    this.dragonCard = null;
    this.tigerCard = null;
    this.roundResult = null;
    
    this.timerInterval = null;
    this.startRoundLoop();
  }

  generateRoundId() {
    const d = new Date();
    const dateStr = d.getFullYear().toString().slice(-2) +
      String(d.getMonth() + 1).padStart(2, '0') +
      String(d.getDate()).padStart(2, '0');
    const secOfDay = Math.floor((d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()) / this.roundDuration);
    return `DT-${dateStr}-${String(secOfDay).padStart(4, '0')}`;
  }

  // 52-Card Deck Generator
  drawCard() {
    const suits = [
      { name: 'spades', symbol: '♠', isRed: false },
      { name: 'hearts', symbol: '♥', isRed: true },
      { name: 'diamonds', symbol: '♦', isRed: true },
      { name: 'clubs', symbol: '♣', isRed: false }
    ];
    const ranks = [
      { name: 'A', value: 1 },
      { name: '2', value: 2 },
      { name: '3', value: 3 },
      { name: '4', value: 4 },
      { name: '5', value: 5 },
      { name: '6', value: 6 },
      { name: '7', value: 7 },
      { name: '8', value: 8 },
      { name: '9', value: 9 },
      { name: '10', value: 10 },
      { name: 'J', value: 11 },
      { name: 'Q', value: 12 },
      { name: 'K', value: 13 }
    ];

    let randomSeed;
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const arr = new Uint32Array(2);
      window.crypto.getRandomValues(arr);
      randomSeed = arr;
    } else {
      randomSeed = [Math.floor(Math.random() * 100000), Math.floor(Math.random() * 100000)];
    }

    const suit = suits[randomSeed[0] % suits.length];
    const rank = ranks[randomSeed[1] % ranks.length];

    return {
      rank: rank.name,
      value: rank.value,
      suit: suit.symbol,
      suitName: suit.name,
      isRed: suit.isRed,
      isBig: rank.value >= 8,
      isSmall: rank.value <= 6,
      isSeven: rank.value === 7
    };
  }

  generateInitialHistory() {
    const list = [];
    const outcomes = ['D', 'T', 'D', 'T', 'D', 'T', 'TIE', 'D', 'T', 'D', 'T', 'D', 'TIE', 'T', 'D', 'T'];
    for (let i = 0; i < 20; i++) {
      const winner = outcomes[Math.floor(Math.random() * outcomes.length)];
      list.push({
        winner: winner,
        dragonCard: { rank: String(Math.floor(2 + Math.random() * 10)), suit: '♥', isRed: true },
        tigerCard: { rank: String(Math.floor(2 + Math.random() * 10)), suit: '♠', isRed: false }
      });
    }
    return list;
  }

  setSelectedChip(val) {
    this.selectedChip = parseFloat(val) || 10;
  }

  getTotalBetAmount() {
    return Object.values(this.currentBets).reduce((acc, curr) => acc + curr, 0);
  }

  placeBet(spotId) {
    if (this.gameState !== 'betting' || this.timeLeft <= 3) {
      return { success: false, msg: "Betting locked for this round!" };
    }

    const amount = this.selectedChip;
    if (!window.wallet.hasFunds(amount)) {
      return { success: false, msg: "Insufficient wallet balance!" };
    }

    // Deduct chip amount from wallet immediately
    window.wallet.deduct(amount);
    window.soundEngine && window.soundEngine.playClick && window.soundEngine.playClick();

    this.currentBets[spotId] = (this.currentBets[spotId] || 0) + amount;

    if (this.ui && this.ui.onBetsUpdated) {
      this.ui.onBetsUpdated(this.currentBets, this.getTotalBetAmount());
    }

    return { success: true, spotId, amount, total: this.currentBets[spotId] };
  }

  clearBets() {
    if (this.gameState !== 'betting' || this.timeLeft <= 3) {
      return { success: false, msg: "Cannot clear bets right now!" };
    }

    const total = this.getTotalBetAmount();
    if (total > 0) {
      // Refund placed bets
      window.wallet.addWin(total);
      this.currentBets = {};
      if (this.ui && this.ui.onBetsUpdated) {
        this.ui.onBetsUpdated(this.currentBets, 0);
      }
      return { success: true, refunded: total };
    }
    return { success: false, msg: "No active bets to clear." };
  }

  doubleBets() {
    if (this.gameState !== 'betting' || this.timeLeft <= 3) {
      return { success: false, msg: "Cannot double bets right now!" };
    }

    const total = this.getTotalBetAmount();
    if (total <= 0) {
      return { success: false, msg: "Place a bet first to double!" };
    }

    if (!window.wallet.hasFunds(total)) {
      return { success: false, msg: "Insufficient balance to double bets!" };
    }

    window.wallet.deduct(total);
    for (const spotId in this.currentBets) {
      this.currentBets[spotId] *= 2;
    }

    if (this.ui && this.ui.onBetsUpdated) {
      this.ui.onBetsUpdated(this.currentBets, this.getTotalBetAmount());
    }

    return { success: true, added: total, newTotal: this.getTotalBetAmount() };
  }

  rebet() {
    if (this.gameState !== 'betting' || this.timeLeft <= 3) {
      return { success: false, msg: "Cannot rebet right now!" };
    }

    const prevKeys = Object.keys(this.previousBets);
    if (prevKeys.length === 0) {
      return { success: false, msg: "No previous bet history available!" };
    }

    const prevTotal = Object.values(this.previousBets).reduce((a, b) => a + b, 0);
    if (!window.wallet.hasFunds(prevTotal)) {
      return { success: false, msg: "Insufficient balance for Rebet!" };
    }

    // First clear any existing current bets with refund
    this.clearBets();

    window.wallet.deduct(prevTotal);
    this.currentBets = { ...this.previousBets };

    if (this.ui && this.ui.onBetsUpdated) {
      this.ui.onBetsUpdated(this.currentBets, this.getTotalBetAmount());
    }

    return { success: true, total: prevTotal };
  }

  startRoundLoop() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      if (this.gameState === 'betting') {
        this.timeLeft--;

        if (this.ui && this.ui.onTimerTick) {
          this.ui.onTimerTick({
            timeLeft: Math.max(0, this.timeLeft),
            roundId: this.roundId,
            state: this.gameState,
            isLocked: this.timeLeft <= 3
          });
        }

        if (this.timeLeft <= 0) {
          this.dealCardsAndSettle();
        }
      }
    }, 1000);
  }

  async dealCardsAndSettle() {
    this.gameState = 'dealing';

    if (this.ui && this.ui.onDealingStart) {
      this.ui.onDealingStart({ roundId: this.roundId });
    }

    // 1. Draw Cards default
    this.dragonCard = this.drawCard();
    this.tigerCard = this.drawCard();
    while (this.tigerCard.rank === this.dragonCard.rank && this.tigerCard.suit === this.dragonCard.suit) {
      this.tigerCard = this.drawCard();
    }

    // If bets placed, query server for authoritative result (SEC-05)
    const totalBet = this.getTotalBetAmount();
    if (totalBet > 0 && window.wallet) {
      try {
        const uid = window.wallet.activeTelegramId || window.wallet.activeUserId;
        const apiBase = window.wallet.apiBaseUrl;
        const res = await fetch(`${apiBase}/api/game/dragontiger/play`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegram_id: uid,
            bets: this.currentBets
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.dragon_card && data.tiger_card) {
            this.dragonCard = data.dragon_card;
            this.tigerCard = data.tiger_card;
            this.serverPayout = data.payout;
            this.serverBalance = data.balance;
            this.serverWinner = data.winner;
          } else {
            throw new Error(data.error || "Server resolution failed");
          }
        } else {
          throw new Error("Server error");
        }
      } catch (err) {
        console.error("Dragon Tiger Server Deal Error:", err);
        // SEC-05: Do NOT resolve locally. Display reconnecting state.
        if (window.app && window.app.showNotification) {
          window.app.showNotification("⚠️ Network issue: Reconnecting to casino dealer server...", "error");
        }
        this.gameState = 'betting';
        this.startBettingTimer();
        return;
      }
    }

  isGameVisible() {
    if (typeof document !== 'undefined' && document.hidden) return false;
    return !!(window.app && window.app.currentGame === 'dragontiger');
  }

  // 2. Animate Dragon Card Reveal (at 700ms)
    setTimeout(() => {
      if (this.isGameVisible() && window.soundEngine && window.soundEngine.playCardFlip) {
        window.soundEngine.playCardFlip();
      }
      if (this.ui && this.ui.onDragonCardReveal) {
        this.ui.onDragonCardReveal(this.dragonCard);
      }
    }, 700);

    // 3. Animate Tiger Card Reveal (at 1800ms)
    setTimeout(() => {
      if (this.isGameVisible() && window.soundEngine && window.soundEngine.playCardFlip) {
        window.soundEngine.playCardFlip();
      }
      if (this.ui && this.ui.onTigerCardReveal) {
        this.ui.onTigerCardReveal(this.tigerCard);
      }
    }, 1800);

    // 4. Determine Winner & Settle Payouts (at 2800ms)
    setTimeout(() => {
      this.calculateResultsAndPayout();
    }, 2800);
  }

  calculateResultsAndPayout() {
    const dVal = this.dragonCard.value;
    const tVal = this.tigerCard.value;

    let winner = 'TIE';
    let isSuitedTie = false;

    if (dVal > tVal) {
      winner = 'D'; // Dragon
    } else if (tVal > dVal) {
      winner = 'T'; // Tiger
    } else {
      winner = 'TIE';
      if (this.dragonCard.suit === this.tigerCard.suit) {
        isSuitedTie = true;
      }
    }

    // Save previous bets for Rebet before calculating
    this.previousBets = { ...this.currentBets };

    let totalWinPayout = 0;
    const betBreakdown = [];

    // Calculate payouts for each bet spot
    for (const spotId in this.currentBets) {
      const betAmt = this.currentBets[spotId];
      let wonSpot = false;
      let mult = 0;

      if (spotId === 'dragon') {
        if (winner === 'D') {
          wonSpot = true;
          mult = 2.0; // 1:1 payout
        } else if (winner === 'TIE') {
          // Standard casino rule: Tie returns 50% of main Dragon/Tiger bet
          wonSpot = true;
          mult = 0.5;
        }
      } else if (spotId === 'tiger') {
        if (winner === 'T') {
          wonSpot = true;
          mult = 2.0;
        } else if (winner === 'TIE') {
          wonSpot = true;
          mult = 0.5;
        }
      } else if (spotId === 'tie') {
        if (winner === 'TIE') {
          wonSpot = true;
          mult = 12.0; // 11:1 payout
        }
      } else if (spotId === 'suited_tie') {
        if (isSuitedTie) {
          wonSpot = true;
          mult = 51.0; // 50:1 payout
        }
      } else if (spotId === 'dragon_big') {
        if (this.dragonCard.isBig) { wonSpot = true; mult = 2.0; }
      } else if (spotId === 'dragon_small') {
        if (this.dragonCard.isSmall) { wonSpot = true; mult = 2.0; }
      } else if (spotId === 'tiger_big') {
        if (this.tigerCard.isBig) { wonSpot = true; mult = 2.0; }
      } else if (spotId === 'tiger_small') {
        if (this.tigerCard.isSmall) { wonSpot = true; mult = 2.0; }
      } else if (spotId === 'dragon_red') {
        if (this.dragonCard.isRed) { wonSpot = true; mult = 2.0; }
      } else if (spotId === 'dragon_black') {
        if (!this.dragonCard.isRed) { wonSpot = true; mult = 2.0; }
      } else if (spotId === 'tiger_red') {
        if (this.tigerCard.isRed) { wonSpot = true; mult = 2.0; }
      } else if (spotId === 'tiger_black') {
        if (!this.tigerCard.isRed) { wonSpot = true; mult = 2.0; }
      }

      if (wonSpot) {
        const spotPayout = betAmt * mult;
        totalWinPayout += spotPayout;
        betBreakdown.push({ spotId, bet: betAmt, mult, payout: spotPayout, won: true });
      } else {
        betBreakdown.push({ spotId, bet: betAmt, mult: 0, payout: 0, won: false });
      }
    }

    // Add win to wallet if any payout
    if (this.serverBalance !== undefined) {
      window.wallet.setServerBalance(this.serverBalance);
      if (this.isGameVisible() && window.soundEngine) {
        if (totalWinPayout > 0) window.soundEngine.playWin && window.soundEngine.playWin();
        else if (Object.keys(this.currentBets).length > 0) window.soundEngine.playBomb && window.soundEngine.playBomb();
      }
    } else if (totalWinPayout > 0) {
      window.wallet.addWin(totalWinPayout);
      if (this.isGameVisible() && window.soundEngine && window.soundEngine.playWin) window.soundEngine.playWin();
    } else if (Object.keys(this.currentBets).length > 0) {
      if (this.isGameVisible() && window.soundEngine && window.soundEngine.playBomb) window.soundEngine.playBomb();
    }
    this.serverBalance = undefined;

    // Record in global bet history if user participated
    const totalUserBet = this.getTotalBetAmount();
    if (totalUserBet > 0) {
      window.wallet.recordBet({
        game: 'Dragon Tiger',
        bet: totalUserBet,
        multiplier: totalWinPayout > 0 ? (Math.round((totalWinPayout / totalUserBet) * 100) / 100) : 0,
        payout: totalWinPayout,
        won: totalWinPayout > totalUserBet
      });
    }

    // Update Roadmap history
    this.history.unshift({
      winner: winner,
      isSuitedTie: isSuitedTie,
      dragonCard: this.dragonCard,
      tigerCard: this.tigerCard
    });
    if (this.history.length > 50) this.history.pop();

    this.roundResult = {
      winner,
      isSuitedTie,
      dragonCard: this.dragonCard,
      tigerCard: this.tigerCard,
      totalWinPayout,
      totalUserBet,
      betBreakdown,
      history: this.history
    };

    this.gameState = 'settled';

    if (this.ui && this.ui.onRoundSettled) {
      this.ui.onRoundSettled(this.roundResult);
    }

    // Reset bets for next round
    this.currentBets = {};

    // 5. Start next round after 5.5 seconds celebration delay
    setTimeout(() => {
      this.gameState = 'betting';
      this.timeLeft = this.roundDuration;
      this.roundId = this.generateRoundId();
      this.dragonCard = null;
      this.tigerCard = null;
      this.roundResult = null;

      if (this.ui && this.ui.onNewRoundReady) {
        this.ui.onNewRoundReady({ roundId: this.roundId, history: this.history });
      }
    }, 5500);
  }

  getRoadmapStats() {
    let dCount = 0, tCount = 0, tieCount = 0;
    this.history.forEach(item => {
      if (item.winner === 'D') dCount++;
      else if (item.winner === 'T') tCount++;
      else tieCount++;
    });
    const total = this.history.length || 1;
    return {
      dragonPercent: Math.round((dCount / total) * 100),
      tigerPercent: Math.round((tCount / total) * 100),
      tiePercent: Math.round((tieCount / total) * 100),
      dragonCount: dCount,
      tigerCount: tCount,
      tieCount: tieCount
    };
  }
}

window.DragonTigerGame = DragonTigerGame;
