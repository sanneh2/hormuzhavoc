/**
 * SoundManager — synthesised sound effects via Web Audio API.
 * No external audio files needed. Export a single shared instance.
 */

// Shared melody: adventurous nautical motif (G major pentatonic)
const GAME_MELODY = [
  [392, 0.30],  // G4
  [440, 0.30],  // A4
  [523, 0.30],  // C5
  [587, 0.60],  // D5
  [523, 0.30],  // C5
  [440, 0.30],  // A4
  [392, 0.60],  // G4
  [330, 0.30],  // E4
  [392, 0.30],  // G4
  [440, 0.60],  // A4
  [494, 0.30],  // B4
  [587, 0.30],  // D5
  [523, 0.30],  // C5
  [440, 0.30],  // A4
  [392, 0.90],  // G4
];

class SoundManager {
  constructor() {
    this._ctx = null;
    this._muted = false;
    // Theme song (title screen)
    this._themeActive = false;
    this._themeGain = null;
    this._themeTimer = null;
    this._themeCursor = 0;
    this._themeNoteIdx = 0;
    // Background jingle (gameplay)
    this._jingleActive = false;
    this._jingleGain = null;
    this._jingleTimer = null;
    this._jingleCursor = 0;
    this._jingleNoteIdx = 0;
  }

