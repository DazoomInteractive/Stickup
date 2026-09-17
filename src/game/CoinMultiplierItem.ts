// ============================================================
// Sky Jumper - 2X Coin Multiplier Power-Up Item
// Collectible golden token that doubles all coins earned from
// selling diamonds to merchants for a limited duration!
// ============================================================

import type { Platform } from './Platform';

export class CoinMultiplierItem {
  x: number;
  y: number; // world Y
  radius = 16;
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

    this.bobTimer += dt * 3.5;

    // Follow platform movement
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

    // 1. Glowing outer halo
    ctx.shadowColor = 'rgba(245, 158, 11, 0.9)';
    ctx.shadowBlur = 12;

    // 2. Translucent golden orb background
    const grad = ctx.createRadialGradient(
      screenX - 3,
      sy - 3,
      2,
      screenX,
      sy,
      this.radius,
    );
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(0.6, '#f59e0b');
    grad.addColorStop(1, '#b45309');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(screenX, sy, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 3. Inner golden ring
    ctx.beginPath();
    ctx.arc(screenX, sy, this.radius - 3.5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 4. "2X" bold label
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Roboto, sans-serif';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 3;
    ctx.fillText('2X', screenX, sy);

    ctx.restore();
  }
}
