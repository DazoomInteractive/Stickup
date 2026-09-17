// ============================================================
// Sky Jumper - Falling Hazard (Adrenaline Rock / Meteorite)
// Drops from above with an advance warning indicator (!)
// Fair, balanced, dynamic and brings real adrenaline!
// ============================================================

export class FallingHazard {
  x: number;
  y: number; // World Y
  radius = 16;
  vy = 420; // Fall speed px/s
  active = true;
  warningTimer = 0.9; // 0.9s fair warning at top of screen before rock plunges
  hasWarned = false;
  private rotation = 0;

  constructor(x: number, startY: number) {
    this.x = x;
    this.y = startY;
  }

  update(dt: number): void {
    if (this.warningTimer > 0) {
      this.warningTimer -= dt;
      return;
    }

    this.rotation += dt * 5;
    this.y += this.vy * dt;
  }

  draw(ctx: CanvasRenderingContext2D, screenX: number, screenY: number, _cameraY?: number): void {
    if (!this.active) return;

    // Show warning sign at top of viewport if hazard is still waiting above
    if (this.warningTimer > 0) {
      const pulse = Math.sin(Date.now() * 0.015) * 0.2 + 0.8;
      ctx.save();
      ctx.translate(screenX, 55);
      ctx.scale(pulse, pulse);

      // Warning marker
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 16px Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚠️', 0, 0);

      ctx.restore();
      return;
    }

    // Draw Falling Rock
    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(this.rotation);

    // Fiery tail / trail
    const grad = ctx.createRadialGradient(0, -this.radius, 2, 0, -this.radius * 2, this.radius * 2.5);
    grad.addColorStop(0, 'rgba(239, 68, 68, 0.7)');
    grad.addColorStop(1, 'rgba(249, 115, 22, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, -this.radius, this.radius * 2, 0, Math.PI * 2);
    ctx.fill();

    // Solid jagged rock body
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(-14, -12);
    ctx.lineTo(8, -16);
    ctx.lineTo(16, 0);
    ctx.lineTo(10, 15);
    ctx.lineTo(-8, 14);
    ctx.lineTo(-16, 4);
    ctx.closePath();
    ctx.fill();

    // Highlight edge
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Glowing core
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(2, 2, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
