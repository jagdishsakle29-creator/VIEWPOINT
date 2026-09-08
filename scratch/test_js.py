import os
import subprocess

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
    "js/rewards.js",
    "js/admin.js",
    "js/livebets.js",
    "js/app.js"
]

mock_preamble = """
var window = this;
var setTimeout = function(fn, ms){ return 1; };
var clearTimeout = function(){};
var setInterval = function(fn, ms){ return 1; };
var clearInterval = function(){};
var requestAnimationFrame = function(fn){ return 1; };
var cancelAnimationFrame = function(){};
var console = { 
  log: function(m){ $.NSFileHandle.fileHandleWithStandardOutput.writeData($.NSString.alloc.initWithUTF8String(m + "\\n").dataUsingEncoding($.NSUTF8StringEncoding)); }, 
  warn: function(m){ $.NSFileHandle.fileHandleWithStandardOutput.writeData($.NSString.alloc.initWithUTF8String("[WARN] " + m + "\\n").dataUsingEncoding($.NSUTF8StringEncoding)); }, 
  error: function(m, e){ 
    var msg = "[ERROR] " + m;
    if (e) msg += " | " + (e.name || '') + ": " + (e.message || '') + " | Stack: " + (e.stack || e);
    $.NSFileHandle.fileHandleWithStandardOutput.writeData($.NSString.alloc.initWithUTF8String(msg + "\\n").dataUsingEncoding($.NSUTF8StringEncoding)); 
  } 
};
window.console = console;
window.addEventListener = function(){};
window.removeEventListener = function(){};
var document = {
  getElementById: function(id) { 
    return { 
      id: id, 
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
      style: {}, 
      classList: { add: function(){}, remove: function(){}, toggle: function(){} },
      addEventListener: function(){},
      appendChild: function(){},
      setAttribute: function(){},
      dataset: {}
    }; 
  },
  addEventListener: function() {},
  hidden: false
};
var localStorage = {
  getItem: function(k) { return null; },
  setItem: function(k, v) {},
  removeItem: function(k) {}
};
var sessionStorage = {
  getItem: function(k) { return null; },
  setItem: function(k, v) {},
  removeItem: function(k) {}
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

combined = mock_preamble + "\n"
for f in files:
    with open(f, 'r', encoding='utf-8') as fp:
        combined += f"\n// --- {f} ---\n" + fp.read() + "\n"

combined += """
console.log("All scripts evaluated successfully! Testing app init...");
try {
  window.app = new window.AppController();
  console.log("AppController instantiated! Current game: " + window.app.currentGame);
} catch (e) {
  console.log("Error during AppController: " + e + "\\nStack: " + e.stack);
}
"""

with open('/tmp/test_bundle.js', 'w', encoding='utf-8') as fp:
    fp.write(combined)

res = subprocess.run(['osascript', '-l', 'JavaScript', '/tmp/test_bundle.js'], capture_output=True, text=True)
print("STDOUT:", res.stdout)
print("STDERR:", res.stderr)
