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

// ============================================================
// Sky Jumper - Heart Pickup Item (❤️ Jon/Salomatlik)
// Collectible floating ruby heart that restores +1 heart (up to 3).
// Shimmers with glowing red aura, bobbing and pulse animation.
// ============================================================
export class HeartPickup {
  x: number;
  y: number; // world Y
  radius = 15;
  collected = false;
  private platform: Platform | null;
  private localOffsetX: number;
  private animTimer: number;

  constructor(x: number, y: number, platform: Platform | null = null) {
    this.x = x;
    this.y = y;
    this.platform = platform;
    this.localOffsetX = platform ? x - platform.x : 0;
    this.animTimer = Math.random() * Math.PI * 2;
  }

  update(dt: number): void {
    if (this.collected) return;
    this.animTimer += dt * 3.5;

    // Follow moving platform
    if (this.platform) {
      this.x = this.platform.x + this.localOffsetX;
    }
  }

  draw(ctx: CanvasRenderingContext2D, screenX: number, screenY: number): void {
    if (this.collected) return;

    // Floating vertical bobbing
    const bobOffset = Math.sin(this.animTimer) * 5;
    const sy = screenY + bobOffset;
    const pulse = 1 + Math.sin(this.animTimer * 2) * 0.08;

    ctx.save();
    ctx.translate(screenX, sy);
    ctx.scale(pulse, pulse);

    // 1. Glowing outer crimson aura
    const aura = ctx.createRadialGradient(0, 0, 2, 0, 0, this.radius * 1.8);
    aura.addColorStop(0, 'rgba(239, 68, 68, 0.7)');
    aura.addColorStop(0.5, 'rgba(244, 63, 94, 0.3)');
    aura.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // 2. Vector Heart Shape
    ctx.beginPath();
    const d = 11;
    ctx.moveTo(0, d * 0.45);
    ctx.bezierCurveTo(-d * 0.8, -d * 0.5, -d * 1.5, d * 0.35, 0, d * 1.4);
    ctx.bezierCurveTo(d * 1.5, d * 0.35, d * 0.8, -d * 0.5, 0, d * 0.45);
    ctx.closePath();

    // Vibrant Red to Crimson Ruby gradient
    const heartGrad = ctx.createLinearGradient(-d, -d, d, d);
    heartGrad.addColorStop(0, '#fca5a5'); // Light pinkish-white specular
    heartGrad.addColorStop(0.3, '#ef4444'); // Vivid red
    heartGrad.addColorStop(1, '#991b1b'); // Deep crimson
    ctx.fillStyle = heartGrad;
    ctx.fill();

    // Crisp bright white border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // 3. Specular gloss reflection highlight on top-left lobe
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.beginPath();
    ctx.ellipse(-d * 0.45, 0, d * 0.35, d * 0.2, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // 4. Center cross sparkle
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, d * 0.1);
    ctx.lineTo(0, d * 0.7);
    ctx.moveTo(-d * 0.3, d * 0.4);
    ctx.lineTo(d * 0.3, d * 0.4);
    ctx.stroke();

    ctx.restore();
  }
}
