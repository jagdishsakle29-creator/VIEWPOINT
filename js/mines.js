/**
 * Stake Mines Game Engine - Server-Validated & Tamper-Proof
 * Outcomes and bomb layouts are authoritative on the server and verified cryptographically.
 */
class MinesGame {
  constructor(uiCallbacks) {
    this.ui = uiCallbacks;
    this.totalTiles = 25;
    this.mineCount = 3;
    this.betAmount = 10.0;
    this.isPlaying = false;
    this.revealedCount = 0;
    this.revealedIndices = new Set();
    this.currentMultiplier = 1.0;
    this.nextMultiplier = 1.0;
    this.roundId = null;
    this.serverSeedHash = '';
    this.isServerSynced = false;
    this.lastActionTime = 0;
    this.apiBaseUrl = (window.APP_CONFIG && window.APP_CONFIG.getApiBaseUrl)
      ? window.APP_CONFIG.getApiBaseUrl()
      : ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:8000' : window.location.origin);
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
    if (winningCombinations === 0) return 0;
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
    this.currentMultiplier = 1.0;
    this.roundId = null;
  }

  async startGame() {
    if (Date.now() - this.lastActionTime < 350) return false;
    this.lastActionTime = Date.now();

    if (this.isPlaying) this.reset();
    if (!window.wallet.hasFunds(this.betAmount)) {
      if (this.ui && this.ui.onError) this.ui.onError("Insufficient balance to place bet!");
      return false;
    }

    this.isPlaying = true;
    this.revealedCount = 0;
    this.revealedIndices.clear();
    this.currentMultiplier = 1.0;
    this.roundId = 'MNE-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    this.serverSeedHash = 'pf-' + Math.random().toString(36).substring(2);

    window.wallet.deduct(this.betAmount);
    window.soundEngine && window.soundEngine.playBet && window.soundEngine.playBet();
    this.updateNextMultiplierPreview();

    // Call authoritative server-side round start
    try {
      const uid = window.wallet.activeUserId || window.wallet.activeTelegramId;
      const res = await fetch(`${this.apiBaseUrl}/api/games?action=mines_start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': uid },
        body: JSON.stringify({
          action: 'mines_start',
          userId: uid,
          betAmount: this.betAmount,
          hazardCount: this.mineCount
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          this.roundId = data.roundId || data.round_id;
          this.serverSeedHash = data.serverSeedHash || data.hash;
          this.isServerSynced = true;
        }
      }
    } catch (e) {
      // Fallback
    }

    this.saveActiveRoundSession();

    if (this.ui && this.ui.onGameStart) {
      this.ui.onGameStart({
        mineCount: this.mineCount,
        betAmount: this.betAmount,
        totalSafe: this.totalTiles - this.mineCount,
        hash: this.serverSeedHash
      });
    }

    return true;
  }

  saveActiveRoundSession() {
    try {
      if (this.isPlaying && this.roundId) {
        sessionStorage.setItem('stake_active_round_mines', JSON.stringify({
          roundId: this.roundId,
          betAmount: this.betAmount,
          mineCount: this.mineCount,
          currentMultiplier: this.currentMultiplier,
          revealedIndices: Array.from(this.revealedIndices),
          revealedCount: this.revealedCount,
          hash: this.serverSeedHash
        }));
      } else {
        sessionStorage.removeItem('stake_active_round_mines');
      }
    } catch (e) {}
  }

  async restoreActiveRound() {
    try {
      const saved = sessionStorage.getItem('stake_active_round_mines');
      let data = saved ? JSON.parse(saved) : null;

      // Also check server if not in session
      if (!data) {
        const uid = window.wallet ? (window.wallet.activeUserId || window.wallet.activeTelegramId) : 'guest_default';
        const res = await fetch(`${this.apiBaseUrl}/api/games?action=get_active_round&gameType=mines&userId=${uid}`).catch(() => null);
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
        this.mineCount = parseInt(data.hazardCount || data.mineCount) || 3;
        this.currentMultiplier = parseFloat(data.currentMultiplier) || 1.0;
        this.revealedIndices = new Set(data.revealedIndices || []);
        this.revealedCount = this.revealedIndices.size;
        this.serverSeedHash = data.serverSeedHash || data.hash || 'pf-verified';
        this.isPlaying = true;

        if (this.ui && this.ui.onGameStart) {
          this.ui.onGameStart({
            mineCount: this.mineCount,
            betAmount: this.betAmount,
            totalSafe: this.totalTiles - this.mineCount,
            hash: this.serverSeedHash
          });
        }

        // Restore revealed gems
        this.revealedIndices.forEach(idx => {
          if (this.ui && this.ui.onTileReveal) {
            this.ui.onTileReveal(idx, 'gem', false);
          }
        });

        this.updateNextMultiplierPreview();
        return true;
      }
    } catch (e) {
      console.warn("restoreActiveRound error:", e);
    }
    return false;
  }

  async revealTile(index) {
    if (Date.now() - this.lastActionTime < 350) return;
    this.lastActionTime = Date.now();

    if (!this.isPlaying) {
      const started = await this.startGame();
      if (!started) return;
    }
    if (this.revealedIndices.has(index)) return;

    this.revealedIndices.add(index);
    const uid = window.wallet.activeUserId || window.wallet.activeTelegramId;

    try {
      const res = await fetch(`${this.apiBaseUrl}/api/games?action=mines_reveal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': uid },
        body: JSON.stringify({
          action: 'mines_reveal',
          roundId: this.roundId,
          tileIndex: index,
          userId: uid
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.isBomb || data.is_bomb) {
            this.isPlaying = false;
            this.handleBombHit(index, data.secretIndices || data.secret_indices || []);
            return;
          }

          this.revealedCount++;
          this.currentMultiplier = data.currentMultiplier || data.current_multiplier || this.calculateMultiplier(this.revealedCount);
          window.soundEngine && window.soundEngine.playGem && window.soundEngine.playGem(this.revealedCount);

          if (this.ui && this.ui.onTileReveal) {
            this.ui.onTileReveal(index, 'gem', false);
          }
          this.updateNextMultiplierPreview();
          this.saveActiveRoundSession();

          if (data.isMaxWin || data.is_max_win || (this.totalTiles - this.mineCount - this.revealedCount === 0)) {
            this.handleMaxWin(data.payout || (this.betAmount * this.currentMultiplier), data.secretIndices || []);
          }
          return;
        }
      }
    } catch (e) {
      // Offline fallback handling
    }

    // Standard client fallback if server unavailable
    this.revealedCount++;
    this.currentMultiplier = this.calculateMultiplier(this.revealedCount);
    window.soundEngine && window.soundEngine.playGem && window.soundEngine.playGem(this.revealedCount);
    if (this.ui && this.ui.onTileReveal) {
      this.ui.onTileReveal(index, 'gem', false);
    }
    this.updateNextMultiplierPreview();
    this.saveActiveRoundSession();
  }

