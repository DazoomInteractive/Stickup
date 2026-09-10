// ============================================================
// Sky Jumper - Shield Power-Up Item
// Collectible floating forcefield orb that grants the player
// a 1-hit invulnerability barrier saving them from lava/falls.
// ============================================================

import type { Platform } from './Platform';

export class Shield {
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

    this.bobTimer += dt * 3.2;

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
    ctx.shadowColor = 'rgba(56, 189, 248, 0.85)';
    ctx.shadowBlur = 12;

    // 2. Shield translucent orb body
    const grad = ctx.createRadialGradient(
      screenX - 3,
      sy - 3,
      2,
      screenX,
      sy,
      this.radius,
    );
    grad.addColorStop(0, '#e0f2fe');
    grad.addColorStop(0.5, '#38bdf8');
    grad.addColorStop(1, '#0284c7');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(screenX, sy, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // 3. Crisp white/cyan border
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // 4. Vector Shield Icon inside
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    const w = 14;
    const h = 16;
    const topY = sy - h / 2 + 1;
    // Shield crest shape
    ctx.moveTo(screenX - w / 2, topY);
    ctx.lineTo(screenX + w / 2, topY);
    ctx.lineTo(screenX + w / 2, topY + h * 0.45);
    ctx.quadraticCurveTo(screenX + w / 2, topY + h, screenX, topY + h);
    ctx.quadraticCurveTo(screenX - w / 2, topY + h, screenX - w / 2, topY + h * 0.45);
    ctx.closePath();
    ctx.fill();

    // Inner shield detail
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(screenX, topY + 2);
    ctx.lineTo(screenX, topY + h - 2);
    ctx.stroke();

    ctx.restore();
  }
}
