// ============================================================
// Sky Jumper - Platform Monsters
// Patrols platform horizontally.
// - Stomping from above rewards extra coins (+5 🪙) and a high bounce!
// - Touching from side/bottom breaks shield or ends run.
// ============================================================

import type { Platform } from './Platform';

export type EnemyType = 'slime' | 'goblin';

export class Enemy {
  platform: Platform;
  x: number;
  y: number;
  width = 32;
  height = 30;
  vx = 55; // Patrol speed px/s
  baseVx = 55;
  active = true;
  type: EnemyType;
  facing = 1;
  private animTimer = 0;

  constructor(platform: Platform) {
    this.platform = platform;
    this.x = platform.x + platform.width / 2;
    this.y = platform.y - 15;
    this.type = Math.random() < 0.5 ? 'slime' : 'goblin';
    this.baseVx = this.type === 'goblin' ? 65 : 45;
    this.vx = Math.random() > 0.5 ? this.baseVx : -this.baseVx;
    this.facing = this.vx > 0 ? 1 : -1;
  }

  update(dt: number): void {
    if (!this.active) return;
    this.animTimer += dt * 7;

    this.x += this.vx * dt;

    // Turn around at platform edges
    const minX = this.platform.x + this.width / 2;
    const maxX = this.platform.x + this.platform.width - this.width / 2;

    if (this.x < minX) {
      this.x = minX;
      this.vx = Math.abs(this.vx);
      this.facing = 1;
    } else if (this.x > maxX) {
      this.x = maxX;
      this.vx = -Math.abs(this.vx);
      this.facing = -1;
    }

    this.y = this.platform.y - 15;
  }

  draw(ctx: CanvasRenderingContext2D, screenX: number, screenY: number): void {
    if (!this.active) return;

    ctx.save();
    ctx.translate(screenX, screenY);

    const squishY = Math.sin(this.animTimer) * 2;
    const dir = this.facing;

    if (this.type === 'slime') {
      // Cute Purple Slime Monster
      ctx.fillStyle = '#9333ea';
      ctx.beginPath();
      ctx.ellipse(0, 4 - squishY, 14, 11 + squishY, 0, 0, Math.PI * 2);
      ctx.fill();

      // Slime Gloss / Highlight
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.ellipse(-4, -1 - squishY, 4, 3, -0.4, 0, Math.PI * 2);
      ctx.fill();

      // Big cute monster eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-5 + dir * 2, 0 - squishY, 3.5, 0, Math.PI * 2);
      ctx.arc(5 + dir * 2, 0 - squishY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Pupils looking towards moving direction
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.arc(-5 + dir * 3.5, 0 - squishY, 1.8, 0, Math.PI * 2);
      ctx.arc(5 + dir * 3.5, 0 - squishY, 1.8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Cheeky Red Flying Imp / Horned Monster
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.roundRect(-12, -12 + squishY, 24, 24, 8);
      ctx.fill();

      // Tiny Horns
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(-9, -12 + squishY);
      ctx.lineTo(-12, -19 + squishY);
      ctx.lineTo(-5, -12 + squishY);
      ctx.moveTo(9, -12 + squishY);
      ctx.lineTo(12, -19 + squishY);
      ctx.lineTo(5, -12 + squishY);
      ctx.fill();

      // Glowing Eyes
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(-4 + dir * 2, -3 + squishY, 3, 0, Math.PI * 2);
      ctx.arc(4 + dir * 2, -3 + squishY, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(-4 + dir * 3, -3 + squishY, 1.5, 0, Math.PI * 2);
      ctx.arc(4 + dir * 3, -3 + squishY, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Cheeky tooth smile
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-3, 4 + squishY);
      ctx.lineTo(0, 7 + squishY);
      ctx.lineTo(3, 4 + squishY);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
}


