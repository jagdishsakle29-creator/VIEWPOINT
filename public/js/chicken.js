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
    let baseCurves = {
      easy: [1.08, 1.18, 1.30, 1.45, 1.65, 1.90, 2.20, 2.60, 3.10, 3.75, 4.60, 5.70, 7.10, 8.90, 11.20, 14.20, 18.00, 23.00, 29.50, 38.00, 49.00, 64.00, 84.00, 110.00, 150.00],
      medium: [1.15, 1.35, 1.65, 2.10, 2.75, 3.70, 5.20, 7.50, 11.00, 16.50, 25.00, 39.00, 62.00, 100.00, 165.00, 280.00, 480.00, 850.00, 1500.00, 2800.00, 5200.00, 9800.00, 18500.00, 35000.00, 68000.00],
      hard: [1.30, 1.80, 2.60, 4.00, 6.50, 11.00, 20.00, 38.00, 75.00, 150.00, 310.00, 650.00, 1400.00, 3100.00, 7000.00, 16000.00, 38000.00, 90000.00, 210000.00, 500000.00, 1200000.00, 2900000.00, 7000000.00, 17000000.00, 42000000.00],
      daredevil: [1.50, 2.50, 4.50, 8.50, 18.00, 45.00, 120.00, 320.00, 900.00, 2600.00, 7800.00, 24000.00, 75000.00, 240000.00, 780000.00, 2600000.00, 8800000.00, 30000000.00, 100000000.00, 350000000.00, 1200000000.00, 4200000000.00, 15000000000.00, 55000000000.00, 200000000000.00]
    };

    const curve = baseCurves[this.difficulty] || baseCurves.medium;
    for (let i = 0; i < this.totalLanes; i++) {
      this.multipliers.push(curve[i] || Math.round((this.multipliers[this.multipliers.length - 1] * 1.3) * 100) / 100);
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

  async startGame(betAmount) {
    if (betAmount) {
      this.betAmount = parseFloat(betAmount);
    } else {
      const bInput = document.getElementById('betAmountInput');
      const p2Input = document.getElementById('p2ChickenBetInput');
      const val = parseFloat(bInput ? bInput.value : (p2Input ? p2Input.value : 10)) || 10;
      this.betAmount = Math.max(1, val);
    }
    if (this.isPlaying) return false;
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

    const depthFactor = (nextStep / this.totalLanes) * 0.22;
    const effectiveHazardRate = Math.min(0.85, this.hazardRate + depthFactor);
    let isHazard = Math.random() < effectiveHazardRate;

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
