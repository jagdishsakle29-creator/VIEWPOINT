/**
 * VIEWPOINT - Master Application Controller
 * Supports: 💎 Mines, 🍗 Chicken, 🚀 Crash, 🎨 Tiranga Color Trading & 📈 Stock Market Trading + UPI Gateway
 * Features: 24/7 Live Support Bot, ⭐ Community Rating, Min ₹200-₹50k UPI System & Keypad Layout
 */

// SVG Assets for Gems, Bombs, Chicken, Bones, etc.
const ASSETS = {
  gem: `
    <svg class="gem-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00ffff" />
          <stop offset="40%" stop-color="#00e701" />
          <stop offset="100%" stop-color="#008f11" />
        </linearGradient>
        <filter id="gemGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <polygon points="50,5 92,35 76,92 24,92 8,35" fill="url(#gemGrad)" stroke="#ffffff" stroke-width="2.5" filter="url(#gemGlow)"/>
      <polygon points="50,5 68,35 50,55 32,35" fill="rgba(255,255,255,0.7)"/>
      <polygon points="50,55 68,35 76,92 50,92" fill="rgba(0,180,50,0.6)"/>
      <polygon points="50,55 32,35 24,92 50,92" fill="rgba(0,140,40,0.8)"/>
      <polygon points="8,35 32,35 24,92" fill="rgba(0,255,180,0.5)"/>
      <polygon points="92,35 68,35 76,92" fill="rgba(0,255,180,0.5)"/>
      <polygon points="50,5 8,35 32,35" fill="rgba(255,255,255,0.9)"/>
      <polygon points="50,5 92,35 68,35" fill="rgba(255,255,255,0.4)"/>
    </svg>
  `,
  bomb: `
    <svg class="bomb-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bombGrad" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#4a5568" />
          <stop offset="50%" stop-color="#1a202c" />
          <stop offset="100%" stop-color="#0f172a" />
        </radialGradient>
        <radialGradient id="fireGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffff00" />
          <stop offset="50%" stop-color="#ff4757" />
          <stop offset="100%" stop-color="#fe2c55" />
        </radialGradient>
      </defs>
      <path d="M50 32 Q62 18 76 22" stroke="#d97706" stroke-width="4" fill="none" stroke-linecap="round"/>
      <circle cx="78" cy="21" r="9" fill="url(#fireGrad)"/>
      <polygon points="78,8 81,18 90,16 83,23 88,32 79,26 73,34 74,24 65,22 74,17" fill="#ffeb3b"/>
      <circle cx="48" cy="58" r="34" fill="url(#bombGrad)" stroke="#ff4757" stroke-width="2.5"/>
      <ellipse cx="38" cy="46" rx="9" ry="5" transform="rotate(-30 38 46)" fill="rgba(255,255,255,0.35)"/>
      <rect x="42" y="27" width="12" height="7" rx="2" fill="#718096" stroke="#2d3748" stroke-width="1.5"/>
    </svg>
  `,
  chicken: `
    <svg class="chicken-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="meatGrad" cx="45%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#fde047" />
          <stop offset="40%" stop-color="#f59e0b" />
          <stop offset="85%" stop-color="#b45309" />
          <stop offset="100%" stop-color="#78350f" />
        </radialGradient>
      </defs>
      <ellipse cx="44" cy="48" rx="28" ry="24" transform="rotate(-25 44 48)" fill="url(#meatGrad)" stroke="#fbbf24" stroke-width="2"/>
      <ellipse cx="36" cy="40" rx="14" ry="7" transform="rotate(-30 36 40)" fill="rgba(255,255,255,0.4)"/>
      <ellipse cx="48" cy="55" rx="8" ry="4" fill="#92400e" opacity="0.6"/>
      <line x1="64" y1="62" x2="80" y2="76" stroke="#e2e8f0" stroke-width="9" stroke-linecap="round"/>
      <circle cx="80" cy="74" r="5" fill="#f8fafc"/>
      <circle cx="76" cy="80" r="5" fill="#f8fafc"/>
      <path d="M28 20 Q32 12 28 4" stroke="#fef08a" stroke-width="2" fill="none" opacity="0.75" stroke-linecap="round"/>
      <path d="M42 16 Q46 8 42 2" stroke="#fef08a" stroke-width="2" fill="none" opacity="0.85" stroke-linecap="round"/>
    </svg>
  `,
  bone: `
    <svg class="bone-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="boneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f8fafc" />
          <stop offset="50%" stop-color="#cbd5e1" />
          <stop offset="100%" stop-color="#94a3b8" />
        </linearGradient>
      </defs>
      <line x1="30" y1="70" x2="70" y2="30" stroke="url(#boneGrad)" stroke-width="12" stroke-linecap="round"/>
      <circle cx="26" cy="65" r="7" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
      <circle cx="33" cy="74" r="7" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
      <circle cx="67" cy="26" r="7" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
      <circle cx="74" cy="35" r="7" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
      <line x1="45" y1="45" x2="55" y2="55" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="55" y1="45" x2="45" y2="55" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/>
    </svg>
  `
};

class AppController {
  constructor() {
    this.currentGame = 'mines'; // 'mines', 'chicken', 'crash', 'colortrading', 'stock'
    this.soundEnabled = true;
    this.stockDurationSec = 30;
    this.selectedRating = 5;

    // DOM Elements
    this.dom = {
      currencySymbol: document.getElementById('currencySymbol'),
      inputCurrencyPrefix: document.getElementById('inputCurrencyPrefix'),
      depCurrPrefix: document.getElementById('depCurrPrefix'),
      walletBalance: document.getElementById('walletBalance'),
      btnResetWallet: document.getElementById('btnResetWallet'),
      btnOpenDeposit: document.getElementById('btnOpenDeposit'),
      btnOpenAdmin: document.getElementById('btnOpenAdmin'),
      btnLiveSupport: document.getElementById('btnLiveSupport'),
      btnOpenRating: document.getElementById('btnOpenRating'),
      btnSoundToggle: document.getElementById('btnSoundToggle'),
      btnProvablyFair: document.getElementById('btnProvablyFair'),
      modalProvablyFair: document.getElementById('modalProvablyFair'),
      btnCloseFairModal: document.getElementById('btnCloseFairModal'),
      serverSeedHash: document.getElementById('serverSeedHash'),
      clientSeedInput: document.getElementById('clientSeedInput'),
      nonceVal: document.getElementById('nonceVal'),
      btnRotateSeed: document.getElementById('btnRotateSeed'),
      
      // UPI Deposit Modal
      modalDepositUpi: document.getElementById('modalDepositUpi'),
      btnCloseDepositModal: document.getElementById('btnCloseDepositModal'),
      tabDepositForm: document.getElementById('tabDepositForm'),
      tabDepositHistory: document.getElementById('tabDepositHistory'),
      viewDepositForm: document.getElementById('viewDepositForm'),
      viewDepositHistory: document.getElementById('viewDepositHistory'),
      depositAmountInput: document.getElementById('depositAmountInput'),
      upiQrCodeImg: document.getElementById('upiQrCodeImg'),
      qrAmountTag: document.getElementById('qrAmountTag'),
      displayPayeeName: document.getElementById('displayPayeeName'),
      displayUpiId: document.getElementById('displayUpiId'),
      btnCopyUpiId: document.getElementById('btnCopyUpiId'),
      copyBtnText: document.getElementById('copyBtnText'),
      linkGPay: document.getElementById('linkGPay'),
      linkPhonePe: document.getElementById('linkPhonePe'),
      linkPaytm: document.getElementById('linkPaytm'),
      linkAnyUpi: document.getElementById('linkAnyUpi'),
      depositUtrInput: document.getElementById('depositUtrInput'),
      btnSubmitDeposit: document.getElementById('btnSubmitDeposit'),
      depositHistoryTableBody: document.getElementById('depositHistoryTableBody'),
      depositQuickChips: document.querySelectorAll('.deposit-quick-chips .chip-btn'),

      // Withdrawal Modal
      btnOpenWithdraw: document.getElementById('btnOpenWithdraw'),
      modalWithdraw: document.getElementById('modalWithdraw'),
      btnCloseWithdrawModal: document.getElementById('btnCloseWithdrawModal'),
      tabWithdrawForm: document.getElementById('tabWithdrawForm'),
      tabWithdrawHistory: document.getElementById('tabWithdrawHistory'),
      viewWithdrawForm: document.getElementById('viewWithdrawForm'),
      viewWithdrawHistory: document.getElementById('viewWithdrawHistory'),
      withdrawAvailableBal: document.getElementById('withdrawAvailableBal'),
      withdrawDailyRemainingText: document.getElementById('withdrawDailyRemainingText'),
      withdrawLimitProgressBar: document.getElementById('withdrawLimitProgressBar'),
      btnMethodUpi: document.getElementById('btnMethodUpi'),
      btnMethodBank: document.getElementById('btnMethodBank'),
      btnMethodCrypto: document.getElementById('btnMethodCrypto'),
      withdrawMethodBtns: document.querySelectorAll('.withdraw-method-btn'),
      channelUpiFields: document.getElementById('channelUpiFields'),
      channelBankFields: document.getElementById('channelBankFields'),
      channelCryptoFields: document.getElementById('channelCryptoFields'),
      withdrawAmountInput: document.getElementById('withdrawAmountInput'),
      withdrawQuickChips: document.querySelectorAll('#viewWithdrawForm .chip-btn[data-amount]'),
      btnWithdrawMax: document.getElementById('btnWithdrawMax'),
      withdrawUpiInput: document.getElementById('withdrawUpiInput'),
      withdrawNameInput: document.getElementById('withdrawNameInput'),
      withdrawBankAccInput: document.getElementById('withdrawBankAccInput'),
      withdrawBankIfscInput: document.getElementById('withdrawBankIfscInput'),
      withdrawBankNameInput: document.getElementById('withdrawBankNameInput'),
      withdrawBankHolderInput: document.getElementById('withdrawBankHolderInput'),
      withdrawCryptoAddress: document.getElementById('withdrawCryptoAddress'),
      calcGrossAmount: document.getElementById('calcGrossAmount'),
      calcPlatformFee: document.getElementById('calcPlatformFee'),
      calcNetAmount: document.getElementById('calcNetAmount'),
      chkSaveWithdrawDetails: document.getElementById('chkSaveWithdrawDetails'),
      btnSubmitWithdraw: document.getElementById('btnSubmitWithdraw'),
      withdrawHistoryTableBody: document.getElementById('withdrawHistoryTableBody'),

      // Live Support Bot Modal
      modalLiveSupport: document.getElementById('modalLiveSupport'),
      btnCloseSupportModal: document.getElementById('btnCloseSupportModal'),
      chatMessagesContainer: document.getElementById('chatMessagesContainer'),
      chatInputField: document.getElementById('chatInputField'),
      btnSendChat: document.getElementById('btnSendChat'),
      chatQuickChips: document.querySelectorAll('.chip-chat-quick'),

      // Rating Modal
      modalRating: document.getElementById('modalRating'),
      btnCloseRatingModal: document.getElementById('btnCloseRatingModal'),
      starRatingBtns: document.querySelectorAll('.star-rating-btn'),
      ratingTextFeedback: document.getElementById('ratingTextFeedback'),
      ratingCommentInput: document.getElementById('ratingCommentInput'),
      btnSubmitRating: document.getElementById('btnSubmitRating'),

      // UPI Admin Settings & Deposit Approval Modal
      modalUpiSettings: document.getElementById('modalUpiSettings'),
      btnCloseAdminModal: document.getElementById('btnCloseAdminModal'),
      tabAdminPending: document.getElementById('tabAdminPending'),
      tabAdminWithdraw: document.getElementById('tabAdminWithdraw'),
      tabAdminUpi: document.getElementById('tabAdminUpi'),
      tabAdminTelegram: document.getElementById('tabAdminTelegram'),
      viewAdminPending: document.getElementById('viewAdminPending'),
      viewAdminWithdraw: document.getElementById('viewAdminWithdraw'),
      viewAdminUpi: document.getElementById('viewAdminUpi'),
      viewAdminTelegram: document.getElementById('viewAdminTelegram'),
      adminPendingBadge: document.getElementById('adminPendingBadge'),
      adminWithdrawBadge: document.getElementById('adminWithdrawBadge'),
      adminPendingListContainer: document.getElementById('adminPendingListContainer'),
      adminWithdrawListContainer: document.getElementById('adminWithdrawListContainer'),
      settingUpiIdInput: document.getElementById('settingUpiIdInput'),
      settingPayeeNameInput: document.getElementById('settingPayeeNameInput'),
      settingCurrencySelect: document.getElementById('settingCurrencySelect'),
      settingMinDepositInput: document.getElementById('settingMinDepositInput'),
      btnSaveUpiSettings: document.getElementById('btnSaveUpiSettings'),
      settingTgBotToken: document.getElementById('settingTgBotToken'),
      settingTgChatId: document.getElementById('settingTgChatId'),
      settingTgEnabled: document.getElementById('settingTgEnabled'),
      btnSaveTelegramSettings: document.getElementById('btnSaveTelegramSettings'),

      // Game Tabs
      tabMines: document.getElementById('tabMines'),
      tabChicken: document.getElementById('tabChicken'),
      tabCrash: document.getElementById('tabCrash'),
      tabColorTrading: document.getElementById('tabColorTrading'),
      tabStock: document.getElementById('tabStock'),

      // Game Stage Views
      minesView: document.getElementById('minesView'),
      chickenView: document.getElementById('chickenView'),
      crashView: document.getElementById('crashView'),
      colortradingView: document.getElementById('colortradingView'),
      stockView: document.getElementById('stockView'),

      // Mines & Chicken Grids
      minesGrid: document.getElementById('minesGrid'),
      chickenGrid: document.getElementById('chickenGrid'),

      // Crash Canvas & Elements
      crashCanvas: document.getElementById('crashCanvas'),
      crashMultiplierText: document.getElementById('crashMultiplierText'),
      crashStatusTag: document.getElementById('crashStatusTag'),
      crashHistoryBar: document.getElementById('crashHistoryBar'),
      crashAutoCashoutInput: document.getElementById('crashAutoCashoutInput'),

      // Controls
      btnDiffEasy: document.getElementById('btnDiffEasy'),
      btnDiffMed: document.getElementById('btnDiffMed'),
      btnDiffHard: document.getElementById('btnDiffHard'),
      difficultyLabelHelper: document.getElementById('difficultyLabelHelper'),
      betAmountInput: document.getElementById('betAmountInput'),
      btnHalfBet: document.getElementById('btnHalfBet'),
      btnDoubleBet: document.getElementById('btnDoubleBet'),
      btnMaxBet: document.getElementById('btnMaxBet'),
      minesCountSelect: document.getElementById('minesCountSelect'),
      bonesCountSelect: document.getElementById('bonesCountSelect'),
      minesSelectGroup: document.getElementById('minesSelectGroup'),
      chickenSelectGroup: document.getElementById('chickenSelectGroup'),
      crashSelectGroup: document.getElementById('crashSelectGroup'),
      colorTradingSelectGroup: document.getElementById('colorTradingSelectGroup'),
      stockSelectGroup: document.getElementById('stockSelectGroup'),
      multiplierPreviewCard: document.getElementById('multiplierPreviewCard'),
      multStreakContainer: document.getElementById('multStreakContainer'),
      mainActionArea: document.getElementById('mainActionArea'),

      btnActionBet: document.getElementById('btnActionBet'),
      btnActionCashout: document.getElementById('btnActionCashout'),
      cashoutAmountDisplay: document.getElementById('cashoutAmountDisplay'),
      cashoutMultiplierDisplay: document.getElementById('cashoutMultiplierDisplay'),
      previewMultiplier: document.getElementById('previewMultiplier'),
      previewProfit: document.getElementById('previewProfit'),
      previewStepLabel: document.getElementById('previewStepLabel'),
      multCurrentVal: document.getElementById('multCurrentVal'),
      multNextVal: document.getElementById('multNextVal'),
      multProgressBadges: document.getElementById('multProgressBadges'),

      // Tiranga Color Trading Elements
      tirangaModeBtns: document.querySelectorAll('.tiranga-mode-btn'),
      tradingPeriodId: document.getElementById('tradingPeriodId'),
      timerDigit1: document.getElementById('timerDigit1'),
      timerDigit2: document.getElementById('timerDigit2'),
      btnBetGreen: document.getElementById('btnBetGreen'),
      btnBetViolet: document.getElementById('btnBetViolet'),
      btnBetRed: document.getElementById('btnBetRed'),
      btnBetBig: document.getElementById('btnBetBig'),
      btnBetSmall: document.getElementById('btnBetSmall'),
      numberBetButtons: document.querySelectorAll('.btn-number-bet'),
      tradingActiveBetsSlip: document.getElementById('tradingActiveBetsSlip'),
      activeBetsList: document.getElementById('activeBetsList'),
      trendBallsRow: document.getElementById('trendBallsRow'),

      // Stock Market Elements
      stockAssetSelect: document.getElementById('stockAssetSelect'),
      stockLivePrice: document.getElementById('stockLivePrice'),
      stockChangeTag: document.getElementById('stockChangeTag'),
      stockCanvas: document.getElementById('stockCanvas'),
      btnStockCall: document.getElementById('btnStockCall'),
      btnStockPut: document.getElementById('btnStockPut'),
      stockActiveTradesCard: document.getElementById('stockActiveTradesCard'),
      stockActiveTradesList: document.getElementById('stockActiveTradesList'),
      btnExpiry30s: document.getElementById('btnExpiry30s'),
      btnExpiry60s: document.getElementById('btnExpiry60s'),
      btnExpiry2m: document.getElementById('btnExpiry2m'),

      // Live Online & Community Stream
      liveOnlineUsersCounter: document.getElementById('liveOnlineUsersCounter'),
      tabCommunityWins: document.getElementById('tabCommunityWins'),
      tabMyBets: document.getElementById('tabMyBets'),
      viewCommunityWins: document.getElementById('viewCommunityWins'),
      viewMyBets: document.getElementById('viewMyBets'),
      communityBetsTableBody: document.getElementById('communityBetsTableBody'),
      liveWinFloatingToast: document.getElementById('liveWinFloatingToast'),
      winToastUser: document.getElementById('winToastUser'),
      winToastPayout: document.getElementById('winToastPayout'),

      // Toast & History
      roundResultToast: document.getElementById('roundResultToast'),
      toastMultiplier: document.getElementById('toastMultiplier'),
      toastPayout: document.getElementById('toastPayout'),
      toastTagline: document.getElementById('toastTagline'),
      historyTableBody: document.getElementById('historyTableBody'),

      // Auth & Refer Elements
      authLoggedOutBox: document.getElementById('authLoggedOutBox'),
      authLoggedInBox: document.getElementById('authLoggedInBox'),
      displayUsername: document.getElementById('displayUsername'),
      modalAuth: document.getElementById('modalAuth'),
      authUsernameInput: document.getElementById('authUsernameInput'),
      authPasswordInput: document.getElementById('authPasswordInput'),
      btnSubmitAuthText: document.getElementById('btnSubmitAuthText'),
      authModalTitle: document.getElementById('authModalTitle'),
      tabAuthLogin: document.getElementById('tabAuthLogin'),
      tabAuthSignup: document.getElementById('tabAuthSignup'),
      modalRefer: document.getElementById('modalRefer'),
      referralLinkInput: document.getElementById('referralLinkInput'),
      referTotalInvites: document.getElementById('referTotalInvites'),
      referTotalEarned: document.getElementById('referTotalEarned'),
      referUnclaimedBonus: document.getElementById('referUnclaimedBonus'),

      // Multi-Page & Page 2 Elements
      mainPage1: document.getElementById('mainPage1'),
      mainPage2: document.getElementById('mainPage2'),
      btnNavPage1: document.getElementById('btnNavPage1'),
      btnNavPage2: document.getElementById('btnNavPage2'),
      limboBetAmountInput: document.getElementById('limboBetAmountInput'),
      limboTargetMultiplierInput: document.getElementById('limboTargetMultiplierInput'),
      limboMultiplierDisplay: document.getElementById('limboMultiplierDisplay'),
      limboResultTag: document.getElementById('limboResultTag'),
      limboWinChance: document.getElementById('limboWinChance'),
      limboProfitDisplay: document.getElementById('limboProfitDisplay'),
      wheelCanvas: document.getElementById('wheelCanvas'),
      wheelStatusText: document.getElementById('wheelStatusText'),
      btnSpinWheel: document.getElementById('btnSpinWheel'),
      rakebackAmount: document.getElementById('rakebackAmount')
    };

    this.authMode = 'login';
    this.currentUser = null;
    this.currentPage = 1;
    this.wheelSpinning = false;
    this.wheelAngle = 0;

    this.initGames();
    this.bindEvents();
    this.renderGrids();
    this.updateWalletUI(window.wallet.balance, window.wallet.currency);
    this.renderHistoryTable();
    this.syncProvablyFairUI();
    this.syncUpiUI();
    this.initAuthAndRefer();
    this.initPage2Arcade();
    this.startOnlineMembersLoop();
    this.startCommunityLiveWinsStream();
  }

