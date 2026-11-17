import type { Platform } from './Platform';

export class ArrowPickup {
  x: number;
  y: number;
  vx: number;
  vy: number;
  count: number;
  radius = 16;
  private age = 0;
  /** The bundle cannot be picked up for a short moment after it is tossed. */
  get canCollect(): boolean {
    return this.age > 0.4;
  }
  collected = false;
  private landedOn: Platform | null = null;
  private localOffsetX = 0;
  private animTimer = Math.random() * Math.PI * 2;

  constructor(x: number, y: number, count: number, vx: number, vy: number) {
    this.x = x;
    this.y = y;
    this.count = count;
    this.vx = vx;
    this.vy = vy;
  }

  update(dt: number, platforms: Platform[]): void {
    if (this.collected) return;
    this.animTimer += dt * 3;
    this.age += dt;

    if (this.landedOn) {
      if (this.landedOn.isSolid()) {
        this.x = this.landedOn.x + this.localOffsetX;
        this.y = this.landedOn.y - 7;
        return;
      }
      this.landedOn = null;
      this.vy = 0;
    }

    const prevY = this.y;
    this.vy = Math.min(this.vy + 1400 * dt, 900);
    this.vx *= Math.max(0, 1 - 2.5 * dt);
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.vy > 0) {
      for (const p of platforms) {
        if (!p.isSolid()) continue;
        const withinX = this.x >= p.x - 4 && this.x <= p.x + p.width + 4;
        if (withinX && prevY + 7 <= p.y + 2 && this.y + 7 >= p.y) {
          this.landedOn = p;
          this.localOffsetX = this.x - p.x;
          this.y = p.y - 7;
          this.vx = 0;
          this.vy = 0;
          break;
        }
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, screenX: number, screenY: number): void {
    if (this.collected) return;
    const bob = this.landedOn ? Math.sin(this.animTimer) * 2 : 0;
    ctx.save();
    ctx.translate(screenX, screenY + bob);
    if (!this.landedOn) ctx.rotate(this.animTimer);
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      ctx.strokeStyle = '#d6b88a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, i * 3);
      ctx.lineTo(10, i * 3);
      ctx.stroke();
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(10, i * 3 - 2);
      ctx.lineTo(15, i * 3);
      ctx.lineTo(10, i * 3 + 2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-2, -6);
    ctx.lineTo(-2, 6);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('x' + this.count, screenX, screenY - 14);
  }
}
