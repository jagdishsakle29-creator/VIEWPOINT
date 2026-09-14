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

var rouletteViewEl = {
  id: 'rouletteView',
  style: { display: 'none' },
  classList: {
    _classes: [],
    add: function(c){ if(this._classes.indexOf(c) === -1) this._classes.push(c); },
    remove: function(c){ this._classes = this._classes.filter(function(x){ return x !== c; }); },
    toggle: function(c, force){ 
      if (force === undefined) { if (this.contains(c)) this.remove(c); else this.add(c); }
      else if (force) this.add(c); else this.remove(c);
    },
    contains: function(c){ return this._classes.indexOf(c) !== -1; }
  }
};

var document = {
  getElementById: function(id) { 
    if (id === 'rouletteView') return rouletteViewEl;
    return { 
      id: id, 
      width: 240,
      height: 240,
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
      getContext: function(){ return { closePath: function(){}, bezierCurveTo: function(){}, quadraticCurveTo: function(){}, translate: function(){}, rotate: function(){}, scale: function(){}, drawImage: function(){}, save: function(){}, restore: function(){}, strokeRect: function(){}, fillText: function(){}, measureText: function(){ return { width: 10 }; }, setLineDash: function(){}, fillRect: function(){}, clearRect: function(){}, beginPath: function(){}, arc: function(){}, fill: function(){}, stroke: function(){}, moveTo: function(){}, lineTo: function(){}, createLinearGradient: function(){ return { addColorStop: function(){} }; }, createRadialGradient: function(){ return { addColorStop: function(){} }; } }; },
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
  hidden: false,
  visibilityState: 'visible',
  body: { appendChild: function(){}, removeChild: function(){} }
};
var localStorage = {
  store: { 'stake_game_balance': '5000' },
  getItem: function(k) { return this.store[k] || null; },
  setItem: function(k, v) { this.store[k] = v; },
  removeItem: function(k) { delete this.store[k]; }
};
var AudioContext = function() {
  return {
    state: 'running',
    currentTime: 0,
    createOscillator: function() {
      return {
        type: 'sine',
        frequency: { setValueAtTime: function(){}, exponentialRampToValueAtTime: function(){} },
        connect: function(){},
        start: function(){},
        stop: function(){}
      };
    },
    createGain: function() {
      return {
        gain: { setValueAtTime: function(){}, exponentialRampToValueAtTime: function(){} },
        connect: function(){}
      };
    },
    destination: {},
    suspend: function() { this.state = 'suspended'; return Promise.resolve(); },
    resume: function() { this.state = 'running'; return Promise.resolve(); }
  };
};
window.AudioContext = AudioContext;
window.webkitAudioContext = AudioContext;

// Mock wallet
var testBalance = 5000;
var recordedBets = [];
window.wallet = {
  currency: '₹',
  balance: testBalance,
  getBalance: function() { return this.balance; },
  hasFunds: function(amt) { return this.balance >= amt; },
  deduct: function(amt) { this.balance -= amt; return true; },
  add: function(amt) { this.balance += amt; return true; },
  addWin: function(amt) { this.balance += amt; return true; },
  recordBet: function(entry) { recordedBets.push(entry); }
};
"""

with open("js/audio.js", "r") as f:
    test_script += f.read() + "\n"

with open("js/roulette.js", "r") as f:
    test_script += f.read() + "\n"

test_script += """
console.log("=== TESTING ROULETTE BACKGROUND SOUND PREVENTION ===");
var rl = new window.RouletteGame();

// Test 1: When rouletteView is hidden, isRouletteActive() must be FALSE
console.log("1. isRouletteActive (hidden): " + rl.isRouletteActive());
console.log("1. canPlayAudio (hidden): " + rl.canPlayAudio());
if (rl.canPlayAudio() !== false) {
  throw new Error("FAIL: canPlayAudio should be false when view is hidden!");
}
console.log("PASS: Roulette audio blocked while view is hidden.");

// Test 2: Show rouletteView
rouletteViewEl.style.display = 'block';
rouletteViewEl.classList.add('active');
console.log("2. isRouletteActive (visible): " + rl.isRouletteActive());
console.log("2. canPlayAudio (visible): " + rl.canPlayAudio());
if (rl.canPlayAudio() !== true) {
  throw new Error("FAIL: canPlayAudio should be true when view is active!");
}
console.log("PASS: Roulette audio allowed when active.");

// Test 3: Tab hidden in background
document.hidden = true;
document.visibilityState = 'hidden';
console.log("3. canPlayAudio when document.hidden: " + rl.canPlayAudio());
if (rl.canPlayAudio() !== false) {
  throw new Error("FAIL: canPlayAudio should be false when document is hidden!");
}
console.log("PASS: Roulette audio completely blocked when tab is in background.");

// Restore visibility
document.hidden = false;
document.visibilityState = 'visible';

// Test 4: Master sound muted
window.soundEngine.enabled = false;
console.log("4. canPlayAudio when soundEngine muted: " + rl.canPlayAudio());
if (rl.canPlayAudio() !== false) {
  throw new Error("FAIL: canPlayAudio should be false when master sound is muted!");
}
console.log("PASS: Roulette audio respects master mute button.");
window.soundEngine.enabled = true;

// Test 5: Wallet betting & payouts
console.log("=== TESTING LIVE ROULETTE TABLE WALLET OPERATIONS ===");
var startBal = window.wallet.balance;
rl.selectChip(50);
var b1 = rl.placeBet('red');
console.log("5. Place Bet 50 on Red: " + b1 + ", Wallet Balance: " + window.wallet.balance);
if (window.wallet.balance !== startBal - 50) {
  throw new Error("FAIL: Wallet balance not deducted correctly!");
}
console.log("PASS: Bet deducted correctly.");

// Test 6: PAYOUTS table lookup
console.log("6. PAYOUTS red: " + window.RouletteGame.PAYOUTS['red'] + ", num_17: " + window.RouletteGame.PAYOUTS['num_17']);
if (window.RouletteGame.PAYOUTS['red'] !== 2 || window.RouletteGame.PAYOUTS['num_17'] !== 36) {
  throw new Error("FAIL: PAYOUTS lookup incorrect!");
}
console.log("PASS: PAYOUTS table verified.");

// Test 7: Settle win
rl.winningDetails = { number: 18, color: 'red', isEven: true, isHigh: false, dozen: 2, column: 3 };
rl.calculatePayouts();
console.log("7. Balance after Red win (100 payout): " + window.wallet.balance);
if (window.wallet.balance !== startBal - 50 + 100) {
  throw new Error("FAIL: Winnings not credited to wallet!");
}
if (recordedBets.length === 0 || recordedBets[0].payout !== 100) {
  throw new Error("FAIL: Bet history not recorded in wallet!");
}
console.log("PASS: Winnings credited and recorded in wallet.");

// Test 8: Pause and resume
rl.pause();
console.log("8. Paused: isPaused=" + rl.isPaused + ", timerInterval=" + rl.timerInterval);
if (rl.isPaused !== true || rl.timerInterval !== null) {
  throw new Error("FAIL: pause did not stop timer!");
}
console.log("PASS: Pause stops all background timers.");

console.log("ALL LIVE TABLE & AUDIO TESTS PASSED SUCCESSFULLY! 🎉");
"""

res = subprocess.run(["osascript", "-l", "JavaScript", "-e", test_script], capture_output=True, text=True)
print("STDOUT:", res.stdout)
print("STDERR:", res.stderr)
