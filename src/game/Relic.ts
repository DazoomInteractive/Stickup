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

  /** Called by the magnet: detaches from the platform and moves by (dx, dy). */
  pullBy(dx: number, dy: number): void {
    this.platform = null;
    this.x += dx;
    this.baseY += dy;
    this.y += dy;
  }

  draw(ctx: CanvasRenderingContext2D, screenX: number, screenY: number): void {
    ctx.save();
    ctx.translate(screenX, screenY);

    const R = this.radius;
    const pulse = Math.sin(this.bobPhase * 1.5) * 0.15 + 1;

    // Soft glow
    const aura = ctx.createRadialGradient(0, 0, 2, 0, 0, R * 2 * pulse);
    aura.addColorStop(0, 'rgba(186, 230, 253, 0.55)');
    aura.addColorStop(1, 'rgba(125, 211, 252, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, R * 2 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Classic brilliant-cut diamond: flat table on top, wide crown, pointed pavilion
    const top = -R * 0.95;
    const girdle = -R * 0.25;
    const bottom = R * 1.35;
    const tableHalf = R * 0.55;
    const girdleHalf = R * 1.2;
    const mid = R * 0.3;

    const facet = (pts: Array<[number, number]>, fill: string): void => {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    };

    // Pavilion facets (lower part)
    facet([[-girdleHalf, girdle], [girdleHalf, girdle], [0, bottom]], '#38bdf8');
    facet([[-girdleHalf, girdle], [-mid, girdle], [0, bottom]], '#0ea5e9');
    facet([[-mid, girdle], [mid, girdle], [0, bottom]], '#7dd3fc');
    facet([[mid, girdle], [girdleHalf, girdle], [0, bottom]], '#0284c7');
    // Crown facets (upper part)
    facet([[-tableHalf, top], [tableHalf, top], [mid, girdle], [-mid, girdle]], '#e0f2fe');
    facet([[-tableHalf, top], [-mid, girdle], [-girdleHalf, girdle]], '#bae6fd');
    facet([[tableHalf, top], [girdleHalf, girdle], [mid, girdle]], '#7dd3fc');

    // Outline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.lineWidth = 1.3;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-tableHalf, top);
    ctx.lineTo(tableHalf, top);
    ctx.lineTo(girdleHalf, girdle);
    ctx.lineTo(0, bottom);
    ctx.lineTo(-girdleHalf, girdle);
    ctx.closePath();
    ctx.stroke();

    // Facet lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-girdleHalf, girdle);
    ctx.lineTo(girdleHalf, girdle);
    ctx.moveTo(-tableHalf, top);
    ctx.lineTo(-mid, girdle);
    ctx.moveTo(tableHalf, top);
    ctx.lineTo(mid, girdle);
    ctx.moveTo(-mid, girdle);
    ctx.lineTo(0, bottom);
    ctx.moveTo(mid, girdle);
    ctx.lineTo(0, bottom);
    ctx.stroke();

    // Twinkling sparkle on the crown
    const twinkle = 3 + Math.abs(Math.sin(this.bobPhase * 1.3)) * 3;
    const sx = -R * 0.3;
    const sy = top + R * 0.45;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(sx, sy - twinkle);
    ctx.lineTo(sx, sy + twinkle);
    ctx.moveTo(sx - twinkle, sy);
    ctx.lineTo(sx + twinkle, sy);
    ctx.stroke();

    ctx.restore();
  }
}
