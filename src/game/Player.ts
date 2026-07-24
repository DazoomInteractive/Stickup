// ============================================================
// Sky Jumper - Player
// Stickman with physics, screen wrapping, squish/stretch bounce
// animation, movement-based tilt, and dust-spawn hook.
//
// FUTURE (Phase 2+): swap drawStickman() for skin system.
// FUTURE (Phase 3): add spring boost, enemy collision hooks.
// ============================================================

import {
  GRAVITY,
  JUMP_VELOCITY,
  SPRING_VELOCITY,
  MOVE_SPEED,
  MAX_FALL_SPEED,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  GAME_WIDTH,
  COLORS,
} from './constants';
import type { InputHandler } from './InputHandler';

export class Player {
  x: number;
  y: number; // world Y (top-left of bounding box)
  vx = 0;
  vy = 0;
  width = PLAYER_WIDTH;
  height = PLAYER_HEIGHT;

  // VFX state
  private scaleX = 1;
  private scaleY = 1;
  private targetScaleX = 1;
  private targetScaleY = 1;
  private tilt = 0;
  private targetTilt = 0;

  // Bounce callback — GameEngine wires this to VFX.spawnDust + audio.
  onBounce: (() => void) | null = null;
  // Spring callback — GameEngine wires this to VFX + spring sound.
  onSpring: (() => void) | null = null;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  get centerX(): number {
    return this.x + this.width / 2;
  }

  get centerY(): number {
    return this.y + this.height / 2;
  }

  get feetY(): number {
    return this.y + this.height;
  }

  update(dt: number, input: InputHandler): void {
    // Horizontal movement
    let dir = 0;
    if (input.isLeft()) dir -= 1;
    if (input.isRight()) dir += 1;
    this.vx = dir * MOVE_SPEED;

    this.x += this.vx * dt;
    // Screen wrapping
    if (this.x + this.width < 0) {
      this.x = GAME_WIDTH;
    } else if (this.x > GAME_WIDTH) {
      this.x = -this.width;
    }

    // Gravity
    this.vy += GRAVITY * dt;
    if (this.vy > MAX_FALL_SPEED) this.vy = MAX_FALL_SPEED;
    this.y += this.vy * dt;

    // Tilt based on horizontal direction (smooth lerp)
    this.targetTilt = dir * 0.18;
    this.tilt += (this.targetTilt - this.tilt) * Math.min(1, dt * 10);

    // Squish/stretch ease back toward 1
    this.scaleX += (this.targetScaleX - this.scaleX) * Math.min(1, dt * 12);
    this.scaleY += (this.targetScaleY - this.scaleY) * Math.min(1, dt * 12);
  }

  /** Called by GameEngine when the player lands on a platform. */
  bounce(): void {
    this.vy = JUMP_VELOCITY;
    this.triggerSquish();
    if (this.onBounce) this.onBounce();
  }

  /** Called by GameEngine when the player hits a spring. */
  springBoost(): void {
    this.vy = SPRING_VELOCITY;
    this.triggerSquish();
    if (this.onSpring) this.onSpring();
  }

  private triggerSquish(): void {
    this.scaleX = 0.7;
    this.scaleY = 1.35;
    this.targetScaleX = 1;
    this.targetScaleY = 1;
  }

  draw(ctx: CanvasRenderingContext2D, screenX: number, screenY: number): void {
    ctx.save();
    ctx.translate(screenX + this.width / 2, screenY + this.height / 2);
    ctx.rotate(this.tilt);
    ctx.scale(this.scaleX, this.scaleY);

    this.drawStickman(ctx);

    ctx.restore();
  }

  /** Clean vector stickman drawn centered on (0,0). */
  private drawStickman(ctx: CanvasRenderingContext2D): void {
    const w = this.width;
    const h = this.height;
    const headR = w * 0.22;

    ctx.strokeStyle = COLORS.player;
    ctx.fillStyle = COLORS.player;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Head
    ctx.beginPath();
    ctx.arc(0, -h * 0.35, headR, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.35 + headR);
    ctx.lineTo(0, h * 0.15);
    ctx.stroke();

    // Arms
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.15);
    ctx.lineTo(-w * 0.3, h * 0.0);
    ctx.moveTo(0, -h * 0.15);
    ctx.lineTo(w * 0.3, h * 0.0);
    ctx.stroke();

    // Legs
    ctx.beginPath();
    ctx.moveTo(0, h * 0.15);
    ctx.lineTo(-w * 0.25, h * 0.5);
    ctx.moveTo(0, h * 0.15);
    ctx.lineTo(w * 0.25, h * 0.5);
    ctx.stroke();

    // Accent dot on head for a touch of color
    ctx.fillStyle = COLORS.playerAccent;
    ctx.beginPath();
    ctx.arc(0, -h * 0.35, headR * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  reset(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.scaleX = 1;
    this.scaleY = 1;
    this.targetScaleX = 1;
    this.targetScaleY = 1;
    this.tilt = 0;
    this.targetTilt = 0;
  }
}