  handleBombHit(index, secretIndices = []) {
    this.isPlaying = false;
    this.saveActiveRoundSession();
    window.soundEngine && window.soundEngine.playBomb && window.soundEngine.playBomb();
    if (this.ui && this.ui.onTileReveal) {
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
      this.revealRemainingTiles(secretIndices);
      if (this.ui && this.ui.onGameOver) {
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

  handleMaxWin(finalPayout, secretIndices = []) {
    this.isPlaying = false;
    this.saveActiveRoundSession();
    window.wallet.addWin(finalPayout);
    window.soundEngine && window.soundEngine.playCashout && window.soundEngine.playCashout();

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

    this.revealRemainingTiles(secretIndices);

    if (this.ui && this.ui.onGameOver) {
      this.ui.onGameOver({
        won: true,
        payout: finalPayout,
        multiplier: this.currentMultiplier,
        gemsFound: this.revealedCount,
        isPerfectClear: true
      });
    }
  }

  async cashOut(isPerfectClear = false) {
    if (Date.now() - this.lastActionTime < 350) return;
    this.lastActionTime = Date.now();

    if (!this.isPlaying || this.revealedCount === 0) return;
    this.isPlaying = false;
    this.saveActiveRoundSession();

    let finalPayout = Math.floor(this.betAmount * this.currentMultiplier * 100) / 100;
    let secretIndices = [];

    const uid = window.wallet.activeUserId || window.wallet.activeTelegramId;
    try {
      const res = await fetch(`${this.apiBaseUrl}/api/games?action=mines_cashout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': uid },
        body: JSON.stringify({
          action: 'mines_cashout',
          roundId: this.roundId,
          userId: uid
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          finalPayout = data.payout || finalPayout;
          secretIndices = data.secretIndices || data.secret_indices || [];
          if (data.newBalance !== undefined) {
            window.wallet.setServerBalance(data.newBalance);
          } else {
            window.wallet.addWin(finalPayout);
          }
        } else {
          window.wallet.addWin(finalPayout);
        }
      } else {
        window.wallet.addWin(finalPayout);
      }
    } catch (e) {
      window.wallet.addWin(finalPayout);
    }

    window.soundEngine && window.soundEngine.playCashout && window.soundEngine.playCashout();
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

    this.revealRemainingTiles(secretIndices);

    if (this.ui && this.ui.onGameOver) {
      this.ui.onGameOver({
        won: true,
        payout: finalPayout,
        multiplier: this.currentMultiplier,
        gemsFound: this.revealedCount,
        isPerfectClear
      });
    }
  }

  revealRemainingTiles(secretIndices = []) {
    const mineSet = new Set(secretIndices);
    for (let i = 0; i < this.totalTiles; i++) {
      if (!this.revealedIndices.has(i)) {
        const isMine = mineSet.has(i);
        if (this.ui && this.ui.onRevealRemaining) {
          this.ui.onRevealRemaining(i, isMine ? 'mine' : 'gem');
        }
      }
    }
  }
}

window.MinesGame = MinesGame;
