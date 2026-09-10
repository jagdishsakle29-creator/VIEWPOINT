import subprocess

test_script = """
var window = this;
var setTimeout = function(fn, ms){ return 1; };
var clearTimeout = function(){};
var setInterval = function(fn, ms){ return 1; };
var clearInterval = function(){};
var requestAnimationFrame = function(fn){ return 1; };
var cancelAnimationFrame = function(){};
var performance = { now: function(){ return Date.now(); } };
window.performance = performance;
var console = { 
  log: function(m){ $.NSFileHandle.fileHandleWithStandardOutput.writeData($.NSString.alloc.initWithUTF8String(m + "\\n").dataUsingEncoding($.NSUTF8StringEncoding)); },
  warn: function(m){ $.NSFileHandle.fileHandleWithStandardOutput.writeData($.NSString.alloc.initWithUTF8String("[WARN] " + m + "\\n").dataUsingEncoding($.NSUTF8StringEncoding)); },
  error: function(m, e){ $.NSFileHandle.fileHandleWithStandardOutput.writeData($.NSString.alloc.initWithUTF8String("[ERROR] " + m + " " + (e ? ((e.message || String(e)) + " " + (e.stack || "")) : "") + "\\n").dataUsingEncoding($.NSUTF8StringEncoding)); }
};
window.console = console;
window.addEventListener = function(){};
window.removeEventListener = function(){};

var document = {
  getElementById: function(id) { 
    return { 
      id: id, 
      value: "10.00",
      innerText: "",
      innerHTML: "",
      style: {}, 
      classList: { add: function(){}, remove: function(){}, toggle: function(){}, contains: function(){ return false; } },
      addEventListener: function(){},
      querySelectorAll: function(){ return []; },
      querySelector: function(){ return null; },
      appendChild: function(){},
      setAttribute: function(){},
      getAttribute: function(){ return ''; },
      scrollIntoView: function(){},
      parentElement: { getBoundingClientRect: function(){ return { width: 300, height: 300 }; } },
      getBoundingClientRect: function(){ return { width: 300, height: 300 }; },
      getContext: function(){ return { closePath: function(){}, bezierCurveTo: function(){}, quadraticCurveTo: function(){}, translate: function(){}, rotate: function(){}, scale: function(){}, drawImage: function(){}, save: function(){}, restore: function(){}, strokeRect: function(){}, fillText: function(){}, measureText: function(){ return { width: 10 }; }, setLineDash: function(){}, fillRect: function(){}, clearRect: function(){}, beginPath: function(){}, arc: function(){}, fill: function(){}, stroke: function(){}, moveTo: function(){}, lineTo: function(){}, createLinearGradient: function(){ return { addColorStop: function(){} }; } }; },
      dataset: {}
    }; 
  },
  querySelector: function() { return null; },
  querySelectorAll: function() { return []; },
  createElement: function(tag) { 
    return { 
      tagName: tag, 
      value: "10",
      innerText: "",
      innerHTML: "",
      style: {}, 
      classList: { add: function(){}, remove: function(){}, toggle: function(){} },
      addEventListener: function(){},
      appendChild: function(){},
      setAttribute: function(){},
      scrollIntoView: function(){},
      dataset: {}
    }; 
  },
  addEventListener: function() {},
  hidden: false
};
var localStorage = {
  store: { 'stake_game_balance': '5000' },
  getItem: function(k) { return this.store[k] || null; },
  setItem: function(k, v) { this.store[k] = v; },
  removeItem: function(k) { delete this.store[k]; }
};
var sessionStorage = {
  store: {},
  getItem: function(k) { return this.store[k] || null; },
  setItem: function(k, v) { this.store[k] = v; },
  removeItem: function(k) { delete this.store[k]; }
};
var navigator = { userAgent: "Mac" };
var location = { hostname: "localhost", origin: "http://localhost:8000", search: "", hash: "" };
var AudioContext = function() {
  return {
    createGain: function() { return { gain: { value: 1, setValueAtTime: function(){}, linearRampToValueAtTime: function(){}, exponentialRampToValueAtTime: function(){} }, connect: function(){} }; },
    createOscillator: function() { return { frequency: { setValueAtTime: function(){}, exponentialRampToValueAtTime: function(){} }, connect: function(){}, start: function(){}, stop: function(){} }; },
    createBufferSource: function() { return { buffer: null, connect: function(){}, start: function(){} }; },
    createBuffer: function() { return { getChannelData: function(){ return new Float32Array(100); } }; },
    createBiquadFilter: function() { return { frequency: { value: 100 }, connect: function(){} }; },
    destination: {},
    currentTime: 0,
    resume: function(){}
  };
};
var webkitAudioContext = AudioContext;
"""

