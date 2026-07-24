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
      if (p.type === 'sparkle') {
        // Draw a small star-ish shape
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
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
