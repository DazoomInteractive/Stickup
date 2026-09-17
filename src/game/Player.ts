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
  JETPACK_DURATION,
  JETPACK_SPEED,
  MAGNET_DURATION,
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
  private squashPhase = 0; // 0 = idle, 1 = squashing on impact, 2 = stretching on launch
  private squashTimer = 0;
  private tilt = 0;
  private targetTilt = 0;

  // Power-up states
  hasShield = false;
  private shieldTimer = 0;

  hasJetpack = false;
  jetpackTimer = 0;
  jetpackMax = JETPACK_DURATION;
  private thrusterAnim = 0;

  hasMagnet = false;
  magnetTimer = 0;
  magnetMax = MAGNET_DURATION;

  hasMultiplier = false;
  multiplierTimer = 0;
  multiplierMax = 4.0;

  // Custom Skin, Hat & Upgrades
  skinColor = '#2b2b2b';
  skinAccent = '#4a90d9';
  skinGlow = 'rgba(74, 144, 217, 0)';
  hat?: 'crown' | 'ninja_bandana' | 'visor' | 'viking_horns' | 'diver_goggles' | 'astronaut_dome' | 'pharaoh_nemes' | 'dragon_horns' | 'knight_helmet' | 'vampire_cape' | 'halo';

  // Callbacks
  onBounce: (() => void) | null = null;
  onSpring: (() => void) | null = null;
  onJetpackEnd: (() => void) | null = null;

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

  get bottomY(): number {
    return this.y + this.height;
  }

  activateJetpack(duration = JETPACK_DURATION): void {
    this.hasJetpack = true;
    this.jetpackTimer = duration;
    this.jetpackMax = duration;
  }

  activateMagnet(duration = MAGNET_DURATION): void {
    this.hasMagnet = true;
    this.magnetTimer = duration;
    this.magnetMax = duration;
  }

  activateMultiplier(duration = 4.0): void {
    this.hasMultiplier = true;
    this.multiplierTimer = duration;
    this.multiplierMax = duration;
  }

  update(dt: number, input: InputHandler): void {
    // Horizontal movement (active in all modes including jetpack)
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

    // Vertical Physics: Jetpack vs Gravity
    if (this.hasJetpack) {
      this.jetpackTimer -= dt;
      this.thrusterAnim += dt * 30;

      // Rocket ascent velocity
      this.vy = -JETPACK_SPEED;
      this.y += this.vy * dt;

      // Jetpack timer expiration: soft landing momentum
      if (this.jetpackTimer <= 0) {
        this.hasJetpack = false;
        this.vy = -750; // soft floaty upward release
        if (this.onJetpackEnd) this.onJetpackEnd();
      }
    } else {
      // Normal Gravity
      this.vy += GRAVITY * dt;
      if (this.vy > MAX_FALL_SPEED) this.vy = MAX_FALL_SPEED;
      this.y += this.vy * dt;
    }

    // Magnet timer
    if (this.hasMagnet) {
      this.magnetTimer -= dt;
      if (this.magnetTimer <= 0) {
        this.hasMagnet = false;
      }
    }

    // Multiplier timer
    if (this.hasMultiplier) {
      this.multiplierTimer -= dt;
      if (this.multiplierTimer <= 0) {
        this.hasMultiplier = false;
      }
    }

    // Tilt based on horizontal direction (smooth lerp)
    this.targetTilt = dir * 0.18;
    this.tilt += (this.targetTilt - this.tilt) * Math.min(1, dt * 10);

    // Multi-phase Squash & Stretch animation (only when jumping, not during jetpack)
    if (!this.hasJetpack) {
      if (this.squashPhase === 1) {
        this.squashTimer -= dt;
        if (this.squashTimer <= 0) {
          this.squashPhase = 2;
          this.squashTimer = 0.15;
          this.scaleX = 0.72;
          this.scaleY = 1.38;
          this.targetScaleX = 1;
          this.targetScaleY = 1;
        }
      } else if (this.squashPhase === 2) {
        this.squashTimer -= dt;
        if (this.squashTimer <= 0) {
          this.squashPhase = 0;
        }
      }
    } else {
      // Aerodynamic stretch while jetpack is firing
      this.scaleX = 0.88;
      this.scaleY = 1.18;
      this.targetScaleX = 0.88;
      this.targetScaleY = 1.18;
    }

    // Smooth lerp back toward target scale
    const lerpSpeed = this.squashPhase === 1 ? 26 : 14;
    this.scaleX += (this.targetScaleX - this.scaleX) * Math.min(1, dt * lerpSpeed);
    this.scaleY += (this.targetScaleY - this.scaleY) * Math.min(1, dt * lerpSpeed);

    if (this.hasShield) {
      this.shieldTimer += dt * 3.5;
    }
  }

  /** Called by GameEngine when the player lands on a platform. */
  bounce(): void {
    this.vy = JUMP_VELOCITY;
    this.triggerSquish(false);
    if (this.onBounce) this.onBounce();
  }

  /** Called by GameEngine when the player hits a spring. */
  springBoost(): void {
    this.vy = SPRING_VELOCITY;
    this.triggerSquish(true);
    if (this.onSpring) this.onSpring();
  }

  private triggerSquish(isSpring = false): void {
    this.squashPhase = 1;
    this.squashTimer = isSpring ? 0.08 : 0.06;
    // Initial squash on impact (compressed down, expanded out)
    this.scaleX = isSpring ? 1.48 : 1.32;
    this.scaleY = isSpring ? 0.56 : 0.70;
    this.targetScaleX = isSpring ? 0.65 : 0.72;
    this.targetScaleY = isSpring ? 1.48 : 1.38;
  }

  draw(ctx: CanvasRenderingContext2D, screenX: number, screenY: number): void {
    this.drawPlayerAt(ctx, screenX, screenY);

    // If partially off screen, draw duplicate on opposite edge for seamless wrapping
    if (screenX < 0) {
      this.drawPlayerAt(ctx, screenX + GAME_WIDTH, screenY);
    } else if (screenX + this.width > GAME_WIDTH) {
      this.drawPlayerAt(ctx, screenX - GAME_WIDTH, screenY);
    }
  }

  private drawPlayerAt(ctx: CanvasRenderingContext2D, sx: number, sy: number): void {
    ctx.save();
    // Anchor squash at feet so player stays grounded during contact
    const feetY = sy + this.height;
    ctx.translate(sx + this.width / 2, feetY - (this.height / 2) * this.scaleY);
    ctx.rotate(this.tilt);
    ctx.scale(this.scaleX, this.scaleY);

    if (this.hasJetpack) {
      this.drawJetpack(ctx);
    }

    this.drawStickman(ctx);

    if (this.hasMagnet) {
      this.drawMagnetArcs(ctx);
    }

    if (this.hasShield) {
      this.drawShieldAura(ctx);
    }

    ctx.restore();
  }

  /** Twin rocket canisters on the player's back with thruster flames */
  private drawJetpack(ctx: CanvasRenderingContext2D): void {
    const w = this.width;
    const h = this.height;

    ctx.save();
    // Harness across torso
    ctx.fillStyle = '#475569';
    ctx.fillRect(-w * 0.32, -h * 0.1, w * 0.64, 4);

    // Left and Right canisters
    const canW = 7;
    const canH = 22;
    const canY = -h * 0.22;
    const leftX = -w * 0.45;
    const rightX = w * 0.45 - canW;

    // Body of rockets
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(leftX, canY + 4, canW, canH - 4);
    ctx.fillRect(rightX, canY + 4, canW, canH - 4);

    // Cones
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(leftX, canY + 4);
    ctx.lineTo(leftX + canW / 2, canY - 2);
    ctx.lineTo(leftX + canW, canY + 4);
    ctx.moveTo(rightX, canY + 4);
    ctx.lineTo(rightX + canW / 2, canY - 2);
    ctx.lineTo(rightX + canW, canY + 4);
    ctx.fill();

    // Warning stripe
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(leftX, canY + canH * 0.4, canW, 2.5);
    ctx.fillRect(rightX, canY + canH * 0.4, canW, 2.5);

    // Nozzles
    ctx.fillStyle = '#334155';
    ctx.fillRect(leftX, canY + canH, canW, 3);
    ctx.fillRect(rightX, canY + canH, canW, 3);

    // Animated Thruster exhaust flames (flicker in last 0.6s as fuel warning)
    const isWarning = this.jetpackTimer < 0.6;
    const flicker = isWarning ? Math.sin(this.thrusterAnim * 2) > -0.2 : true;

    if (flicker) {
      const flameLen = 14 + Math.sin(this.thrusterAnim) * 5;

      // Outer orange flame
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(leftX, canY + canH + 3);
      ctx.lineTo(leftX + canW, canY + canH + 3);
      ctx.lineTo(leftX + canW / 2, canY + canH + 3 + flameLen);
      ctx.moveTo(rightX, canY + canH + 3);
      ctx.lineTo(rightX + canW, canY + canH + 3);
      ctx.lineTo(rightX + canW / 2, canY + canH + 3 + flameLen);
      ctx.fill();

      // Inner hot yellow core
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(leftX + 1.5, canY + canH + 3);
      ctx.lineTo(leftX + canW - 1.5, canY + canH + 3);
      ctx.lineTo(leftX + canW / 2, canY + canH + 3 + flameLen * 0.6);
      ctx.moveTo(rightX + 1.5, canY + canH + 3);
      ctx.lineTo(rightX + canW - 1.5, canY + canH + 3);
      ctx.lineTo(rightX + canW / 2, canY + canH + 3 + flameLen * 0.6);
      ctx.fill();
    }

    ctx.restore();
  }

  /** Subtle magnetic energy arcs above head when Magnet is active */
  private drawMagnetArcs(ctx: CanvasRenderingContext2D): void {
    const pulse = (Math.sin(this.shieldTimer * 3) + 1) * 0.5;
    const h = this.height;

    ctx.save();
    ctx.strokeStyle = `rgba(192, 132, 252, ${0.4 + pulse * 0.5})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -h * 0.55, 14, -Math.PI * 0.8, -Math.PI * 0.2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, -h * 0.62, 20, -Math.PI * 0.75, -Math.PI * 0.25);
    ctx.stroke();
    ctx.restore();
  }

  /** Glowing, pulsating spherical energy forcefield aura (protects player + jetpack) */
  private drawShieldAura(ctx: CanvasRenderingContext2D): void {
    const pulse = Math.sin(this.shieldTimer) * 2;
    // Sized to encapsulate both stickman and jetpack
    const baseR = this.hasJetpack
      ? Math.max(this.width, this.height) * 0.68
      : Math.max(this.width, this.height) * 0.58;
    const r = baseR + pulse;

    ctx.save();
    // Translucent cyan bubble
    ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
    ctx.shadowColor = 'rgba(56, 189, 248, 0.9)';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Shield rim outline
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#7dd3fc';
    ctx.stroke();

    // Rotating orbital spark node
    const orbitAngle = this.shieldTimer;
    const orbX = Math.cos(orbitAngle) * r;
    const orbY = Math.sin(orbitAngle) * r;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(orbX, orbY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /** Clean vector stickman drawn centered on (0,0). */
  private drawStickman(ctx: CanvasRenderingContext2D): void {
    const w = this.width;
    const h = this.height;
    const headR = w * 0.22;

    // Optional Skin Glow Aura
    if (this.skinGlow && this.skinGlow !== 'rgba(74, 144, 217, 0)') {
      ctx.save();
      ctx.shadowColor = this.skinGlow;
      ctx.shadowBlur = 12;
      ctx.strokeStyle = this.skinColor;
      ctx.fillStyle = this.skinColor;
      ctx.lineWidth = 3.5;
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

      // Accent dot on head
      ctx.fillStyle = this.skinAccent;
      ctx.beginPath();
      ctx.arc(0, -h * 0.35, headR * 0.38, 0, Math.PI * 2);
      ctx.fill();

      // Hat / Accessories on Glowing Stickman
      this.drawHat(ctx, headR, h);

      ctx.restore();
      return;
    }

    ctx.strokeStyle = this.skinColor || COLORS.player;
    ctx.fillStyle = this.skinColor || COLORS.player;
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
    ctx.fillStyle = this.skinAccent || COLORS.playerAccent;
    ctx.beginPath();
    ctx.arc(0, -h * 0.35, headR * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Hat / Accessories on Standard Stickman
    this.drawHat(ctx, headR, h);
  }

  private drawHat(ctx: CanvasRenderingContext2D, headR: number, h: number): void {
    if (!this.hat) return;

    if (this.hat === 'crown') {
      const crownY = -h * 0.35 - headR - 1;
      ctx.save();
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-headR * 0.9, crownY);
      ctx.lineTo(-headR * 0.9, crownY - 9);
      ctx.lineTo(-headR * 0.45, crownY - 4);
      ctx.lineTo(0, crownY - 11);
      ctx.lineTo(headR * 0.45, crownY - 4);
      ctx.lineTo(headR * 0.9, crownY - 9);
      ctx.lineTo(headR * 0.9, crownY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Jewels on crown
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, crownY - 8, 1.8, 0, Math.PI * 2);
      ctx.arc(-headR * 0.7, crownY - 6.5, 1.4, 0, Math.PI * 2);
      ctx.arc(headR * 0.7, crownY - 6.5, 1.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (this.hat === 'ninja_bandana') {
      const bandY = -h * 0.35 - headR * 0.2;
      ctx.save();
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-headR * 1.05, bandY, headR * 2.1, 4.5);

      // Trailing ribbons behind head
      const wave = Math.sin(this.thrusterAnim * 0.5) * 4;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(headR * 0.9, bandY + 2);
      ctx.quadraticCurveTo(headR * 1.5, bandY + 4 + wave, headR * 2.0, bandY + 8 - wave);
      ctx.moveTo(headR * 0.9, bandY + 2);
      ctx.quadraticCurveTo(headR * 1.4, bandY + 8 - wave, headR * 1.9, bandY + 14 + wave);
      ctx.stroke();
      ctx.restore();
    } else if (this.hat === 'visor') {
      const visorY = -h * 0.35 - 1;
      ctx.save();
      ctx.fillStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(-headR * 1.05, visorY, headR * 2.1, 5, 2.5);
      ctx.fill();
      ctx.restore();
    } else if (this.hat === 'viking_horns') {
      const hornY = -h * 0.35 - headR * 0.3;
      ctx.save();
      // Horn helmet band
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-headR * 1.05, hornY, headR * 2.1, 4);
      // Left horn
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-headR * 0.9, hornY + 2);
      ctx.quadraticCurveTo(-headR * 1.6, hornY - 6, -headR * 1.4, hornY - 14);
      ctx.stroke();
      // Right horn
      ctx.beginPath();
      ctx.moveTo(headR * 0.9, hornY + 2);
      ctx.quadraticCurveTo(headR * 1.6, hornY - 6, headR * 1.4, hornY - 14);
      ctx.stroke();
      ctx.restore();
    } else if (this.hat === 'diver_goggles') {
      const goggleY = -h * 0.35 - 1;
      ctx.save();
      ctx.fillStyle = '#06b6d4';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(-headR * 0.45, goggleY, headR * 0.4, 0, Math.PI * 2);
      ctx.arc(headR * 0.45, goggleY, headR * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Snorkel tube
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(headR * 0.9, goggleY);
      ctx.lineTo(headR * 1.25, goggleY - 10);
      ctx.stroke();
      ctx.restore();
    } else if (this.hat === 'astronaut_dome') {
      const headCenterY = -h * 0.35;
      ctx.save();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, headCenterY, headR * 1.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Visor reflection shine
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, headCenterY, headR * 1.05, -Math.PI * 0.7, -Math.PI * 0.3);
      ctx.stroke();
      ctx.restore();
    } else if (this.hat === 'pharaoh_nemes') {
      const nemesY = -h * 0.35 - headR;
      ctx.save();
      ctx.fillStyle = '#eab308';
      ctx.strokeStyle = '#1e3a8a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-headR * 1.3, nemesY + headR * 1.8);
      ctx.lineTo(-headR * 0.9, nemesY);
      ctx.lineTo(headR * 0.9, nemesY);
      ctx.lineTo(headR * 1.3, nemesY + headR * 1.8);
      ctx.lineTo(headR * 0.8, nemesY + headR * 1.8);
      ctx.lineTo(0, nemesY + headR * 0.5);
      ctx.lineTo(-headR * 0.8, nemesY + headR * 1.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Golden Uraeus cobra on forehead
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, nemesY + 1, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (this.hat === 'dragon_horns') {
      const hornY = -h * 0.35 - headR * 0.3;
      ctx.save();
      ctx.strokeStyle = '#f59e0b';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 6;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      // Left sharp curved horn
      ctx.beginPath();
      ctx.moveTo(-headR * 0.7, hornY);
      ctx.quadraticCurveTo(-headR * 1.8, hornY - 8, -headR * 1.3, hornY - 16);
      ctx.stroke();
      // Right sharp curved horn
      ctx.beginPath();
      ctx.moveTo(headR * 0.7, hornY);
      ctx.quadraticCurveTo(headR * 1.8, hornY - 8, headR * 1.3, hornY - 16);
      ctx.stroke();
      ctx.restore();
    } else if (this.hat === 'knight_helmet') {
      const helmY = -h * 0.35 - headR * 0.7;
      ctx.save();
      ctx.fillStyle = '#64748b';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.fillRect(-headR * 1.1, helmY, headR * 2.2, headR * 1.6);
      // Visor slit
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-headR * 0.85, -h * 0.35 - 2, headR * 1.7, 4);
      // Red plume on top
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, helmY - 2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (this.hat === 'vampire_cape') {
      ctx.save();
      const wave = Math.sin(this.thrusterAnim * 0.4) * 3;
      ctx.fillStyle = '#7f1d1d';
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-headR * 1.1, -h * 0.15);
      ctx.lineTo(-headR * 1.8, h * 0.35 + wave);
      ctx.lineTo(-headR * 0.4, h * 0.2);
      ctx.lineTo(headR * 0.4, h * 0.2);
      ctx.lineTo(headR * 1.8, h * 0.35 - wave);
      ctx.lineTo(headR * 1.1, -h * 0.15);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (this.hat === 'halo') {
      const haloY = -h * 0.35 - headR - 8;
      ctx.save();
      ctx.strokeStyle = '#fde047';
      ctx.shadowColor = '#fde047';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, haloY, headR * 1.1, headR * 0.38, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
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
    this.hasShield = false;
    this.shieldTimer = 0;
    this.hasJetpack = false;
    this.jetpackTimer = 0;
    this.hasMagnet = false;
    this.magnetTimer = 0;
    this.hasMultiplier = false;
    this.multiplierTimer = 0;
  }
}
