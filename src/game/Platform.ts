// ============================================================
// Sky Jumper - Platform
// Supports 5 platform types via a single class using a `type`
// discriminator. New types (Phase 4+: enemy, ice, etc.) can be
// added by extending PlatformType and adding a draw branch.
//
// Types:
//   static    — green, does nothing
//   moving    — blue, horizontal ping-pong
//   breakable — brown wood, crumbles after one bounce
//   fading    — purple, fades out and reappears periodically
//   spring    — has a spring on top that boosts the player 2x
// ============================================================

import {
  PLATFORM_WIDTH,
  PLATFORM_HEIGHT,
  GAME_WIDTH,
  COLORS,
} from './constants';

export type PlatformType =
  | 'static'
  | 'moving'
  | 'breakable'
  | 'fading'
  | 'spring';

export class Platform {
  x: number;
  y: number; // world Y (top edge)
  width = PLATFORM_WIDTH;
  height = PLATFORM_HEIGHT;
  type: PlatformType;

  // Moving platform state
  private range: number;
  private speed: number;
  private direction = 1;
  private originX: number;

  // Breakable state
  broken = false;
  private breakTimer = 0; // counts up after break for fade-out animation

  // Fading state — oscillates between visible and invisible
  private fadePhase: number;
  private fadeAlpha = 1;
  private solid = true; // whether collision is active right now

  // Elastic bounce dip on player contact
  private dipOffset = 0;
  private dipVelocity = 0;

  // Spring compression animation (0 to 1)
  private springCompress = 0;

