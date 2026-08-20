/**
 * ====================================================================
 * CHICKEN ROAD CROSSING (HEN CROSS HIGHWAY) GAME ENGINE
 * Trending Hen Road Crossing with Dynamic Highway Multipliers & Physics
 * ====================================================================
 */

class ChickenGame {
  constructor(uiCallbacks) {
    this.ui = uiCallbacks || {};
    this.totalLanes = 25; // 25 highway lanes
    this.difficulty = 'medium'; // 'easy', 'medium', 'hard', 'daredevil'
    this.hazardRate = 0.25; // 25% hazard chance on medium
    this.betAmount = 10.0;
    this.isPlaying = false;
    this.currentStep = 0; // 0 = start curb, 1..25 = highway lanes
    this.laneHazards = []; // true if lane has car hazard, false if safe
    this.multipliers = [];
    this.currentMultiplier = 1.0;
    this.nextMultiplier = 1.25;
    this.roundId = null;
    this.serverSeedHash = '';
    this.generateMultiplierTable();
  }

  setDifficulty(diff) {
    if (this.isPlaying) return;
    this.difficulty = diff;
    if (diff === 'easy') this.hazardRate = 0.15; // 85% safe
    else if (diff === 'medium') this.hazardRate = 0.25; // 75% safe
    else if (diff === 'hard') this.hazardRate = 0.35; // 65% safe
    else if (diff === 'daredevil') this.hazardRate = 0.50; // 50% safe (crazy multipliers!)
    
    this.generateMultiplierTable();
    this.updateNextMultiplierPreview();
  }

  setBoneCount(val) {
    // Backward compatibility with previous bone count selector
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
    const houseEdge = 0.97; // 3% house edge
    let mult = 1.0;

    // Hard max multiplier target capped at 270x (not 600x)
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
  }

  startGame() {
    if (this.isPlaying) this.reset();
    if (!window.wallet.hasFunds(this.betAmount)) {
      if (this.ui.onError) this.ui.onError("Insufficient balance! Please deposit to play.");
      return false;
    }

    this.isPlaying = true;
    this.currentStep = 0;
    this.currentMultiplier = 1.0;
    this.generateMultiplierTable();
    this.generateLaneHazards();

    // Deduct bet from wallet
    window.wallet.deduct(this.betAmount);
    window.soundEngine.playBet();

    if (this.ui.onGameStart) {
      this.ui.onGameStart({
        betAmount: this.betAmount,
        difficulty: this.difficulty,
        totalLanes: this.totalLanes,
        multipliers: this.multipliers
      });
    }

    this.updateNextMultiplierPreview();
    return true;
  }

  generateLaneHazards() {
    this.laneHazards = [];
    for (let i = 0; i < this.totalLanes; i++) {
      const isHazard = Math.random() < this.hazardRate;
      this.laneHazards.push(isHazard);
    }
  }

  // Jump Hen to the next highway lane
  async hopForward() {
    if (!this.isPlaying) return;

    const nextStep = this.currentStep + 1;
    if (nextStep > this.totalLanes) return;

    window.soundEngine.playChickenHop();
    const isHazard = this.laneHazards[nextStep - 1];

    if (this.ui.onHopAnimation) {
      this.ui.onHopAnimation(nextStep);
    }

    // Short hop delay for physics
    await new Promise(r => setTimeout(r, 220));

    if (isHazard) {
      // CAR HIT / SQUISH!
      this.isPlaying = false;
      window.soundEngine.playCarCrash();

      if (this.ui.onCarHit) {
        this.ui.onCarHit({
          lane: nextStep,
          lostAmount: this.betAmount,
          revealedHazards: this.laneHazards
        });
      }

      window.wallet.recordHistory({
        game: 'Chicken Road',
        bet: this.betAmount,
        multiplier: 0,
        win: 0,
        result: 'lost',
        details: `Hit by speeding car on Lane ${nextStep} (${this.difficulty})`
      });

      this.updateNextMultiplierPreview();
    } else {
      // SAFE CROSSING!
      this.currentStep = nextStep;
      this.currentMultiplier = this.getMultiplierForStep(this.currentStep);
      window.soundEngine.playChicken(this.currentStep);

      const isJackpotFinish = this.currentStep === this.totalLanes;

      if (this.ui.onSafeHop) {
        this.ui.onSafeHop({
          lane: this.currentStep,
          multiplier: this.currentMultiplier,
          currentWin: Math.round(this.betAmount * this.currentMultiplier * 100) / 100,
          nextMultiplier: this.getMultiplierForStep(this.currentStep + 1),
          isJackpotFinish: isJackpotFinish
        });
      }

      this.updateNextMultiplierPreview();

      // Auto-cashout if reached the 25th finish line trophy!
      if (isJackpotFinish) {
        this.cashOut();
      }
    }
  }

  cashOut() {
    if (!this.isPlaying || this.currentStep === 0) return;

    this.isPlaying = false;
    const totalWin = Math.round(this.betAmount * this.currentMultiplier * 100) / 100;
    const profit = Math.round((totalWin - this.betAmount) * 100) / 100;

    window.wallet.add(totalWin);
    window.soundEngine.playCashout();

    if (this.ui.onCashOut) {
      this.ui.onCashOut({
        winAmount: totalWin,
        profit: profit,
        multiplier: this.currentMultiplier,
        stepsCrossed: this.currentStep,
        revealedHazards: this.laneHazards
      });
    }

    window.wallet.recordHistory({
      game: 'Chicken Road',
      bet: this.betAmount,
      multiplier: this.currentMultiplier,
      win: totalWin,
      result: 'won',
      details: `Safely crossed ${this.currentStep} lanes (${this.currentMultiplier}x)`
    });

    this.updateNextMultiplierPreview();
  }
}

window.ChickenGame = ChickenGame;
