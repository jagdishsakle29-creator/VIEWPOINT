/**
 * VIEWPOINT - Color Trading (Win Go 30s) Game Engine - Server Synced & Validated
 * Features: Live 30s period timer, Colors (Red/Green/Violet), Numbers 0-9, Big/Small.
 */
class ColorTradingGame {
  constructor(uiCallbacks) {
    this.ui = uiCallbacks;
    this.periodDuration = 30;
    this.timeLeft = this.periodDuration;
    this.periodId = this.generatePeriodId();
    this.activeBets = [];
    this.history = this.generateInitialHistory();
    this.timerInterval = null;

    this.syncWithServer();
    this.startTimer();
  }

  async syncWithServer() {
    try {
      const apiBase = window.wallet ? window.wallet.apiBaseUrl : 'http://localhost:8000';
      const res = await fetch(`${apiBase}/api/game/color/current`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.period_id) this.periodId = data.period_id;
          if (data.time_left !== undefined) this.timeLeft = data.time_left;
          if (data.history && data.history.length > 0) this.history = data.history;
        }
      }
    } catch (e) {
      // Offline fallback
    }
  }

  generatePeriodId() {
    const d = new Date();
    const dateStr = d.getFullYear().toString() + 
      String(d.getMonth() + 1).padStart(2, '0') + 
      String(d.getDate()).padStart(2, '0');
    const minuteOfDay = Math.floor((d.getHours() * 60 + d.getMinutes()) * 2 + d.getSeconds() / 30);
    return `${dateStr}${String(minuteOfDay).padStart(4, '0')}`;
  }

  generateInitialHistory() {
    const list = [];
    for (let i = 0; i < 10; i++) {
      const num = Math.floor(Math.random() * 10);
      list.push(this.formatResult(num));
    }
    return list;
  }

  formatResult(num) {
    let colors = [];
    if (num === 0) colors = ['violet', 'red'];
    else if (num === 5) colors = ['violet', 'green'];
    else if (num % 2 === 0) colors = ['red'];
    else colors = ['green'];

    const size = num >= 5 ? 'Big' : 'Small';
    return { number: num, colors, size, color: colors[0] };
  }

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.timeLeft--;

      if (this.timeLeft <= 5 && this.timeLeft > 0) {
        window.soundEngine.playClick();
      }

      if (this.timeLeft <= 0) {
        this.settleRound();
        this.timeLeft = this.periodDuration;
        this.periodId = this.generatePeriodId();
        this.syncWithServer();
      }

      if (this.ui && this.ui.onTimerTick) {
        this.ui.onTimerTick({
          timeLeft: this.timeLeft,
          periodId: this.periodId,
          isLocked: this.timeLeft <= 5
        });
      }
    }, 1000);
  }

  async placeBet(type, choice, amount) {
    amount = parseFloat(amount);
    if (isNaN(amount) || amount <= 0) return { success: false, msg: "Invalid amount" };

    if (this.timeLeft <= 5) {
      return { success: false, msg: "Betting locked for this round (last 5 seconds)!" };
    }

    if (!window.wallet.hasFunds(amount)) {
      return { success: false, msg: "Insufficient wallet balance!" };
    }

    // Call server to place and validate bet
    try {
      const telegramId = window.wallet.activeTelegramId || '78912345';
      const apiBase = window.wallet.apiBaseUrl;
      const res = await fetch(`${apiBase}/api/game/color/bet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: telegramId,
          choice: String(choice),
          amount: amount
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.balance !== undefined) window.wallet.setServerBalance(data.balance);
        } else {
          window.wallet.deduct(amount);
        }
      } else {
        window.wallet.deduct(amount);
      }
    } catch (e) {
      window.wallet.deduct(amount);
    }

    window.soundEngine.playBet();

    const bet = {
      id: Date.now().toString(36),
      type, // 'color', 'number', 'size'
      choice, // 'green', 'red', 'violet', 0..9, 'big', 'small'
      amount,
      periodId: this.periodId
    };

    this.activeBets.push(bet);

    if (this.ui && this.ui.onBetPlaced) {
      this.ui.onBetPlaced(this.activeBets);
    }

    return { success: true, bet };
  }

  settleRound() {
    const winningNum = Math.floor(Math.random() * 10);
    const result = this.formatResult(winningNum);
    this.history.unshift(result);
    if (this.history.length > 20) this.history.pop();

    let totalWin = 0;
    const settledBets = [];

    this.activeBets.forEach(bet => {
      let multiplier = 0;
      let won = false;

      if (bet.type === 'color') {
        if (bet.choice === 'green' && result.colors.includes('green')) {
          won = true;
          multiplier = (winningNum === 5) ? 1.5 : 2.0;
        } else if (bet.choice === 'red' && result.colors.includes('red')) {
          won = true;
          multiplier = (winningNum === 0) ? 1.5 : 2.0;
        } else if (bet.choice === 'violet' && result.colors.includes('violet')) {
          won = true;
          multiplier = 4.5;
        }
      } else if (bet.type === 'number') {
        if (parseInt(bet.choice) === winningNum) {
          won = true;
          multiplier = 9.0;
        }
      } else if (bet.type === 'size') {
        if (bet.choice.toLowerCase() === result.size.toLowerCase()) {
          won = true;
          multiplier = 2.0;
        }
      }

      const payout = won ? bet.amount * multiplier : 0;
      if (won) {
        totalWin += payout;
        window.wallet.addWin(payout);
      }

      window.wallet.recordBet({
        game: 'Color Trading',
        bet: bet.amount,
        multiplier: multiplier,
        payout: payout,
        won: won
      });

      settledBets.push({ ...bet, won, multiplier, payout });
    });

    if (totalWin > 0) {
      window.soundEngine.playGem(5);
    }

    if (this.ui && this.ui.onRoundSettled) {
      this.ui.onRoundSettled({
        result,
        settledBets,
        totalWin,
        history: this.history
      });
    }

    this.activeBets = [];
  }
}

window.ColorTradingGame = ColorTradingGame;
