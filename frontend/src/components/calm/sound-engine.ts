// Calming Sound Generator using standard Web Audio API
// Provides 100% working, royalty-free procedural ambient soundscapes with zero external dependencies.

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentType: string | null = null;
  private activeNodes: { stop?: () => void; disconnect?: () => void }[] = [];
  private intervalTimer: NodeJS.Timeout | null = null;
  private volume: number = 0.6;
  private isMuted: boolean = false;

  private initContext(): boolean {
    if (typeof window === "undefined") return false;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      return true;
    } catch (e) {
      console.warn("Web Audio API not supported or blocked by browser:", e);
      return false;
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public play(type: string): boolean {
    if (!this.initContext() || !this.ctx || !this.masterGain) return false;

    // If already playing this type, ensure context is active
    if (this.currentType === type && this.activeNodes.length > 0) {
      if (this.ctx.state === "suspended") this.ctx.resume();
      return true;
    }

    // Stop previous track cleanly
    this.stop();

    this.currentType = type;

    switch (type) {
      case "rain":
        this.startRain();
        break;
      case "ocean":
        this.startOcean();
        break;
      case "forest":
        this.startForest();
        break;
      case "piano":
        this.startPiano();
        break;
      case "ambient":
        this.startAmbient();
        break;
      default:
        this.startAmbient();
    }

    return true;
  }

  public stop() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }

    this.activeNodes.forEach((node) => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch {
        // Node already stopped
      }
    });
    this.activeNodes = [];
    this.currentType = null;
  }

  public pause() {
    if (this.ctx && this.ctx.state === "running") {
      this.ctx.suspend();
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public getCurrentType(): string | null {
    return this.currentType;
  }

  public isRunning(): boolean {
    return this.ctx !== null && this.ctx.state === "running" && this.currentType !== null;
  }

  // ---------------------------------------------------------------------------
  // PROCEDURAL SOUNDSCAPE SYNTHESIZERS
  // ---------------------------------------------------------------------------

  private createPinkNoiseBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 4; // 4 seconds looping buffer
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  private startRain() {
    if (!this.ctx || !this.masterGain) return;
    const buffer = this.createPinkNoiseBuffer();
    if (!buffer) return;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Highpass to remove heavy rumble
    const highpass = this.ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.setValueAtTime(400, this.ctx.currentTime);

    // Lowpass to create soft rainfall patter
    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(2400, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.7, this.ctx.currentTime);

    noise.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
    this.activeNodes.push(noise, highpass, lowpass, gain);
  }

  private startOcean() {
    if (!this.ctx || !this.masterGain) return;
    const buffer = this.createPinkNoiseBuffer();
    if (!buffer) return;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Lowpass filter whose frequency is modulated by an LFO (Wave tides)
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(250, this.ctx.currentTime);
    filter.Q.setValueAtTime(3, this.ctx.currentTime);

    // LFO for periodic wave crashing (every 7 seconds)
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.14, this.ctx.currentTime); // ~7.1s cycle

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(320, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.85, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
    lfo.start();
    this.activeNodes.push(noise, filter, lfo, lfoGain, gain);
  }

  private startForest() {
    if (!this.ctx || !this.masterGain) return;
    const buffer = this.createPinkNoiseBuffer();
    if (!buffer) return;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Wind filter
    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.setValueAtTime(650, this.ctx.currentTime);
    bandpass.Q.setValueAtTime(1.8, this.ctx.currentTime);

    // Subtle wind oscillation
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.08, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(200, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(bandpass.frequency);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.55, this.ctx.currentTime);

    noise.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
    lfo.start();
    this.activeNodes.push(noise, bandpass, lfo, lfoGain, gain);
  }

  private startPiano() {
    if (!this.ctx || !this.masterGain) return;

    // Pentatonic calming notes in Hz (C4, D4, E4, G4, A4, C5, D5, E5)
    const notes = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];
    const playHarmonicNote = () => {
      if (!this.ctx || !this.masterGain) return;

      const freq = notes[Math.floor(Math.random() * notes.length)];
      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      // Warm overtone
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(freq * 2, this.ctx.currentTime);

      const now = this.ctx.currentTime;
      noteGain.gain.setValueAtTime(0.001, now);
      noteGain.gain.exponentialRampToValueAtTime(0.18, now + 0.05); // Attack
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8); // Gentle Decay

      osc.connect(noteGain);
      osc2.connect(noteGain);
      noteGain.connect(this.masterGain);

      osc.start(now);
      osc2.start(now);
      osc.stop(now + 4.0);
      osc2.stop(now + 4.0);

      this.activeNodes.push(osc, osc2, noteGain);
    };

    // Play initial note immediately
    playHarmonicNote();

    // Play next calming note every 2.5 - 3.5 seconds
    this.intervalTimer = setInterval(() => {
      playHarmonicNote();
    }, 2800);
  }

  private startAmbient() {
    if (!this.ctx || !this.masterGain) return;

    // Soothing warm chord (Frequencies: 108Hz, 216Hz, 324Hz, 432Hz harmonic warm drone)
    const freqs = [108, 162, 216, 324, 432];
    const groupGain = this.ctx.createGain();
    groupGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    groupGain.connect(this.masterGain);
    this.activeNodes.push(groupGain);

    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = idx % 2 === 0 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      // Subtle detune vibrato
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.1 + idx * 0.04, this.ctx.currentTime);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(1.5, this.ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      osc.connect(groupGain);
      osc.start();
      lfo.start();

      this.activeNodes.push(osc, lfo, lfoGain);
    });
  }
}

export const soundEngine = new SoundEngine();
