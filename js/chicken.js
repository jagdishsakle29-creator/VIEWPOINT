/**
 * ====================================================================
 * CHICKEN ROAD CROSSING (HEN CROSS HIGHWAY) GAME ENGINE
 * Trending Hen Road Crossing with Server-Side Authoritative Hazard Validation
 * ====================================================================
 */

class ChickenGame {
  constructor(uiCallbacks) {
    this.ui = uiCallbacks || {};
    this.totalLanes = 25; // 25 highway lanes
    this.difficulty = 'medium'; // 'easy', 'medium', 'hard', 'daredevil'
    this.hazardRate = 0.25;
    this.hazardCount = 3;
    this.betAmount = 10.0;
    this.isPlaying = false;
    this.currentStep = 0;
    this.laneHazards = [];
    this.multipliers = [];
    this.currentMultiplier = 1.0;
    this.nextMultiplier = 1.25;
    this.roundId = null;
    this.serverSeedHash = '';
    this.lastActionTime = 0;
    this.apiBaseUrl = (window.APP_CONFIG && window.APP_CONFIG.getApiBaseUrl)
      ? window.APP_CONFIG.getApiBaseUrl()
      : ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:8000' : window.location.origin);
    this.generateMultiplierTable();
  }

  setDifficulty(diff) {
    if (this.isPlaying) return;
    this.difficulty = diff;
    if (diff === 'easy') { this.hazardRate = 0.15; this.hazardCount = 2; }
    else if (diff === 'medium') { this.hazardRate = 0.25; this.hazardCount = 4; }
    else if (diff === 'hard') { this.hazardRate = 0.35; this.hazardCount = 7; }
    else if (diff === 'daredevil') { this.hazardRate = 0.50; this.hazardCount = 10; }
    
    this.generateMultiplierTable();
    this.updateNextMultiplierPreview();
  }

  setBoneCount(val) {
    const num = parseInt(val) || 3;
    if (num <= 2) this.setDifficulty('easy');
    else if (num <= 5) this.setDifficulty('medium');
    else if (num <= 10) this.setDifficulty('hard');
    else this.setDifficulty('daredevil');
  }

  setBetAmount(amount) {
    if (this.isPlaying) return;
    this.betAmount = Math.max(1, parseFloat(amount) || 10.0);
    this.updateNextMultiplierPreview();
  }

  generateMultiplierTable() {
    this.multipliers = [1.0];
    const safeProbability = 1.0 - this.hazardRate;
    const houseEdge = 0.97;
    let mult = 1.0;

    const maxTarget = this.difficulty === 'hard' ? 270.0 : (this.difficulty === 'medium' ? 88.0 : 26.5);

    for (let i = 1; i <= this.totalLanes; i++) {
      mult = mult * (1.0 / safeProbability) * houseEdge;
      if (i === this.totalLanes) {
        mult = maxTarget;
      } else {
        mult = Math.min(maxTarget * (i / this.totalLanes), mult);
        mult = Math.min(265.0, mult);
      }
      this.multipliers.push(Math.round(mult * 100) / 100);
    }
  }

  getMultiplierForStep(step) {
    if (step <= 0) return 1.0;
    if (step >= this.multipliers.length) return this.multipliers[this.multipliers.length - 1];
    return this.multipliers[step];
  }

  updateNextMultiplierPreview() {
    this.nextMultiplier = this.getMultiplierForStep(this.currentStep + 1);
    if (this.ui && this.ui.onMultiplierUpdate) {
      this.ui.onMultiplierUpdate({
        current: this.currentMultiplier,
        next: this.nextMultiplier,
        profit: this.isPlaying ? (this.betAmount * this.currentMultiplier) : (this.betAmount * this.nextMultiplier),
        chickensFound: this.currentStep,
        totalChickens: this.totalLanes,
        step: this.currentStep,
        difficulty: this.difficulty
      });
    }
  }

