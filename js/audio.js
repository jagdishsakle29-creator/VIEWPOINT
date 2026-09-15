/**
 * High quality Web Audio API sound synthesizer
 * Zero external assets required, instantaneous playback, zero background leaks.
 * Complete background & tab-switch muting for Safari, Chrome, iOS & Android.
 */
class CasinoAudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.tabVisible = typeof document !== 'undefined' ? (!document.hidden && document.visibilityState === 'visible') : true;

    // Load saved sound preference
    try {
      const saved = localStorage.getItem('stake_sound_enabled');
      if (saved !== null) {
        this.enabled = saved === 'true';
      }
    } catch(e) {}

    // Pre-unlock on first user interaction anywhere
    const unlock = () => {
      if (this.canPlay()) {
        this.init();
      }
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });

    // Instantly mute / suspend audio context when tab is in background / blurred / minimized
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const handleHidden = () => {
        this.tabVisible = false;
        if (this.ctx && this.ctx.state === 'running') {
          this.ctx.suspend().catch(() => {});
        }
      };

      const handleVisible = () => {
        if (!document.hidden && document.visibilityState === 'visible') {
          this.tabVisible = true;
          if (this.enabled && this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
          }
        }
      };

      document.addEventListener('visibilitychange', () => {
        if (document.hidden || document.visibilityState === 'hidden') {
          handleHidden();
        } else {
          handleVisible();
        }
      });

      // Handle Safari & Mobile lifecycle events
      window.addEventListener('pagehide', handleHidden);
      window.addEventListener('freeze', handleHidden);
      window.addEventListener('blur', () => {
        // If window is totally blurred or document hidden
        if (document.hidden || document.visibilityState === 'hidden') {
          handleHidden();
        }
      });

      window.addEventListener('pageshow', handleVisible);
      window.addEventListener('resume', handleVisible);
      window.addEventListener('focus', handleVisible);
    }
  }

  init() {
    if (!this.canPlay()) return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        try {
          this.ctx = new AudioCtx();
        } catch(e) {
          this.ctx = null;
        }
      }
    }
    if (this.ctx && this.ctx.state === 'suspended' && this.tabVisible && this.enabled) {
      this.ctx.resume().catch(() => {});
    }
  }

  canPlay() {
    if (!this.enabled || !this.tabVisible) return false;
    if (typeof document !== 'undefined' && (document.hidden || document.visibilityState === 'hidden')) return false;
    return true;
  }

  triggerHaptic(type = 'light') {
    if (!this.canPlay()) return;
    try {
      if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
        const hf = window.Telegram.WebApp.HapticFeedback;
        if (type === 'light' || type === 'medium' || type === 'heavy' || type === 'rigid' || type === 'soft') {
          hf.impactOccurred(type);
        } else if (type === 'success' || type === 'warning' || type === 'error') {
          hf.notificationOccurred(type);
        } else if (type === 'selection') {
          hf.selectionChanged();
        }
      } else if (navigator.vibrate) {
        if (type === 'light') navigator.vibrate(15);
        else if (type === 'medium') navigator.vibrate(30);
        else if (type === 'heavy' || type === 'error') navigator.vibrate([40, 30, 60]);
        else if (type === 'success') navigator.vibrate([20, 20, 35]);
      }
    } catch(e) {}
  }

  toggleSound(enabled) {
    this.enabled = !!enabled;
    try {
      localStorage.setItem('stake_sound_enabled', this.enabled ? 'true' : 'false');
    } catch(e) {}
    if (!this.enabled && this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(() => {});
    }
    return this.enabled;
  }

  playClick() {
    if (!this.canPlay()) return;
    this.triggerHaptic('light');
    this.init();
    if (!this.ctx || !this.canPlay()) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch(e) {}
  }

  playBet() {
    if (!this.canPlay()) return;
    this.triggerHaptic('medium');
    this.init();
    if (!this.ctx || !this.canPlay()) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(250, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch(e) {}
  }

  playDeposit() {
    if (!this.canPlay()) return;
    this.triggerHaptic('success');
    this.init();
    if (!this.ctx || !this.canPlay()) return;
    try {
      const freqs = [523.25, 659.25, 783.99, 1046.50];
      freqs.forEach((f, i) => {
        if (!this.canPlay()) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, this.ctx.currentTime + i * 0.07);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.07 + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + i * 0.07);
        osc.stop(this.ctx.currentTime + i * 0.07 + 0.35);
      });
    } catch(e) {}
  }

  playGem(streak = 1) {
    if (!this.canPlay()) return;
    this.triggerHaptic(streak >= 5 ? 'success' : 'light');
    this.init();
    if (!this.ctx || !this.canPlay()) return;
    try {
      const baseFreqs = [523.25, 587.33, 659.25, 698.46, 783.99, 880.0, 987.77, 1046.5, 1174.66, 1318.51];
      const rootIndex = (streak - 1) % baseFreqs.length;
      const octaveMultiplier = 1 + Math.floor((streak - 1) / baseFreqs.length) * 0.4;
      const rootFreq = baseFreqs[rootIndex] * octaveMultiplier;

      const freqs = [rootFreq, rootFreq * 1.2599, rootFreq * 1.4983];

      freqs.forEach((f, i) => {
        if (!this.canPlay()) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = i === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f, this.ctx.currentTime + i * 0.03);

        gain.gain.setValueAtTime(0.18 / (i + 1), this.ctx.currentTime + i * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35 + i * 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + i * 0.03);
        osc.stop(this.ctx.currentTime + 0.4 + i * 0.05);
      });
    } catch(e) {}
  }

  playChickenHop() {
    if (!this.canPlay()) return;
    this.triggerHaptic('light');
    this.init();
    if (!this.ctx || !this.canPlay()) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(680, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch(e) {}
  }

  playCarHorn() {
    if (!this.canPlay()) return;
    this.triggerHaptic('heavy');
    this.init();
    if (!this.ctx || !this.canPlay()) return;
    try {
      [340, 420].forEach(freq => {
        if (!this.canPlay()) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.35);
      });
    } catch(e) {}
  }

  playCarCrash() {
    if (!this.canPlay()) return;
    this.triggerHaptic('error');
    this.playCarHorn();
    this.playBomb();
  }

  playChicken(streak = 1) {
    if (!this.canPlay()) return;
    this.triggerHaptic(streak >= 5 ? 'success' : 'light');
    this.init();
    if (!this.ctx || !this.canPlay()) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const basePitch = 550 + Math.min(streak * 45, 800);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(basePitch, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(basePitch * 1.33, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch(e) {}
  }

  playBomb() {
    if (!this.canPlay()) return;
    this.triggerHaptic('error');
    this.init();
    if (!this.ctx || !this.canPlay()) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.6);

      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.6);

      const bufferSize = Math.floor(this.ctx.sampleRate * 0.45);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(700, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.45);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.45);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      noise.start();
      noise.stop(this.ctx.currentTime + 0.45);
    } catch(e) {}
  }

  playBone() {
    if (!this.canPlay()) return;
    this.init();
    if (!this.ctx || !this.canPlay()) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch(e) {}
  }

  playCashout() {
    this.playDeposit();
  }

  playWin() {
    this.playDeposit();
  }

  playMineHit() {
    this.playBomb();
  }

  playGemReveal(streak = 1) {
    this.playGem(streak);
  }

  playCardFlip() {
    if (!this.canPlay()) return;
    this.triggerHaptic('light');
    this.init();
    if (!this.ctx || !this.canPlay()) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch(e) {}
  }

  playJetFlight(mult = 1.0) {
    if (!this.canPlay()) return;
    this.init();
    if (!this.ctx || !this.canPlay()) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      const baseFreq = 85 + Math.min(mult * 28, 480);
      osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.035, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch(e) {}
  }

  // =========================================================================
  // DYNAMIC GAME-SPECIFIC BACKGROUND MUSIC (ZERO OVERLAP BETWEEN GAMES)
  // =========================================================================
  stopGameBgm() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    if (this.bgmNodes && this.bgmNodes.length > 0) {
      this.bgmNodes.forEach(node => {
        try {
          if (node.gain && this.ctx) {
            node.gain.setValueAtTime(node.gain.value, this.ctx.currentTime);
            node.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.15);
          }
          if (node.stop && this.ctx) {
            node.stop(this.ctx.currentTime + 0.16);
          }
          if (node.disconnect) {
            setTimeout(() => { try { node.disconnect(); } catch(e) {} }, 200);
          }
        } catch(e) {}
      });
    }
    this.bgmNodes = [];
    this.currentGame = null;
  }

  setGameBgm(gameId) {
    // 1. Always stop any previously playing background audio immediately
    this.stopGameBgm();

    gameId = String(gameId || '').toLowerCase().trim();
    if (!gameId || !this.canPlay() || !this.enabled || !this.tabVisible) return;

    this.init();
    if (!this.ctx) return;

    this.currentGame = gameId;
    const now = this.ctx.currentTime;

    try {
      if (gameId === 'aviator' || gameId === 'crash') {
        // Jet / Rocket high-altitude wind drone
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(65, now);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(180, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.025, now + 0.4);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();

        this.bgmNodes.push(osc, gain, filter);
      }
      else if (gameId === 'mines') {
        // Deep tension ambient drone (110Hz + 165Hz fifth)
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(110, now);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(165, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.03, now + 0.5);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);
        osc1.start();
        osc2.start();

        this.bgmNodes.push(osc1, osc2, gain);
      }
      else if (gameId === 'dragontiger') {
        // Oriental Mystic Casino Drone + Periodic gong
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(146.83, now); // D3

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.028, now + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        this.bgmNodes.push(osc, gain);

        // Periodic soft temple bell note every 4.5s
        this.bgmTimer = setInterval(() => {
          if (!this.canPlay() || this.currentGame !== 'dragontiger') return;
          try {
            const bell = this.ctx.createOscillator();
            const bellGain = this.ctx.createGain();
            bell.type = 'triangle';
            bell.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
            bellGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
            bellGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.2);
            bell.connect(bellGain);
            bellGain.connect(this.ctx.destination);
            bell.start();
            bell.stop(this.ctx.currentTime + 1.2);
          } catch(e) {}
        }, 4500);
      }
      else if (gameId === 'chicken') {
        // Upbeat rhythmic arcade bass pulse
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(130.81, now); // C3

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.025, now + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        this.bgmNodes.push(osc, gain);
      }
      else if (gameId === 'roulette') {
        // VIP Casino wheel lounge ambient
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(174.61, now); // F3

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.028, now + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        this.bgmNodes.push(osc, gain);
      }
      else if (gameId === 'andarbahar') {
        // Indian Casino Card Lounge Ambience
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(196.00, now); // G3

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.025, now + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        this.bgmNodes.push(osc, gain);
      }
      else if (gameId === 'sportsbook') {
        // Stadium match crowd rumble
        const bufferSize = Math.floor(this.ctx.sampleRate * 2);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.2;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(120, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.035, now + 0.5);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();

        this.bgmNodes.push(noise, filter, gain);
      }
      else {
        // Default futuristic electronic lounge for Limbo, Dice, Plinko, Slots
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(130, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.022, now + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        this.bgmNodes.push(osc, gain);
      }
    } catch(e) {}
  }
}

window.soundEngine = new CasinoAudioEngine();

window.toggleMasterAudio = function() {
  if (!window.soundEngine) return false;
  const newState = !window.soundEngine.enabled;
  window.soundEngine.toggleSound(newState);
  const icon = document.getElementById('soundToggleIcon');
  if (icon) icon.innerText = newState ? '🔊' : '🔇';
  const btn = document.getElementById('btnToggleSound');
  if (btn) {
    btn.style.opacity = newState ? '1' : '0.6';
    btn.title = newState ? 'Mute Sound' : 'Unmute Sound';
  }
  if (window.app && window.app.showNotification) {
    window.app.showNotification(newState ? '🔊 Casino sound unmuted' : '🔇 Casino sound muted', 'info');
  }
  return newState;
};
