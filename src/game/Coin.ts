// ============================================================
// Sky Jumper - Coin
// Collectible golden coin with a gentle floating bob animation.
// On collection, GameEngine triggers sparkle VFX + floating "+1".
//
// FUTURE (Phase 3): add Gem, PowerUp as siblings following the
// same interface (update/draw/collect). GameEngine collects by
// proximity, so new item types drop in without touching logic.
// ============================================================

import { COIN_RADIUS, COLORS } from './constants';

export class Coin {
  x: number;
  y: number; // world Y (center)
  radius = COIN_RADIUS;
  collected = false;

  // Bob animation
  private bobPhase: number;
  private baseY: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.baseY = y;
    this.bobPhase = Math.random() * Math.PI * 2;
  }

  update(dt: number): void {
    this.bobPhase += dt * 3;
    this.y = this.baseY + Math.sin(this.bobPhase) * 6;
  }

  draw(ctx: CanvasRenderingContext2D, screenX: number, screenY: number): void {
    // Outer ring
    ctx.fillStyle = COLORS.coinDark;
    ctx.beginPath();
    ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner face
    ctx.fillStyle = COLORS.coin;
    ctx.beginPath();
    ctx.arc(screenX, screenY, this.radius - 3, 0, Math.PI * 2);
    ctx.fill();

    // Shine highlight
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(screenX - this.radius * 0.3, screenY - this.radius * 0.3, this.radius * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }
}