  // ── AudioContext (lazy, resumes after user gesture) ──────────────────
  _ctx_get() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this._ctx.state === 'suspended') this._ctx.resume();
    return this._ctx;
  }

  // ── Theme song (title/start screen) ─────────────────────────────────
  startThemeSong() {
    if (this._themeActive) return;
    const ctx = this._ctx_get();
    this._themeActive = true;
    this._themeGain = ctx.createGain();
    this._themeGain.gain.setValueAtTime(0, ctx.currentTime);
    this._themeGain.gain.linearRampToValueAtTime(this._muted ? 0 : 0.28, ctx.currentTime + 0.8);
    this._themeGain.connect(ctx.destination);
    this._themeCursor = ctx.currentTime + 0.15;
    this._themeNoteIdx = 0;
    this._scheduleTheme();
  }

  _scheduleTheme() {
    if (!this._themeActive) return;
    const ctx = this._ctx_get();
    const LOOKAHEAD = 0.4;
    if (this._themeCursor < ctx.currentTime) {
      this._themeCursor = ctx.currentTime + 0.05;
    }
    while (this._themeCursor < ctx.currentTime + LOOKAHEAD) {
      const [freq, dur] = GAME_MELODY[this._themeNoteIdx % GAME_MELODY.length];
      const t = this._themeCursor;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.9, t + 0.02);
      env.gain.setValueAtTime(0.9, t + dur * 0.75);
      env.gain.linearRampToValueAtTime(0, t + dur);
      osc.connect(env);
      env.connect(this._themeGain);
      osc.start(t);
      osc.stop(t + dur + 0.01);
      this._themeCursor += dur;
      this._themeNoteIdx++;
    }
    this._themeTimer = setTimeout(() => this._scheduleTheme(), 100);
  }

  stopThemeSong() {
    this._themeActive = false;
    clearTimeout(this._themeTimer);
    if (this._themeGain) {
      try {
        const ctx = this._ctx_get();
        this._themeGain.gain.setTargetAtTime(0, ctx.currentTime, 0.12);
      } catch (_) {}
      this._themeGain = null;
    }
  }

  // ── Background jingle during gameplay (quiet version of theme) ───────
  startEngine() {
    if (this._jingleActive) return;
    const ctx = this._ctx_get();
    this._jingleActive = true;
    this._jingleGain = ctx.createGain();
    this._jingleGain.gain.setValueAtTime(0, ctx.currentTime);
    this._jingleGain.gain.linearRampToValueAtTime(this._muted ? 0 : 0.07, ctx.currentTime + 1.5);
    this._jingleGain.connect(ctx.destination);
    this._jingleCursor = ctx.currentTime + 0.3;
    this._jingleNoteIdx = 0;
    this._scheduleJingle();
  }

  _scheduleJingle() {
    if (!this._jingleActive) return;
    const ctx = this._ctx_get();
    const LOOKAHEAD = 0.4;
    if (this._jingleCursor < ctx.currentTime) {
      this._jingleCursor = ctx.currentTime + 0.05;
    }
    while (this._jingleCursor < ctx.currentTime + LOOKAHEAD) {
      const [freq, dur] = GAME_MELODY[this._jingleNoteIdx % GAME_MELODY.length];
      const t = this._jingleCursor;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.9, t + 0.02);
      env.gain.setValueAtTime(0.9, t + dur * 0.75);
      env.gain.linearRampToValueAtTime(0, t + dur);
      osc.connect(env);
      env.connect(this._jingleGain);
      osc.start(t);
      osc.stop(t + dur + 0.01);
      this._jingleCursor += dur;
      this._jingleNoteIdx++;
    }
    this._jingleTimer = setTimeout(() => this._scheduleJingle(), 100);
  }

  stopEngine() {
    this._jingleActive = false;
    clearTimeout(this._jingleTimer);
    if (this._jingleGain) {
      try {
        const ctx = this._ctx_get();
        this._jingleGain.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
      } catch (_) {}
      this._jingleGain = null;
    }
  }

  // ── Explosion boom ───────────────────────────────────────────────────
  playExplosion(large = false) {
    if (this._muted) return;
    const ctx = this._ctx_get();
    const t = ctx.currentTime;
    const vol = large ? 0.85 : 0.55;

    // White-noise burst filtered to mid-low band
    const bufSize = Math.floor(ctx.sampleRate * 0.65);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buf;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 220;
    noiseFilter.Q.value = 0.4;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(vol * 0.75, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

    // Sub-bass sine drop
    const boom = ctx.createOscillator();
    boom.type = 'sine';
    boom.frequency.setValueAtTime(large ? 55 : 75, t);
    boom.frequency.exponentialRampToValueAtTime(18, t + 0.55);

    const boomGain = ctx.createGain();
    boomGain.gain.setValueAtTime(vol, t);
    boomGain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    boom.connect(boomGain);
    boomGain.connect(ctx.destination);

    noise.start(t);
    noise.stop(t + 0.65);
    boom.start(t);
    boom.stop(t + 0.55);
  }

  // ── Collect chime (ascending triplet) ───────────────────────────────
  playCollect() {
    if (this._muted) return;
    const ctx = this._ctx_get();
    const t = ctx.currentTime;

    [880, 1320, 1760].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      const s = t + i * 0.06;
      gain.gain.setValueAtTime(0, s);
      gain.gain.linearRampToValueAtTime(0.17, s + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, s + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(s);
      osc.stop(s + 0.24);
    });
  }

  // ── Drone warning beep ───────────────────────────────────────────────
  playDroneBeep() {
    if (this._muted) return;
    const ctx = this._ctx_get();
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 1100;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.09, t);
    gain.gain.setValueAtTime(0, t + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  // ── Slow-motion whoosh (frequency sweep down) ────────────────────────
  playSlowmo() {
    if (this._muted) return;
    const ctx = this._ctx_get();
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(195, t + 0.45);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.26, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.5);
  }

  // ── Mute toggle ──────────────────────────────────────────────────────
  mute() {
    this._muted = true;
    if (this._jingleGain) this._jingleGain.gain.value = 0;
    if (this._themeGain) this._themeGain.gain.value = 0;
  }

  unmute() {
    this._muted = false;
    if (this._jingleGain) this._jingleGain.gain.value = 0.07;
    if (this._themeGain) this._themeGain.gain.value = 0.28;
  }

  toggle() {
    this._muted ? this.unmute() : this.mute();
  }

  isMuted() { return this._muted; }
}

// Singleton — import this instance everywhere
export const soundManager = new SoundManager();
