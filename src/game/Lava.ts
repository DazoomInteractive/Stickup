// ============================================================
// Sky Jumper - Rising Lava (Lava / Olovli To'lqin)
// Rises steadily from the bottom once the player ascends,
// creating suspense, urgency, and high-energy arcade action.
// ============================================================

import { GAME_WIDTH, GAME_HEIGHT } from './constants';
import type { Camera } from './Camera';
import type { VFX } from './VFX';

export class Lava {
  worldY: number;
  private time = 0;
  private baseSpeed = 75; // px per second
  private emberTimer = 0;

  constructor(initialWorldY: number = GAME_HEIGHT + 350) {
    this.worldY = initialWorldY;
  }

  reset(): void {
    this.worldY = GAME_HEIGHT + 350;
    this.time = 0;
    this.emberTimer = 0;
  }

  update(dt: number, heightMeters: number, cameraY: number, vfx: VFX): void {
    this.time += dt;

    // Grace zone: below 25 meters, lava creeps very gently (30 px/s)
    let currentSpeed = 30;
    if (heightMeters >= 25) {
      // Scales with altitude smoothly, capped safely
      currentSpeed = this.baseSpeed + Math.min(55, (heightMeters - 25) * 0.15);
    }

    // Rise upward (world Y decreases)
    this.worldY -= currentSpeed * dt;

    // Rubber-band clamp: lava never lags more than 1 screen below camera bottom
    const maxLagY = cameraY + GAME_HEIGHT + 220;
    if (this.worldY > maxLagY) {
      this.worldY = maxLagY;
    }

    // Spawn rising fiery embers if lava is within 300px of visible screen
    this.emberTimer += dt;
    if (this.emberTimer > 0.08) {
      this.emberTimer = 0;
      const emberX = Math.random() * GAME_WIDTH;
      vfx.spawnLavaEmber(emberX, this.worldY - Math.random() * 10);
    }
  }

  /**
   * Checks if player has touched or submerged in the lava.
   */
  touches(playerFeetY: number): boolean {
    return playerFeetY >= this.worldY + 4;
  }

  draw(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const screenY = camera.worldToScreenY(this.worldY);

    // If completely off the bottom with generous margin, only draw subtle ambient heat haze
    if (screenY > GAME_HEIGHT + 140) {
      return;
    }

    ctx.save();

    // 1. Ambient bottom heat pulse if lava is near or on screen
    const proximity = Math.max(0, 1 - (screenY - GAME_HEIGHT * 0.5) / (GAME_HEIGHT * 0.7));
    if (proximity > 0) {
      const hazeH = Math.min(180, 80 + proximity * 100);
      const hazeGrad = ctx.createLinearGradient(0, GAME_HEIGHT - hazeH, 0, GAME_HEIGHT);
      hazeGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
      hazeGrad.addColorStop(1, `rgba(239, 68, 68, ${0.18 * proximity})`);
      ctx.fillStyle = hazeGrad;
      ctx.fillRect(0, GAME_HEIGHT - hazeH, GAME_WIDTH, hazeH);
    }

    // 2. Layer 1: Back molten wave (Darker crimson)
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.moveTo(0, GAME_HEIGHT);
    for (let x = 0; x <= GAME_WIDTH; x += 15) {
      const wave = Math.sin(this.time * 2.8 + x * 0.02) * 9;
      ctx.lineTo(x, screenY + wave + 4);
    }
    ctx.lineTo(GAME_WIDTH, GAME_HEIGHT);
    ctx.closePath();
    ctx.fill();

    // 3. Layer 2: Front glowing lava wave (Bright fiery gradient)
    const lavaGrad = ctx.createLinearGradient(0, screenY - 10, 0, Math.max(GAME_HEIGHT, screenY + 80));
    lavaGrad.addColorStop(0, '#fef08a'); // White-hot crest
    lavaGrad.addColorStop(0.12, '#fb923c'); // Vivid orange
    lavaGrad.addColorStop(0.35, '#ea580c'); // Molten fiery red
    lavaGrad.addColorStop(1.0, '#7f1d1d'); // Deep dark magma

    ctx.shadowColor = 'rgba(249, 115, 22, 0.85)';
    ctx.shadowBlur = 16;
    ctx.fillStyle = lavaGrad;

    ctx.beginPath();
    ctx.moveTo(0, GAME_HEIGHT);
    for (let x = 0; x <= GAME_WIDTH; x += 12) {
      const wave = Math.sin(this.time * 3.8 + x * 0.028 + 1.2) * 8;
      ctx.lineTo(x, screenY + wave);
    }
    ctx.lineTo(GAME_WIDTH, GAME_HEIGHT);
    ctx.closePath();
    ctx.fill();

    // 4. White-hot surface rim line
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let x = 0; x <= GAME_WIDTH; x += 12) {
      const wave = Math.sin(this.time * 3.8 + x * 0.028 + 1.2) * 8;
      if (x === 0) ctx.moveTo(x, screenY + wave);
      else ctx.lineTo(x, screenY + wave);
    }
    ctx.stroke();

    // 5. Danger Warning Pill if lava is aggressively close to screen view
    if (screenY < GAME_HEIGHT - 30 && screenY > GAME_HEIGHT - 220) {
      this.drawWarningBadge(ctx, screenY);
    }

    ctx.restore();
  }

  private drawWarningBadge(ctx: CanvasRenderingContext2D, screenY: number): void {
    const pulse = 0.8 + Math.sin(this.time * 8) * 0.2;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fef08a';
    ctx.font = '900 12px Roboto, sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 4;
    ctx.fillText('🔥 LAVA IS RISING! 🔥', GAME_WIDTH / 2, Math.max(30, screenY - 18));
    ctx.restore();
  }
}