  reset() {
    this.isPlaying = false;
    this.currentStep = 0;
    this.currentMultiplier = 1.0;
    this.roundId = null;
  }

  async startGame() {
    if (this.isPlaying) this.reset();
    if (!window.wallet.hasFunds(this.betAmount)) {
      if (this.ui && this.ui.onError) this.ui.onError("Insufficient balance! Please deposit to play.");
      return false;
    }

    this.isPlaying = true;
    this.currentStep = 0;
    this.currentMultiplier = 1.0;
    this.generateMultiplierTable();
    this.roundId = 'CHK-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);

    window.wallet.deduct(this.betAmount);
    window.soundEngine && window.soundEngine.playBet && window.soundEngine.playBet();

    const uid = window.wallet.activeUserId || window.wallet.activeTelegramId;
    try {
      const res = await fetch(`${this.apiBaseUrl}/api/games?action=chicken_start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': uid },
        body: JSON.stringify({
          action: 'chicken_start',
          userId: uid,
          betAmount: this.betAmount,
          hazardCount: this.hazardCount
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          this.roundId = data.roundId || data.round_id;
        }
      }
    } catch (e) {}

    this.saveActiveRoundSession();

    if (this.ui && this.ui.onGameStart) {
      this.ui.onGameStart({
        difficulty: this.difficulty,
        betAmount: this.betAmount,
        totalLanes: this.totalLanes
      });
    }

    this.updateNextMultiplierPreview();
    return true;
  }

  saveActiveRoundSession() {
    try {
      if (this.isPlaying && this.roundId) {
        sessionStorage.setItem('stake_active_round_chicken', JSON.stringify({
          roundId: this.roundId,
          betAmount: this.betAmount,
          difficulty: this.difficulty,
          hazardCount: this.hazardCount,
          currentStep: this.currentStep,
          currentMultiplier: this.currentMultiplier
        }));
      } else {
        sessionStorage.removeItem('stake_active_round_chicken');
      }
    } catch (e) {}
  }

  async restoreActiveRound() {
    try {
      const saved = sessionStorage.getItem('stake_active_round_chicken');
      let data = saved ? JSON.parse(saved) : null;

      if (!data) {
        const uid = window.wallet ? (window.wallet.activeUserId || window.wallet.activeTelegramId) : 'guest_default';
        const res = await fetch(`${this.apiBaseUrl}/api/games?action=get_active_round&gameType=chicken&userId=${uid}`).catch(() => null);
        if (res && res.ok) {
          const sData = await res.json();
          if (sData.success && sData.hasActiveRound) {
            data = sData;
          }
        }
      }

      if (data && data.roundId) {
        this.roundId = data.roundId;
        this.betAmount = parseFloat(data.betAmount) || 10;
        this.setDifficulty(data.difficulty || 'medium');
        this.currentStep = parseInt(data.currentStep || (data.revealedIndices ? data.revealedIndices.length : 0)) || 0;
        this.currentMultiplier = parseFloat(data.currentMultiplier) || this.getMultiplierForStep(this.currentStep);
        this.isPlaying = true;

        if (this.ui && this.ui.onGameStart) {
          this.ui.onGameStart({
            difficulty: this.difficulty,
            betAmount: this.betAmount,
            totalLanes: this.totalLanes
          });
        }

        if (this.ui && this.ui.onStepAdvance) {
          this.ui.onStepAdvance({
            step: this.currentStep,
            multiplier: this.currentMultiplier,
            safe: true
          });
        }

        this.updateNextMultiplierPreview();
        return true;
      }
    } catch (e) {
      console.warn("restoreActiveRound chicken error:", e);
    }
    return false;
  }

  async hopForward() {
    if (!this.isPlaying) return;

    const nextStep = this.currentStep + 1;
    if (nextStep > this.totalLanes) return;

    window.soundEngine && window.soundEngine.playChickenHop && window.soundEngine.playChickenHop();

    if (this.ui && this.ui.onHopAnimation) {
      this.ui.onHopAnimation(nextStep);
    }

    await new Promise(r => setTimeout(r, 220));

    const uid = window.wallet.activeUserId || window.wallet.activeTelegramId;
    let isHazard = Math.random() < this.hazardRate;

    try {
      const res = await fetch(`${this.apiBaseUrl}/api/games?action=chicken_reveal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': uid },
        body: JSON.stringify({
          action: 'chicken_reveal',
          roundId: this.roundId,
          tileIndex: nextStep - 1,
          userId: uid
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          isHazard = !!(data.isBomb || data.is_bomb);
        }
      }
    } catch (e) {}

    if (isHazard) {
      this.isPlaying = false;
      this.saveActiveRoundSession();
      window.soundEngine && window.soundEngine.playCarCrash && window.soundEngine.playCarCrash();

      if (this.ui && this.ui.onCarHit) {
        this.ui.onCarHit({
          lane: nextStep,
          lostAmount: this.betAmount,
          revealedHazards: this.laneHazards
        });
      }

      window.wallet.recordBet({
        game: 'Chicken Road',
        bet: this.betAmount,
        multiplier: 0,
        payout: 0,
        won: false
      });

      this.updateNextMultiplierPreview();
    } else {
      this.currentStep = nextStep;
      this.currentMultiplier = this.getMultiplierForStep(this.currentStep);
      this.saveActiveRoundSession();
      window.soundEngine && window.soundEngine.playChicken && window.soundEngine.playChicken(this.currentStep);

      const isJackpotFinish = this.currentStep === this.totalLanes;

      if (this.ui && this.ui.onSafeHop) {
        this.ui.onSafeHop({
          lane: this.currentStep,
          multiplier: this.currentMultiplier,
          currentWin: Math.round(this.betAmount * this.currentMultiplier * 100) / 100,
          nextMultiplier: this.getMultiplierForStep(this.currentStep + 1),
          isJackpotFinish: isJackpotFinish
        });
      }

      this.updateNextMultiplierPreview();

      if (isJackpotFinish) {
        this.cashOut(true);
      }
    }
  }

  async cashOut(isAuto = false) {
    if (!this.isPlaying || this.currentStep === 0) return;
    if (Date.now() - this.lastActionTime < 350) return;
    this.lastActionTime = Date.now();

    this.isPlaying = false;
    this.saveActiveRoundSession();
    let totalWin = Math.round(this.betAmount * this.currentMultiplier * 100) / 100;
    const profit = Math.round((totalWin - this.betAmount) * 100) / 100;

    const uid = window.wallet.activeUserId || window.wallet.activeTelegramId;
    try {
      const res = await fetch(`${this.apiBaseUrl}/api/games?action=chicken_cashout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': uid },
        body: JSON.stringify({
          action: 'chicken_cashout',
          roundId: this.roundId,
          userId: uid
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          totalWin = data.payout || totalWin;
          if (data.newBalance !== undefined) {
            window.wallet.setServerBalance(data.newBalance);
          } else {
            window.wallet.add(totalWin);
          }
        } else {
          window.wallet.add(totalWin);
        }
      } else {
        window.wallet.add(totalWin);
      }
    } catch (e) {
      window.wallet.add(totalWin);
    }

    window.soundEngine && window.soundEngine.playCashout && window.soundEngine.playCashout();

    if (this.ui && this.ui.onCashOut) {
      this.ui.onCashOut({
        winAmount: totalWin,
        profit: profit,
        multiplier: this.currentMultiplier,
        stepsCrossed: this.currentStep,
        revealedHazards: this.laneHazards
      });
    }

    window.wallet.recordBet({
      game: 'Chicken Road',
      bet: this.betAmount,
      multiplier: this.currentMultiplier,
      payout: totalWin,
      won: true
    });

    this.updateNextMultiplierPreview();
  }
}

window.ChickenGame = ChickenGame;
