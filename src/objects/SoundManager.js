/**
 * SoundManager — synthesised sound effects via Web Audio API.
 * No external audio files needed. Export a single shared instance.
 */
class SoundManager {
  constructor() {
    this._ctx = null;
    this._muted = false;
    this._engineNodes = null;
  }

  // ── AudioContext (lazy, resumes after user gesture) ──────────────────
  _ctx_get() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this._ctx.state === 'suspended') this._ctx.resume();
    return this._ctx;
  }

  // ── Engine hum (looping low-frequency rumble) ────────────────────────
  startEngine() {
    if (this._engineNodes) return;
    const ctx = this._ctx_get();
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 46;

    // Slight vibrato
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 2.4;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 2.2;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start(t);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 170;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(this._muted ? 0 : 0.032, t + 1.8);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);

    this._engineNodes = { osc, lfo, gain };
  }

  stopEngine() {
    if (!this._engineNodes) return;
    const { osc, lfo, gain } = this._engineNodes;
    const ctx = this._ctx_get();
    gain.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
    setTimeout(() => {
      try { osc.stop(); lfo.stop(); } catch (_) {}
    }, 600);
    this._engineNodes = null;
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
    if (this._engineNodes) this._engineNodes.gain.gain.value = 0;
  }

  unmute() {
    this._muted = false;
    if (this._engineNodes) this._engineNodes.gain.gain.value = 0.032;
  }

  toggle() {
    this._muted ? this.unmute() : this.mute();
  }

  isMuted() { return this._muted; }
}

// Singleton — import this instance everywhere
export const soundManager = new SoundManager();
