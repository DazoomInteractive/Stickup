// ============================================================
// Sky Jumper - Audio Manager
// Lightweight Web Audio API wrapper. Generates tones procedurally
// so no external asset files are needed. Mute persists per session.
// ============================================================

export class AudioManager {
  private ctx: AudioContext | null = null;
  private muted = false;

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
    if (!this.muted) {
      this.resume();
    }
    return this.muted;
  }

  isMuted(): boolean {
    return this.muted;
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
