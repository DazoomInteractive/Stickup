// ============================================================
// Sky Jumper - Arrow Projectile
// Fired by Archer Elves. Moves horizontally across the screen.
// Can be dodged or shielded!
// ============================================================

export class Arrow {
  x: number;
  y: number;
  vx: number;
  active = true;
  radius = 6;
  width = 24;
  height = 8;

  constructor(x: number, y: number, dir: number) {
    this.x = x;
    this.y = y;
    this.vx = dir * 280; // 280 px/s fast arrow
  }

  update(dt: number): void {
    this.x += this.vx * dt;
    if (this.x < -100 || this.x > 600) {
      this.active = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D, screenX: number, screenY: number): void {
    if (!this.active) return;
    ctx.save();
    ctx.translate(screenX, screenY);
    if (this.vx < 0) {
      ctx.scale(-1, 1);
    }

    // Wooden shaft
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(12, 0);
    ctx.stroke();

    // Arrowhead (silver / neon tip)
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(12, -4);
    ctx.lineTo(18, 0);
    ctx.lineTo(12, 4);
    ctx.closePath();
    ctx.fill();

    // Fletching feathers
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(-16, -3);
    ctx.lineTo(-14, 0);
    ctx.lineTo(-16, 3);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
