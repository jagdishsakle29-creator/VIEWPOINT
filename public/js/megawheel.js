/**
 * VIEWPOINT Casino - Live Mega Money Wheel Studio
 * Authentic 54-Segment Big Money Wheel with Live Multipliers
 */

(function(window) {
  'use strict';

  class MegaWheelGame {
    constructor(options = {}) {
      this.options = options;
      this.selectedChip = 10;
      this.bets = {};
      this.totalBet = 0;
      this.isSpinning = false;
      this.currentAngle = 0;
      this.history = [];
      this.roundId = this.generateRoundId();

      // 54 segments mapping:
      // 1x (23 segments), 2x (15 segments), 5x (7 segments), 10x (4 segments), 20x (2 segments), 40x (1 segment), 2x Mega Boost (2 segments)
      this.segments = [
        { label: '1x', mult: 1, color: '#38bdf8' },
        { label: '2x', mult: 2, color: '#fbbf24' },
        { label: '1x', mult: 1, color: '#38bdf8' },
        { label: '5x', mult: 5, color: '#a855f7' },
        { label: '1x', mult: 1, color: '#38bdf8' },
        { label: '2x', mult: 2, color: '#fbbf24' },
        { label: '10x', mult: 10, color: '#ec4899' },
        { label: '1x', mult: 1, color: '#38bdf8' },
        { label: '2x', mult: 2, color: '#fbbf24' },
        { label: '1x', mult: 1, color: '#38bdf8' },
        { label: '20x', mult: 20, color: '#10b981' },
        { label: '1x', mult: 1, color: '#38bdf8' },
        { label: '2x', mult: 2, color: '#fbbf24' },
        { label: '5x', mult: 5, color: '#a855f7' },
        { label: '1x', mult: 1, color: '#38bdf8' },
        { label: '2x', mult: 2, color: '#fbbf24' },
        { label: '1x', mult: 1, color: '#38bdf8' },
        { label: '40x', mult: 40, color: '#f59e0b' },
        { label: '1x', mult: 1, color: '#38bdf8' },
        { label: '2x', mult: 2, color: '#fbbf24' },
        { label: '5x', mult: 5, color: '#a855f7' },
        { label: '1x', mult: 1, color: '#38bdf8' },
        { label: '10x', mult: 10, color: '#ec4899' },
        { label: '2x', mult: 2, color: '#fbbf24' }
      ];

      this.initDom();
      this.bindEvents();
      this.renderWheel();
    }

    generateRoundId() {
      const d = new Date();
      return 'MW-' + d.getFullYear().toString().slice(-2) +
        String(d.getMonth() + 1).padStart(2, '0') +
        String(d.getDate()).padStart(2, '0') + '-' +
        Math.floor(1000 + Math.random() * 9000);
    }

    initDom() {
      this.dom = {
        roundIdTag: document.getElementById('mwRoundIdTag'),
        statusText: document.getElementById('mwStatusText'),
        canvas: document.getElementById('mwWheelCanvas'),
        btnSpin: document.getElementById('btnMwSpin'),
        btnClear: document.getElementById('btnMwClear'),
        btnDouble: document.getElementById('btnMwDouble'),
        historyRow: document.getElementById('mwHistoryRow'),
        winBanner: document.getElementById('mwWinBanner')
      };
      if (this.dom.roundIdTag) this.dom.roundIdTag.innerText = this.roundId;
      if (this.dom.canvas) {
        this.ctx = this.dom.canvas.getContext('2d');
      }
    }

    bindEvents() {
      if (this.dom.btnSpin) {
        this.dom.btnSpin.addEventListener('click', () => this.spinWheel());
      }
      if (this.dom.btnClear) {
        this.dom.btnClear.addEventListener('click', () => this.clearBets());
      }
      if (this.dom.btnDouble) {
        this.dom.btnDouble.addEventListener('click', () => this.doubleBets());
      }
    }

    setChip(amt) {
      this.selectedChip = amt;
      document.querySelectorAll('.mw-chip-btn').forEach(b => {
        b.classList.toggle('active', parseFloat(b.getAttribute('data-amount')) === amt);
      });
      if (window.soundEngine && window.soundEngine.playChip) window.soundEngine.playChip();
    }

    placeBet(spot) {
      if (this.isSpinning) return;

      const amt = this.selectedChip || 10;
      if (window.wallet && !window.wallet.hasSufficientBalance(this.totalBet + amt)) {
        if (window.app && window.app.showNotification) window.app.showNotification("Insufficient balance!", "error");
        return;
      }

      this.bets[spot] = (this.bets[spot] || 0) + amt;
      this.totalBet += amt;
      this.updateChipsDisplay();
      if (window.soundEngine && window.soundEngine.playChip) window.soundEngine.playChip();
    }

    clearBets() {
      if (this.isSpinning) return;
      this.bets = {};
      this.totalBet = 0;
      this.updateChipsDisplay();
    }

    doubleBets() {
      if (this.isSpinning || this.totalBet === 0) return;
      if (window.wallet && !window.wallet.hasSufficientBalance(this.totalBet * 2)) {
        if (window.app && window.app.showNotification) window.app.showNotification("Insufficient balance to double!", "error");
        return;
      }
      for (const k in this.bets) {
        this.bets[k] *= 2;
      }
      this.totalBet *= 2;
      this.updateChipsDisplay();
      if (window.soundEngine && window.soundEngine.playChip) window.soundEngine.playChip();
    }

    updateChipsDisplay() {
      ['1x', '2x', '5x', '10x', '20x', '40x'].forEach(spot => {
        const badge = document.getElementById(`mwChipBadge_${spot}`);
        const spotEl = document.getElementById(`mwBetSpot_${spot}`);
        const amt = this.bets[spot] || 0;
        if (badge) {
          badge.style.display = amt > 0 ? 'inline-flex' : 'none';
          badge.innerText = `₹${amt}`;
        }
        if (spotEl) {
          spotEl.classList.toggle('has-bet', amt > 0);
        }
      });
      if (this.dom.btnSpin) {
        this.dom.btnSpin.disabled = (this.totalBet === 0);
      }
    }

    renderWheel() {
      if (!this.ctx || !this.dom.canvas) return;
      const w = this.dom.canvas.width;
      const h = this.dom.canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(cx, cy) - 10;
      const numSegs = this.segments.length;
      const arc = (2 * Math.PI) / numSegs;

      this.ctx.clearRect(0, 0, w, h);

      // Outer gold rim
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, radius + 8, 0, 2 * Math.PI);
      this.ctx.lineWidth = 14;
      this.ctx.strokeStyle = '#d97706';
      this.ctx.stroke();

      this.ctx.translate(cx, cy);
      this.ctx.rotate(this.currentAngle);

      for (let i = 0; i < numSegs; i++) {
        const seg = this.segments[i];
        const startAngle = i * arc;
        const endAngle = startAngle + arc;

        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.arc(0, 0, radius, startAngle, endAngle);
        this.ctx.fillStyle = seg.color;
        this.ctx.fill();
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeStyle = '#0f172a';
        this.ctx.stroke();

        // Text label
        this.ctx.save();
        this.ctx.rotate(startAngle + arc / 2);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 12px Inter, sans-serif';
        this.ctx.textAlign = 'right';
        this.ctx.shadowColor = 'rgba(0,0,0,0.8)';
        this.ctx.shadowBlur = 4;
        this.ctx.fillText(seg.label, radius - 15, 4);
        this.ctx.restore();
      }

      this.ctx.restore();

      // Center gold cap
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, 28, 0, 2 * Math.PI);
      this.ctx.fillStyle = '#0f172a';
      this.ctx.fill();
      this.ctx.lineWidth = 4;
      this.ctx.strokeStyle = '#f59e0b';
      this.ctx.stroke();

      this.ctx.fillStyle = '#fbbf24';
      this.ctx.font = 'bold 13px Inter, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('MEGA', cx, cy);
    }

    spinWheel() {
      if (this.isSpinning || this.totalBet === 0) return;

      if (window.wallet && !window.wallet.hasSufficientBalance(this.totalBet)) {
        if (window.app && window.app.showNotification) window.app.showNotification("Insufficient balance!", "error");
        return;
      }
      if (window.wallet) window.wallet.deductBalance(this.totalBet, 'Mega Wheel Bet');

      this.isSpinning = true;
      this.roundId = this.generateRoundId();
      if (this.dom.roundIdTag) this.dom.roundIdTag.innerText = this.roundId;

      if (this.dom.winBanner) this.dom.winBanner.style.display = 'none';
      if (this.dom.statusText) {
        this.dom.statusText.innerText = "SPINNING MEGA WHEEL...";
        this.dom.statusText.style.color = '#fbbf24';
      }

      const targetIdx = Math.floor(Math.random() * this.segments.length);
      const arc = (2 * Math.PI) / this.segments.length;
      // Top pointer points to 270 deg (3*PI/2)
      const targetAngle = (3 * Math.PI / 2) - (targetIdx * arc) - (arc / 2);
      const totalRotation = (Math.PI * 2 * 6) + targetAngle - (this.currentAngle % (Math.PI * 2));

      const startTime = performance.now();
      const duration = 4000;
      const startAngle = this.currentAngle;

      if (window.soundEngine && window.soundEngine.playWheelSpin) window.soundEngine.playWheelSpin();

      const animate = (now) => {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / duration);
        // Ease out cubic
        const easeOut = 1 - Math.pow(1 - t, 3);
        this.currentAngle = startAngle + totalRotation * easeOut;
        this.renderWheel();

        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          this.settleSpin(this.segments[targetIdx]);
        }
      };

      requestAnimationFrame(animate);
    }

    settleSpin(winningSeg) {
      this.isSpinning = false;
      const winningLabel = winningSeg.label;
      const betAmt = this.bets[winningLabel] || 0;
      let totalWin = 0;

      if (betAmt > 0) {
        totalWin = betAmt * (winningSeg.mult + 1);
      }

      totalWin = Math.floor(totalWin * 100) / 100;

      const title = totalWin > 0 ? `WHEEL STOPPED ON ${winningLabel}! YOU WON! 🎉` : `WHEEL STOPPED ON ${winningLabel} 💔`;
      const color = totalWin > 0 ? '#10b981' : '#ef4444';

      if (this.dom.statusText) {
        this.dom.statusText.innerText = title;
        this.dom.statusText.style.color = color;
      }

      if (totalWin > 0 && window.wallet) {
        window.wallet.addBalance(totalWin, 'Mega Wheel Payout');
        if (window.soundEngine && window.soundEngine.playWin) window.soundEngine.playWin();
      } else {
        if (window.soundEngine && window.soundEngine.playLose) window.soundEngine.playLose();
      }

      if (this.dom.winBanner) {
        this.dom.winBanner.style.display = 'block';
        this.dom.winBanner.innerHTML = `<span style="color: ${color}; font-weight: 800;">${title}</span> ${totalWin > 0 ? `+₹${totalWin.toFixed(2)}` : ''}`;
      }

      this.addHistoryBadge(winningLabel, winningSeg.color);

      setTimeout(() => {
        this.clearBets();
      }, 2000);
    }

    addHistoryBadge(label, bg) {
      this.history.unshift({ label, bg });
      if (this.history.length > 18) this.history.pop();

      if (this.dom.historyRow) {
        this.dom.historyRow.innerHTML = this.history.map(h => 
          `<span style="display:inline-flex;align-items:center;justify-content:center;padding:4px 8px;border-radius:12px;background:${h.bg};color:#fff;font-size:10.5px;font-weight:900;">${h.label}</span>`
        ).join('');
      }
    }
  }

  window.MegaWheelGame = MegaWheelGame;
})(window);