files = [
    "js/config.js",
    "js/security.js",
    "js/audio.js",
    "js/wallet.js",
    "js/provablyFair.js",
    "js/dragontiger.js",
    "js/mines.js",
    "js/limbo.js",
    "js/chicken.js",
    "js/plinko.js",
    "js/crash.js",
    "js/colortrading.js",
    "js/stocktrading.js",
    "js/dice.js",
    "js/pump.js",
    "js/moles.js",
    "js/tower.js",
    "js/aviator.js",
    "js/andarbahar.js",
    "js/roulette.js",
    "js/blackjack.js",
    "js/baccarat.js",
    "js/teenpatti.js",
    "js/sicbo.js",
    "js/megawheel.js",
    "js/sevenup.js",
    "js/rewards.js",
    "js/admin.js",
    "js/livebets.js",
    "js/app.js"
]

for f in files:
    with open(f, 'r', encoding='utf-8') as fp:
        test_script += f"\n// --- {f} ---\n" + fp.read() + "\n"

test_script += """
window.app = new window.AppController();
console.log("=== WALLET BALANCE ===");
console.log("Balance: " + window.wallet.balance);

var games = [
  'mines', 'dragontiger', 'limbo', 'pump', 'chicken', 'plinko', 'crash', 'moles',
  'colortrading', 'stock', 'dice', 'tower', 'aviator', 'andarbahar', 'roulette',
  'blackjack', 'baccarat', 'teenpatti', 'sicbo', 'megawheel', 'sevenup'
];

games.forEach(function(g) {
  console.log("\\n>>> Testing game: " + g);
  try {
    window.app.switchGame(g);
    console.log("Switched to " + g + ". CurrentGame: " + window.app.currentGame + ", activeInstance: " + (window.app.activeInstance ? window.app.activeInstance.constructor.name : "null"));
    
    // Now simulate bet
    if (g === 'dragontiger') {
      var dt = window.app.dragontiger;
      if (dt) {
        console.log("DT state before bet: " + dt.gameState + ", timeLeft: " + dt.timeLeft);
        var bRes = dt.placeBet('dragon');
        console.log("DT placeBet result: " + JSON.stringify(bRes));
        console.log("DT currentBets: " + JSON.stringify(dt.currentBets));
        // Force deal
        dt.dealCardsAndSettle();
        console.log("DT after dealCardsAndSettle, gameState: " + dt.gameState + ", roundResult: " + (dt.roundResult ? dt.roundResult.winner : 'pending'));
      } else {
        console.log("DT is null!");
      }
    } else if (g === 'colortrading') {
      var ct = window.app.colortrading;
      if (ct) {
        console.log("CT period: " + ct.periodId + ", timeLeft: " + ct.timeLeft);
        var res = ct.placeBet('green', 10);
        console.log("CT placeBet result: " + JSON.stringify(res));
      }
    } else if (g === 'stock') {
      var st = window.app.stock;
      if (st) {
        var res = st.placeTrade('up', 10);
        console.log("Stock placeTrade result: " + JSON.stringify(res));
      }
    } else if (g === 'aviator') {
      window.app.handleBetClick();
      console.log("Aviator gameState: " + (window.aviatorGame ? window.aviatorGame.gameState : 'N/A'));
    } else if (g === 'andarbahar') {
      window.app.handleBetClick();
      console.log("Andar Bahar isPlaying: " + (window.andarBaharGame ? window.andarBaharGame.isPlaying : 'N/A'));
    } else if (g === 'roulette') {
      var rl = window.rouletteGame;
      if (rl) {
        console.log("Roulette roundId: " + rl.roundId + ", isSpinning: " + rl.isSpinning);
        var bRes = rl.placeBet('red');
        console.log("Roulette placeBet red result: " + JSON.stringify(bRes));
        var bRes2 = rl.placeBet('num_7');
        console.log("Roulette placeBet num_7 result: " + JSON.stringify(bRes2));
        console.log("Roulette bets: " + JSON.stringify(rl.bets));
        rl.spinNow();
        console.log("Roulette after spinNow, isSpinning: " + rl.isSpinning);
      } else {
        console.log("Roulette is null!");
      }
    } else if (g === 'blackjack') {
      var bj = window.blackjackGame;
      if (bj) {
        bj.startDeal();
        console.log("Blackjack after startDeal: gameState=" + bj.gameState + ", playerHand=" + bj.playerHand.length + ", dealerHand=" + bj.dealerHand.length);
        if (bj.gameState === 'player_turn') {
          bj.stand();
          console.log("Blackjack after stand: gameState=" + bj.gameState);
        }
      }
    } else if (g === 'baccarat') {
      var bac = window.baccaratGame;
      if (bac) {
        bac.placeBet('player');
        console.log("Baccarat bets: " + JSON.stringify(bac.bets));
        bac.startDeal();
        console.log("Baccarat after startDeal: gameState=" + bac.gameState + ", playerHand=" + bac.playerHand.length);
      }
    } else if (g === 'teenpatti') {
      var tp = window.teenPattiGame;
      if (tp) {
        tp.startDeal();
        console.log("Teen Patti after startDeal: gameState=" + tp.gameState + ", playerHand=" + tp.playerHand.length);
        tp.playHand();
        console.log("Teen Patti after playHand: gameState=" + tp.gameState);
      }
    } else if (g === 'sicbo') {
      var sb = window.sicBoGame;
      if (sb) {
        sb.placeBet('small');
        console.log("Sic Bo bets: " + JSON.stringify(sb.bets));
        sb.rollDice();
        console.log("Sic Bo after rollDice: gameState=" + sb.gameState);
      }
    } else if (g === 'megawheel') {
      var mw = window.megaWheelGame;
      if (mw) {
        mw.placeBet('1x');
        console.log("Mega Wheel bets: " + JSON.stringify(mw.bets));
        mw.spinWheel();
        console.log("Mega Wheel after spinWheel: isSpinning=" + mw.isSpinning);
      }
    } else if (g === 'sevenup') {
      var su = window.sevenUpGame;
      if (su) {
        su.placeBet('down');
        console.log("7 Up 7 Down bets: " + JSON.stringify(su.bets));
        su.rollDice();
        console.log("7 Up 7 Down after rollDice: isRolling=" + su.isRolling);
      }
    } else {
      // General handleBetClick
      window.app.handleBetClick();
      console.log("After handleBetClick: isPlaying: " + (window.app.activeInstance ? window.app.activeInstance.isPlaying : 'N/A'));
    }
  } catch (err) {
    console.log("ERROR in game " + g + ": " + err + "\\n" + err.stack);
  }
});

console.log("\\n>>> Testing Page 3 Switching:");
try {
  window.app.switchGamePage(3);
  console.log("Page 3 switched! Active game: " + window.app.currentGame);
} catch (e) {
  console.log("Page 3 switch error: " + e);
}
"""

with open('/tmp/test_games.js', 'w', encoding='utf-8') as fp:
    fp.write(test_script)

res = subprocess.run(['osascript', '-l', 'JavaScript', '/tmp/test_games.js'], capture_output=True, text=True)
print("STDOUT:", res.stdout)
print("STDERR:", res.stderr)
