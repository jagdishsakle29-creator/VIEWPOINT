/**
 * ====================================================================
 * VIEWPOINT LIVE SPORTSBOOK & REAL-TIME CRICKET BETTING ENGINE
 * Real-time match progression, ball-by-ball live simulation, dynamic odds,
 * interactive bet slip, strict wallet integration, and authoritative settlement.
 * ====================================================================
 */

(function(window) {
  'use strict';

  class SportsbookEngine {
    constructor() {
      this.activeSport = 'cricket';
      this.selectedMarket = {
        marketId: 'match_winner',
        label: 'India',
        odds: 1.75
      };
      this.betAmount = 100;
      this.activeBets = [];
      this.historyBets = [];

      // Cricket Live Match State (ICC T20 World Cup Final Simulation)
      this.cricketMatch = {
        id: 'CRIC-IND-AUS-2026',
        title: 'India vs Australia',
        tournament: 'ICC T20 World Cup • Final',
        venue: 'Melbourne Cricket Ground',
        status: 'LIVE • 2nd Innings',
        target: 205,
        team1: { name: 'India', short: 'IND', flag: '🇮🇳', score: 184, wickets: 4, overs: 17.3 },
        team2: { name: 'Australia', short: 'AUS', flag: '🇦🇺', score: 204, wickets: 6, overs: 20.0 },
        currentOverRuns: 8,
        ballsInCurrentOver: 3,
        batsman1: { name: 'Virat Kohli', runs: 72, balls: 41, fours: 6, sixes: 3, onStrike: true },
        batsman2: { name: 'Hardik Pandya', runs: 24, balls: 11, fours: 2, sixes: 1, onStrike: false },
        bowler: { name: 'Mitchell Starc', figures: '3.3-0-32-2', economy: 9.14 },
        recentBalls: ['1', '4', '0', '6', '1'],
        odds: {
          ind_win: 1.75,
          aus_win: 2.15,
          over_12_high: 1.90,
          over_12_low: 1.85,
          dot: 2.20,
          single: 1.55,
          four: 4.50,
          six: 6.00,
          wicket: 8.50
        }
      };

      this.ballInterval = null;
      this.init();
    }

    init() {
      this.updateEstPayout();
      this.renderScoreboard();
      this.renderBetSlip();
      this.startCricketBallSimulation();

      // Ensure click listeners on stake buttons
      document.addEventListener('DOMContentLoaded', () => {
        this.renderScoreboard();
        this.renderBetSlip();
      });
    }

    startCricketBallSimulation() {
      if (this.ballInterval) clearInterval(this.ballInterval);
      this.ballInterval = setInterval(() => {
        this.simulateNextBall();
      }, 4000);
    }

    simulateNextBall() {
      const match = this.cricketMatch;
      if (!match) return;

      // Check if match already finished, if so restart fresh chase
      if (match.team1.score >= match.target || match.team1.wickets >= 10 || match.team1.overs >= 20.0) {
        match.team1.score = 175;
        match.team1.wickets = 3;
        match.team1.overs = 17.0;
        match.currentOverRuns = 0;
        match.ballsInCurrentOver = 0;
        match.recentBalls = ['1', '0', '4'];
      }

      // Ball outcome pool with realistic cricket distributions
      const ballOutcomes = ['0', '1', '1', '2', '4', '0', '1', '6', 'W', '4', '1'];
      const outcome = ballOutcomes[Math.floor(Math.random() * ballOutcomes.length)];

      let runs = 0;
      let isWicket = false;
      if (outcome === '0') runs = 0;
      else if (outcome === '1') runs = 1;
      else if (outcome === '2') runs = 2;
      else if (outcome === '4') runs = 4;
      else if (outcome === '6') runs = 6;
      else if (outcome === 'W') isWicket = true;

      match.team1.score += runs;
      match.currentOverRuns += runs;
      if (isWicket) {
        match.team1.wickets = Math.min(10, match.team1.wickets + 1);
      }

      // Overs calculation
      match.ballsInCurrentOver += 1;
      let wholeOvers = Math.floor(match.team1.overs);
      let isOverComplete = false;

      if (match.ballsInCurrentOver >= 6) {
        wholeOvers += 1;
        match.ballsInCurrentOver = 0;
        isOverComplete = true;
      }
      match.team1.overs = parseFloat((wholeOvers + match.ballsInCurrentOver * 0.1).toFixed(1));

      // Batsman update
      if (match.batsman1.onStrike) {
        match.batsman1.runs += runs;
        match.batsman1.balls += 1;
        if (runs === 4) match.batsman1.fours += 1;
        if (runs === 6) match.batsman1.sixes += 1;
        if (runs % 2 === 1 || isOverComplete) {
          match.batsman1.onStrike = false;
          match.batsman2.onStrike = true;
        }
      } else {
        match.batsman2.runs += runs;
        match.batsman2.balls += 1;
        if (runs === 4) match.batsman2.fours += 1;
        if (runs === 6) match.batsman2.sixes += 1;
        if (runs % 2 === 1 || isOverComplete) {
          match.batsman1.onStrike = true;
          match.batsman2.onStrike = false;
        }
      }

      // Dynamic odds modulation
      const runsRemaining = Math.max(0, match.target - match.team1.score);
      const ballsRemaining = Math.max(1, Math.round((20.0 - match.team1.overs) * 6));
      const reqRate = (runsRemaining / (ballsRemaining / 6)).toFixed(2);
      if (reqRate > 12) {
        match.odds.ind_win = Math.min(3.50, parseFloat((1.75 + (reqRate - 10) * 0.25).toFixed(2)));
        match.odds.aus_win = Math.max(1.25, parseFloat((2.15 - (reqRate - 10) * 0.20).toFixed(2)));
      } else {
        match.odds.ind_win = Math.max(1.18, parseFloat((1.75 - (10 - reqRate) * 0.15).toFixed(2)));
        match.odds.aus_win = Math.min(4.50, parseFloat((2.15 + (10 - reqRate) * 0.25).toFixed(2)));
      }

      // Recent balls strip
      match.recentBalls.push(outcome);
      if (match.recentBalls.length > 7) match.recentBalls.shift();

      // Check settlement for active bets
      this.checkBetsSettlement(outcome, runs, isWicket, isOverComplete, match.currentOverRuns);

      if (isOverComplete) {
        match.currentOverRuns = 0;
      }

      // Update UI elements
      this.renderScoreboard();
    }

    checkBetsSettlement(outcome, runs, isWicket, isOverComplete, overRunsTotal) {
      if (!this.activeBets || this.activeBets.length === 0) return;

      const remaining = [];
      const match = this.cricketMatch;

      this.activeBets.forEach(bet => {
        let settled = false;
        let won = false;

        if (bet.marketId === 'next_ball') {
          settled = true;
          const lbl = (bet.label || '').toLowerCase();
          if (lbl.includes('dot') || lbl.includes('0')) {
            if (outcome === '0') won = true;
          } else if (lbl.includes('1 or 2') || lbl.includes('single')) {
            if (outcome === '1' || outcome === '2') won = true;
          } else if (lbl.includes('four') || lbl.includes('4')) {
            if (outcome === '4') won = true;
          } else if (lbl.includes('six') || lbl.includes('6')) {
            if (outcome === '6') won = true;
          } else if (lbl.includes('wicket') || lbl.includes('w')) {
            if (isWicket || outcome === 'W') won = true;
          }
        } else if (bet.marketId === 'over_runs' && isOverComplete) {
          settled = true;
          const lbl = (bet.label || '').toLowerCase();
          if (lbl.includes('over') && overRunsTotal > 12) won = true;
          else if (lbl.includes('under') && overRunsTotal <= 12) won = true;
        } else if (bet.marketId === 'match_winner') {
          if (match.team1.score >= match.target) {
            settled = true;
            if ((bet.label || '').toLowerCase().includes('india')) won = true;
          } else if (match.team1.overs >= 20.0 && match.team1.score < match.target) {
            settled = true;
            if ((bet.label || '').toLowerCase().includes('australia')) won = true;
          }
        }

        if (settled) {
          bet.status = won ? 'WON' : 'LOST';
          const payout = won ? Math.round(bet.amount * bet.odds * 100) / 100 : 0;
          bet.payout = payout;

          if (won) {
            // Strict Financial Credit
            if (window.wallet && typeof window.wallet.addWin === 'function') {
              window.wallet.addWin(payout);
            }
            if (window.wallet && typeof window.wallet.recordBet === 'function') {
              window.wallet.recordBet({
                game: 'Cricket Bet',
                bet: bet.amount,
                payout: payout,
                multiplier: bet.odds,
                won: true
              });
            }
            if (window.LiveBets && typeof window.LiveBets.recordUserWin === 'function') {
              window.LiveBets.recordUserWin('Cricket Bet', bet.amount, bet.odds, payout);
            }
            if (window.soundEngine && typeof window.soundEngine.playWin === 'function') {
              window.soundEngine.playWin();
            }
            if (window.app && typeof window.app.showNotification === 'function') {
              window.app.showNotification(`🏏 CRICKET BET WON! You won ₹${payout.toFixed(2)} on "${bet.label}"!`, "success");
            }
          } else {
            if (window.wallet && typeof window.wallet.recordBet === 'function') {
              window.wallet.recordBet({
                game: 'Cricket Bet',
                bet: bet.amount,
                payout: 0,
                multiplier: bet.odds,
                won: false
              });
            }
            if (window.app && typeof window.app.showNotification === 'function') {
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
      this.selectedMarket = {
        marketId: marketId,
        label: label,
        odds: parseFloat(odds) || 1.85
      };

      if (window.soundEngine && typeof window.soundEngine.playClick === 'function') {
        window.soundEngine.playClick();
      }

      // Update button visual highlight
      document.querySelectorAll('.market-odd-btn').forEach(btn => {
        btn.classList.remove('selected', 'active');
      });

      // Highlight matching button
      const allBtns = document.querySelectorAll('.market-odd-btn');
      allBtns.forEach(btn => {
        if (btn.innerText.includes(label)) {
          btn.classList.add('selected', 'active');
        }
      });

      this.renderBetSlip();
      this.updateEstPayout();
    }

    setQuickStake(amt) {
      const stakeInput = document.getElementById('sportsStakeInput');
      const parsed = parseFloat(amt) || 50;
      if (stakeInput) {
        stakeInput.value = parsed;
      }
      this.betAmount = parsed;
      this.updateEstPayout();
    }

    updateEstPayout() {
      const stakeInput = document.getElementById('sportsStakeInput');
      const stake = parseFloat(stakeInput ? stakeInput.value : this.betAmount) || 50;
      this.betAmount = stake;

      const odds = this.selectedMarket ? this.selectedMarket.odds : 1.75;
      const est = (stake * odds).toFixed(2);

      const estEl = document.getElementById('slipEstPayout');
      if (estEl) estEl.innerText = `₹${est}`;
    }

    placeBet() {
      if (!this.selectedMarket) {
        if (window.app && window.app.showNotification) {
          window.app.showNotification("⚠️ Please select a cricket match odd first!", "info");
        }
        return false;
      }

      const stakeInput = document.getElementById('sportsStakeInput');
      const stake = parseFloat(stakeInput ? stakeInput.value : this.betAmount) || 50;

      if (stake < 10) {
        if (window.app && window.app.showNotification) {
          window.app.showNotification("⚠️ Minimum cricket bet is ₹10", "info");
        }
        return false;
      }

      // Wallet balance check
      if (!window.wallet || !window.wallet.hasFunds(stake)) {
        const bal = window.wallet ? `₹${window.wallet.balance.toFixed(2)}` : '₹0.00';
        if (window.app && window.app.showNotification) {
          window.app.showNotification(`❌ Insufficient balance (${bal})! <a href="javascript:void(0)" onclick="window.claimDemoChips && window.claimDemoChips(500)" style="color:#00e5ff;font-weight:bold;text-decoration:underline;">Tap to Refill ₹500</a>`, "error");
        }
        return false;
      }

      // Authoritative deduction
      window.wallet.deduct(stake);

      const ticket = {
        id: 'CRIC-' + Date.now().toString(36).toUpperCase(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        marketId: this.selectedMarket.marketId,
        label: this.selectedMarket.label,
        odds: this.selectedMarket.odds,
        amount: stake,
        potentialReturn: Math.round(stake * this.selectedMarket.odds * 100) / 100,
        status: 'OPEN'
      };

      this.activeBets.unshift(ticket);

      if (window.soundEngine && typeof window.soundEngine.playBet === 'function') {
        window.soundEngine.playBet();
      }

      if (window.app && typeof window.app.showNotification === 'function') {
        window.app.showNotification(`✅ Cricket Bet Placed: ₹${stake} on "${this.selectedMarket.label}" @ ${this.selectedMarket.odds}x`, "success");
      }

      this.renderBetSlip();
      return true;
    }

    renderScoreboard() {
      const match = this.cricketMatch;
      if (!match) return;

      // Update India Score
      const indScoreEl = document.getElementById('cricScoreIndia');
      if (indScoreEl) {
        indScoreEl.innerHTML = `${match.team1.score}/${match.team1.wickets} <span style="font-size: 14px; color: #94a3b8;">(${match.team1.overs} ov)</span>`;
      }

      // Fallback for alternate element IDs
      const cricLiveScore = document.getElementById('cricLiveScore');
      if (cricLiveScore) cricLiveScore.innerText = `${match.team1.score}/${match.team1.wickets}`;

      const cricLiveOvers = document.getElementById('cricLiveOvers');
      if (cricLiveOvers) cricLiveOvers.innerText = `(${match.team1.overs} ov)`;

      // Runs remaining calculation
      const runsRemaining = Math.max(0, match.target - match.team1.score);
      const ballsRemaining = Math.max(0, Math.round((20.0 - match.team1.overs) * 6));
      const reqRate = (runsRemaining / (ballsRemaining > 0 ? (ballsRemaining / 6) : 1)).toFixed(2);
      const crr = (match.team1.score / (match.team1.overs > 0 ? match.team1.overs : 1)).toFixed(2);

      // Bowler & Striker strip
      const bowlerInfoEl = document.querySelector('.tracker-bowler-info');
      if (bowlerInfoEl) {
        const striker = match.batsman1.onStrike ? match.batsman1 : match.batsman2;
        bowlerInfoEl.innerHTML = `
          <span>🎳 Bowler: <strong>${match.bowler.name}</strong> (${match.bowler.figures})</span>
          <span>🏏 Striker: <strong>${striker.name}</strong> (${striker.runs}* off ${striker.balls})</span>
        `;
      }

      // Live Balls Strip
      const ballsStrip = document.getElementById('cricBallsStrip');
      if (ballsStrip) {
        ballsStrip.innerHTML = match.recentBalls.map(b => {
          let cls = 'ball-pill';
          if (b === '4') cls += ' four';
          else if (b === '6') cls += ' six';
          else if (b === 'W') cls += ' wicket';
          else if (b === '0') cls += ' dot';
          return `<span class="${cls}">${b}</span>`;
        }).join('') + '<span class="ball-pill current">Next</span>';
      }

      // Dynamic odds on buttons
      const indBtnVal = document.querySelector('#oddBtn-winner-india .odd-val');
      if (indBtnVal) indBtnVal.innerText = match.odds.ind_win.toFixed(2);

      const ausBtnVal = document.querySelector('#oddBtn-winner-aus .odd-val');
      if (ausBtnVal) ausBtnVal.innerText = match.odds.aus_win.toFixed(2);
    }

    renderBetSlip() {
      const slipMarketName = document.getElementById('slipMarketName');
      const slipOddsDisplay = document.getElementById('slipOddsDisplay');
      const slipActiveCount = document.getElementById('slipActiveCount');
      const betSlipSelection = document.getElementById('betSlipSelection');
      const betSlipEmpty = document.getElementById('betSlipEmpty');

      if (this.selectedMarket) {
        if (betSlipSelection) betSlipSelection.style.display = 'block';
        if (betSlipEmpty) betSlipEmpty.style.display = 'none';
        if (slipMarketName) slipMarketName.innerText = `${this.selectedMarket.label}`;
        if (slipOddsDisplay) slipOddsDisplay.innerText = `${this.selectedMarket.odds.toFixed(2)}`;
        if (slipActiveCount) slipActiveCount.innerText = `1 Selection`;
      } else {
        if (betSlipSelection) betSlipSelection.style.display = 'none';
        if (betSlipEmpty) betSlipEmpty.style.display = 'block';
        if (slipActiveCount) slipActiveCount.innerText = `0 Selections`;
      }

      // Open Bets History
      const openCountEl = document.getElementById('openBetsCount');
      const openListEl = document.getElementById('openBetsList');

      if (openCountEl) openCountEl.innerText = this.activeBets.length;
      if (openListEl) {
        if (this.activeBets.length === 0) {
          openListEl.innerHTML = '<div style="font-size: 11px; color: #64748b; font-style: italic;">No active bets. Place a wager above!</div>';
        } else {
          openListEl.innerHTML = this.activeBets.map(bet => `
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 6px; padding: 6px 10px; font-size: 11.5px;">
              <div>
                <strong style="color: #38bdf8;">🟢 ${bet.label}</strong>
                <span style="color: #94a3b8; margin-left: 5px;">@ ${bet.odds.toFixed(2)}x</span>
                <div style="font-size: 10px; color: #64748b;">Stake: ₹${bet.amount.toFixed(2)}</div>
              </div>
              <div style="text-align: right;">
                <span style="color: #10b981; font-weight: 800;">₹${bet.potentialReturn.toFixed(2)}</span>
                <div style="font-size: 9.5px; color: #38bdf8; font-weight: 700;">IN PLAY</div>
              </div>
            </div>
          `).join('');
        }
      }
    }
  }

  window.SportsbookEngine = SportsbookEngine;
  window.Sportsbook = new SportsbookEngine();

})(window);