  constructor(
    x: number,
    y: number,
    type: PlatformType,
    range = 0,
    speed = 0,
    fadeOffset = 0,
  ) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.range = range;
    this.speed = speed;
    this.originX = x;
    this.fadePhase = fadeOffset;
  }

  /** Whether this platform currently blocks the player. */
  isSolid(): boolean {
    if (this.type === 'breakable') return !this.broken;
    if (this.type === 'fading') return this.solid;
    return true;
  }

  /** Whether this platform has a spring on top. */
  hasSpring(): boolean {
    return this.type === 'spring';
  }

  /** Called when player lands on this platform — triggers an elastic dip. */
  triggerBounce(isSpring = false): void {
    this.dipVelocity = isSpring ? 75 : 55;
    if (isSpring) {
      this.springCompress = 1;
    }
  }

  /** Breakable platforms: mark as broken (called by GameEngine on bounce). */
  break(): void {
    if (this.type !== 'breakable' || this.broken) return;
    this.broken = true;
    this.breakTimer = 0;
  }

  update(dt: number): void {
    // Elastic spring physics for dip bounce
    if (this.dipOffset !== 0 || this.dipVelocity !== 0) {
      const springK = 380;
      const damping = 22;
      const force = -springK * this.dipOffset - damping * this.dipVelocity;
      this.dipVelocity += force * dt;
      this.dipOffset += this.dipVelocity * dt;
      if (Math.abs(this.dipOffset) < 0.1 && Math.abs(this.dipVelocity) < 1) {
        this.dipOffset = 0;
        this.dipVelocity = 0;
      }
    }

    // Spring compression decay
    if (this.springCompress > 0) {
      this.springCompress = Math.max(0, this.springCompress - dt * 4.5);
    }

    // Moving
    if (this.type === 'moving' || (this.type === 'spring' && this.speed > 0)) {
      this.x += this.speed * this.direction * dt;
      if (this.x <= 0) {
        this.x = 0;
        this.direction = 1;
      } else if (this.x + this.width >= GAME_WIDTH) {
        this.x = GAME_WIDTH - this.width;
        this.direction = -1;
      }
      if (this.range > 0) {
        if (this.x > this.originX + this.range) {
          this.x = this.originX + this.range;
          this.direction = -1;
        } else if (this.x < this.originX - this.range) {
          this.x = this.originX - this.range;
          this.direction = 1;
        }
      }
    }

    // Breakable — animate fade-out after breaking
    if (this.type === 'breakable' && this.broken) {
      this.breakTimer += dt;
    }

    // Fading — 4-second cycle: 2.5s solid, 1.5s invisible, with ramp
    if (this.type === 'fading') {
      this.fadePhase += dt;
      const cycle = this.fadePhase % 4;
      if (cycle < 2.2) {
        this.fadeAlpha = 1;
        this.solid = true;
      } else if (cycle < 2.6) {
        // Fading out
        const t = (cycle - 2.2) / 0.4;
        this.fadeAlpha = 1 - t;
        this.solid = t < 0.5;
      } else if (cycle < 3.6) {
        this.fadeAlpha = 0;
        this.solid = false;
      } else {
        // Fading back in
        const t = (cycle - 3.6) / 0.4;
        this.fadeAlpha = t;
        this.solid = t > 0.5;
      }
    }
  }

  /** Whether this platform should be removed from the game. */
  shouldRemove(): boolean {
    if (this.type === 'breakable' && this.broken && this.breakTimer > 0.5) {
      return true;
    }
    return false;
  }

  draw(ctx: CanvasRenderingContext2D, screenX: number, screenY: number): void {
    // Skip fully invisible/removed
    if (this.type === 'breakable' && this.broken && this.breakTimer > 0.5) return;
    if (this.type === 'fading' && this.fadeAlpha <= 0.01) return;

    ctx.save();
    if (this.type === 'fading') {
      ctx.globalAlpha = this.fadeAlpha;
    }
    if (this.type === 'breakable' && this.broken) {
      // Quick fade as it crumbles
      ctx.globalAlpha = Math.max(0, 1 - this.breakTimer / 0.5);
    }

    const colors = this.getColors();
    const renderY = screenY + this.dipOffset;
    this.drawBody(ctx, screenX, renderY, colors.main, colors.dark);

    // Spring on top
    if (this.type === 'spring') {
      this.drawSpring(ctx, screenX, renderY);
    }

    ctx.restore();
  }

  private drawBody(
    ctx: CanvasRenderingContext2D,
    screenX: number,
    screenY: number,
    main: string,
    dark: string,
  ): void {
    // Shadow
    ctx.fillStyle = COLORS.shadow;
    ctx.beginPath();
    this.roundRect(ctx, screenX + 2, screenY + 3, this.width, this.height, 6);
    ctx.fill();

    // Body
    ctx.fillStyle = main;
    ctx.beginPath();
    this.roundRect(ctx, screenX, screenY, this.width, this.height, 6);
    ctx.fill();

    // Bottom stripe
    ctx.fillStyle = dark;
    ctx.beginPath();
    this.roundRect(ctx, screenX, screenY + this.height - 5, this.width, 5, 6);
    ctx.fill();

    // Breakable: add wood grain lines
    if (this.type === 'breakable') {
      ctx.strokeStyle = dark;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(screenX + 15, screenY + 4);
      ctx.lineTo(screenX + 15, screenY + this.height - 6);
      ctx.moveTo(screenX + 45, screenY + 4);
      ctx.lineTo(screenX + 45, screenY + this.height - 6);
      ctx.moveTo(screenX + 75, screenY + 4);
      ctx.lineTo(screenX + 75, screenY + this.height - 6);
      ctx.stroke();
    }
  }

  private drawSpring(
    ctx: CanvasRenderingContext2D,
    screenX: number,
    screenY: number,
  ): void {
    const cx = screenX + this.width / 2;
    const baseY = screenY;
    // Compresses by up to 12px when springCompress is 1
    const compOffset = this.springCompress * 12;
    const springH = Math.max(8, 20 - compOffset);
    const topY = baseY - springH;

    // Coil
    ctx.strokeStyle = COLORS.springCoil;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const coilStep = springH / 3.3;
    for (let i = 0; i < 3; i++) {
      const y1 = baseY - (i + 1) * coilStep;
      const y2 = baseY - (i + 1) * coilStep - (coilStep * 0.5);
      ctx.moveTo(cx - 10, y1);
      ctx.lineTo(cx + 10, y2);
    }
    ctx.stroke();

    // Top plate
    ctx.fillStyle = COLORS.spring;
    ctx.strokeStyle = COLORS.springDark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    this.roundRect(ctx, cx - 16, topY, 32, 7, 4);
    ctx.fill();
    ctx.stroke();
  }

  private getColors(): { main: string; dark: string } {
    switch (this.type) {
      case 'moving':
        return { main: COLORS.movingPlatform, dark: COLORS.movingPlatformDark };
      case 'breakable':
        return { main: COLORS.breakablePlatform, dark: COLORS.breakablePlatformDark };
      case 'fading':
        return { main: COLORS.fadingPlatform, dark: COLORS.fadingPlatformDark };
      case 'spring':
        return { main: COLORS.staticPlatform, dark: COLORS.staticPlatformDark };
      default:
        return { main: COLORS.staticPlatform, dark: COLORS.staticPlatformDark };
    }
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ): void {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }
}