  initGames() {
    // 1. Mines Game Instance
    this.mines = new window.MinesGame({
      onMultiplierUpdate: (data) => this.onGameMultiplierUpdate(data),
      onGameStart: (data) => this.onGameStarted(data),
      onTileReveal: (index, type, isMine) => this.onMineTileReveal(index, type, isMine),
      onRevealRemaining: (index, type) => this.onMineRevealRemaining(index, type),
      onGameOver: (result) => this.onGameOverResult(result),
      onError: (msg) => this.showNotification(msg, 'error')
    });

    // 2. Chicken Game Instance
    this.chicken = new window.ChickenGame({
      onMultiplierUpdate: (data) => this.onGameMultiplierUpdate(data),
      onGameStart: (data) => this.onGameStarted(data),
      onDishReveal: (index, type, isBone) => this.onChickenDishReveal(index, type, isBone),
      onRevealRemaining: (index, type) => this.onChickenRevealRemaining(index, type),
      onGameOver: (result) => this.onGameOverResult(result),
      onError: (msg) => this.showNotification(msg, 'error')
    });

    // 3. Crash Game Instance
    if (window.CrashGame && this.dom.crashCanvas) {
      this.crash = new window.CrashGame(this.dom.crashCanvas, {
        onGameStart: (data) => {
          this.dom.btnActionBet.style.display = 'none';
          this.dom.btnActionCashout.style.display = 'flex';
          this.dom.btnActionCashout.disabled = false;
          this.dom.betAmountInput.disabled = true;
          this.dom.crashStatusTag.innerText = "FLYING...";
          this.dom.crashMultiplierText.classList.remove('crashed');
        },
        onMultiplierUpdate: (mult) => {
          this.dom.crashMultiplierText.innerText = `${mult.toFixed(2)}x`;
          const currentPayout = this.crash.betAmount * mult;
          this.dom.cashoutAmountDisplay.innerText = `${window.wallet.currency}${currentPayout.toFixed(2)}`;
          this.dom.cashoutMultiplierDisplay.innerText = `${mult.toFixed(2)}x`;
        },
        onCashout: (res) => {
          this.dom.btnActionBet.style.display = 'flex';
          this.dom.btnActionCashout.style.display = 'none';
          this.dom.betAmountInput.disabled = false;
          this.showToast({ won: true, payout: res.payout, multiplier: res.multiplier });
          this.renderHistoryTable();
        },
        onCrash: (res) => {
          this.dom.btnActionBet.style.display = 'flex';
          this.dom.btnActionCashout.style.display = 'none';
          this.dom.betAmountInput.disabled = false;
          this.dom.crashMultiplierText.classList.add('crashed');
          this.dom.crashMultiplierText.innerText = `${res.crashPoint.toFixed(2)}x`;
          this.dom.crashStatusTag.innerText = "CRASHED!";
          this.renderCrashHistory();
          if (!res.hasCashedOut) {
            this.showToast({ won: false, payout: 0, multiplier: 0 });
          }
          this.renderHistoryTable();
        },
        onError: (msg) => this.showNotification(msg, 'error')
      });
      this.renderCrashHistory();
    }

    // 4. Color Trading Game Instance
    if (window.ColorTradingGame) {
      this.colortrading = new window.ColorTradingGame({
        onTimerTick: (data) => {
          this.dom.tradingPeriodId.innerText = data.periodId;
          const tens = Math.floor(data.timeLeft / 10);
          const ones = data.timeLeft % 10;
          this.dom.timerDigit1.innerText = tens;
          this.dom.timerDigit2.innerText = ones;
          const isHurry = data.timeLeft <= 5;
          this.dom.timerDigit1.classList.toggle('hurry', isHurry);
          this.dom.timerDigit2.classList.toggle('hurry', isHurry);
        },
        onBetPlaced: (bets) => {
          this.renderActiveBetsSlip(bets);
          this.showNotification("✅ Bet placed for current period!", "success");
        },
        onRoundSettled: (res) => {
          this.renderTrendBalls(res.history);
          this.renderActiveBetsSlip([]);
          if (res.totalWin > 0) {
            this.showNotification(`🎉 You won ${window.wallet.currency}${res.totalWin.toFixed(2)} in Color Trading!`, "success");
          }
          this.renderHistoryTable();
        }
      });
      this.renderTrendBalls(this.colortrading.history);
    }

    // 5. Stock Market Live Trading Instance
    if (window.StockTradingGame && this.dom.stockCanvas) {
      this.stock = new window.StockTradingGame(this.dom.stockCanvas, {
        onPriceTick: (data) => {
          this.dom.stockLivePrice.innerText = `${window.wallet.currency}${data.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          this.dom.stockLivePrice.className = data.isUp ? 'stock-live-price' : 'stock-live-price down';
          this.dom.stockChangeTag.innerText = `${data.isUp ? '+' : ''}${data.changePercent.toFixed(2)}% Today`;
          this.dom.stockChangeTag.className = data.isUp ? 'stock-change-tag' : 'stock-change-tag down';
        },
        onTradePlaced: (trades) => {
          this.renderStockActiveTrades(trades);
          this.showNotification("📈 Position opened successfully!", "success");
        },
        onTradeUpdate: (trades) => {
          this.renderStockActiveTrades(trades);
        },
        onTradeSettled: (res) => {
          this.renderStockActiveTrades(this.stock.activeTrades);
          if (res.won) {
            this.showNotification(`🎉 Trade Won! Payout: ${window.wallet.currency}${res.payout.toFixed(2)}`, "success");
          } else if (res.isTie) {
            this.showNotification(`🤝 Trade Tied! Investment refunded.`, "info");
          } else {
            this.showNotification(`📉 Trade Closed at ${window.wallet.currency}${res.closePrice.toFixed(2)}`, "error");
          }
          this.renderHistoryTable();
        }
      });
    }

    this.activeInstance = this.mines;
    this.activeInstance.setBetAmount(parseFloat(this.dom.betAmountInput.value) || 10);
    this.activeInstance.setMineCount(parseInt(this.dom.minesCountSelect.value) || 3);
  }

  bindEvents() {
    // Wallet Subscription
    window.wallet.subscribe((balance, currency) => this.updateWalletUI(balance, currency));

    // Reset Wallet
    this.dom.btnResetWallet.addEventListener('click', () => {
      window.soundEngine.playClick();
      window.wallet.resetBalance(1000.00);
      this.showNotification(`Balance reset to ${window.wallet.currency}1,000.00 demo funds!`, "success");
    });

    // Sound Toggle
    if (this.dom.btnSoundToggle) {
      this.dom.btnSoundToggle.addEventListener('click', () => {
        this.soundEnabled = !this.soundEnabled;
        window.soundEngine.toggleSound(this.soundEnabled);
        this.dom.btnSoundToggle.classList.toggle('active', this.soundEnabled);
        this.dom.btnSoundToggle.innerHTML = this.soundEnabled
          ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08"></path></svg>`
          : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4.93a10 10 0 0 1 2.83 2.83M11 5L6 9H2v6h4l5 4v-6.5"></path></svg>`;
      });
    }

    // UPI Deposit Modal Open/Close
    this.dom.btnOpenDeposit.addEventListener('click', () => {
      window.soundEngine.playClick();
      this.syncUpiUI();
      this.dom.modalDepositUpi.classList.add('open');
    });

    this.dom.btnCloseDepositModal.addEventListener('click', () => {
      this.dom.modalDepositUpi.classList.remove('open');
    });

    // Copy UPI ID Button Listener
    if (this.dom.btnCopyUpiId) {
      this.dom.btnCopyUpiId.addEventListener('click', (e) => {
        e.stopPropagation();
        this.copyUpiId();
      });
    }

    // Live Support Bot Modal Open/Close
    if (this.dom.btnLiveSupport) {
      this.dom.btnLiveSupport.addEventListener('click', () => {
        window.soundEngine.playClick();
        this.dom.modalLiveSupport.classList.add('open');
      });
    }

    if (this.dom.btnCloseSupportModal) {
      this.dom.btnCloseSupportModal.addEventListener('click', () => {
        this.dom.modalLiveSupport.classList.remove('open');
      });
    }

    // Support Chat Send & Quick Chips
    if (this.dom.btnSendChat) {
      this.dom.btnSendChat.addEventListener('click', () => this.handleUserChatMessage());
    }
    if (this.dom.chatInputField) {
      this.dom.chatInputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleUserChatMessage();
      });
    }
    if (this.dom.chatQuickChips) {
      this.dom.chatQuickChips.forEach(chip => {
        chip.addEventListener('click', () => {
          const q = chip.dataset.query;
          let userText = chip.innerText;
          this.appendChatMessage(userText, 'user');
          setTimeout(() => this.generateBotResponse(q), 400);
        });
      });
    }

