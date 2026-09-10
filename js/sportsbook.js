/**
 * ====================================================================
 * VIEWPOINT LIVE SPORTSBOOK & CRICKET BETTING ENGINE
 * Live match simulations, real-time odds, over-by-over ball tracker,
 * interactive bet slip, and instant wallet credit / settlement.
 * ====================================================================
 */

(function(window) {
  'use strict';

  class SportsbookEngine {
    constructor() {
      this.activeSport = 'cricket';
      this.selectedMarket = null; // { matchId, marketId, label, odds, team }
      this.betAmount = 50;
      this.activeBets = [];
      this.historyBets = [];

      // Cricket Live Match Simulation State
      this.cricketMatch = {
        id: 'CRIC-IND-AUS-2026',
        title: 'India vs Australia',
        tournament: 'ICC T20 World Cup 2026 • Final',
        status: 'LIVE • 2nd Innings',
        team1: { name: 'India', short: 'IND', flag: '🇮🇳', score: 186, wickets: 3, overs: 17.3, target: 212 },
        team2: { name: 'Australia', short: 'AUS', flag: '🇦🇺', score: 211, wickets: 6, overs: 20.0 },
        batsman1: { name: 'Virat Kohli', runs: 82, balls: 46, fours: 7, sixes: 3, onStrike: true },
        batsman2: { name: 'Hardik Pandya', runs: 28, balls: 12, fours: 2, sixes: 2, onStrike: false },
        bowler: { name: 'Mitchell Starc', figures: '3.3-0-36-2', economy: 10.2 },
        recentBalls: ['1', '4', '0', 'W', '6', '1'],
        requiredRate: '10.40 RPO',
        currentRate: '10.63 RPO',
        markets: [
          { id: 'm_winner', title: 'Match Winner', options: [
            { id: 'ind_win', label: 'India', odds: 1.82, sub: 'Needs 26 off 15b' },
            { id: 'aus_win', label: 'Australia', odds: 2.05, sub: 'Defending 25 runs' }
          ]},
          { id: 'm_next_over', title: '18th Over Total Runs (Starc)', options: [
            { id: 'ov_high', label: 'Over 9.5 Runs', odds: 1.88, sub: '10+ runs in over' },
            { id: 'ov_low', label: 'Under 9.5 Runs', odds: 1.92, sub: '9 or fewer runs' }
          ]},
          { id: 'm_next_boundary', title: 'Next Ball Outcome', options: [
            { id: 'b_four_six', label: 'Boundary (4 or 6)', odds: 2.40, sub: 'Striker: V. Kohli' },
            { id: 'b_wicket', label: 'Wicket Fall', odds: 4.20, sub: 'Caught/Bowled' },
            { id: 'b_dot_single', label: 'Dot or 1-2 Runs', odds: 1.48, sub: 'Normal ball' }
          ]},
          { id: 'm_top_batsman', title: 'Player Milestones', options: [
            { id: 'kohli_90', label: 'Kohli Scores 90+ Runs', odds: 1.65, sub: 'Current: 82*' },
            { id: 'pandya_40', label: 'Hardik Scores 40+ Runs', odds: 2.10, sub: 'Current: 28*' }
          ]}
        ]
      };

      this.soccerMatch = {
        id: 'SOC-RMA-MCI',
        title: 'Real Madrid vs Manchester City',
        tournament: 'UEFA Champions League • Semi-Final',
        team1: { name: 'Real Madrid', flag: '🇪🇸', score: 2 },
        team2: { name: 'Man City', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', score: 2 },
        time: '76:24',
        markets: [
          { id: 'soc_win', title: 'Full Time Result', options: [
            { id: 'rma_win', label: 'Real Madrid', odds: 2.30 },
            { id: 'draw', label: 'Draw', odds: 3.10 },
            { id: 'mci_win', label: 'Man City', odds: 2.45 }
          ]}
        ]
      };

      this.ballInterval = null;
      this.init();
    }

    init() {
      if (!this.selectedMarket) {
        this.selectMarket('match_winner', 'India', 1.75);
      }
      this.startCricketBallSimulation();
    }

    startCricketBallSimulation() {
      if (this.ballInterval) clearInterval(this.ballInterval);
      this.ballInterval = setInterval(() => {
        this.simulateNextBall();
      }, 5000);
    }

    simulateNextBall() {
      const match = this.cricketMatch;
      if (!match || match.team1.overs >= 20) return;

      const ballOutcomes = ['1', '2', '4', '6', '0', '1', 'W', '4'];
      const outcome = ballOutcomes[Math.floor(Math.random() * ballOutcomes.length)];
      
      let runs = 0;
      let isWicket = false;
      if (outcome === '1') runs = 1;
      else if (outcome === '2') runs = 2;
      else if (outcome === '4') runs = 4;
      else if (outcome === '6') runs = 6;
      else if (outcome === 'W') isWicket = true;

      // Update match stats
      match.team1.score += runs;
      if (isWicket) match.team1.wickets = Math.min(9, match.team1.wickets + 1);

      // Overs progression
      let currentBalls = Math.round((match.team1.overs % 1) * 10) + 1;
      let wholeOvers = Math.floor(match.team1.overs);
      if (currentBalls >= 6) {
        wholeOvers += 1;
        currentBalls = 0;
      }
      match.team1.overs = parseFloat((wholeOvers + currentBalls * 0.1).toFixed(1));

      // Batsman runs
      if (match.batsman1.onStrike) {
        match.batsman1.runs += runs;
        match.batsman1.balls += 1;
        if (runs === 4) match.batsman1.fours += 1;
        if (runs === 6) match.batsman1.sixes += 1;
        if (runs % 2 === 1 || currentBalls === 0) {
          match.batsman1.onStrike = false;
          match.batsman2.onStrike = true;
        }
      } else {
        match.batsman2.runs += runs;
        match.batsman2.balls += 1;
        if (runs === 4) match.batsman2.fours += 1;
        if (runs === 6) match.batsman2.sixes += 1;
        if (runs % 2 === 1 || currentBalls === 0) {
          match.batsman1.onStrike = true;
          match.batsman2.onStrike = false;
        }
      }

      // Recent balls array
      match.recentBalls.push(outcome);
      if (match.recentBalls.length > 8) match.recentBalls.shift();

      // Check active bets for settlement
      this.checkBetsSettlement(outcome, runs, isWicket);

      // Update UI if cricket view is open
      this.renderScoreboard();
    }

    checkBetsSettlement(outcome, runs, isWicket) {
      if (!this.activeBets || this.activeBets.length === 0) return;

      const remaining = [];
      this.activeBets.forEach(bet => {
        let settled = false;
        let won = false;

        if (bet.marketId === 'm_next_boundary') {
          settled = true;
          if (bet.optionId === 'b_four_six' && (outcome === '4' || outcome === '6')) won = true;
          else if (bet.optionId === 'b_wicket' && isWicket) won = true;
          else if (bet.optionId === 'b_dot_single' && (outcome === '0' || outcome === '1' || outcome === '2')) won = true;
        } else if (bet.marketId === 'm_top_batsman') {
          if (bet.optionId === 'kohli_90' && this.cricketMatch.batsman1.runs >= 90) {
            settled = true;
            won = true;
          } else if (bet.optionId === 'pandya_40' && this.cricketMatch.batsman2.runs >= 40) {
            settled = true;
            won = true;
          }
        }

        if (settled) {
          bet.status = won ? 'WON' : 'LOST';
          const payout = won ? Math.round(bet.amount * bet.odds * 100) / 100 : 0;
          bet.payout = payout;

          if (won && window.wallet && window.wallet.addWin) {
            window.wallet.addWin(payout);
            if (window.soundEngine && window.soundEngine.playWin) window.soundEngine.playWin();
            if (window.app && window.app.showNotification) {
              window.app.showNotification(`🏏 SPORTSBOOK WIN! Bet on "${bet.label}" won ₹${payout.toFixed(2)}!`, "success");
            }
          } else if (!won) {
            if (window.app && window.app.showNotification) {
              window.app.showNotification(`🏏 Bet on "${bet.label}" settled: Lost`, "info");
            }
          }
          this.historyBets.unshift(bet);
        } else {
          remaining.push(bet);
        }
      });

      this.activeBets = remaining;
      this.renderBetSlip();
    }

    selectMarket(marketId, label, odds) {
      return this.selectMarketOption(marketId, marketId, label, odds);
    }

    selectMarketOption(marketId, optionId, label, odds) {
      this.selectedMarket = {
        marketId: marketId,
        optionId: optionId || marketId,
        label: label || 'India',
        odds: parseFloat(odds) || 1.90
      };

      if (window.soundEngine && window.soundEngine.playClick) {
        window.soundEngine.playClick();
      }

      this.renderBetSlip();
      
      // Auto-focus stake input on mobile / scroll to bet slip
      const slipEl = document.getElementById('sportsBetSlip');
      if (slipEl && window.innerWidth <= 768) {
        slipEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    setQuickStake(amt) {
      this.betAmount = parseFloat(amt) || 50;
      const input = document.getElementById('sportsStakeInput');
      if (input) input.value = this.betAmount;
      this.renderBetSlip();
    }

    placeBet() {
      if (!this.selectedMarket) {
        if (window.app && window.app.showNotification) {
          window.app.showNotification("⚠️ Please select a match odd first!", "info");
        }
        return false;
      }

      const stakeInput = document.getElementById('sportsStakeInput');
      const stake = parseFloat(stakeInput ? stakeInput.value : this.betAmount) || 50;
      if (stake <= 0) return false;

      // Wallet balance check
      if (!window.wallet || !window.wallet.hasFunds(stake)) {
        const bal = window.wallet ? `₹${window.wallet.balance.toFixed(2)}` : '₹0.00';
        if (window.app && window.app.showNotification) {
          window.app.showNotification(`❌ Insufficient balance (${bal})! <a href="javascript:void(0)" onclick="window.claimDemoChips && window.claimDemoChips(500)" style="color:#00e5ff;font-weight:bold;text-decoration:underline;">Tap to Refill ₹500</a>`, "error");
        }
        return false;
      }

      // Deduct from wallet
      if (window.wallet && window.wallet.deductBet) {
        window.wallet.deductBet(stake);
      }

      const betTicket = {
        id: 'SP-' + Date.now().toString(36).toUpperCase(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        matchTitle: this.cricketMatch.title,
        marketId: this.selectedMarket.marketId,
        optionId: this.selectedMarket.optionId,
        label: this.selectedMarket.label,
        odds: this.selectedMarket.odds,
        amount: stake,
        potentialReturn: Math.round(stake * this.selectedMarket.odds * 100) / 100,
        status: 'OPEN'
      };

      this.activeBets.unshift(betTicket);
      if (window.soundEngine && window.soundEngine.playBet) {
        window.soundEngine.playBet();
      }

      if (window.app && window.app.showNotification) {
        window.app.showNotification(`✅ Sports Bet Placed: ₹${stake} on "${this.selectedMarket.label}" @ ${this.selectedMarket.odds}x`, "success");
      }

      this.selectedMarket = null;
      this.renderBetSlip();
      return true;
    }

    renderScoreboard() {
      const match = this.cricketMatch;
      const scoreEl = document.getElementById('cricLiveScore');
      const oversEl = document.getElementById('cricLiveOvers');
      const ballsTrackEl = document.getElementById('cricBallTracker');
      const kRunsEl = document.getElementById('cricKohliRuns');
      const hRunsEl = document.getElementById('cricHardikRuns');
      const reqEl = document.getElementById('cricReqText');

      if (scoreEl) scoreEl.innerText = `${match.team1.score}/${match.team1.wickets}`;
      if (oversEl) oversEl.innerText = `(${match.team1.overs} ov)`;
      if (reqEl) {
        const remainingRuns = Math.max(0, match.team1.target - match.team1.score);
        reqEl.innerText = `Need ${remainingRuns} runs to win`;
      }
      if (kRunsEl) kRunsEl.innerText = `${match.batsman1.runs}* (${match.batsman1.balls})`;
      if (hRunsEl) hRunsEl.innerText = `${match.batsman2.runs}* (${match.batsman2.balls})`;

      if (ballsTrackEl) {
        ballsTrackEl.innerHTML = match.recentBalls.map(b => {
          let cls = 'ball-pill';
          if (b === '4') cls += ' four';
          else if (b === '6') cls += ' six';
          else if (b === 'W') cls += ' wicket';
          return `<span class="${cls}">${b}</span>`;
        }).join('');
      }
    }

    renderBetSlip() {
      const slipContainer = document.getElementById('sportsBetSlip');
      if (!slipContainer) return;

      if (!this.selectedMarket && this.activeBets.length === 0) {
        slipContainer.innerHTML = `
          <div class="bet-slip-empty">
            <div style="font-size: 28px; margin-bottom: 6px;">🏏</div>
            <strong>Your Bet Slip is Empty</strong>
            <p>Click any match odd above to add your live cricket wager!</p>
          </div>
        `;
        return;
      }

      let activeHtml = '';
      if (this.selectedMarket) {
        const potential = (this.betAmount * this.selectedMarket.odds).toFixed(2);
        activeHtml = `
          <div class="bet-slip-selection">
            <div class="selection-header">
              <span class="selection-market">${this.selectedMarket.label}</span>
              <strong class="selection-odds">${this.selectedMarket.odds.toFixed(2)}x</strong>
            </div>
            <div class="selection-match-title">${this.cricketMatch.title}</div>
            
            <div class="selection-stake-row">
              <label>Stake (₹):</label>
              <input type="number" id="sportsStakeInput" class="bet-input-field" value="${this.betAmount}" min="10" max="50000" oninput="window.Sportsbook.setQuickStake(this.value)">
            </div>
            
            <div class="quick-chip-row">
              <button type="button" class="quick-chip" onclick="window.Sportsbook.setQuickStake(50)">₹50</button>
              <button type="button" class="quick-chip" onclick="window.Sportsbook.setQuickStake(100)">₹100</button>
              <button type="button" class="quick-chip" onclick="window.Sportsbook.setQuickStake(500)">₹500</button>
              <button type="button" class="quick-chip" onclick="window.Sportsbook.setQuickStake(1000)">₹1k</button>
            </div>

            <div class="selection-return-row">
              <span>Potential Return:</span>
              <strong style="color: #00e701; font-size: 15px;">₹${potential}</strong>
            </div>

            <button type="button" class="btn-stake-primary btn-place-sports-bet" onclick="window.Sportsbook.placeBet()">
              ⚡ PLACE CRICKET BET
            </button>
          </div>
        `;
      }

      let pendingHtml = '';
      if (this.activeBets.length > 0) {
        pendingHtml = `
          <div class="active-tickets-box">
            <div class="tickets-title">Pending Live Wagers (${this.activeBets.length})</div>
            ${this.activeBets.map(t => `
              <div class="live-ticket-card">
                <div class="ticket-top">
                  <span class="ticket-selection">🟢 ${t.label}</span>
                  <span class="ticket-odds">${t.odds.toFixed(2)}x</span>
                </div>
                <div class="ticket-details">
                  <span>Stake: ₹${t.amount.toFixed(2)}</span>
                  <span style="color: #00e701; font-weight: 700;">Win: ₹${t.potentialReturn.toFixed(2)}</span>
                </div>
                <div class="ticket-status-badge">Live • Settles at ball outcome</div>
              </div>
            `).join('')}
          </div>
        `;
      }

      slipContainer.innerHTML = activeHtml + pendingHtml;
    }
  }

  window.SportsbookEngine = SportsbookEngine;
  window.Sportsbook = new SportsbookEngine();

})(window);
