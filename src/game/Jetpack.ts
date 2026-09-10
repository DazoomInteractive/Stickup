// ============================================================
// Sky Jumper - Jetpack Power-Up Item
// Collectible rocket pack that propels the player into high-speed
// vertical ascent with thruster exhaust VFX and sound.
// ============================================================

import type { Platform } from './Platform';

export class Jetpack {
  x: number;
  y: number; // world Y
  radius = 18;
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

    this.bobTimer += dt * 3.4;

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

    // 1. Warm orange/yellow glow
    ctx.shadowColor = 'rgba(249, 115, 22, 0.85)';
    ctx.shadowBlur = 14;

    // 2. Translucent badge background
    ctx.fillStyle = 'rgba(255, 237, 213, 0.9)';
    ctx.beginPath();
    ctx.arc(screenX, sy, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 3. Vector Jetpack graphics (Twin rocket tubes)
    const canW = 6;
    const canH = 16;
    const canGap = 4;
    const topY = sy - canH / 2 + 1;

    // Left Canister
    this.drawCanister(ctx, screenX - canGap - canW, topY, canW, canH);
    // Right Canister
    this.drawCanister(ctx, screenX + canGap, topY, canW, canH);

    // Center Bridge/Harness
    ctx.fillStyle = '#475569';
    ctx.fillRect(screenX - canGap, sy - 3, canGap * 2, 6);

    // Center power core indicator (glowing cyan dot)
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(screenX, sy, 2, 0, Math.PI * 2);
    ctx.fill();

    // Idle nozzle flame sparks
    const flameH = 3 + Math.sin(this.bobTimer * 2) * 1.5;
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(screenX - canGap - canW + 1, topY + canH, canW - 2, flameH);
    ctx.fillRect(screenX + canGap + 1, topY + canH, canW - 2, flameH);

    ctx.restore();
  }

  private drawCanister(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    w: number,
    h: number,
  ): void {
    // Rocket body
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(cx, cy + 3, w, h - 3);

    // Red conical nose cone
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(cx, cy + 3);
    ctx.lineTo(cx + w / 2, cy - 2);
    ctx.lineTo(cx + w, cy + 3);
    ctx.closePath();
    ctx.fill();

    // Yellow warning stripe
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(cx, cy + h * 0.45, w, 2.5);

    // Dark nozzle base
    ctx.fillStyle = '#334155';
    ctx.fillRect(cx, cy + h - 1.5, w, 2);
  }
}
