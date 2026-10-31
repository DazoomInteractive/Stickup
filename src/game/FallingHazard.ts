// ============================================================
// Sky Jumper - Falling Hazard (Adrenaline Rock / Meteorite)
// Drops from above with an advance warning indicator (!)
// Fair, balanced, dynamic and brings real adrenaline!
// ============================================================

export class FallingHazard {
  x: number;
  y: number; // World Y
  radius = 18;
  vy = 520; // Fall speed px/s
  active = true;
  warningTimer = 1.0; // 1.0s fair warning at top of screen before rock plunges
  hasWarned = false;
  private rotation = 0;

  constructor(x: number, startY: number) {
    this.x = x;
    this.y = startY;
  }

  update(dt: number, cameraY?: number): void {
    if (this.warningTimer > 0) {
      this.warningTimer -= dt;
      // Keep rock just above camera while warning is displayed
      if (cameraY !== undefined) {
        this.y = cameraY - 40;
      }
      return;
    }
    this.rotation += dt * 6.5;
    this.y += this.vy * dt;
  }

  draw(ctx: CanvasRenderingContext2D, screenX: number, screenY: number): void {
    if (!this.active) return;

    // Show warning sign at top of viewport if hazard is still waiting above
    if (this.warningTimer > 0) {
      const pulse = Math.sin(Date.now() * 0.015) * 0.2 + 0.9;
      ctx.save();

      // Danger column guideline
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(screenX, 75);
      ctx.lineTo(screenX, 400);
      ctx.stroke();
      ctx.setLineDash([]);

      // Warning marker at top
      ctx.translate(screenX, 55);
      ctx.scale(pulse, pulse);

      // Outer glowing warning halo
      ctx.shadowColor = 'rgba(239, 68, 68, 0.85)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();

      // Sharp white border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Exclamation / Danger icon
      ctx.shadowBlur = 0;
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

    // Fiery smoke tail / trail
    const grad = ctx.createRadialGradient(0, -this.radius, 2, 0, -this.radius * 2, this.radius * 2.5);
    grad.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
    grad.addColorStop(0.5, 'rgba(249, 115, 22, 0.5)');
    grad.addColorStop(1, 'rgba(249, 115, 22, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, -this.radius * 1.2, this.radius * 2, 0, Math.PI * 2);
    ctx.fill();

    // Solid jagged rock body
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(-15, -13);
    ctx.lineTo(9, -17);
    ctx.lineTo(17, 0);
    ctx.lineTo(11, 16);
    ctx.lineTo(-9, 15);
    ctx.lineTo(-17, 4);
    ctx.closePath();
    ctx.fill();

    // Highlight edge
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Glowing magma fissure / core
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(2, 2, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // Magma crack lines
    ctx.strokeStyle = '#fdba74';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(2, 2);
    ctx.lineTo(-8, -4);
    ctx.moveTo(2, 2);
    ctx.lineTo(10, 8);
    ctx.stroke();

    ctx.restore();
  }
}
