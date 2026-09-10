live_css = """
/* =========================================================
   STAKE LIVE CASINO STUDIO & LIVE TABLE BET GAMES
   ========================================================= */

/* Dedicated Live Studio Section */
.live-studio-section {
  width: 100%;
  margin: 16px 0 24px 0;
  padding: 18px 16px;
  background: linear-gradient(180deg, rgba(16, 23, 42, 0.85) 0%, rgba(9, 13, 22, 0.95) 100%);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 18px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  box-sizing: border-box;
}

.live-studio-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.live-studio-heading {
  margin: 0;
  font-family: var(--font-display);
  font-size: 19px;
  font-weight: 900;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 10px;
}

.live-pulse-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  font-weight: 800;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  padding: 3px 8px;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.live-dot-pulse {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #ef4444;
  box-shadow: 0 0 8px #ef4444;
  animation: liveDotBlink 1.4s infinite ease-in-out;
}

@keyframes liveDotBlink {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.85); }
}

.live-studio-subtitle {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: #94a3b8;
}

.live-studio-filter-pills {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
}

.live-subfilter-btn {
  padding: 6px 12px;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  color: #94a3b8;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.live-subfilter-btn:hover {
  color: #fff;
  border-color: rgba(239, 68, 68, 0.4);
}

.live-subfilter-btn.active {
  background: #ef4444;
  color: #fff;
  border-color: #ef4444;
  box-shadow: 0 2px 10px rgba(239, 68, 68, 0.4);
}

/* 9 Live Tables Grid */
.live-tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}

@media (max-width: 600px) {
  .live-tables-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 10px;
  }
}

.live-table-card {
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.live-table-card:hover {
  transform: translateY(-4px);
  border-color: rgba(239, 68, 68, 0.5);
  box-shadow: 0 8px 24px rgba(239, 68, 68, 0.2);
}

.live-table-visual {
  position: relative;
  height: 130px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.live-dealer-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  font-size: 9px;
  font-weight: 800;
  padding: 3px 6px;
  border-radius: 6px;
  background: rgba(239, 68, 68, 0.3);
  border: 1px solid #ef4444;
  color: #fca5a5;
  backdrop-filter: blur(4px);
  z-index: 2;
}

.live-player-count {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 9.5px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #94a3b8;
  z-index: 2;
}

.live-card-icon {
  font-size: 42px;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.6));
  transition: transform 0.25s ease;
}

.live-table-card:hover .live-card-icon {
  transform: scale(1.1);
}

.live-dealer-host-info {
  position: absolute;
  bottom: 8px;
  left: 10px;
  right: 10px;
  display: flex;
  flex-direction: column;
  z-index: 2;
}

.live-dealer-host-info .host-name {
  font-size: 10px;
  color: #cbd5e1;
  font-weight: 600;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
}

.live-dealer-host-info .table-name {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 800;
  color: #ffffff;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9);
}

.live-table-footer {
  padding: 8px 10px;
  background: #090d18;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.live-table-limits {
  font-size: 9.5px;
  font-weight: 600;
  color: #64748b;
}

.btn-live-play {
  padding: 4px 8px;
  background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-live-play:hover {
  filter: brightness(1.15);
  transform: scale(1.04);
}

/* =========================================================
   LIVE TABLE ARENA COMMON STYLES (Blackjack, Baccarat, etc.)
   ========================================================= */

.live-table-stage {
  background: radial-gradient(circle at 50% 30%, #1a233a 0%, #0a0e1a 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 14px;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}

.live-table-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.live-dealer-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 800;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.35);
  padding: 4px 10px;
  border-radius: 12px;
}

.live-round-id {
  font-family: var(--font-mono);
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
  padding: 3px 8px;
  background: rgba(15, 23, 42, 0.7);
  border-radius: 6px;
}

.live-status-pill {
  text-align: center;
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 800;
  color: #fbbf24;
  margin: 10px 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
}

.live-win-banner {
  text-align: center;
  padding: 8px 14px;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid #10b981;
  border-radius: 10px;
  font-size: 13px;
  margin: 8px auto;
  max-width: 380px;
}

.live-history-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  overflow-x: auto;
}

.live-history-title {
  font-size: 10.5px;
  font-weight: 700;
  color: #64748b;
}

.live-history-track {
  display: flex;
  gap: 6px;
  overflow-x: auto;
}

.live-table-controls {
  background: #0d1424;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.live-chips-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.live-chip-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: radial-gradient(circle, #2563eb 0%, #1d4ed8 100%);
  border: 2px dashed #93c5fd;
  color: #fff;
  font-size: 11px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.5);
  transition: all 0.2s ease;
}

.live-chip-btn:hover {
  transform: translateY(-2px) scale(1.08);
}

.live-chip-btn.active {
  transform: translateY(-4px) scale(1.12);
  border-color: #fbbf24;
  box-shadow: 0 0 14px rgba(251, 191, 36, 0.7);
}

.live-btn-group {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-live-primary {
  padding: 10px 24px;
  background: linear-gradient(135deg, #00e701 0%, #00b301 100%);
  border: none;
  border-radius: 10px;
  color: #000;
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-live-primary:hover:not(:disabled) {
  filter: brightness(1.1);
  transform: scale(1.02);
}

.btn-live-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-live-tool {
  padding: 8px 14px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-live-tool:hover {
  background: rgba(51, 65, 85, 0.8);
  color: #fff;
}

.btn-live-action {
  padding: 10px 18px;
  border-radius: 10px;
  border: none;
  font-family: var(--font-display);
  font-size: 13.5px;
  font-weight: 800;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-live-action.hit { background: #10b981; }
.btn-live-action.stand { background: #ef4444; }
.btn-live-action.double { background: #3b82f6; }

.live-amount-input {
  width: 100px;
  padding: 8px 10px;
  background: #0b0f19;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
}

/* =========================================================
   BLACKJACK CARD STYLES
   ========================================================= */

.bj-hand-section {
  background: rgba(15, 23, 42, 0.5);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 8px;
}

.bj-hand-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.bj-hand-label {
  font-size: 11px;
  font-weight: 800;
  color: #94a3b8;
  letter-spacing: 0.5px;
}

.bj-hand-score {
  font-size: 13px;
  font-weight: 900;
  color: #fbbf24;
  padding: 2px 8px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 6px;
}

.bj-cards-container {
  display: flex;
  gap: 8px;
  min-height: 80px;
  align-items: center;
  flex-wrap: wrap;
}

.bj-card {
  width: 54px;
  height: 76px;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 4px;
  box-sizing: border-box;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
  position: relative;
  user-select: none;
}

.bj-card-back {
  background: radial-gradient(circle, #b91c1c 0%, #7f1d1d 100%);
  border-color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bj-card-inner-pattern {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.7);
}

.bj-card-corner {
  display: flex;
  flex-direction: column;
  line-height: 1;
  font-size: 12px;
  font-weight: 900;
}

.bj-card-corner.bottom-right {
  align-self: flex-end;
  transform: rotate(180deg);
}

.bj-card-center-suit {
  align-self: center;
  font-size: 18px;
}

.bj-card-placeholder {
  font-size: 11px;
  color: #64748b;
  font-style: italic;
}

.bj-felt-text {
  text-align: center;
  font-size: 10px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.25);
  letter-spacing: 1px;
  margin-bottom: 4px;
}

/* =========================================================
   BACCARAT STYLES
   ========================================================= */

.bac-cards-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.bac-side {
  background: rgba(15, 23, 42, 0.6);
  border-radius: 12px;
  padding: 10px;
}

.bac-side-title {
  font-size: 12px;
  font-weight: 800;
  color: #fff;
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.bac-side-score {
  font-weight: 900;
  color: #fbbf24;
}

.bac-cards-row {
  display: flex;
  gap: 6px;
  min-height: 76px;
}

.bac-vs-badge {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 900;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.15);
  padding: 4px 8px;
  border-radius: 50%;
}

.bac-board-container {
  background: #0d1424;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 14px;
}

.bac-bet-spots-row {
  display: grid;
  grid-template-columns: 1fr 1.3fr 1fr 1.3fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

@media (max-width: 650px) {
  .bac-bet-spots-row {
    grid-template-columns: 1fr 1fr;
  }
}

.bac-spot {
  padding: 12px 6px;
  border-radius: 10px;
  text-align: center;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.bac-spot:hover {
  transform: translateY(-2px);
  border-color: rgba(99, 102, 241, 0.5);
}

.bac-spot.spot-player { border-color: rgba(59, 130, 246, 0.4); }
.bac-spot.spot-banker { border-color: rgba(239, 68, 68, 0.4); }
.bac-spot.spot-tie { border-color: rgba(16, 185, 129, 0.4); }

.bac-spot.has-bet {
  border-color: #00e701;
  box-shadow: 0 0 12px rgba(0, 231, 1, 0.35);
}

.bac-spot-lbl {
  font-size: 11px;
  font-weight: 800;
  color: #fff;
}

.bac-spot-odds {
  font-size: 10px;
  font-weight: 700;
  color: #94a3b8;
  margin-top: 2px;
}

.bac-chip-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #00e701;
  color: #000;
  font-size: 9px;
  font-weight: 900;
  padding: 2px 6px;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
}

/* =========================================================
   TEEN PATTI STYLES
   ========================================================= */

.tp-hand-card-box {
  background: rgba(15, 23, 42, 0.55);
  border-radius: 12px;
  padding: 10px;
  margin-bottom: 8px;
}

.tp-hand-title {
  font-size: 11.5px;
  font-weight: 800;
  color: #cbd5e1;
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.tp-hand-rank {
  color: #fbbf24;
}

.tp-cards-row {
  display: flex;
  gap: 8px;
  justify-content: center;
  min-height: 76px;
}

.tp-inputs-row {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.tp-input-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tp-input-col label {
  font-size: 9.5px;
  font-weight: 700;
  color: #94a3b8;
}

/* =========================================================
   SUPER SIC BO STYLES
   ========================================================= */

.sb-shaker-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 10px 0;
}

.sb-glass-dome {
  width: 140px;
  height: 90px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, rgba(15, 23, 42, 0.8) 100%);
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-radius: 50px 50px 10px 10px;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.3), inset 0 2px 6px rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
}

.sb-glass-dome.shaking {
  animation: sbDomeShake 0.1s infinite;
}

@keyframes sbDomeShake {
  0% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(-3px, 2px) rotate(-2deg); }
  50% { transform: translate(3px, -2px) rotate(2deg); }
  75% { transform: translate(-2px, -2px) rotate(-1deg); }
  100% { transform: translate(2px, 2px) rotate(1deg); }
}

.sb-die {
  font-size: 32px;
  color: #fff;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.8);
}

.sb-total-pill {
  margin-top: 8px;
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 800;
  color: #fbbf24;
}

.sb-board-container {
  background: #0d1424;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 12px;
}

.sb-main-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  margin-bottom: 8px;
}

.sb-sums-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
  margin-bottom: 10px;
}

.sb-bet-spot {
  padding: 10px 4px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.sb-bet-spot:hover {
  border-color: #3b82f6;
  transform: translateY(-2px);
}

.sb-bet-spot.has-bet {
  border-color: #00e701;
  box-shadow: 0 0 10px rgba(0, 231, 1, 0.35);
}

.sb-spot-title {
  font-size: 11px;
  font-weight: 800;
  color: #fff;
}

.sb-spot-payout {
  font-size: 9.5px;
  color: #94a3b8;
  font-weight: 600;
}

.sb-lightning-badge {
  font-size: 9px;
  font-weight: 900;
  color: #fbbf24;
  background: rgba(245, 158, 11, 0.2);
  padding: 1px 4px;
  border-radius: 4px;
  margin-left: 2px;
}

.sb-chip-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #00e701;
  color: #000;
  font-size: 8.5px;
  font-weight: 900;
  padding: 1px 5px;
  border-radius: 8px;
}

/* =========================================================
   MEGA MONEY WHEEL STYLES
   ========================================================= */

.mw-wheel-container {
  position: relative;
  width: 280px;
  height: 280px;
  margin: 0 auto 10px auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mw-top-pointer {
  position: absolute;
  top: -6px;
  font-size: 26px;
  color: #ef4444;
  z-index: 10;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.8));
}

.mw-spots-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
  margin-bottom: 12px;
}

@media (max-width: 600px) {
  .mw-spots-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.mw-bet-spot {
  padding: 10px 4px;
  border-radius: 10px;
  text-align: center;
  cursor: pointer;
  position: relative;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.2s ease;
}

.mw-bet-spot:hover {
  transform: translateY(-2px);
  border-color: #fbbf24;
}

.mw-bet-spot.has-bet {
  border-color: #00e701;
  box-shadow: 0 0 10px rgba(0, 231, 1, 0.4);
}

.mw-spot-tag {
  font-size: 13px;
  font-weight: 900;
  color: #fff;
}

.mw-spot-sub {
  font-size: 9px;
  color: #94a3b8;
  font-weight: 600;
}

.mw-chip-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #00e701;
  color: #000;
  font-size: 8.5px;
  font-weight: 900;
  padding: 1px 5px;
  border-radius: 8px;
}

/* =========================================================
   7 UP 7 DOWN STYLES
   ========================================================= */

.su-dice-chamber {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin: 12px 0 6px 0;
}

.su-die {
  width: 52px;
  height: 52px;
  background: #ffffff;
  border-radius: 10px;
  font-size: 40px;
  color: #b91c1c;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.6);
  user-select: none;
}

.su-dice-total-pill {
  text-align: center;
  font-family: var(--font-display);
  font-size: 13.5px;
  font-weight: 800;
  color: #fbbf24;
  margin-bottom: 8px;
}

.su-zones-row {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1.2fr;
  gap: 10px;
  margin-bottom: 12px;
}

.su-bet-spot {
  padding: 14px 8px;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  position: relative;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.12);
  transition: all 0.2s ease;
}

.su-bet-spot.spot-down { border-color: rgba(59, 130, 246, 0.5); }
.su-bet-spot.spot-seven { border-color: rgba(245, 158, 11, 0.6); background: rgba(245, 158, 11, 0.08); }
.su-bet-spot.spot-up { border-color: rgba(239, 68, 68, 0.5); }

.su-bet-spot:hover {
  transform: translateY(-2px);
}

.su-bet-spot.has-bet {
  border-color: #00e701;
  box-shadow: 0 0 12px rgba(0, 231, 1, 0.4);
}

.su-zone-title {
  font-size: 14px;
  font-weight: 900;
  color: #fff;
}

.su-zone-sub {
  font-size: 10px;
  color: #94a3b8;
  font-weight: 600;
  margin: 2px 0;
}

.su-zone-payout {
  font-size: 12px;
  font-weight: 800;
  color: #fbbf24;
}

.su-chip-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #00e701;
  color: #000;
  font-size: 9px;
  font-weight: 900;
  padding: 2px 6px;
  border-radius: 10px;
}
"""

with open('public/css/style.css', 'a', encoding='utf-8') as f:
    f.write(live_css)

print("✅ Appended live casino CSS styles to public/css/style.css.")
