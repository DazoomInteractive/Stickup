// ============================================================
// Sky Jumper - Ancient Relic (Qadimiy Tosh)
// Replaces standard coins with glowing ancient runic gemstones.
// Has shimmering crystal facets and floating animation.
// ============================================================

import type { Platform } from './Platform';

export class Relic {
  x: number;
  y: number;
  radius = 14;
  collected = false;

  private bobPhase: number;
  private baseY: number;
  platform: Platform | null = null;
  private platformOffsetX = 0;
  private rotation = 0;

  constructor(x: number, y: number, platform: Platform | null = null) {
    this.x = x;
    this.y = y;
    this.baseY = y;
    this.bobPhase = Math.random() * Math.PI * 2;
    this.platform = platform;
    if (platform) {
      this.platformOffsetX = x - platform.x;
    }
  }

  update(dt: number): void {
    this.bobPhase += dt * 3.2;
    this.rotation += dt * 1.5;

    if (this.platform) {
      this.x = this.platform.x + this.platformOffsetX;
      const offset = this.platform.hasSpring() ? 55 : 32;
      this.baseY = this.platform.y - offset;
    }
    this.y = this.baseY + Math.sin(this.bobPhase) * 6;
  }

  draw(ctx: CanvasRenderingContext2D, screenX: number, screenY: number): void {
    ctx.save();
    ctx.translate(screenX, screenY);

    const pulse = Math.sin(this.bobPhase * 1.5) * 0.15 + 1;

    // Glowing Neon Aura Pulse
    const aura = ctx.createRadialGradient(0, 0, 2, 0, 0, this.radius * 2.2 * pulse);
    aura.addColorStop(0, 'rgba(56, 189, 248, 0.7)');
    aura.addColorStop(0.5, 'rgba(165, 243, 252, 0.35)');
    aura.addColorStop(1, 'rgba(6, 182, 212, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 2.2 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Outer Faceted Diamond Polygon (Brilliant Cut)
    ctx.beginPath();
    ctx.moveTo(0, -this.radius * 1.3); // Top apex
    ctx.lineTo(this.radius * 1.0, -this.radius * 0.4); // Top right shoulder
    ctx.lineTo(this.radius * 0.75, this.radius * 0.7);  // Mid right
    ctx.lineTo(0, this.radius * 1.4); // Bottom tip
    ctx.lineTo(-this.radius * 0.75, this.radius * 0.7); // Mid left
    ctx.lineTo(-this.radius * 1.0, -this.radius * 0.4); // Top left shoulder
    ctx.closePath();

    // Prismatic Cyan/Sapphire Diamond Gradient Fill
    const crystalGrad = ctx.createLinearGradient(-this.radius, -this.radius * 1.2, this.radius, this.radius * 1.2);
    crystalGrad.addColorStop(0, '#f0fdfa'); // Luminous brilliant white
    crystalGrad.addColorStop(0.25, '#67e8f9'); // Radiant cyan
    crystalGrad.addColorStop(0.65, '#0284c7'); // Rich sapphire blue
    crystalGrad.addColorStop(1, '#0369a1'); // Deep diamond core
    ctx.fillStyle = crystalGrad;
    ctx.fill();

    // Internal 3D Refraction Lines (Diamond Facets)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Inner Facet Triangular Crest
    ctx.beginPath();
    ctx.moveTo(0, -this.radius * 1.3);
    ctx.lineTo(0, this.radius * 0.4);
    ctx.lineTo(this.radius * 0.75, this.radius * 0.7);
    ctx.moveTo(0, this.radius * 0.4);
    ctx.lineTo(-this.radius * 0.75, this.radius * 0.7);
    ctx.moveTo(0, -this.radius * 1.3);
    ctx.lineTo(this.radius * 1.0, -this.radius * 0.4);
    ctx.moveTo(0, -this.radius * 1.3);
    ctx.lineTo(-this.radius * 1.0, -this.radius * 0.4);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Glowing Stellar Core Star
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
    ctx.fill();

    // 4-Point Starlight Glimmer
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(0, 8);
    ctx.moveTo(-8, 0);
    ctx.lineTo(8, 0);
    ctx.stroke();

    ctx.restore();
  }
}
