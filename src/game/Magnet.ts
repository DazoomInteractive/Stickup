// ============================================================
// Sky Jumper - Magnet Power-Up Item
// Collectible horseshoe magnet that attracts nearby coins
// directly toward the player for 6.5 seconds.
// ============================================================

import type { Platform } from './Platform';

export class Magnet {
  x: number;
  y: number; // world Y
  radius = 17;
  collected = false;

  private platform: Platform | null;
  private localOffsetX: number;
  private bobTimer: number;

  constructor(x: number, y: number, platform: Platform | null = null) {
    this.x = x;
    this.y = y;
    this.platform = platform;
    this.localOffsetX = platform ? x - platform.x : 0;
    this.bobTimer = Math.random() * Math.PI * 2;
  }

  update(dt: number): void {
    if (this.collected) return;

    this.bobTimer += dt * 3.3;

    // Follow moving platform
    if (this.platform) {
      this.x = this.platform.x + this.localOffsetX;
    }
  }

  draw(ctx: CanvasRenderingContext2D, screenX: number, screenY: number): void {
    if (this.collected) return;

    // Gentle vertical bobbing
    const bobOffset = Math.sin(this.bobTimer) * 4;
    const sy = screenY + bobOffset;

    ctx.save();

    // 1. Electric blue / purple magnetic glow
    ctx.shadowColor = 'rgba(168, 85, 247, 0.85)';
    ctx.shadowBlur = 12;

    // 2. Badge background
    ctx.fillStyle = 'rgba(250, 245, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(screenX, sy, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 3. Horseshoe Magnet drawing
    ctx.save();
    ctx.translate(screenX, sy);

    const mw = 16;
    const mh = 16;
    const thickness = 4.5;

    // Outer U path
    ctx.lineWidth = thickness;
    ctx.lineCap = 'butt';

    // Red magnet body (bottom arc and lower sides)
    ctx.strokeStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 0, mw / 2, 0, Math.PI, false);
    ctx.stroke();

    // Silver magnetic poles on top
    ctx.strokeStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(-mw / 2, 0);
    ctx.lineTo(-mw / 2, -mh / 2 + 1);
    ctx.moveTo(mw / 2, 0);
    ctx.lineTo(mw / 2, -mh / 2 + 1);
    ctx.stroke();

    // Small magnetic spark arc on top poles
    const sparkPulse = (Math.sin(this.bobTimer * 4) + 1) * 0.5;
    ctx.strokeStyle = `rgba(56, 189, 248, ${0.4 + sparkPulse * 0.5})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -mh / 2, mw / 2, -Math.PI * 0.8, -Math.PI * 0.2);
    ctx.stroke();

    ctx.restore();

    ctx.restore();
  }
}
