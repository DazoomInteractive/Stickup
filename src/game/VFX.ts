// ============================================================
// Sky Jumper - VFX System
// Manages particles and floating text. Lightweight: objects are
// stored in flat arrays and removed in-place when expired.
// ============================================================

import type { Particle, FloatingText } from './types';
import { COLORS } from './constants';

export class VFX {
  private particles: Particle[] = [];
  private texts: FloatingText[] = [];

  update(dt: number): void {
    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 400 * dt; // light gravity on dust
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Floating texts
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.y += t.vy * dt;
      t.life -= dt;
      if (t.life <= 0) {
        this.texts.splice(i, 1);
      }
    }
  }

  /** Dust puff at the player's feet when bouncing. */
  spawnDust(x: number, y: number): void {
    const count = 6;
    for (let i = 0; i < count; i++) {
      const angle = Math.PI + (Math.random() - 0.5) * Math.PI * 0.8;
      const speed = 40 + Math.random() * 60;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.4,
        life: 0.4,
        maxLife: 0.4,
        size: 3 + Math.random() * 3,
        type: 'dust',
        color: COLORS.dust,
      });
    }
  }

  /** Golden sparkle burst when a coin is collected. */
  spawnSparkle(x: number, y: number): void {
    const count = 8;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const speed = 80 + Math.random() * 60;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        life: 0.5,
        maxLife: 0.5,
        size: 2 + Math.random() * 3,
        type: 'sparkle',
        color: COLORS.sparkle,
      });
    }
  }

  /** Fiery ember floating up from the rising lava. */
  spawnLavaEmber(x: number, y: number): void {
    if (this.particles.length > 90) return; // budget limit
    const colors = ['#fde047', '#fb923c', '#ef4444'];
    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 50,
      vy: -(60 + Math.random() * 80),
      life: 0.6 + Math.random() * 0.4,
      maxLife: 1.0,
      size: 2 + Math.random() * 3.5,
      type: 'ember',
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }

  /** Shimmering cyan burst when shield is picked up or broken. */
  spawnShieldBurst(x: number, y: number, isBreak = false): void {
    const count = isBreak ? 14 : 9;
    const colors = ['#38bdf8', '#7dd3fc', '#bae6fd', '#0284c7'];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = isBreak ? 120 + Math.random() * 100 : 70 + Math.random() * 60;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: isBreak ? 0.6 : 0.45,
        maxLife: isBreak ? 0.6 : 0.45,
        size: isBreak ? 3 + Math.random() * 4 : 2 + Math.random() * 3,
        type: 'shield',
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  /** Fiery thruster exhaust particles streaming downward from Jetpack. */
  spawnJetpackThruster(x: number, y: number): void {
    if (this.particles.length > 120) return;
    const colors = ['#fbbf24', '#f97316', '#ef4444', '#fed7aa', '#94a3b8'];
    for (let i = 0; i < 2; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 12,
        y,
        vx: (Math.random() - 0.5) * 45,
        vy: 180 + Math.random() * 140, // thrust pushes downward
        life: 0.25 + Math.random() * 0.15,
        maxLife: 0.4,
        size: 3 + Math.random() * 4,
        type: 'jetpack',
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  /** Pickup burst for Jetpack. */
  spawnJetpackBurst(x: number, y: number): void {
    const count = 12;
    const colors = ['#f97316', '#fbbf24', '#ef4444', '#fef08a'];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 90 + Math.random() * 70;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5,
        maxLife: 0.5,
        size: 3 + Math.random() * 3,
        type: 'jetpack',
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  /** Pickup burst for Magnet. */
  spawnMagnetBurst(x: number, y: number): void {
    const count = 12;
    const colors = ['#a855f7', '#c084fc', '#e879f9', '#38bdf8'];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 80 + Math.random() * 60;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.45,
        maxLife: 0.45,
        size: 2.5 + Math.random() * 3,
        type: 'magnet',
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  /** Tiny magnetic sparkle when attracting a coin. */
  spawnMagnetSpark(x: number, y: number): void {
    if (this.particles.length > 110) return;
    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 30,
      vy: (Math.random() - 0.5) * 30,
      life: 0.22,
      maxLife: 0.22,
      size: 2 + Math.random() * 2,
      type: 'magnet',
      color: '#c084fc',
    });
  }

  /** Dynamic Jump Trail particles for all 21 unique unlockable trails. */
  spawnTrail(x: number, y: number, trailType: string): void {
    if (!trailType || trailType === 'none' || this.particles.length > 140) return;

    const trailPalettes: Record<string, string[]> = {
      mint: ['#34d399', '#6ee7b7', '#a7f3d0', '#059669'],
      gold_spark: ['#fbbf24', '#f59e0b', '#fef08a', '#d97706'],
      bubbles: ['#38bdf8', '#7dd3fc', '#bae6fd', '#0284c7'],
      sakura: ['#f472b6', '#fbcfe8', '#f9a8d4', '#ec4899'],
      fire: ['#f97316', '#ef4444', '#fbbf24', '#fed7aa'],
      lightning: ['#eab308', '#facc15', '#fef08a', '#ffffff'],
      neon_cyan: ['#06b6d4', '#22d3ee', '#67e8f9', '#ffffff'],
      void: ['#a855f7', '#c084fc', '#7e22ce', '#3b0764'],
      crimson: ['#ef4444', '#dc2626', '#b91c1c', '#f87171'],
      emerald: ['#10b981', '#34d399', '#059669', '#6ee7b7'],
      rainbow: ['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#38bdf8', '#c084fc'],
      frost: ['#bae6fd', '#e0f2fe', '#7dd3fc', '#ffffff'],
      music: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'],
      toxic: ['#84cc16', '#a3e635', '#4d7c0f', '#bef264'],
      starlight: ['#fde047', '#fef08a', '#ffffff', '#f59e0b'],
      magma: ['#ea580c', '#c2410c', '#f97316', '#7c2d12'],
      diamond_glow: ['#38bdf8', '#7dd3fc', '#ffffff', '#bae6fd'],
      matrix: ['#22c55e', '#4ade80', '#15803d', '#86efac'],
      solar: ['#f59e0b', '#fbbf24', '#ea580c', '#fde047'],
      galaxy: ['#c084fc', '#e879f9', '#818cf8', '#38bdf8'],
    };

    const colors = trailPalettes[trailType] || ['#ffffff', '#cbd5e1'];
    const count = 2;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 12,
        y: y + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 45,
        vy: (Math.random() - 0.5) * 35,
        life: 0.35 + Math.random() * 0.18,
        maxLife: 0.55,
        size: 2.5 + Math.random() * 3.2,
        type: 'sparkle',
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  /** Floating "+1" text that rises and fades. */
  spawnFloatingText(x: number, y: number, text: string, color: string): void {
    this.texts.push({
      x,
      y,
      vy: -60,
      life: 0.9,
      maxLife: 0.9,
      text,
      color,
    });
  }

  drawParticles(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      if (p.type === 'sparkle' || p.type === 'shield' || p.type === 'magnet') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'ember' || p.type === 'jetpack') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.4 + 0.6 * alpha), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  drawTexts(ctx: CanvasRenderingContext2D): void {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const t of this.texts) {
      const alpha = t.life / t.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = t.color;
      ctx.font = 'bold 22px Roboto, sans-serif';
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }

  clear(): void {
    this.particles.length = 0;
    this.texts.length = 0;
  }
}
