/**
 * Stake/Mystake Chicken Game Engine
 * 5x5 Grid with 25 silver dishes / cloches. Uncover roasted chicken drumsticks or bones!
 */
class ChickenGame {
  constructor(uiCallbacks) {
    this.ui = uiCallbacks;
    this.totalTiles = 25;
    this.boneCount = 3;
    this.betAmount = 10.0;
    this.isPlaying = false;
    this.revealedCount = 0;
    this.boneIndices = new Set();
    this.revealedIndices = new Set();
    this.currentMultiplier = 1.0;
    this.nextMultiplier = 1.0;
    this.roundData = null;
  }

  setBoneCount(count) {
    if (this.isPlaying) return;
    this.boneCount = Math.max(1, Math.min(24, parseInt(count) || 3));
    this.updateNextMultiplierPreview();
  }

  setBetAmount(amount) {
    if (this.isPlaying) return;
    this.betAmount = Math.max(0.01, parseFloat(amount) || 1.0);
  }

  nCr(n, r) {
    if (r < 0 || r > n) return 0;
    if (r === 0 || r === n) return 1;
    if (r > n / 2) r = n - r;
    let res = 1;
    for (let i = 1; i <= r; i++) {
      res = (res * (n - i + 1)) / i;
    }
    return res;
  }

  calculateMultiplier(revealedChickens, bones = this.boneCount) {
    if (revealedChickens === 0) return 1.0;
    const safeChickens = this.totalTiles - bones;
    if (revealedChickens > safeChickens) return 0;

    const totalCombinations = this.nCr(this.totalTiles, revealedChickens);
    const winningCombinations = this.nCr(safeChickens, revealedChickens);
    const rawMultiplier = totalCombinations / winningCombinations;
    const houseEdge = 0.99;
    return Math.floor(rawMultiplier * houseEdge * 100) / 100;
  }

  updateNextMultiplierPreview() {
    this.nextMultiplier = this.calculateMultiplier(this.revealedCount + 1, this.boneCount);
    if (this.ui && this.ui.onMultiplierUpdate) {
      this.ui.onMultiplierUpdate({
        current: this.currentMultiplier,
        next: this.nextMultiplier,
        profit: this.isPlaying ? (this.betAmount * this.currentMultiplier) : (this.betAmount * this.nextMultiplier),
        chickensFound: this.revealedCount,
        totalChickens: this.totalTiles - this.boneCount
      });
    }
  }

  startGame() {
    if (this.isPlaying) return;
    if (!window.wallet.hasFunds(this.betAmount)) {
      if (this.ui.onError) this.ui.onError("Insufficient balance to place bet!");
      return false;
    }

    // Generate fair bones synchronously first
    this.roundData = window.provablyFair.generateMineIndices(this.totalTiles, this.boneCount);
    this.boneIndices = this.roundData.mineIndices;

    window.wallet.deduct(this.betAmount);
    window.soundEngine.playBet();

    this.isPlaying = true;
    this.revealedCount = 0;
    this.revealedIndices.clear();
    this.currentMultiplier = 1.0;

    this.updateNextMultiplierPreview();

    if (this.ui.onGameStart) {
      this.ui.onGameStart({
        boneCount: this.boneCount,
        betAmount: this.betAmount,
        totalSafe: this.totalTiles - this.boneCount
      });
    }

    return true;
  }

  async revealDish(index) {
    if (!this.isPlaying) {
      const started = this.startGame();
      if (!started) return;
    }
    if (this.revealedIndices.has(index)) return;

    this.revealedIndices.add(index);
    const isBone = this.boneIndices.has(index);

    if (isBone) {
      // Hit a bone -> LOSE
      this.isPlaying = false;
      window.soundEngine.playBone();

      if (this.ui.onDishReveal) {
        this.ui.onDishReveal(index, 'bone', true);
      }

      window.wallet.recordBet({
        game: 'Chicken',
        bet: this.betAmount,
        multiplier: 0,
        payout: 0,
        won: false,
        gemsFound: this.revealedCount,
        totalGems: this.totalTiles - this.boneCount,
        serverSeedHash: this.roundData ? this.roundData.serverSeedHash : ''
      });

      setTimeout(() => {
        this.revealRemainingDishes(index);
        if (this.ui.onGameOver) {
          this.ui.onGameOver({
            won: false,
            payout: 0,
            multiplier: 0,
            chickensFound: this.revealedCount,
            boneHitIndex: index
          });
        }
      }, 300);

    } else {
      // Uncovered Chicken -> CONTINUE
      this.revealedCount++;
      this.currentMultiplier = this.calculateMultiplier(this.revealedCount);
      window.soundEngine.playChicken(this.revealedCount);

      if (this.ui.onDishReveal) {
        this.ui.onDishReveal(index, 'chicken', false);
      }

      this.updateNextMultiplierPreview();

      const safeRemaining = (this.totalTiles - this.boneCount) - this.revealedCount;
      if (safeRemaining === 0) {
        this.cashOut(true);
      }
    }
  }

  cashOut(isPerfectClear = false) {
    if (!this.isPlaying || this.revealedCount === 0) return;

    this.isPlaying = false;
    const finalPayout = Math.floor(this.betAmount * this.currentMultiplier * 100) / 100;
    window.wallet.addWin(finalPayout);
    window.soundEngine.playCashout();

    window.wallet.recordBet({
      game: 'Chicken',
      bet: this.betAmount,
      multiplier: this.currentMultiplier,
      payout: finalPayout,
      won: true,
      gemsFound: this.revealedCount,
      totalGems: this.totalTiles - this.boneCount,
      serverSeedHash: this.roundData ? this.roundData.serverSeedHash : ''
    });

    this.revealRemainingDishes(null);

    if (this.ui.onGameOver) {
      this.ui.onGameOver({
        won: true,
        payout: finalPayout,
        multiplier: this.currentMultiplier,
        chickensFound: this.revealedCount,
        isPerfectClear
      });
    }
  }

  revealRemainingDishes(hitIndex) {
    for (let i = 0; i < this.totalTiles; i++) {
      if (!this.revealedIndices.has(i)) {
        const isBone = this.boneIndices.has(i);
        if (this.ui.onRevealRemaining) {
          this.ui.onRevealRemaining(i, isBone ? 'bone' : 'chicken');
        }
      }
    }
  }
}

window.ChickenGame = ChickenGame;
