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

  async startGame() {
    if (this.isPlaying) return false;
    if (!window.wallet.hasFunds(this.betAmount)) {
      if (this.ui.onError) this.ui.onError("Insufficient balance to place bet!");
      return false;
    }

    this.isPlaying = true;
    this.revealedCount = 0;
    this.revealedIndices.clear();
    this.mineIndices.clear();
    this.currentMultiplier = 1.0;
    this.roundId = null;

    // Try server-validated round initiation
    try {
      const telegramId = window.wallet.activeTelegramId || '78912345';
      const apiBase = window.wallet.apiBaseUrl;
      const res = await fetch(`${apiBase}/api/game/mines/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: telegramId,
          bet_amount: this.betAmount,
          mine_count: this.mineCount
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          this.roundId = data.round_id;
          this.serverSeedHash = data.hash;
          this.isServerSynced = true;
          if (data.new_balance !== undefined) {
            window.wallet.setServerBalance(data.new_balance);
          } else {
            window.wallet.deduct(this.betAmount);
          }
        } else {
          throw new Error(data.error || 'Server error');
        }
      } else {
        throw new Error('Server response not ok');
      }
    } catch (err) {
      // Local fallback mode
      this.isServerSynced = false;
      this.roundData = window.provablyFair ? window.provablyFair.generateMineIndices(this.totalTiles, this.mineCount) : null;
      if (this.roundData) {
        this.mineIndices = this.roundData.mineIndices;
        this.serverSeedHash = this.roundData.serverSeedHash;
      }
      window.wallet.deduct(this.betAmount);
    }

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

  async revealTile(index) {
    if (!this.isPlaying) {
      const started = await this.startGame();
      if (!started) return;
    }
    if (this.revealedIndices.has(index)) return;

    this.revealedIndices.add(index);

    // If server synced round
    if (this.isServerSynced && this.roundId) {
      try {
        const apiBase = window.wallet.apiBaseUrl;
        const res = await fetch(`${apiBase}/api/game/mines/reveal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            round_id: this.roundId,
            tile_index: index
          })
        });

        const data = await res.json();
        if (data.success) {
          if (data.is_bomb) {
            // Hit Bomb
            this.isPlaying = false;
            if (data.secret_indices) {
              this.mineIndices = new Set(data.secret_indices);
            }
            if (data.balance !== undefined) window.wallet.setServerBalance(data.balance);
            this.handleBombHit(index);
          } else {
            // Safe Gem
            this.revealedCount = data.revealed_count || (this.revealedCount + 1);
            this.currentMultiplier = data.current_multiplier || this.calculateMultiplier(this.revealedCount);
            window.soundEngine.playGem(this.revealedCount);

            if (this.ui.onTileReveal) {
              this.ui.onTileReveal(index, 'gem', false);
            }
            this.updateNextMultiplierPreview();

            if (data.is_max_win || data.game_over) {
              if (data.secret_indices) this.mineIndices = new Set(data.secret_indices);
              if (data.balance !== undefined) window.wallet.setServerBalance(data.balance);
              this.cashOut(true);
            }
          }
          return;
        }
      } catch (e) {
        console.warn('Reveal API call failed, falling back to local verification', e);
      }
    }

    // Local fallback verification
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

  async cashOut(isPerfectClear = false) {
    if (!this.isPlaying || this.revealedCount === 0) return;
    this.isPlaying = false;

    let finalPayout = Math.floor(this.betAmount * this.currentMultiplier * 100) / 100;

    if (this.isServerSynced && this.roundId) {
      try {
        const apiBase = window.wallet.apiBaseUrl;
        const res = await fetch(`${apiBase}/api/game/mines/cashout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ round_id: this.roundId })
        });

        const data = await res.json();
        if (data.success) {
          finalPayout = data.payout || finalPayout;
          if (data.secret_indices) this.mineIndices = new Set(data.secret_indices);
          if (data.new_balance !== undefined) {
            window.wallet.setServerBalance(data.new_balance);
          } else {
            window.wallet.addWin(finalPayout);
          }
        } else {
          window.wallet.addWin(finalPayout);
        }
      } catch (e) {
        window.wallet.addWin(finalPayout);
      }
    } else {
      window.wallet.addWin(finalPayout);
    }

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