    // Rating Modal Open/Close
    if (this.dom.btnOpenRating) {
      this.dom.btnOpenRating.addEventListener('click', () => {
        window.soundEngine.playClick();
        this.dom.modalRating.classList.add('open');
      });
    }

    if (this.dom.btnCloseRatingModal) {
      this.dom.btnCloseRatingModal.addEventListener('click', () => {
        this.dom.modalRating.classList.remove('open');
      });
    }

    // Star Rating Click
    if (this.dom.starRatingBtns) {
      this.dom.starRatingBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          window.soundEngine.playClick();
          const r = parseInt(btn.dataset.rating) || 5;
          this.selectedRating = r;
          this.dom.starRatingBtns.forEach((b, idx) => {
            b.classList.toggle('active', idx < r);
          });
          const labels = {
            1: '1.0 / 5.0 - Needs Improvement',
            2: '2.0 / 5.0 - Fair Experience',
            3: '3.0 / 5.0 - Good Experience',
            4: '4.0 / 5.0 - Very Good & Fast!',
            5: '5.0 / 5.0 - Excellent & Super Fast!'
          };
          this.dom.ratingTextFeedback.innerText = labels[r];
        });
      });
    }

    if (this.dom.btnSubmitRating) {
      this.dom.btnSubmitRating.addEventListener('click', () => {
        window.soundEngine.playClick();
        this.dom.modalRating.classList.remove('open');
        this.showNotification("🎉 Thank you for your 5-star rating and review!", "success");
      });
    }

    // Admin Settings Modal
    this.dom.btnOpenAdmin.addEventListener('click', () => {
      window.soundEngine.playClick();
      this.syncAdminSettingsUI();
      this.renderAdminPendingDeposits();
      this.dom.modalUpiSettings.classList.add('open');
    });

    this.dom.btnCloseAdminModal.addEventListener('click', () => {
      this.dom.modalUpiSettings.classList.remove('open');
    });

    // Admin Tabs Switcher
    if (this.dom.tabAdminPending && this.dom.tabAdminWithdraw && this.dom.tabAdminUpi && this.dom.tabAdminTelegram) {
      this.dom.tabAdminPending.addEventListener('click', () => {
        window.soundEngine.playClick();
        [this.dom.tabAdminPending, this.dom.tabAdminWithdraw, this.dom.tabAdminUpi, this.dom.tabAdminTelegram].forEach(t => t && t.classList.remove('active'));
        [this.dom.viewAdminPending, this.dom.viewAdminWithdraw, this.dom.viewAdminUpi, this.dom.viewAdminTelegram].forEach(v => v && v.classList.remove('active'));
        this.dom.tabAdminPending.classList.add('active');
        this.dom.viewAdminPending.classList.add('active');
        this.renderAdminPendingDeposits();
      });

      this.dom.tabAdminWithdraw.addEventListener('click', () => {
        window.soundEngine.playClick();
        [this.dom.tabAdminPending, this.dom.tabAdminWithdraw, this.dom.tabAdminUpi, this.dom.tabAdminTelegram].forEach(t => t && t.classList.remove('active'));
        [this.dom.viewAdminPending, this.dom.viewAdminWithdraw, this.dom.viewAdminUpi, this.dom.viewAdminTelegram].forEach(v => v && v.classList.remove('active'));
        this.dom.tabAdminWithdraw.classList.add('active');
        this.dom.viewAdminWithdraw.classList.add('active');
        this.renderAdminWithdrawList();
      });

      this.dom.tabAdminUpi.addEventListener('click', () => {
        window.soundEngine.playClick();
        [this.dom.tabAdminPending, this.dom.tabAdminWithdraw, this.dom.tabAdminUpi, this.dom.tabAdminTelegram].forEach(t => t && t.classList.remove('active'));
        [this.dom.viewAdminPending, this.dom.viewAdminWithdraw, this.dom.viewAdminUpi, this.dom.viewAdminTelegram].forEach(v => v && v.classList.remove('active'));
        this.dom.tabAdminUpi.classList.add('active');
        this.dom.viewAdminUpi.classList.add('active');
      });

      this.dom.tabAdminTelegram.addEventListener('click', () => {
        window.soundEngine.playClick();
        [this.dom.tabAdminPending, this.dom.tabAdminWithdraw, this.dom.tabAdminUpi, this.dom.tabAdminTelegram].forEach(t => t && t.classList.remove('active'));
        [this.dom.viewAdminPending, this.dom.viewAdminWithdraw, this.dom.viewAdminUpi, this.dom.viewAdminTelegram].forEach(v => v && v.classList.remove('active'));
        this.dom.tabAdminTelegram.classList.add('active');
        this.dom.viewAdminTelegram.classList.add('active');
      });
    }

    // Save UPI Settings
    this.dom.btnSaveUpiSettings.addEventListener('click', () => {
      window.soundEngine.playClick();
      const upiId = this.dom.settingUpiIdInput.value.trim();
      const payeeName = this.dom.settingPayeeNameInput.value.trim() || 'VIEWPOINT Games';
      const currency = this.dom.settingCurrencySelect.value;
      const minDeposit = parseFloat(this.dom.settingMinDepositInput.value) || 200;

      if (!upiId) {
        this.showNotification("Please enter a valid UPI ID!", "error");
        return;
      }

      window.wallet.saveUpiSettings({ upiId, payeeName, minDeposit });
      window.wallet.setCurrency(currency);
      this.syncUpiUI();
      this.dom.modalUpiSettings.classList.remove('open');
      this.showNotification("✅ UPI Account settings saved successfully!", "success");
    });

    // Save Telegram Settings
    if (this.dom.btnSaveTelegramSettings) {
      this.dom.btnSaveTelegramSettings.addEventListener('click', () => {
        window.soundEngine.playClick();
        const botToken = this.dom.settingTgBotToken.value.trim();
        const chatId = this.dom.settingTgChatId.value.trim();
        const isEnabled = this.dom.settingTgEnabled.checked;

        window.wallet.saveTelegramSettings({ botToken, chatId, isEnabled });
        this.showNotification("🔔 Telegram Bot Alert settings saved!", "success");
      });
    }

    // Deposit Tabs
    this.dom.tabDepositForm.addEventListener('click', () => {
      this.dom.tabDepositForm.classList.add('active');
      this.dom.tabDepositHistory.classList.remove('active');
      this.dom.viewDepositForm.classList.add('active');
      this.dom.viewDepositHistory.classList.remove('active');
    });

    this.dom.tabDepositHistory.addEventListener('click', () => {
      this.dom.tabDepositHistory.classList.add('active');
      this.dom.tabDepositForm.classList.remove('active');
      this.dom.viewDepositHistory.classList.add('active');
      this.dom.viewDepositForm.classList.remove('active');
      this.renderDepositHistoryTable();
    });

    // Withdrawal Modal & Tabs
    if (this.dom.btnOpenWithdraw) {
      this.dom.btnOpenWithdraw.addEventListener('click', () => this.openWithdrawModal());
    }
    if (this.dom.btnCloseWithdrawModal) {
      this.dom.btnCloseWithdrawModal.addEventListener('click', () => {
        this.dom.modalWithdraw.classList.remove('open');
      });
    }

    if (this.dom.tabWithdrawForm && this.dom.tabWithdrawHistory) {
      this.dom.tabWithdrawForm.addEventListener('click', () => {
        this.dom.tabWithdrawForm.classList.add('active');
        this.dom.tabWithdrawHistory.classList.remove('active');
        this.dom.viewWithdrawForm.classList.add('active');
        this.dom.viewWithdrawHistory.classList.remove('active');
      });

      this.dom.tabWithdrawHistory.addEventListener('click', () => {
        this.dom.tabWithdrawHistory.classList.add('active');
        this.dom.tabWithdrawForm.classList.remove('active');
        this.dom.viewWithdrawHistory.classList.add('active');
        this.dom.viewWithdrawForm.classList.remove('active');
        this.renderWithdrawHistoryTable();
      });
    }

    // Quick Chip Amount Click (Deposit)
    this.dom.depositQuickChips.forEach(chip => {
      chip.addEventListener('click', () => {
        window.soundEngine.playClick();
        this.dom.depositQuickChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.dom.depositAmountInput.value = chip.dataset.amount;
        this.updateUpiQr();
      });
    });

    this.dom.depositAmountInput.addEventListener('input', () => {
      this.updateUpiQr();
    });

    if (this.dom.btnSubmitDeposit) {
      this.dom.btnSubmitDeposit.addEventListener('click', () => {
        this.submitDepositUtr();
      });
    }

    // Multi-Channel Withdrawal Method Selector (UPI / Bank IMPS / USDT)
    this.selectedWithdrawMethod = 'UPI';
    if (this.dom.withdrawMethodBtns) {
      this.dom.withdrawMethodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          window.soundEngine.playClick();
          this.dom.withdrawMethodBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.selectedWithdrawMethod = btn.dataset.method;
          
          // Switch visible form fields
          if (this.dom.channelUpiFields) this.dom.channelUpiFields.style.display = this.selectedWithdrawMethod === 'UPI' ? 'block' : 'none';
          if (this.dom.channelBankFields) this.dom.channelBankFields.style.display = this.selectedWithdrawMethod === 'BANK' ? 'block' : 'none';
          if (this.dom.channelCryptoFields) this.dom.channelCryptoFields.style.display = this.selectedWithdrawMethod === 'CRYPTO' ? 'block' : 'none';
        });
      });
    }

    // Quick Chip Amount Click (Withdraw)
    if (this.dom.withdrawQuickChips) {
      this.dom.withdrawQuickChips.forEach(chip => {
        chip.addEventListener('click', () => {
          window.soundEngine.playClick();
          this.dom.withdrawQuickChips.forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          this.dom.withdrawAmountInput.value = chip.dataset.amount;
          this.updateWithdrawCalculations();
        });
      });
    }

    if (this.dom.withdrawAmountInput) {
      this.dom.withdrawAmountInput.addEventListener('input', () => {
        this.updateWithdrawCalculations();
      });
    }

    if (this.dom.btnWithdrawMax) {
      this.dom.btnWithdrawMax.addEventListener('click', () => {
        window.soundEngine.playClick();
        this.dom.withdrawAmountInput.value = Math.floor(window.wallet.balance);
        this.updateWithdrawCalculations();
      });
    }

    // Submit Multi-Channel Withdrawal Request
    if (this.dom.btnSubmitWithdraw) {
      this.dom.btnSubmitWithdraw.addEventListener('click', () => {
        this.submitWithdrawRequest();
      });
    }

    // Provably Fair Modal
    this.dom.btnProvablyFair.addEventListener('click', () => {
      window.soundEngine.playClick();
      this.syncProvablyFairUI();
      this.dom.modalProvablyFair.classList.add('open');
    });

    this.dom.btnCloseFairModal.addEventListener('click', () => {
      this.dom.modalProvablyFair.classList.remove('open');
    });

    this.dom.btnRotateSeed.addEventListener('click', () => {
      window.soundEngine.playClick();
      window.provablyFair.rotateServerSeed();
      this.syncProvablyFairUI();
      this.showNotification("Server Seed rotated & hashed!", "success");
    });

    this.dom.clientSeedInput.addEventListener('change', () => {
      window.provablyFair.setClientSeed(this.dom.clientSeedInput.value);
    });

    // Difficulty Mode Selector (Easy / Medium / Hard)
    if (this.dom.btnDiffEasy) {
      this.dom.btnDiffEasy.addEventListener('click', () => this.setDifficulty('easy'));
      this.dom.btnDiffMed.addEventListener('click', () => this.setDifficulty('medium'));
      this.dom.btnDiffHard.addEventListener('click', () => this.setDifficulty('hard'));
    }

    // Community Live Wins vs Personal Bets Tab Switcher
    if (this.dom.tabCommunityWins && this.dom.tabMyBets) {
      this.dom.tabCommunityWins.addEventListener('click', () => {
        window.soundEngine.playClick();
        this.dom.tabCommunityWins.classList.add('active');
        this.dom.tabMyBets.classList.remove('active');
        this.dom.viewCommunityWins.style.display = 'block';
        this.dom.viewMyBets.style.display = 'none';
      });

      this.dom.tabMyBets.addEventListener('click', () => {
        window.soundEngine.playClick();
        this.dom.tabMyBets.classList.add('active');
        this.dom.tabCommunityWins.classList.remove('active');
        this.dom.viewMyBets.style.display = 'block';
        this.dom.viewCommunityWins.style.display = 'none';
        this.renderHistoryTable();
      });
    }

    // Game Tabs
    this.dom.tabMines.addEventListener('click', () => this.switchGame('mines'));
    this.dom.tabChicken.addEventListener('click', () => this.switchGame('chicken'));
    this.dom.tabCrash.addEventListener('click', () => this.switchGame('crash'));
    this.dom.tabColorTrading.addEventListener('click', () => this.switchGame('colortrading'));
    if (this.dom.tabStock) this.dom.tabStock.addEventListener('click', () => this.switchGame('stock'));

    // Bet Amount Input
    this.dom.betAmountInput.addEventListener('input', () => {
      const val = parseFloat(this.dom.betAmountInput.value) || 0;
      if (this.activeInstance && this.activeInstance.setBetAmount) {
        this.activeInstance.setBetAmount(val);
        if (this.activeInstance.updateNextMultiplierPreview) this.activeInstance.updateNextMultiplierPreview();
      }
    });

    // Quick Bet Buttons
    this.dom.btnHalfBet.addEventListener('click', () => {
      window.soundEngine.playClick();
      let val = (parseFloat(this.dom.betAmountInput.value) || 10) / 2;
      val = Math.max(0.1, Math.round(val * 100) / 100);
      this.dom.betAmountInput.value = val.toFixed(2);
      if (this.activeInstance && this.activeInstance.setBetAmount) {
        this.activeInstance.setBetAmount(val);
        if (this.activeInstance.updateNextMultiplierPreview) this.activeInstance.updateNextMultiplierPreview();
      }
    });

    this.dom.btnDoubleBet.addEventListener('click', () => {
      window.soundEngine.playClick();
      let val = (parseFloat(this.dom.betAmountInput.value) || 10) * 2;
      val = Math.min(window.wallet.balance, Math.round(val * 100) / 100);
      this.dom.betAmountInput.value = val.toFixed(2);
      if (this.activeInstance && this.activeInstance.setBetAmount) {
        this.activeInstance.setBetAmount(val);
        if (this.activeInstance.updateNextMultiplierPreview) this.activeInstance.updateNextMultiplierPreview();
      }
    });

    this.dom.btnMaxBet.addEventListener('click', () => {
      window.soundEngine.playClick();
      const val = Math.floor(window.wallet.balance * 100) / 100;
      this.dom.betAmountInput.value = val.toFixed(2);
      if (this.activeInstance && this.activeInstance.setBetAmount) {
        this.activeInstance.setBetAmount(val);
        if (this.activeInstance.updateNextMultiplierPreview) this.activeInstance.updateNextMultiplierPreview();
      }
    });

    // Mines / Bones Select
    this.dom.minesCountSelect.addEventListener('change', () => {
      window.soundEngine.playClick();
      this.mines.setMineCount(this.dom.minesCountSelect.value);
    });

    this.dom.bonesCountSelect.addEventListener('change', () => {
      window.soundEngine.playClick();
      this.chicken.setBoneCount(this.dom.bonesCountSelect.value);
    });

    if (this.dom.crashAutoCashoutInput) {
      this.dom.crashAutoCashoutInput.addEventListener('input', () => {
        if (this.crash) this.crash.setAutoCashout(this.dom.crashAutoCashoutInput.value);
      });
    }

    // Action Bet Button
    this.dom.btnActionBet.addEventListener('click', () => {
      this.hideToast();
      if (this.currentGame === 'crash') {
        this.crash.setBetAmount(parseFloat(this.dom.betAmountInput.value) || 10);
        this.crash.setAutoCashout(parseFloat(this.dom.crashAutoCashoutInput.value) || 2.0);
        this.crash.startGame();
      } else {
        this.activeInstance.startGame();
      }
    });

    // Action Cashout Button
    this.dom.btnActionCashout.addEventListener('click', () => {
      if (this.currentGame === 'crash') {
        this.crash.cashOut();
      } else {
        this.activeInstance.cashOut();
      }
    });

    // Tiranga Interval Buttons
    this.dom.tirangaModeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        window.soundEngine.playClick();
        this.dom.tirangaModeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const dur = parseInt(btn.dataset.duration) || 30;
        if (this.colortrading) {
          this.colortrading.periodDuration = dur;
          this.colortrading.timeLeft = dur;
        }
      });
    });

    // Color Trading Button Events
    if (this.dom.btnBetGreen) {
      this.dom.btnBetGreen.addEventListener('click', () => {
        const betVal = parseFloat(this.dom.betAmountInput.value) || 10;
        const res = this.colortrading.placeBet('color', 'green', betVal);
        if (!res.success) this.showNotification(res.msg, 'error');
      });
      this.dom.btnBetViolet.addEventListener('click', () => {
        const betVal = parseFloat(this.dom.betAmountInput.value) || 10;
        const res = this.colortrading.placeBet('color', 'violet', betVal);
        if (!res.success) this.showNotification(res.msg, 'error');
      });
      this.dom.btnBetRed.addEventListener('click', () => {
        const betVal = parseFloat(this.dom.betAmountInput.value) || 10;
        const res = this.colortrading.placeBet('color', 'red', betVal);
        if (!res.success) this.showNotification(res.msg, 'error');
      });
      this.dom.btnBetBig.addEventListener('click', () => {
        const betVal = parseFloat(this.dom.betAmountInput.value) || 10;
        const res = this.colortrading.placeBet('size', 'big', betVal);
        if (!res.success) this.showNotification(res.msg, 'error');
      });
      this.dom.btnBetSmall.addEventListener('click', () => {
        const betVal = parseFloat(this.dom.betAmountInput.value) || 10;
        const res = this.colortrading.placeBet('size', 'small', betVal);
        if (!res.success) this.showNotification(res.msg, 'error');
      });

      this.dom.numberBetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const num = btn.dataset.number;
          const betVal = parseFloat(this.dom.betAmountInput.value) || 10;
          const res = this.colortrading.placeBet('number', num, betVal);
          if (!res.success) this.showNotification(res.msg, 'error');
        });
      });
    }

    // Stock Market Asset Selection
    if (this.dom.stockAssetSelect) {
      this.dom.stockAssetSelect.addEventListener('change', () => {
        window.soundEngine.playClick();
        if (this.stock) this.stock.setAsset(this.dom.stockAssetSelect.value);
      });
    }

    // Stock Expiry Buttons
    if (this.dom.btnExpiry30s) {
      const setExp = (btn, sec) => {
        window.soundEngine.playClick();
        [this.dom.btnExpiry30s, this.dom.btnExpiry60s, this.dom.btnExpiry2m].forEach(b => b && b.classList.remove('active'));
        btn.classList.add('active');
        this.stockDurationSec = sec;
      };
      this.dom.btnExpiry30s.addEventListener('click', () => setExp(this.dom.btnExpiry30s, 30));
      this.dom.btnExpiry60s.addEventListener('click', () => setExp(this.dom.btnExpiry60s, 60));
      this.dom.btnExpiry2m.addEventListener('click', () => setExp(this.dom.btnExpiry2m, 120));
    }

    // Stock Call & Put Actions
    if (this.dom.btnStockCall) {
      this.dom.btnStockCall.addEventListener('click', () => {
        const amount = parseFloat(this.dom.betAmountInput.value) || 10;
        if (this.stock) {
          const res = this.stock.placeTrade('CALL', amount, this.stockDurationSec);
          if (!res.success) this.showNotification(res.msg, 'error');
        }
      });
    }

    if (this.dom.btnStockPut) {
      this.dom.btnStockPut.addEventListener('click', () => {
        const amount = parseFloat(this.dom.betAmountInput.value) || 10;
        if (this.stock) {
          const res = this.stock.placeTrade('PUT', amount, this.stockDurationSec);
          if (!res.success) this.showNotification(res.msg, 'error');
        }
      });
    }
  }

  handleUserChatMessage() {
    const text = this.dom.chatInputField.value.trim();
    if (!text) return;
    this.appendChatMessage(text, 'user');
    this.dom.chatInputField.value = '';

    setTimeout(() => {
      let q = 'general';
      const lower = text.toLowerCase();
      if (lower.includes('deposit') || lower.includes('pese') || lower.includes('add') || lower.includes('utr') || lower.includes('payment')) {
        q = 'check_deposit';
      } else if (lower.includes('rule') || lower.includes('how to play') || lower.includes('kese khele')) {
        q = 'game_rules';
      } else if (lower.includes('admin') || lower.includes('owner') || lower.includes('contact')) {
        q = 'human_agent';
      }
      this.generateBotResponse(q);
    }, 400);
  }

  appendChatMessage(text, sender = 'bot') {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg ${sender}`;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    msgDiv.innerHTML = `
      <div class="chat-bubble">${text}</div>
      <span class="chat-time">${timeStr}</span>
    `;
    this.dom.chatMessagesContainer.appendChild(msgDiv);
    this.dom.chatMessagesContainer.scrollTop = this.dom.chatMessagesContainer.scrollHeight;
  }

  generateBotResponse(queryType) {
    let reply = '';
    const pendingDep = window.wallet.pendingDeposits[0];
    const lastDep = window.wallet.depositHistory[0];

    switch (queryType) {
      case 'check_deposit':
        if (pendingDep) {
          reply = `⏳ **Deposit Under Admin Review:**<br>• Amount: <strong>₹${pendingDep.amount.toFixed(2)}</strong><br>• UTR: <code>${pendingDep.utr}</code><br>• Time: ${pendingDep.time}<br>• Status: <span style="color:#f59e0b; font-weight:800;">PENDING CONFIRMATION ⏳</span><br>Your deposit request has been submitted. Admin will verify bank records and credit your balance within 1-2 minutes!`;
        } else if (lastDep) {
          reply = `🔍 **Your Latest Deposit Status:**<br>• Amount: <strong>₹${lastDep.amount.toFixed(2)}</strong><br>• UTR: <code>${lastDep.utr}</code><br>• Time: ${lastDep.time}<br>• Status: <span style="color:#00e701; font-weight:800;">✅ APPROVED / SUCCESS</span><br>Funds have been successfully credited to your main balance!`;
        } else {
          reply = `You have no pending deposit records right now. To add funds, click **"Deposit"** in the top navbar (Min ₹200). After submitting your 12-digit UTR, balance is credited upon quick admin verification!`;
        }
        break;
      case 'how_to_add':
        reply = `💳 **How to Add Funds (Deposit Guide):**<br>1. Click <strong>"Deposit"</strong> in the top navbar.<br>2. Select or enter deposit amount (Min ₹200 to ₹50,000).<br>3. Scan the QR code or click fast UPI app links (GPay/PhonePe/Paytm).<br>4. Copy the 12-digit UTR / Reference ID from your payment app, paste it, and click Submit!<br>5. Funds will be verified and credited to your wallet balance instantly.`;
        break;
      case 'game_rules':
        reply = `📜 **VIEWPOINT Game Rules:**<br>• <strong>Mines & Chicken:</strong> Uncover safe tiles to boost your multiplier. Cash out anytime before hitting a mine or bone!<br>• <strong>Crash (Aviator):</strong> Cash out before the rocket crashes to secure profits.<br>• <strong>Win Go Color:</strong> Bet on Green, Red, Violet (2x-4.5x) or Numbers (9x payout).<br>• <strong>Stock Trading:</strong> Predict BTC price Up (Call) or Down (Put) for a +90% binary return.`;
        break;
      case 'human_agent':
        reply = `👨‍💼 **Official Admin Contact & Support:**<br>• Telegram: <a href="https://t.me/VIEWPOINT78" target="_blank" style="color: #00e5ff; font-weight: 800; text-decoration: underline;">@VIEWPOINT78 (Click to Chat)</a><br>• Official Merchant UPI: <code>${window.wallet.upiSettings.upiId}</code><br>If you need any deposit or withdrawal assistance, feel free to direct message on Telegram!`;
        break;
      default:
        reply = `Thank you for contacting VIEWPOINT Support! For direct priority assistance, message our official admin on Telegram at <a href="https://t.me/VIEWPOINT78" target="_blank" style="color: #00e5ff; font-weight:800;">@VIEWPOINT78</a> or click **"Check My Deposit Status"** above.`;
        break;
    }

    this.appendChatMessage(reply, 'bot');
  }

  syncAdminSettingsUI() {
    const s = window.wallet.upiSettings;
    const tg = window.wallet.telegramSettings;
    this.dom.settingUpiIdInput.value = s.upiId;
    this.dom.settingPayeeNameInput.value = s.payeeName;
    this.dom.settingCurrencySelect.value = window.wallet.currency;
    this.dom.settingMinDepositInput.value = s.minDeposit || 200;

    if (this.dom.settingTgBotToken) this.dom.settingTgBotToken.value = tg.botToken || '';
    if (this.dom.settingTgChatId) this.dom.settingTgChatId.value = tg.chatId || '';
    if (this.dom.settingTgEnabled) this.dom.settingTgEnabled.checked = !!tg.isEnabled;

    this.updateAdminBadges();
  }

  updateAdminBadges() {
    const depCount = window.wallet.pendingDeposits.length;
    if (this.dom.adminPendingBadge) {
      this.dom.adminPendingBadge.innerText = depCount;
      this.dom.adminPendingBadge.style.display = depCount > 0 ? 'inline-block' : 'none';
    }

    const wthCount = window.wallet.pendingWithdrawals ? window.wallet.pendingWithdrawals.length : 0;
    if (this.dom.adminWithdrawBadge) {
      this.dom.adminWithdrawBadge.innerText = wthCount;
      this.dom.adminWithdrawBadge.style.display = wthCount > 0 ? 'inline-block' : 'none';
    }
  }

  renderAdminPendingDeposits() {
    this.updateAdminBadges();
    const list = window.wallet.pendingDeposits;
    if (!this.dom.adminPendingListContainer) return;

    if (list.length === 0) {
      this.dom.adminPendingListContainer.innerHTML = `
        <div style="text-align:center; padding: 28px 16px; color: var(--text-muted);">
          <div style="font-size: 32px; margin-bottom: 8px;">✅</div>
          <strong style="color:#e2e8f0; font-size:14px;">No Pending Deposit Requests</strong>
          <p style="font-size:12px; margin-top:4px;">All deposit requests are up-to-date.</p>
        </div>
      `;
      return;
    }

    this.dom.adminPendingListContainer.innerHTML = list.map(item => `
      <div class="pending-deposit-item" data-id="${item.id}">
        <div class="pending-dep-info">
          <span class="pending-dep-amount">+${window.wallet.currency}${item.amount.toFixed(2)}</span>
          <div>UTR: <span class="pending-dep-utr">${item.utr}</span></div>
          <span class="pending-dep-time">Time: ${item.time} • Order: ${item.id}</span>
        </div>
        <div class="pending-dep-actions">
          <button class="btn-approve-dep" onclick="window.app.handleAdminApprove('${item.id}')">
            ✅ Approve
          </button>
          <button class="btn-reject-dep" onclick="window.app.handleAdminReject('${item.id}')">
            ❌ Reject
          </button>
        </div>
      </div>
    `).join('');
  }

  renderAdminWithdrawList() {
    this.updateAdminBadges();
    const list = window.wallet.pendingWithdrawals || [];
    if (!this.dom.adminWithdrawListContainer) return;

    if (list.length === 0) {
      this.dom.adminWithdrawListContainer.innerHTML = `
        <div style="text-align:center; padding: 28px 16px; color: var(--text-muted);">
          <div style="font-size: 32px; margin-bottom: 8px;">🎉</div>
          <strong style="color:#e2e8f0; font-size:14px;">No Pending Withdrawals</strong>
          <p style="font-size:12px; margin-top:4px;">All payout requests have been successfully transferred.</p>
        </div>
      `;
      return;
    }

    this.dom.adminWithdrawListContainer.innerHTML = list.map(item => {
      const fee = item.fee !== undefined ? item.fee : (Math.round(item.amount * 0.08 * 100) / 100);
      const netPayout = item.netPayout !== undefined ? item.netPayout : (Math.round((item.amount - fee) * 100) / 100);
      const channel = item.channel || 'UPI';
      const receiver = item.receiver || item.upiId || 'N/A';
      return `
        <div class="pending-deposit-item" data-id="${item.id}" style="border-left: 4px solid #f59e0b;">
          <div class="pending-dep-info">
            <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
              <span class="channel-tag ${channel.toLowerCase()}">${channel}</span>
              <strong style="color:#00e701; font-size:14px;">Transfer to Player: ${window.wallet.currency}${netPayout.toFixed(2)}</strong>
            </div>
            <div style="font-size:11px; color:var(--text-secondary); margin-bottom:2px;">
              Gross: <del>${window.wallet.currency}${item.amount.toFixed(2)}</del> • <span style="color:#f59e0b; font-weight:700;">8% Platform Fee: +${window.wallet.currency}${fee.toFixed(2)} (Admin Profit)</span>
            </div>
            <div>Receiver: <span class="pending-dep-utr" style="color: #f59e0b; background: rgba(245,158,11,0.1);">${receiver}</span></div>
            <span class="pending-dep-time">Name: ${item.accountName} • Time: ${item.time} • Order: ${item.id}</span>
          </div>
          <div class="pending-dep-actions">
            <button class="btn-approve-dep" style="background:#f59e0b; color:#0f212e;" onclick="window.app.handleAdminApproveWithdraw('${item.id}')">
              ✅ Mark Paid (${window.wallet.currency}${netPayout.toFixed(0)})
            </button>
            <button class="btn-reject-dep" onclick="window.app.handleAdminRejectWithdraw('${item.id}')">
              ❌ Reject & Refund
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  handleAdminApprove(depositId) {
    window.soundEngine.playDeposit();
    const approved = window.wallet.approveDeposit(depositId);
    if (approved) {
      this.renderAdminPendingDeposits();
      this.renderDepositHistoryTable();
      this.renderHistoryTable();
      this.showNotification(`🎉 Approved deposit of ${window.wallet.currency}${approved.amount.toFixed(2)} (UTR: ${approved.utr})! Added to player wallet.`, "success");
    }
  }

  handleAdminReject(depositId) {
    window.soundEngine.playClick();
    const rejected = window.wallet.rejectDeposit(depositId);
    if (rejected) {
      this.renderAdminPendingDeposits();
      this.renderDepositHistoryTable();
      this.showNotification(`❌ Deposit request (UTR: ${rejected.utr}) rejected.`, "error");
    }
  }

  handleAdminApproveWithdraw(withdrawId) {
    window.soundEngine.playCashout();
    const paid = window.wallet.approveWithdrawal(withdrawId);
    if (paid) {
      this.renderAdminWithdrawList();
      this.renderWithdrawHistoryTable();
      const net = paid.netPayout || (paid.amount * 0.92);
      this.showNotification(`✅ Withdrawal of ${window.wallet.currency}${net.toFixed(2)} (8% fee deducted) to ${paid.receiver || paid.upiId} marked as PAID!`, "success");
    }
  }

  handleAdminRejectWithdraw(withdrawId) {
    window.soundEngine.playClick();
    const rejected = window.wallet.rejectWithdrawal(withdrawId, "Incorrect UPI or Details");
    if (rejected) {
      this.renderAdminWithdrawList();
      this.renderWithdrawHistoryTable();
      this.showNotification(`❌ Withdrawal rejected and full ${window.wallet.currency}${rejected.amount.toFixed(2)} refunded back to player balance.`, "info");
    }
  }

  updateWithdrawCalculations() {
    const amount = parseFloat(this.dom.withdrawAmountInput ? this.dom.withdrawAmountInput.value : 500) || 0;
    const fee = Math.round(amount * 0.08 * 100) / 100;
    const net = Math.round((amount - fee) * 100) / 100;

    if (this.dom.calcGrossAmount) {
      this.dom.calcGrossAmount.innerText = `${window.wallet.currency}${amount.toFixed(2)}`;
    }
    if (this.dom.calcPlatformFee) {
      this.dom.calcPlatformFee.innerText = `-${window.wallet.currency}${fee.toFixed(2)} (8%)`;
    }
    if (this.dom.calcNetAmount) {
      this.dom.calcNetAmount.innerText = `${window.wallet.currency}${net.toFixed(2)}`;
    }
  }

  openWithdrawModal() {
    window.soundEngine.playClick();
    if (this.dom.withdrawAvailableBal) {
      this.dom.withdrawAvailableBal.innerText = `${window.wallet.currency}${window.wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // Daily Limit Calculations
    const dailyLimit = 100000.00;
    let withdrawnToday = 0;
    const today = new Date().toLocaleDateString();
    (window.wallet.withdrawHistory || []).forEach(w => {
      if (w.date === today && w.status !== 'REFUNDED') withdrawnToday += w.amount;
    });
    const remaining = Math.max(0, dailyLimit - withdrawnToday);
    if (this.dom.withdrawDailyRemainingText) {
      this.dom.withdrawDailyRemainingText.innerText = `${window.wallet.currency}${remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })} / ${window.wallet.currency}${dailyLimit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    }
    if (this.dom.withdrawLimitProgressBar) {
      const pct = Math.max(5, Math.min(100, (remaining / dailyLimit) * 100));
      this.dom.withdrawLimitProgressBar.style.width = `${pct}%`;
    }

    // Autofill saved account details
    try {
      const saved = localStorage.getItem('stake_saved_withdraw_account');
      if (saved) {
        const d = JSON.parse(saved);
        if (d.channel && this.dom.withdrawMethodBtns) {
          this.dom.withdrawMethodBtns.forEach(b => {
            if (b.dataset.method === d.channel) b.click();
          });
        }
        if (d.upiId && this.dom.withdrawUpiInput) this.dom.withdrawUpiInput.value = d.upiId;
        if (d.accountName && this.dom.withdrawNameInput) this.dom.withdrawNameInput.value = d.accountName;
        if (d.accountNumber && this.dom.withdrawBankAccInput) this.dom.withdrawBankAccInput.value = d.accountNumber;
        if (d.ifsc && this.dom.withdrawBankIfscInput) this.dom.withdrawBankIfscInput.value = d.ifsc;
        if (d.bankName && this.dom.withdrawBankNameInput) this.dom.withdrawBankNameInput.value = d.bankName;
        if (d.accountName && this.dom.withdrawBankHolderInput) this.dom.withdrawBankHolderInput.value = d.accountName;
        if (d.cryptoAddress && this.dom.withdrawCryptoAddress) this.dom.withdrawCryptoAddress.value = d.cryptoAddress;
      }
    } catch (e) {}

    this.updateWithdrawCalculations();
    this.dom.modalWithdraw.classList.add('open');
  }

  renderWithdrawHistoryTable() {
    const list = window.wallet.withdrawHistory || [];
    if (!this.dom.withdrawHistoryTableBody) return;

    if (list.length === 0) {
      this.dom.withdrawHistoryTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-muted); padding: 20px;">No withdrawal transactions yet.</td></tr>`;
      return;
    }

    this.dom.withdrawHistoryTableBody.innerHTML = list.map(w => {
      const isPaid = w.status === 'PAID';
      const color = isPaid ? '#00e701' : (w.status === 'REFUNDED' ? '#fe2c55' : '#f59e0b');
      const channel = w.channel || 'UPI';
      const channelClass = channel.toLowerCase();
      const receiver = w.receiver || w.upiId || 'N/A';
      const fee = w.fee !== undefined ? w.fee : (Math.round(w.amount * 0.08 * 100) / 100);
      const net = w.netPayout !== undefined ? w.netPayout : (Math.round((w.amount - fee) * 100) / 100);
      return `
        <tr>
          <td>${w.time}</td>
          <td><span class="channel-tag ${channelClass}">${channel}</span></td>
          <td style="color: #f59e0b; font-weight: 700;">
            ${window.wallet.currency}${net.toFixed(2)}
            <div style="font-size:10px; color:var(--text-muted); font-weight:normal;">Gross: ${window.wallet.currency}${w.amount.toFixed(2)} (8% fee)</div>
          </td>
          <td><code style="font-size: 11px; color: var(--accent-cyan);">${receiver}</code></td>
          <td><span style="background: rgba(245,158,11,0.15); color: ${color}; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 700;">${w.status}</span></td>
        </tr>
      `;
    }).join('');
  }

  syncUpiUI() {
    const s = window.wallet.upiSettings;
    this.dom.displayUpiId.innerText = s.upiId;
    this.dom.displayPayeeName.innerText = s.payeeName;
    this.dom.depCurrPrefix.innerText = window.wallet.currency;
    this.updateUpiQr();
  }

  updateUpiQr() {
    const s = window.wallet.upiSettings;
    const amount = parseFloat(this.dom.depositAmountInput.value) || 200;
    const upiUrl = `upi://pay?pa=${encodeURIComponent(s.upiId)}&pn=${encodeURIComponent(s.payeeName)}&am=${amount.toFixed(2)}&cu=INR&tn=ViewpointDeposit`;

    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;
    this.dom.upiQrCodeImg.src = qrSrc;
    this.dom.qrAmountTag.innerText = `${window.wallet.currency}${amount.toLocaleString()}`;

    this.dom.linkGPay.href = upiUrl;
    this.dom.linkPhonePe.href = upiUrl;
    this.dom.linkPaytm.href = upiUrl;
    this.dom.linkAnyUpi.href = upiUrl;
  }

  copyUpiId() {
    const upiId = (this.dom.displayUpiId && this.dom.displayUpiId.innerText.trim()) || (window.wallet && window.wallet.upiSettings && window.wallet.upiSettings.upiId) || 'adrenox1@axl';
    
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(upiId).then(() => {
        this.onUpiCopiedSuccess(upiId);
      }).catch(() => {
        this.fallbackCopyText(upiId);
      });
    } else {
      this.fallbackCopyText(upiId);
    }
  }

  fallbackCopyText(text) {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
      this.onUpiCopiedSuccess(text);
    } catch (err) {
      this.showNotification("UPI ID: " + text, "info");
    }
  }

  onUpiCopiedSuccess(upiId) {
    if (window.soundEngine) window.soundEngine.playClick();
    if (this.dom.copyBtnText) {
      this.dom.copyBtnText.innerText = "Copied! ✓";
    }
    if (this.dom.btnCopyUpiId) {
      this.dom.btnCopyUpiId.style.background = "#00e701";
      this.dom.btnCopyUpiId.style.color = "#0f212e";
    }
    this.showNotification(`📋 UPI ID "${upiId}" Copied Successfully!`, "success");
    setTimeout(() => {
      if (this.dom.copyBtnText) {
        this.dom.copyBtnText.innerText = "Copy";
      }
      if (this.dom.btnCopyUpiId) {
        this.dom.btnCopyUpiId.style.background = "";
        this.dom.btnCopyUpiId.style.color = "";
      }
    }, 2500);
  }

  submitDepositUtr() {
    const amount = parseFloat(this.dom.depositAmountInput.value) || 200;
    const utr = this.dom.depositUtrInput.value.trim();

    if (!utr || utr.length < 6) {
      this.showNotification("Please enter a valid 12-digit UTR / Reference number from your UPI app!", "error");
      return;
    }

    const depReq = window.wallet.submitDepositRequest(amount, utr, window.wallet.upiSettings.upiId);
    if (depReq) {
      window.soundEngine.playWin();
      this.dom.depositUtrInput.value = '';
      this.dom.modalDepositUpi.classList.remove('open');
      this.updateAdminBadges();
      this.showNotification(`✅ Deposit request of ${window.wallet.currency}${amount.toFixed(2)} submitted! Balance will be credited upon admin confirmation.`, "success");
    }
  }

  submitWithdrawRequest() {
    const amount = parseFloat(this.dom.withdrawAmountInput.value);
    if (isNaN(amount) || amount < 300) {
      this.showNotification("Minimum withdrawal amount is ₹300 INR!", "error");
      return;
    }
    if (amount > 50000) {
      this.showNotification("Maximum single withdrawal limit is ₹50,000 INR!", "error");
      return;
    }
    if (amount > window.wallet.balance) {
      this.showNotification("Insufficient balance for this withdrawal amount!", "error");
      return;
    }

    let withdrawPayload = {
      amount: amount,
      channel: this.selectedWithdrawMethod
    };

    if (this.selectedWithdrawMethod === 'UPI') {
      const upi = this.dom.withdrawUpiInput.value.trim();
      const name = this.dom.withdrawNameInput.value.trim() || 'Player';
      if (!upi || upi.length < 5 || !upi.includes('@')) {
        this.showNotification("Please enter a valid receiver UPI ID (e.g. name@okhdfcbank)!", "error");
        return;
      }
      withdrawPayload.receiver = upi;
      withdrawPayload.upiId = upi;
      withdrawPayload.accountName = name;
    } else if (this.selectedWithdrawMethod === 'BANK') {
      const acc = this.dom.withdrawBankAccInput.value.trim();
      const ifsc = this.dom.withdrawBankIfscInput.value.trim().toUpperCase();
      const bankName = this.dom.withdrawBankNameInput.value.trim() || 'Bank';
      const holder = this.dom.withdrawBankHolderInput.value.trim() || 'Player';
      if (!acc || acc.length < 9) {
        this.showNotification("Please enter a valid Bank Account Number (Min 9 digits)!", "error");
        return;
      }
      if (!ifsc || ifsc.length !== 11) {
        this.showNotification("Please enter a valid 11-digit IFSC code (e.g. HDFC0000123)!", "error");
        return;
      }
      withdrawPayload.receiver = `${bankName} • A/C: ...${acc.slice(-4)} (${ifsc})`;
      withdrawPayload.accountNumber = acc;
      withdrawPayload.ifsc = ifsc;
      withdrawPayload.bankName = bankName;
      withdrawPayload.accountName = holder;
    } else if (this.selectedWithdrawMethod === 'CRYPTO') {
      const addr = this.dom.withdrawCryptoAddress.value.trim();
      if (!addr || addr.length < 20) {
        this.showNotification("Please enter a valid USDT TRC-20 wallet address!", "error");
        return;
      }
      withdrawPayload.receiver = `USDT TRC20: ${addr.slice(0, 6)}...${addr.slice(-4)}`;
      withdrawPayload.cryptoAddress = addr;
      withdrawPayload.accountName = 'Crypto Wallet';
    }

    // Save account details if checked
    if (this.dom.chkSaveWithdrawDetails && this.dom.chkSaveWithdrawDetails.checked) {
      try {
        localStorage.setItem('stake_saved_withdraw_account', JSON.stringify(withdrawPayload));
      } catch(e) {}
    }

    const withdrawReq = window.wallet.submitWithdrawRequest(withdrawPayload);
    if (withdrawReq) {
      window.soundEngine.playCashout();
      this.dom.modalWithdraw.classList.remove('open');
      this.updateAdminBadges();
      this.showNotification(`💸 Withdrawal request of ${window.wallet.currency}${amount.toFixed(2)} (${this.selectedWithdrawMethod}) submitted! Dispatching in 5-15 mins.`, "success");
    }
  }

  // ================= AUTH & REFER SYSTEM =================
  initAuthAndRefer() {
    try {
      const savedUser = localStorage.getItem('stake_user_auth');
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser);
      }
    } catch(e) {}
    this.syncAuthUI();
  }

  syncAuthUI() {
    if (!this.dom.authLoggedOutBox || !this.dom.authLoggedInBox) return;
    if (this.currentUser && this.currentUser.username) {
      this.dom.authLoggedOutBox.style.display = 'none';
      this.dom.authLoggedInBox.style.display = 'flex';
      this.dom.displayUsername.innerText = this.currentUser.username;
    } else {
      this.dom.authLoggedOutBox.style.display = 'flex';
      this.dom.authLoggedInBox.style.display = 'none';
    }
  }

  openAuthModal(type = 'login') {
    window.soundEngine.playClick();
    this.switchAuthTab(type);
    if (this.dom.modalAuth) this.dom.modalAuth.classList.add('open');
  }

  closeAuthModal() {
    if (this.dom.modalAuth) this.dom.modalAuth.classList.remove('open');
  }

  switchAuthTab(type) {
    window.soundEngine.playClick();
    this.authMode = type;
    if (this.dom.tabAuthLogin) this.dom.tabAuthLogin.classList.toggle('active', type === 'login');
    if (this.dom.tabAuthSignup) this.dom.tabAuthSignup.classList.toggle('active', type === 'signup');
    if (this.dom.authModalTitle) this.dom.authModalTitle.innerText = type === 'login' ? 'Member Login' : 'Create VIP Account';
    if (this.dom.btnSubmitAuthText) this.dom.btnSubmitAuthText.innerText = type === 'login' ? 'Login to VIEWPOINT' : 'Create & Join Now';
  }

  submitAuthForm() {
    const uname = this.dom.authUsernameInput.value.trim();
    const pwd = this.dom.authPasswordInput.value.trim();
    if (!uname || uname.length < 3) {
      this.showNotification("Please enter a valid Username or Mobile number!", "error");
      return;
    }
    if (!pwd || pwd.length < 4) {
      this.showNotification("Password must be at least 4 characters!", "error");
      return;
    }

    this.currentUser = {
      username: uname,
      loginTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isGuest: false
    };

    localStorage.setItem('stake_user_auth', JSON.stringify(this.currentUser));
    this.syncAuthUI();
    this.closeAuthModal();
    window.soundEngine.playCashout();
    this.showNotification(`🎉 Welcome ${uname}! Logged in successfully.`, "success");
  }

  handleGuestLogin() {
    const guestName = 'Player_' + Math.floor(1000 + Math.random() * 9000);
    this.currentUser = {
      username: guestName,
      loginTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isGuest: true
    };
    localStorage.setItem('stake_user_auth', JSON.stringify(this.currentUser));
    this.syncAuthUI();
    this.closeAuthModal();
    window.soundEngine.playCashout();
    this.showNotification(`⚡ Playing as Guest: ${guestName}`, "success");
  }

  logoutUser() {
    window.soundEngine.playClick();
    this.currentUser = null;
    localStorage.removeItem('stake_user_auth');
    this.syncAuthUI();
    this.showNotification("Logged out successfully.", "info");
  }

  // Refer & Earn Modal
  openReferModal() {
    window.soundEngine.playClick();
    if (this.dom.modalRefer) this.dom.modalRefer.classList.add('open');
  }

  closeReferModal() {
    if (this.dom.modalRefer) this.dom.modalRefer.classList.remove('open');
  }

  copyReferralLink() {
    const link = (this.dom.referralLinkInput && this.dom.referralLinkInput.value) || "https://viewpoint.games/?ref=VP7821";
    this.fallbackCopyText(link);
    window.soundEngine.playClick();
    this.showNotification("📋 Referral link copied to clipboard!", "success");
  }

  claimReferralBonus() {
    window.soundEngine.playCashout();
    const bonus = 350.00;
    window.wallet.addWin(bonus);
    if (this.dom.referUnclaimedBonus) this.dom.referUnclaimedBonus.innerText = "₹0.00";
    if (this.dom.btnClaimReferBonus) {
      this.dom.btnClaimReferBonus.disabled = true;
      this.dom.btnClaimReferBonus.innerText = "✅ Bonus Claimed to Wallet!";
    }
    this.showNotification(`🎉 Claimed ₹${bonus.toFixed(2)} referral bonus to your game wallet!`, "success");
  }

  // ================= MULTI-PAGE SWITCHER =================
  switchMainPage(pageNumber) {
    window.soundEngine.playClick();
    this.currentPage = pageNumber;
    if (this.dom.btnNavPage1) this.dom.btnNavPage1.classList.toggle('active', pageNumber === 1);
    if (this.dom.btnNavPage2) this.dom.btnNavPage2.classList.toggle('active', pageNumber === 2);

    if (this.dom.mainPage1) this.dom.mainPage1.style.display = pageNumber === 1 ? 'block' : 'none';
    if (this.dom.mainPage2) this.dom.mainPage2.style.display = pageNumber === 2 ? 'block' : 'none';

    if (pageNumber === 2) {
      this.drawLuckyWheel(this.wheelAngle || 0);
      this.updateLimboProb();
    }
  }

  // ================= PAGE 2 ARCADE: LIMBO, WHEEL & VIP =================
  initPage2Arcade() {
    this.updateLimboProb();
    this.drawLuckyWheel(0);
  }

  updateLimboProb() {
    if (!this.dom.limboTargetMultiplierInput) return;
    const target = parseFloat(this.dom.limboTargetMultiplierInput.value) || 2.0;
    const bet = parseFloat(this.dom.limboBetAmountInput ? this.dom.limboBetAmountInput.value : 20) || 20;

    const prob = Math.min(98.0, Math.max(0.01, 99.0 / target));
    if (this.dom.limboWinChance) this.dom.limboWinChance.innerText = `${prob.toFixed(2)}%`;
    if (this.dom.limboProfitDisplay) this.dom.limboProfitDisplay.innerText = `+${window.wallet.currency}${(bet * target).toFixed(2)}`;
  }

  rollLimbo() {
    const bet = parseFloat(this.dom.limboBetAmountInput.value) || 20;
    const target = parseFloat(this.dom.limboTargetMultiplierInput.value) || 2.0;

    if (!window.wallet.hasFunds(bet)) {
      this.showNotification("Insufficient balance for Limbo bet!", "error");
      return;
    }

    window.wallet.deduct(bet);
    window.soundEngine.playBet();

    // Generate fair Limbo roll
    const e = 2 ** 32;
    let h;
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      h = window.crypto.getRandomValues(new Uint32Array(1))[0];
    } else {
      h = Math.floor(Math.random() * e);
    }
    const raw = Math.floor((100 * e - h) / (e - h)) / 100;
    const rolled = Math.max(1.00, Math.min(1000.0, raw));

    const won = rolled >= target;

    if (this.dom.limboMultiplierDisplay) {
      this.dom.limboMultiplierDisplay.innerText = `${rolled.toFixed(2)}x`;
      this.dom.limboMultiplierDisplay.className = won ? 'limbo-big-multiplier' : 'limbo-big-multiplier loss';
    }

    if (this.dom.limboResultTag) {
      this.dom.limboResultTag.innerText = won ? `TARGET REACHED (${target.toFixed(2)}x) 🎉` : `MISSED TARGET (${target.toFixed(2)}x) 💥`;
      this.dom.limboResultTag.style.color = won ? '#00e701' : '#fe2c55';
    }

    if (won) {
      const payout = Math.round(bet * target * 100) / 100;
      window.wallet.addWin(payout);
      window.soundEngine.playCashout();
      window.wallet.recordBet({
        game: 'Limbo Turbo',
        bet: bet,
        multiplier: target,
        payout: payout,
        won: true
      });
      this.showNotification(`🎉 Limbo Hit ${rolled.toFixed(2)}x! Won ${window.wallet.currency}${payout.toFixed(2)}`, "success");
    } else {
      window.soundEngine.playBomb();
      window.wallet.recordBet({
        game: 'Limbo Turbo',
        bet: bet,
        multiplier: 0,
        payout: 0,
        won: false
      });
    }

    this.renderHistoryTable();
  }

  // Draw Fortune Wheel on HTML Canvas
  drawLuckyWheel(angle) {
    if (!this.dom.wheelCanvas) return;
    const ctx = this.dom.wheelCanvas.getContext('2d');
    if (!ctx) return;

    const w = this.dom.wheelCanvas.width;
    const h = this.dom.wheelCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = w / 2 - 10;

    ctx.clearRect(0, 0, w, h);

    const slices = [
      { text: "₹20", color: "#10b981", textColor: "#fff" },
      { text: "₹50", color: "#3b82f6", textColor: "#fff" },
      { text: "₹10", color: "#64748b", textColor: "#fff" },
      { text: "₹100", color: "#f59e0b", textColor: "#000" },
      { text: "2x Spin", color: "#8b5cf6", textColor: "#fff" },
      { text: "₹250", color: "#06b6d4", textColor: "#fff" },
      { text: "₹500", color: "#ef4444", textColor: "#fff" },
      { text: "₹50", color: "#10b981", textColor: "#fff" }
    ];

    const sliceAngle = (2 * Math.PI) / slices.length;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    slices.forEach((s, i) => {
      const start = i * sliceAngle;
      const end = start + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, start, end);
      ctx.closePath();
      ctx.fillStyle = s.color;
      ctx.fill();
      ctx.strokeStyle = "#1a2c38";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Text
      ctx.save();
      ctx.rotate(start + sliceAngle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = s.textColor;
      ctx.font = "bold 13px Outfit, sans-serif";
      ctx.fillText(s.text, r - 16, 5);
      ctx.restore();
    });

    // Center Pin
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "#0f212e";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
  }

  spinLuckyWheel() {
    if (this.wheelSpinning) return;
    this.wheelSpinning = true;
    window.soundEngine.playBet();

    if (this.dom.btnSpinWheel) this.dom.btnSpinWheel.disabled = true;
    if (this.dom.wheelStatusText) this.dom.wheelStatusText.innerText = "Spinning Wheel of Fortune... 🎰";

    const rewards = [20, 50, 10, 100, 40, 250, 500, 50];
    const chosenIndex = Math.floor(Math.random() * rewards.length);
    const winAmount = rewards[chosenIndex];

    const totalSpins = 5 + Math.floor(Math.random() * 3);
    const targetAngle = totalSpins * 2 * Math.PI + (chosenIndex * ((2 * Math.PI) / rewards.length));

    let current = this.wheelAngle || 0;
    const duration = 3200;
    const start = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

    const animate = (time) => {
      const elapsed = time - start;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const angle = current + targetAngle * ease;
      this.drawLuckyWheel(angle);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.wheelAngle = angle % (2 * Math.PI);
        this.wheelSpinning = false;
        if (this.dom.btnSpinWheel) this.dom.btnSpinWheel.disabled = false;

        window.wallet.addWin(winAmount);
        window.soundEngine.playCashout();

        if (this.dom.wheelStatusText) {
          this.dom.wheelStatusText.innerHTML = `🎉 WON <strong>${window.wallet.currency}${winAmount.toFixed(2)}</strong>! Added to balance.`;
          this.dom.wheelStatusText.style.color = "#00e701";
        }
        this.showNotification(`🎡 Lucky Wheel Won +${window.wallet.currency}${winAmount.toFixed(2)}!`, "success");
        this.renderHistoryTable();
      }
    };

    requestAnimationFrame(animate);
  }

  claimRakeback() {
    window.soundEngine.playCashout();
    const amount = 420.00;
    window.wallet.addWin(amount);
    if (this.dom.rakebackAmount) this.dom.rakebackAmount.innerText = "₹0.00 (Claimed)";
    this.showNotification(`💰 Claimed +₹${amount.toFixed(2)} VIP Rakeback Bonus to wallet!`, "success");
  }

  claimDailyReward() {
    window.soundEngine.playCashout();
    const amount = 50.00;
    window.wallet.addWin(amount);
    this.showNotification(`🎁 Claimed +₹${amount.toFixed(2)} Daily Login Reward!`, "success");
  }

  renderDepositHistoryTable() {
    const deposits = window.wallet.depositHistory;
    if (deposits.length === 0) {
      this.dom.depositHistoryTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-muted); padding: 20px;">No deposit transactions yet.</td></tr>`;
      return;
    }

    this.dom.depositHistoryTableBody.innerHTML = deposits.map(d => `
      <tr>
        <td>${d.time}</td>
        <td style="color: var(--accent-green); font-weight: 700;">+${window.wallet.currency}${d.amount.toFixed(2)}</td>
        <td><code style="font-size: 11px; color: var(--accent-cyan);">${d.utr}</code></td>
        <td><span style="background: rgba(0,231,1,0.15); color: #00e701; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 700;">SUCCESS</span></td>
      </tr>
    `).join('');
  }

  syncProvablyFairUI() {
    this.dom.serverSeedHash.innerText = window.provablyFair.serverSeedHash || 'Generating...';
    this.dom.clientSeedInput.value = window.provablyFair.clientSeed;
    this.dom.nonceVal.innerText = window.provablyFair.nonce;
  }

  setDifficulty(diff) {
    window.soundEngine.playClick();
    [this.dom.btnDiffEasy, this.dom.btnDiffMed, this.dom.btnDiffHard].forEach(b => b && b.classList.remove('active'));

    if (diff === 'easy') {
      if (this.dom.btnDiffEasy) this.dom.btnDiffEasy.classList.add('active');
      if (this.dom.difficultyLabelHelper) this.dom.difficultyLabelHelper.innerText = "🟢 Easy (Low Risk)";
      
      // Mines
      if (this.dom.minesCountSelect) {
        this.dom.minesCountSelect.value = "1";
        if (this.mines) this.mines.setMineCount(1);
      }
      // Chicken
      if (this.dom.bonesCountSelect) {
        this.dom.bonesCountSelect.value = "2";
        if (this.chicken) this.chicken.setBoneCount(2);
      }
      // Crash
      if (this.dom.crashAutoCashoutInput) {
        this.dom.crashAutoCashoutInput.value = "1.50";
        if (this.crash) this.crash.setAutoCashout(1.50);
      }
      // Tiranga Color
      const btn300 = document.querySelector('.tiranga-mode-btn[data-duration="300"]');
      if (btn300) btn300.click();

      // Stock
      if (this.dom.btnExpiry60s) this.dom.btnExpiry60s.click();

    } else if (diff === 'hard') {
      if (this.dom.btnDiffHard) this.dom.btnDiffHard.classList.add('active');
      if (this.dom.difficultyLabelHelper) this.dom.difficultyLabelHelper.innerText = "🔴 Hard (High Win Multiplier)";
      
      // Mines
      if (this.dom.minesCountSelect) {
        this.dom.minesCountSelect.value = "10";
        if (this.mines) this.mines.setMineCount(10);
      }
      // Chicken
      if (this.dom.bonesCountSelect) {
        this.dom.bonesCountSelect.value = "10";
        if (this.chicken) this.chicken.setBoneCount(10);
      }
      // Crash
      if (this.dom.crashAutoCashoutInput) {
        this.dom.crashAutoCashoutInput.value = "5.00";
        if (this.crash) this.crash.setAutoCashout(5.00);
      }
      // Tiranga Color
      const btn30 = document.querySelector('.tiranga-mode-btn[data-duration="30"]');
      if (btn30) btn30.click();

      // Stock
      if (this.dom.btnExpiry30s) this.dom.btnExpiry30s.click();

    } else {
      // Medium
      if (this.dom.btnDiffMed) this.dom.btnDiffMed.classList.add('active');
      if (this.dom.difficultyLabelHelper) this.dom.difficultyLabelHelper.innerText = "🟡 Balanced Mode";
      
      // Mines
      if (this.dom.minesCountSelect) {
        this.dom.minesCountSelect.value = "3";
        if (this.mines) this.mines.setMineCount(3);
      }
      // Chicken
      if (this.dom.bonesCountSelect) {
        this.dom.bonesCountSelect.value = "5";
        if (this.chicken) this.chicken.setBoneCount(5);
      }
      // Crash
      if (this.dom.crashAutoCashoutInput) {
        this.dom.crashAutoCashoutInput.value = "2.00";
        if (this.crash) this.crash.setAutoCashout(2.00);
      }
      // Tiranga Color
      const btn60 = document.querySelector('.tiranga-mode-btn[data-duration="60"]');
      if (btn60) btn60.click();

      // Stock
      if (this.dom.btnExpiry30s) this.dom.btnExpiry30s.click();
    }

    if (this.activeInstance && this.activeInstance.updateNextMultiplierPreview) {
      this.activeInstance.updateNextMultiplierPreview();
    }
  }

  switchGame(gameType) {
    window.soundEngine.playClick();
    this.currentGame = gameType;
    this.hideToast();

    // Reset all tab classes
    [this.dom.tabMines, this.dom.tabChicken, this.dom.tabCrash, this.dom.tabColorTrading, this.dom.tabStock].forEach(t => t && t.classList.remove('active'));
    [this.dom.minesView, this.dom.chickenView, this.dom.crashView, this.dom.colortradingView, this.dom.stockView].forEach(v => v && v.classList.remove('active'));

    // Reset control groups
    this.dom.minesSelectGroup.style.display = 'none';
    this.dom.chickenSelectGroup.style.display = 'none';
    this.dom.crashSelectGroup.style.display = 'none';
    this.dom.colorTradingSelectGroup.style.display = 'none';
    this.dom.stockSelectGroup.style.display = 'none';

    this.dom.multiplierPreviewCard.style.display = 'none';
    this.dom.multStreakContainer.style.display = 'none';
    this.dom.mainActionArea.style.display = 'flex';

    if (gameType === 'mines') {
      this.dom.tabMines.classList.add('active');
      this.dom.minesView.classList.add('active');
      this.dom.minesSelectGroup.style.display = 'flex';
      this.dom.multiplierPreviewCard.style.display = 'flex';
      this.dom.multStreakContainer.style.display = 'flex';
      this.activeInstance = this.mines;
      this.dom.previewStepLabel.innerText = "Next Diamond Multiplier";
      this.resetGridUI();
      if (this.mines) {
        this.mines.setMineCount(parseInt(this.dom.minesCountSelect.value) || 3);
        this.mines.updateNextMultiplierPreview();
      }
    } else if (gameType === 'chicken') {
      this.dom.tabChicken.classList.add('active');
      this.dom.chickenView.classList.add('active');
      this.dom.chickenSelectGroup.style.display = 'flex';
      this.dom.multiplierPreviewCard.style.display = 'flex';
      this.dom.multStreakContainer.style.display = 'flex';
      this.activeInstance = this.chicken;
      this.dom.previewStepLabel.innerText = "Next Chicken Multiplier";
      this.resetGridUI();
      if (this.chicken) {
        this.chicken.setBoneCount(parseInt(this.dom.bonesCountSelect.value) || 5);
        this.chicken.updateNextMultiplierPreview();
      }
    } else if (gameType === 'crash') {
      this.dom.tabCrash.classList.add('active');
      this.dom.crashView.classList.add('active');
      this.dom.crashSelectGroup.style.display = 'flex';
      this.dom.mainActionArea.style.display = 'flex';
      this.activeInstance = this.crash;
      this.dom.btnActionBet.style.display = 'flex';
      this.dom.btnActionCashout.style.display = 'none';
      this.dom.betAmountInput.disabled = false;
      if (this.crash) {
        this.crash.resizeCanvas();
        this.crash.renderIdle();
        this.renderCrashHistory();
      }
    } else if (gameType === 'colortrading') {
      this.dom.tabColorTrading.classList.add('active');
      this.dom.colortradingView.classList.add('active');
      this.dom.colorTradingSelectGroup.style.display = 'flex';
      this.dom.mainActionArea.style.display = 'none';
      this.activeInstance = this.colortrading;
      if (this.colortrading) {
        this.renderTrendBalls(this.colortrading.history);
        this.renderActiveBetsSlip(this.colortrading.activeBets || []);
      }
    } else if (gameType === 'stock') {
      this.dom.tabStock.classList.add('active');
      this.dom.stockView.classList.add('active');
      this.dom.stockSelectGroup.style.display = 'flex';
      this.dom.mainActionArea.style.display = 'none';
      this.activeInstance = this.stock;
      if (this.stock) {
        this.stock.resizeCanvas();
        this.renderStockActiveTrades(this.stock.activeTrades || []);
      }
    }

    const betVal = parseFloat(this.dom.betAmountInput.value) || 10;
    if (this.activeInstance && this.activeInstance.setBetAmount) {
      this.activeInstance.setBetAmount(betVal);
      if (this.activeInstance.updateNextMultiplierPreview) this.activeInstance.updateNextMultiplierPreview();
    }
  }

  handleBetClick() {
    this.hideToast();
    if (this.currentGame === 'crash') {
      this.crash.setBetAmount(parseFloat(this.dom.betAmountInput.value) || 10);
      this.crash.setAutoCashout(parseFloat(this.dom.crashAutoCashoutInput.value) || 2.0);
      this.crash.startGame();
    } else if (this.activeInstance && this.activeInstance.startGame) {
      this.activeInstance.startGame();
    }
  }

  handleCashoutClick() {
    if (this.currentGame === 'crash') {
      this.crash.cashOut();
    } else if (this.activeInstance && this.activeInstance.cashOut) {
      this.activeInstance.cashOut();
    }
  }

  openDepositModal() {
    window.soundEngine.playClick();
    this.syncUpiUI();
    this.dom.modalDepositUpi.classList.add('open');
  }

  openAdminModal() {
    window.soundEngine.playClick();
    this.syncAdminSettingsUI();
    this.renderAdminPendingDeposits();
    this.dom.modalUpiSettings.classList.add('open');
  }

  openSupportModal() {
    window.soundEngine.playClick();
    this.dom.modalLiveSupport.classList.add('open');
  }

  openRatingModal() {
    window.soundEngine.playClick();
    this.dom.modalRating.classList.add('open');
  }

  resetWallet() {
    window.soundEngine.playClick();
    window.wallet.resetBalance(1000.00);
    this.showNotification(`Balance reset to ${window.wallet.currency}1,000.00 demo funds!`, "success");
  }

  updateWalletUI(balance, currency) {
    if (this.dom.walletBalance) {
      this.dom.walletBalance.innerText = (typeof balance === 'number' ? balance : parseFloat(balance) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (this.dom.currencySymbol) {
      this.dom.currencySymbol.innerText = currency || '₹';
    }
    if (this.dom.inputCurrencyPrefix) {
      this.dom.inputCurrencyPrefix.innerText = currency || '₹';
    }
    if (this.dom.depCurrPrefix) {
      this.dom.depCurrPrefix.innerText = currency || '₹';
    }
  }

  renderCrashHistory() {
    if (!this.crash || !this.dom.crashHistoryBar) return;
    this.dom.crashHistoryBar.innerHTML = this.crash.history.map(pt => {
      const cls = pt >= 10.0 ? 'high' : (pt >= 2.0 ? 'med' : 'low');
      return `<div class="crash-hist-pill ${cls}">${pt.toFixed(2)}x</div>`;
    }).join('');
  }

  renderTrendBalls(history) {
    if (!this.dom.trendBallsRow || !history) return;
    this.dom.trendBallsRow.innerHTML = history.map(item => {
      let bg = '#10b981';
      if (item.colors.includes('violet') && item.colors.includes('red')) bg = 'linear-gradient(135deg, #8b5cf6 50%, #ef4444 50%)';
      else if (item.colors.includes('violet') && item.colors.includes('green')) bg = 'linear-gradient(135deg, #8b5cf6 50%, #10b981 50%)';
      else if (item.color === 'red') bg = '#ef4444';
      else if (item.color === 'violet') bg = '#8b5cf6';

      return `<div class="trend-ball" style="background: ${bg};">${item.number}</div>`;
    }).join('');
  }

  renderActiveBetsSlip(bets) {
    if (!this.dom.tradingActiveBetsSlip || !this.dom.activeBetsList) return;
    if (!bets || bets.length === 0) {
      this.dom.tradingActiveBetsSlip.style.display = 'none';
      return;
    }
    this.dom.tradingActiveBetsSlip.style.display = 'flex';
    this.dom.activeBetsList.innerHTML = bets.map(b => `
      <div class="active-bet-pill">
        <span>${b.choice.toUpperCase()}</span>
        <strong style="color: var(--accent-green);">${window.wallet.currency}${b.amount}</strong>
      </div>
    `).join('');
  }

  renderStockActiveTrades(trades) {
    if (!this.dom.stockActiveTradesCard || !this.dom.stockActiveTradesList) return;
    if (!trades || trades.length === 0) {
      this.dom.stockActiveTradesCard.style.display = 'none';
      return;
    }
    this.dom.stockActiveTradesCard.style.display = 'flex';
    this.dom.stockActiveTradesList.innerHTML = trades.map(t => `
      <div class="stock-active-trade-item">
        <span class="${t.direction === 'CALL' ? 'trade-call-badge' : 'trade-put-badge'}">${t.direction === 'CALL' ? 'CALL ⬆' : 'PUT ⬇'} (${t.asset})</span>
        <span>Entry: <strong>${window.wallet.currency}${t.entryPrice.toFixed(2)}</strong></span>
        <span>Invest: <strong>${window.wallet.currency}${t.amount.toFixed(2)}</strong></span>
        <span style="color: var(--accent-cyan); font-weight:800;">⏱ ${t.timeLeft}s</span>
      </div>
    `).join('');
  }

  renderGrids() {
    // Mines 5x5 Grid
    let mineTiles = this.dom.minesGrid.querySelectorAll('.mine-tile');
    if (mineTiles.length === 0) {
      this.dom.minesGrid.innerHTML = '';
      for (let i = 0; i < 25; i++) {
        const tile = document.createElement('div');
        tile.className = 'mine-tile';
        tile.dataset.index = i;
        this.dom.minesGrid.appendChild(tile);
      }
      mineTiles = this.dom.minesGrid.querySelectorAll('.mine-tile');
    }

    mineTiles.forEach((tile, i) => {
      tile.onclick = () => {
        if (!this.mines.isPlaying) {
          this.mines.setBetAmount(parseFloat(this.dom.betAmountInput.value) || 10);
          this.mines.setMineCount(parseInt(this.dom.minesCountSelect.value) || 3);
        }
        this.mines.revealTile(i);
      };
    });

    // Chicken 5x5 Dishes Grid
    let dishes = this.dom.chickenGrid.querySelectorAll('.dish-card');
    if (dishes.length === 0) {
      this.dom.chickenGrid.innerHTML = '';
      for (let i = 0; i < 25; i++) {
        const dish = document.createElement('div');
        dish.className = 'dish-card';
        dish.dataset.index = i;
        dish.innerHTML = `<div class="dish-lid"></div><div class="dish-content"></div>`;
        this.dom.chickenGrid.appendChild(dish);
      }
      dishes = this.dom.chickenGrid.querySelectorAll('.dish-card');
    }

    dishes.forEach((dish, i) => {
      dish.onclick = () => {
        if (!this.chicken.isPlaying) {
          this.chicken.setBetAmount(parseFloat(this.dom.betAmountInput.value) || 10);
          this.chicken.setBoneCount(parseInt(this.dom.bonesCountSelect.value) || 5);
        }
        this.chicken.revealDish(i);
      };
    });
  }

  resetGridUI() {
    const mineTiles = this.dom.minesGrid.querySelectorAll('.mine-tile');
    mineTiles.forEach(tile => {
      tile.className = 'mine-tile';
      tile.innerHTML = '';
    });

    const dishes = this.dom.chickenGrid.querySelectorAll('.dish-card');
    dishes.forEach(dish => {
      dish.className = 'dish-card';
      dish.innerHTML = `
        <div class="dish-lid"></div>
        <div class="dish-content"></div>
      `;
    });

    this.dom.btnActionBet.style.display = 'flex';
    this.dom.btnActionCashout.style.display = 'none';
    this.dom.betAmountInput.disabled = false;
    this.dom.minesCountSelect.disabled = false;
    this.dom.bonesCountSelect.disabled = false;
  }

  onGameStarted(data) {
    this.resetGridUI();
    this.hideToast();

    this.dom.btnActionBet.style.display = 'none';
    this.dom.btnActionCashout.style.display = 'flex';
    this.dom.btnActionCashout.disabled = true;
    this.dom.cashoutAmountDisplay.innerText = `${window.wallet.currency}0.00`;
    this.dom.cashoutMultiplierDisplay.innerText = `0.00x`;

    this.dom.betAmountInput.disabled = true;
    this.dom.minesCountSelect.disabled = true;
    this.dom.bonesCountSelect.disabled = true;

    this.syncProvablyFairUI();
  }

  onGameMultiplierUpdate(data) {
    this.dom.multCurrentVal.innerText = `${data.current.toFixed(2)}x`;
    this.dom.multNextVal.innerText = `${data.next.toFixed(2)}x`;

    this.dom.previewMultiplier.innerText = `${data.next.toFixed(2)}x`;
    this.dom.previewProfit.innerText = `+${window.wallet.currency}${(data.profit).toFixed(2)}`;

    const foundCount = data.gemsFound !== undefined ? data.gemsFound : (data.chickensFound !== undefined ? data.chickensFound : (this.activeInstance ? this.activeInstance.revealedCount : 0));

    if (this.activeInstance && this.activeInstance.isPlaying && foundCount > 0) {
      this.dom.btnActionCashout.disabled = false;
      const currentPayout = this.activeInstance.betAmount * data.current;
      this.dom.cashoutAmountDisplay.innerText = `${window.wallet.currency}${currentPayout.toFixed(2)}`;
      this.dom.cashoutMultiplierDisplay.innerText = `${data.current.toFixed(2)}x`;
    }

    this.renderMultiplierLadder();
  }

  renderMultiplierLadder() {
    this.dom.multProgressBadges.innerHTML = '';
    const totalSafe = this.activeInstance.totalTiles - (this.currentGame === 'mines' ? this.activeInstance.mineCount : this.activeInstance.boneCount);
    const count = this.activeInstance.revealedCount;

    const startIdx = Math.max(1, count - 1);
    const endIdx = Math.min(totalSafe, startIdx + 5);

    for (let i = startIdx; i <= endIdx; i++) {
      const mult = this.activeInstance.calculateMultiplier(i);
      const badge = document.createElement('span');
      badge.className = 'mult-badge-step';
      if (i < count) badge.classList.add('passed');
      if (i === count) badge.classList.add('active');
      badge.innerText = `${mult.toFixed(2)}x`;
      this.dom.multProgressBadges.appendChild(badge);
    }
  }

  onMineTileReveal(index, type, isMine) {
    const tile = this.dom.minesGrid.querySelector(`[data-index="${index}"]`);
    if (!tile) return;

    tile.classList.add('revealed');
    if (isMine) {
      tile.classList.add('bomb-revealed');
      tile.innerHTML = `<div class="bomb-icon-wrapper">${ASSETS.bomb}</div>`;
    } else {
      tile.classList.add('gem-revealed');
      tile.innerHTML = `<div class="gem-icon-wrapper">${ASSETS.gem}</div>`;
    }
  }

  onMineRevealRemaining(index, type) {
    const tile = this.dom.minesGrid.querySelector(`[data-index="${index}"]`);
    if (!tile || tile.classList.contains('revealed')) return;

    tile.classList.add('revealed', 'auto-revealed');
    if (type === 'mine') {
      tile.innerHTML = `<div class="bomb-icon-wrapper">${ASSETS.bomb}</div>`;
    } else {
      tile.innerHTML = `<div class="gem-icon-wrapper">${ASSETS.gem}</div>`;
    }
  }

  onChickenDishReveal(index, type, isBone) {
    const dish = this.dom.chickenGrid.querySelector(`[data-index="${index}"]`);
    if (!dish) return;

    dish.classList.add('opened');
    const content = dish.querySelector('.dish-content');
    if (isBone) {
      dish.classList.add('bone-opened');
      content.innerHTML = `<div class="bone-wrapper">${ASSETS.bone}</div>`;
    } else {
      dish.classList.add('chicken-opened');
      content.innerHTML = `<div class="chicken-drumstick-wrapper">${ASSETS.chicken}</div>`;
    }
  }

  onChickenRevealRemaining(index, type) {
    const dish = this.dom.chickenGrid.querySelector(`[data-index="${index}"]`);
    if (!dish || dish.classList.contains('opened')) return;

    dish.classList.add('opened', 'auto-opened');
    const content = dish.querySelector('.dish-content');
    if (type === 'bone') {
      content.innerHTML = `<div class="bone-wrapper">${ASSETS.bone}</div>`;
    } else {
      content.innerHTML = `<div class="chicken-drumstick-wrapper">${ASSETS.chicken}</div>`;
    }
  }

  onGameOverResult(result) {
    this.dom.btnActionBet.style.display = 'flex';
    this.dom.btnActionCashout.style.display = 'none';
    this.dom.betAmountInput.disabled = false;
    this.dom.minesCountSelect.disabled = false;
    this.dom.bonesCountSelect.disabled = false;

    this.showToast(result);
    this.renderHistoryTable();
  }

  showToast(result) {
    if (result.won) {
      this.dom.roundResultToast.classList.remove('loss');
      this.dom.toastMultiplier.innerText = `${result.multiplier.toFixed(2)}x`;
      this.dom.toastPayout.innerText = `+${window.wallet.currency}${result.payout.toFixed(2)}`;
      this.dom.toastTagline.innerText = result.isPerfectClear ? "PERFECT BOARD CLEAR! 🏆" : "CASHOUT SUCCESSFUL! 💰";
    } else {
      this.dom.roundResultToast.classList.add('loss');
      this.dom.toastMultiplier.innerText = `0.00x`;
      this.dom.toastPayout.innerText = `-${window.wallet.currency}${this.activeInstance.betAmount.toFixed(2)}`;
      this.dom.toastTagline.innerText = this.currentGame === 'mines' ? "BOOM! You hit a mine." : (this.currentGame === 'chicken' ? "CRUNCH! You hit a bone." : "CRASHED! Plane flew away.");
    }

    this.dom.roundResultToast.classList.add('show');
    setTimeout(() => {
      this.hideToast();
    }, 4000);
  }

  hideToast() {
    this.dom.roundResultToast.classList.remove('show');
  }

  renderHistoryTable() {
    const history = window.wallet.history;
    if (history.length === 0) {
      this.dom.historyTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-muted); padding: 24px;">No bets placed yet. Start playing!</td></tr>`;
      return;
    }

    this.dom.historyTableBody.innerHTML = history.map(item => {
      let icon = '💎 Mines';
      if (item.game === 'Chicken') icon = '🍗 Chicken';
      else if (item.game === 'Crash') icon = '🚀 Crash';
      else if (item.game === 'Color Trading') icon = '🎨 Color Trading';
      else if (item.game.startsWith('Stock')) icon = '📈 ' + item.game;

      return `
        <tr>
          <td>
            <span class="badge-game ${item.game.toLowerCase().replace(/[^a-z0-9]/g, '')}">
              ${icon}
            </span>
          </td>
          <td>${window.wallet.currency}${item.bet.toFixed(2)}</td>
          <td><strong>${item.multiplier > 0 ? item.multiplier.toFixed(2) + 'x' : '0.00x'}</strong></td>
          <td class="${item.won ? 'payout-green' : 'payout-gray'}">
            ${item.won ? '+' + window.wallet.currency + item.payout.toFixed(2) : window.wallet.currency + '0.00'}
          </td>
          <td>${item.time}</td>
        </tr>
      `;
    }).join('');
  }

  showNotification(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: ${type === 'error' ? '#fe2c55' : '#00e701'};
      color: #0f212e;
      padding: 12px 20px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 14px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      z-index: 999;
      transform: translateY(20px);
      opacity: 0;
      transition: all 0.3s ease;
    `;
    toast.innerText = msg;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    }, 10);

    setTimeout(() => {
      toast.style.transform = 'translateY(20px)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  startOnlineMembersLoop() {
    let baseOnline = 5482;
    setInterval(() => {
      const delta = Math.floor((Math.random() - 0.48) * 12);
      baseOnline = Math.max(5120, Math.min(5980, baseOnline + delta));
      if (this.dom.liveOnlineUsersCounter) {
        this.dom.liveOnlineUsersCounter.innerText = `${(baseOnline / 1000).toFixed(1)}k`;
      }
    }, 3500);
  }

  startCommunityLiveWinsStream() {
    const fakeUsers = [
      'Aman_VIP***', 'Rahul_King***', 'Vikram_007***', 'Priya_Pro***', 
      'Karan_Win***', 'Dev_Trader***', 'Ananya_99***', 'Suresh_Star***',
      'Rohan_Ace***', 'Deepak_X***', 'Neeraj_Pro***', 'Manish_88***',
      'Kabir_Rich***', 'Alok_Gamer***', 'Pooja_Gold***', 'Sameer_99***'
    ];

    const fakeGames = [
      { name: '💎 Mines', class: 'mines', multRange: [1.35, 8.5] },
      { name: '🚀 Crash', class: 'crash', multRange: [1.50, 24.0] },
      { name: '🍗 Chicken', class: 'chicken', multRange: [1.25, 6.8] },
      { name: '🎨 Tiranga Win Go', class: 'colortrading', multRange: [2.00, 9.0] },
      { name: '📈 Stock BTC', class: 'stock', multRange: [1.90, 1.90] }
    ];

    const fakeAmounts = [200, 500, 1000, 1500, 2000, 2500, 5000, 10000];

    // Seed initial rows
    if (this.dom.communityBetsTableBody) {
      for (let i = 0; i < 7; i++) {
        this.insertSimulatedWinRow(fakeUsers, fakeGames, fakeAmounts, false);
      }
    }

    // Interval stream insertion
    setInterval(() => {
      if (this.dom.communityBetsTableBody) {
        this.insertSimulatedWinRow(fakeUsers, fakeGames, fakeAmounts, true);
      }
    }, 2400);

    // Periodic Floating Toast (Every 7 seconds)
    setInterval(() => {
      this.triggerFloatingLiveWinToast(fakeUsers, fakeGames, fakeAmounts);
    }, 7000);
  }

  getRandomSimulatedBet() {
    const randomPool = [
      50, 100, 150, 200, 250, 300, 350, 400, 500, 650, 750, 800, 1000,
      1200, 1500, 1800, 2000, 2500, 3200, 4000, 5000, 6500, 8000, 10000,
      12500, 15000, 20000, 25000
    ];
    const base = randomPool[Math.floor(Math.random() * randomPool.length)];
    const extra = Math.random() < 0.35 ? (Math.floor(Math.random() * 9) * 10) : 0;
    return base + extra;
  }

  insertSimulatedWinRow(fakeUsers, fakeGames, fakeAmounts, isAnimated = true) {
    if (!this.dom.communityBetsTableBody) return;

    const user = fakeUsers[Math.floor(Math.random() * fakeUsers.length)];
    const game = fakeGames[Math.floor(Math.random() * fakeGames.length)];
    const bet = this.getRandomSimulatedBet();
    
    // 30% Loss Probability (2 to 4 out of 10 bets result in loss)
    const isLoss = Math.random() < 0.30;
    let mult = isLoss ? 0.00 : (Math.random() * (game.multRange[1] - game.multRange[0]) + game.multRange[0]);
    mult = Math.round(mult * 100) / 100;
    const payout = isLoss ? 0 : Math.round((bet * mult) * 100) / 100;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const tr = document.createElement('tr');
    if (isAnimated) tr.className = 'live-win-row-new';

    tr.innerHTML = `
      <td>
        <span class="badge-game ${game.class}">
          ${game.name}
        </span>
      </td>
      <td><span class="live-user-tag">${user}</span></td>
      <td>${window.wallet.currency}${bet.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      <td><strong style="color: ${isLoss ? '#fe2c55' : '#00e5ff'};">${mult.toFixed(2)}x</strong></td>
      <td style="color: ${isLoss ? '#fe2c55' : '#00e701'}; font-weight: 700;">
        ${isLoss ? `-${window.wallet.currency}${bet.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : `+${window.wallet.currency}${payout.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
      </td>
      <td>${time}</td>
    `;

    if (!this.dom.communityBetsTableBody) return;
    this.dom.communityBetsTableBody.insertBefore(tr, this.dom.communityBetsTableBody.firstChild);

    // Keep max 15 entries
    while (this.dom.communityBetsTableBody.children && this.dom.communityBetsTableBody.children.length > 15) {
      this.dom.communityBetsTableBody.removeChild(this.dom.communityBetsTableBody.lastChild);
    }
  }

  triggerFloatingLiveWinToast(fakeUsers, fakeGames, fakeAmounts) {
    if (!this.dom.liveWinFloatingToast || !this.dom.winToastUser || !this.dom.winToastPayout) return;

    const user = fakeUsers[Math.floor(Math.random() * fakeUsers.length)];
    const game = fakeGames[Math.floor(Math.random() * fakeGames.length)];
    const bet = this.getRandomSimulatedBet();
    
    // Loss event in floating live toast (approx 3 out of 10)
    const isLoss = Math.random() < 0.28;

    if (isLoss) {
      this.dom.winToastUser.innerText = `💥 ${user} lost`;
      this.dom.winToastPayout.innerText = `-${window.wallet.currency}${bet.toLocaleString('en-US')} on ${game.name} (0.00x)`;
      this.dom.winToastPayout.style.color = '#fe2c55';
    } else {
      let mult = (Math.random() * (game.multRange[1] - game.multRange[0]) + game.multRange[0]);
      mult = Math.round(mult * 100) / 100;
      const payout = Math.round((bet * mult) * 100) / 100;
      this.dom.winToastUser.innerText = `🔥 ${user} just won!`;
      this.dom.winToastPayout.innerText = `+${window.wallet.currency}${payout.toLocaleString('en-US', { maximumFractionDigits: 2 })} on ${game.name} (${mult.toFixed(2)}x)`;
      this.dom.winToastPayout.style.color = '#00e701';
    }

    this.dom.liveWinFloatingToast.classList.add('show');
    setTimeout(() => {
      this.dom.liveWinFloatingToast.classList.remove('show');
    }, 3800);
  }
}

window.AppController = AppController;

// Initialize on DOM load or immediately if already loaded
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.app = new AppController();
    });
  } else {
    window.app = new AppController();
  }
}

// Disable double tap zoom & pinch gesture on mobile devices
if (typeof document !== 'undefined' && document.addEventListener) {
  let lastTouchEnd = 0;
  document.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
      if (event.target && (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.tagName === 'SELECT')) {
        // Allow normal input tap
      } else {
        event.preventDefault();
      }
    }
    lastTouchEnd = now;
  }, { passive: false });

  document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
  }, { passive: false });
}



