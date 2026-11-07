// ============================================================
// Sky Jumper - Arrow Projectile
// Fired by Archer Elves (or Player).
// Moves in any aimed 360-degree direction with rotation.
// ============================================================

export class Arrow {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  active = true;
  radius = 7;
  width = 24;
  height = 8;
  isPlayerArrow = false;

  constructor(x: number, y: number, vx: number, vy: number = 0, isPlayerArrow: boolean = false) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.angle = Math.atan2(vy, vx);
    this.isPlayerArrow = isPlayerArrow;
  }

  update(dt: number): void {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.x < -150 || this.x > 650) {
      this.active = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D, screenX: number, screenY: number): void {
    if (!this.active) return;
    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(this.angle);

    // Glow trail
    ctx.strokeStyle = this.isPlayerArrow ? 'rgba(56, 189, 248, 0.4)' : 'rgba(239, 68, 68, 0.3)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(12, 0);
    ctx.stroke();

    // Wooden / Crystal shaft
    ctx.strokeStyle = this.isPlayerArrow ? '#0284c7' : '#78350f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(12, 0);
    ctx.stroke();

    // Arrowhead (silver / luminous tip)
    ctx.fillStyle = this.isPlayerArrow ? '#38bdf8' : '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(12, -4.5);
    ctx.lineTo(18, 0);
    ctx.lineTo(12, 4.5);
    ctx.closePath();
    ctx.fill();

    // Fletching feathers
    ctx.fillStyle = this.isPlayerArrow ? '#67e8f9' : '#ef4444';
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(-16, -3.5);
    ctx.lineTo(-14, 0);
    ctx.lineTo(-16, 3.5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
