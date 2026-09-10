// ============================================================
// Sky Jumper - Audio Manager
// Lightweight Web Audio API wrapper. Generates tones procedurally
// so no external asset files are needed. Mute persists per session.
// ============================================================

export class AudioManager {
  private ctx: AudioContext | null = null;
  private muted = false;

  constructor() {
    try {
      this.muted = localStorage.getItem('sky_jumper_muted') === 'true';
    } catch {
      this.muted = false;
    }
  }

  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    try {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new Ctor();
    } catch {
      this.ctx = null;
    }
    return this.ctx;
  }

  resume(): void {
    const ctx = this.ensureContext();
    if (ctx && ctx.state === 'suspended') {
      void ctx.resume();
    }
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    try {
      localStorage.setItem('sky_jumper_muted', String(this.muted));
    } catch {
      // ignore
    }
    if (!this.muted) {
      this.resume();
    }
    return this.muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  /** Short click tone for menu buttons. */
  playButton(): void {
    this.tone(580, 0.05, 'sine', 0.1, 880);
  }

  /** Short tonal blip for jumps and bounces. */
  playJump(): void {
    this.tone(440, 0.12, 'square', 0.12, 220);
  }

  /** Brighter two-note chime for coin collection. */
  playCoin(): void {
    this.tone(880, 0.08, 'triangle', 0.1, 660);
    window.setTimeout(() => this.tone(1320, 0.1, 'triangle', 0.1, 880), 60);
  }

  /** Descending tone for game over. */
  playGameOver(): void {
    this.tone(330, 0.2, 'sawtooth', 0.12, 110);
    window.setTimeout(() => this.tone(220, 0.3, 'sawtooth', 0.12, 80), 150);
  }

  /** Bright rising boing for spring boost. */
  playSpring(): void {
    this.tone(300, 0.25, 'sine', 0.15, 1200);
  }

  /** Shimmering ethereal chime for shield pickup. */
  playShieldCollect(): void {
    this.tone(587.33, 0.12, 'sine', 0.14, 880); // D5 -> A5
    window.setTimeout(() => this.tone(880, 0.18, 'sine', 0.16, 1174.66), 80); // A5 -> D6
  }

  /** Forcefield pop and rescue boost when shield saves the player. */
  playShieldBreak(): void {
    this.tone(880, 0.1, 'sawtooth', 0.2, 220);
    window.setTimeout(() => this.tone(440, 0.25, 'triangle', 0.25, 1320), 70);
  }

  /** Sizzle and rumble when falling into rising lava. */
  playLavaBurn(): void {
    this.tone(180, 0.25, 'sawtooth', 0.22, 60);
    window.setTimeout(() => this.tone(120, 0.35, 'sawtooth', 0.25, 40), 90);
  }

  /** Thruster blast ignition when picking up Jetpack. */
  playJetpack(): void {
    this.tone(220, 0.3, 'sawtooth', 0.2, 580);
    window.setTimeout(() => this.tone(440, 0.4, 'sawtooth', 0.22, 880), 80);
  }

  /** Soft steam release and upward pop when jetpack finishes. */
  playJetpackEnd(): void {
    this.tone(600, 0.18, 'sine', 0.15, 300);
  }

  /** Magnetic electric resonance chime when picking up Magnet. */
  playMagnetCollect(): void {
    this.tone(440, 0.1, 'triangle', 0.14, 880);
    window.setTimeout(() => this.tone(659.25, 0.14, 'triangle', 0.16, 1318.5), 70);
  }

  /** Joyful fanfare for breaking a personal high score record. */
  playNewRecord(): void {
    if (this.muted) return;
    this.tone(523.25, 0.1, 'triangle', 0.16); // C5
    window.setTimeout(() => this.tone(659.25, 0.1, 'triangle', 0.18), 90); // E5
    window.setTimeout(() => this.tone(783.99, 0.12, 'triangle', 0.20), 180); // G5
    window.setTimeout(() => this.tone(1046.5, 0.35, 'triangle', 0.24), 280); // C6
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    endFreq?: number,
  ): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(endFreq, 1),
        ctx.currentTime + duration,
      );
    }
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }
}
