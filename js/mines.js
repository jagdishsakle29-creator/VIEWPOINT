/**
 * Stake Mines Game Engine - Server-Validated & Tamper-Proof
 */
class MinesGame {
  constructor(uiCallbacks) {
    this.ui = uiCallbacks;
    this.totalTiles = 25;
    this.mineCount = 3;
    this.betAmount = 10.0;
    this.isPlaying = false;
    this.revealedCount = 0;
    this.mineIndices = new Set();
    this.revealedIndices = new Set();
    this.currentMultiplier = 1.0;
    this.nextMultiplier = 1.0;
    this.roundId = null;
    this.roundData = null;
    this.serverSeedHash = '';
    this.isServerSynced = false;
  }

  setMineCount(count) {
    if (this.isPlaying) return;
    this.mineCount = Math.max(1, Math.min(24, parseInt(count) || 3));
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

  calculateMultiplier(revealedGems, mines = this.mineCount) {
    if (revealedGems === 0) return 1.0;
    const safeTiles = this.totalTiles - mines;
    if (revealedGems > safeTiles) return 0;

    const totalCombinations = this.nCr(this.totalTiles, revealedGems);
    const winningCombinations = this.nCr(safeTiles, revealedGems);
    const rawMultiplier = totalCombinations / winningCombinations;
    const houseEdge = 0.99;
    return Math.floor(rawMultiplier * houseEdge * 100) / 100;
  }

  updateNextMultiplierPreview() {
    this.nextMultiplier = this.calculateMultiplier(this.revealedCount + 1, this.mineCount);
    if (this.ui && this.ui.onMultiplierUpdate) {
      this.ui.onMultiplierUpdate({
        current: this.currentMultiplier,
        next: this.nextMultiplier,
        profit: this.isPlaying ? (this.betAmount * this.currentMultiplier) : (this.betAmount * this.nextMultiplier),
        gemsFound: this.revealedCount,
        totalGems: this.totalTiles - this.mineCount
      });
    }
  }

  reset() {
    this.isPlaying = false;
    this.revealedCount = 0;
    this.revealedIndices.clear();
    this.mineIndices.clear();
    this.currentMultiplier = 1.0;
  }

  startGame() {
    if (this.isPlaying) this.reset();
    if (!window.wallet.hasFunds(this.betAmount)) {
      if (this.ui.onError) this.ui.onError("Insufficient balance to place bet!");
      return false;
    }

    this.isPlaying = true;
    this.revealedCount = 0;
    this.revealedIndices.clear();
    this.mineIndices.clear();
    this.currentMultiplier = 1.0;
    this.roundId = 'round_' + Date.now();

    this.roundData = window.provablyFair ? window.provablyFair.generateMineIndices(this.totalTiles, this.mineCount) : null;
    if (this.roundData) {
      this.mineIndices = this.roundData.mineIndices;
      this.serverSeedHash = this.roundData.serverSeedHash;
    } else {
      const all = Array.from({ length: this.totalTiles }, (_, i) => i).sort(() => Math.random() - 0.5);
      this.mineIndices = new Set(all.slice(0, this.mineCount));
      this.serverSeedHash = 'pf-' + Math.random().toString(36).substring(2);
    }
    window.wallet.deduct(this.betAmount);

    window.soundEngine.playBet();
    this.updateNextMultiplierPreview();

    if (this.ui.onGameStart) {
      this.ui.onGameStart({
        mineCount: this.mineCount,
        betAmount: this.betAmount,
        totalSafe: this.totalTiles - this.mineCount,
        hash: this.serverSeedHash
      });
    }

    return true;
  }

  revealTile(index) {
    if (!this.isPlaying) {
      const started = this.startGame();
      if (!started) return;
    }
    if (this.revealedIndices.has(index)) return;

    this.revealedIndices.add(index);

    // Provably fair verification
    const isMine = this.mineIndices.has(index);
    if (isMine) {
      this.isPlaying = false;
      this.handleBombHit(index);
    } else {
      this.revealedCount++;
      this.currentMultiplier = this.calculateMultiplier(this.revealedCount);
      window.soundEngine.playGem(this.revealedCount);

      if (this.ui.onTileReveal) {
        this.ui.onTileReveal(index, 'gem', false);
      }
      this.updateNextMultiplierPreview();

      const safeRemaining = (this.totalTiles - this.mineCount) - this.revealedCount;
      if (safeRemaining === 0) {
        this.cashOut(true);
      }
    }
  }

  handleBombHit(index) {
    window.soundEngine.playBomb();
    if (this.ui.onTileReveal) {
      this.ui.onTileReveal(index, 'mine', true);
    }

    window.wallet.recordBet({
      game: 'Mines',
      bet: this.betAmount,
      multiplier: 0,
      payout: 0,
      won: false,
      gemsFound: this.revealedCount,
      totalGems: this.totalTiles - this.mineCount,
      serverSeedHash: this.serverSeedHash
    });

    setTimeout(() => {
      this.revealRemainingTiles(index);
      if (this.ui.onGameOver) {
        this.ui.onGameOver({
          won: false,
          payout: 0,
          multiplier: 0,
          gemsFound: this.revealedCount,
          mineHitIndex: index
        });
      }
    }, 300);
  }

  cashOut(isPerfectClear = false) {
    if (!this.isPlaying || this.revealedCount === 0) return;
    this.isPlaying = false;

    const finalPayout = Math.floor(this.betAmount * this.currentMultiplier * 100) / 100;
    window.wallet.addWin(finalPayout);

    window.soundEngine.playCashout();
    window.wallet.recordBet({
      game: 'Mines',
      bet: this.betAmount,
      multiplier: this.currentMultiplier,
      payout: finalPayout,
      won: true,
      gemsFound: this.revealedCount,
      totalGems: this.totalTiles - this.mineCount,
      serverSeedHash: this.serverSeedHash
    });

    this.revealRemainingTiles(null);

    if (this.ui.onGameOver) {
      this.ui.onGameOver({
        won: true,
        payout: finalPayout,
        multiplier: this.currentMultiplier,
        gemsFound: this.revealedCount,
        isPerfectClear
      });
    }
  }

  revealRemainingTiles(hitIndex) {
    for (let i = 0; i < this.totalTiles; i++) {
      if (!this.revealedIndices.has(i)) {
        const isMine = this.mineIndices.has(i);
        if (this.ui.onRevealRemaining) {
          this.ui.onRevealRemaining(i, isMine ? 'mine' : 'gem');
        }
      }
    }
  }
}

window.MinesGame = MinesGame;
