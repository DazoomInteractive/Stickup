// ============================================================
// Sky Jumper - Platform Monsters
// Patrols platform horizontally and hunts player.
// - Slime / Goblin: Patrols platform. Stomp rewards +5 🪙 and kills.
// - Zombie: Chases player by jumping across 2–4 platforms!
//   Stomping its head does NOT kill or give coins, but STUNS (1.8s dizzy 💫).
// - Archer Elf: Jumps across 1–4 platforms and shoots 360° aimed arrows
//   towards player (except straight down). Stomping gives NO coins,
//   STUNS (1.8s), and triggers 1 of 3 random events:
//   1) Disarm & Ammo Loot (+2 Arrows)
//   2) Broken Bow (cannot shoot anymore)
//   3) Wild Dizzy Shot (wild stray arrow)
// ============================================================

import type { Platform } from './Platform';
import { Arrow } from './Arrow';

export type EnemyType = 'slime' | 'goblin' | 'zombie' | 'archer';

export class Enemy {
  platform: Platform;
  x: number;
  y: number;
  width = 32;
  height = 32;
  vx = 55; // Patrol speed px/s
  baseVx = 55;
  vy = 0;
  isJumping = false;
  active = true;
  type: EnemyType;
  facing = 1;
  animTimer = 0;

  // Stun Mechanics
  stunTimer = 0; // > 0 means dizzy/stunned, cannot move, shoot or hurt player
  dizzyAngle = 0;

  // Platform Jumping (Zombie & Archer Elf)
  maxChaseJumps = 3;
  chaseJumpsRemaining = 3;
  jumpCooldown = 1.0;

  // Archer Elf Specific
  bowBroken = false;
  shootCooldown = 2.5;
  isAiming = false;
  aimAngle = 0;
  pendingArrows: Arrow[] = [];

  constructor(platform: Platform) {
    this.platform = platform;
    this.x = platform.x + platform.width / 2;
    this.y = platform.y - 16;
    const r = Math.random();
    if (r < 0.32) {
      this.type = 'zombie';
      this.baseVx = 42;
      this.maxChaseJumps = 2 + Math.floor(Math.random() * 3); // 2, 3, or 4 jumps
      this.chaseJumpsRemaining = this.maxChaseJumps;
      this.jumpCooldown = 0.8 + Math.random() * 0.8;
    } else if (r < 0.64) {
      this.type = 'archer';
      this.baseVx = 48;
      this.maxChaseJumps = 1 + Math.floor(Math.random() * 4); // 1 to 4 jumps
      this.chaseJumpsRemaining = this.maxChaseJumps;
      this.jumpCooldown = 1.2 + Math.random() * 0.8;
      this.shootCooldown = 2.2 + Math.random() * 1.2;
    } else if (r < 0.82) {
      this.type = 'slime';
      this.baseVx = 45;
    } else {
      this.type = 'goblin';
      this.baseVx = 65;
    }

    this.vx = Math.random() > 0.5 ? this.baseVx : -this.baseVx;
    this.facing = this.vx > 0 ? 1 : -1;
  }

  update(dt: number, playerX?: number, playerY?: number, platforms?: Platform[]): void {
    if (!this.active) return;

    // Handle Stun State
    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      this.dizzyAngle += dt * 8;
      this.isAiming = false;
      // Stunned: remain on current platform without moving
      if (!this.isJumping) {
        this.y = this.platform.y - 16;
      }
      return;
    }

    this.animTimer += dt * 7;

    // ARCHER ELF AIMING & SHOOTING LOGIC (360° except straight down)
    if (this.type === 'archer' && !this.bowBroken && playerX !== undefined && playerY !== undefined) {
      const dx = playerX - this.x;
      const dy = playerY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Check if target is directly underneath through the platform floor
      const isStraightDown = dy > 30 && Math.abs(dx) < 36;

      if (dist < 420 && !isStraightDown) {
        const targetAngle = Math.atan2(dy, dx);
        this.aimAngle = targetAngle;
        this.facing = dx >= 0 ? 1 : -1;

        this.shootCooldown -= dt;

        // Draw bowstring back for 0.45s before release
        if (this.shootCooldown <= 0.45) {
          this.isAiming = true;
        }

        if (this.shootCooldown <= 0) {
          this.isAiming = false;
          this.shootCooldown = 2.8 + Math.random() * 0.8;

          // Spawn 360° aimed arrow
          const speed = 320;
          const arrowVx = Math.cos(targetAngle) * speed;
          const arrowVy = Math.sin(targetAngle) * speed;
          this.pendingArrows.push(new Arrow(this.x + Math.cos(targetAngle) * 16, this.y + Math.sin(targetAngle) * 16, arrowVx, arrowVy, false));
        }
      } else {
        this.isAiming = false;
        this.shootCooldown = Math.max(0.5, this.shootCooldown - dt * 0.5);
      }
    }

    // JUMP & CHASE LOGIC (Zombie & Archer Elf: 1–4 platforms)
    const canJumpChase = (this.type === 'zombie' || this.type === 'archer') && playerX !== undefined && playerY !== undefined && platforms;

    if (canJumpChase) {
      const dx = playerX! - this.x;
      const dy = playerY! - this.y;
      const distY = Math.abs(dy);
      const distX = Math.abs(dx);

      if (this.isJumping) {
        // In flight arc
        this.vy += 850 * dt; // Gravity
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Check landing on solid platforms when descending
        if (this.vy > 0) {
          for (const plat of platforms!) {
            if (plat.isBroken) continue;
            const feetY = this.y + 16;
            const prevFeetY = feetY - this.vy * dt;
            if (feetY >= plat.y && prevFeetY <= plat.y + 16) {
              if (this.x >= plat.x - 10 && this.x <= plat.x + plat.width + 10) {
                // Landed on new platform!
                this.platform = plat;
                this.y = plat.y - 16;
                this.vy = 0;
                this.isJumping = false;
                this.jumpCooldown = 1.0;
                break;
              }
            }
          }
        }

        // Fallback if jumped and missed completely
        if (this.y > this.platform.y + 260) {
          this.y = this.platform.y - 16;
          this.vy = 0;
          this.isJumping = false;
          this.chaseJumpsRemaining = 0;
        }
        return;
      }

      // Grounded on current platform
      this.y = this.platform.y - 16;

      // Check if player is within chase range
      const canChase = this.chaseJumpsRemaining > 0 && distY < 350 && distX < 290;

      if (canChase) {
        this.facing = dx > 0 ? 1 : -1;
        this.vx = this.facing * (this.type === 'archer' ? 50 : 55);
        this.jumpCooldown -= dt;

        // Check if player is on a different platform height
        const needsJump = distY > 35;

        if (this.jumpCooldown <= 0 && needsJump) {
          // Find next platform towards player
          let targetPlat: Platform | null = null;
          let bestDist = 9999;

          for (const plat of platforms!) {
            if (plat === this.platform || plat.isBroken) continue;
            const pdy = plat.y - this.y;
            const sameVerticalDir = (dy < 0 && pdy < -30 && pdy > -180) || (dy > 0 && pdy > 30 && pdy < 180);
            if (sameVerticalDir) {
              const pdx = (plat.x + plat.width / 2) - this.x;
              const d = Math.sqrt(pdx * pdx + pdy * pdy);
              if (d < bestDist && d < 260) {
                bestDist = d;
                targetPlat = plat;
              }
            }
          }

          if (targetPlat) {
            // Leap towards the target platform!
            this.isJumping = true;
            this.chaseJumpsRemaining--;
            const targetX = targetPlat.x + targetPlat.width / 2;
            const timeToPeak = 0.5;
            this.vy = dy < 0 ? -480 : -240;
            this.vx = Math.max(-130, Math.min(130, (targetX - this.x) / timeToPeak));
            return;
          }
        }
      } else {
        // Normal patrol speed when not chasing
        if (Math.abs(this.vx) > this.baseVx) {
          this.vx = this.facing * this.baseVx;
        }
        // Slowly refresh chase jumps if player is far away
        if (distY > 400 && this.chaseJumpsRemaining < this.maxChaseJumps) {
          this.chaseJumpsRemaining = this.maxChaseJumps;
        }
      }
    }

    // Standard horizontal patrol movement on current platform
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

    this.y = this.platform.y - 16;
  }

  draw(ctx: CanvasRenderingContext2D, screenX: number, screenY: number): void {
    if (!this.active) return;

    ctx.save();
    ctx.translate(screenX, screenY);

    const squishY = Math.sin(this.animTimer) * 2;
    const dir = this.facing;
    const isStunned = this.stunTimer > 0;

    if (this.type === 'archer') {
      // ARCHER ELF (Forest green cloak, pointed ears, wooden recurve bow)
      if (isStunned) {
        ctx.rotate(Math.sin(this.dizzyAngle) * 0.22);
      }

      // Forest green hooded cloak
      ctx.fillStyle = '#166534';
      ctx.beginPath();
      ctx.roundRect(-9, -4 + squishY, 18, 18, [6, 6, 2, 2]);
      ctx.fill();

      // Elf Head (fair skin)
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, -9 + squishY, 9, 0, Math.PI * 2);
      ctx.fill();

      // Green Hood trim over head
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(0, -12 + squishY, 10, Math.PI, 0, false);
      ctx.lineTo(7, -8 + squishY);
      ctx.lineTo(-7, -8 + squishY);
      ctx.closePath();
      ctx.fill();

      // Pointed Elf Ears
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(-8, -10 + squishY);
      ctx.lineTo(-14, -14 + squishY);
      ctx.lineTo(-7, -7 + squishY);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(8, -10 + squishY);
      ctx.lineTo(14, -14 + squishY);
      ctx.lineTo(7, -7 + squishY);
      ctx.fill();

      // Quiver on back with arrows
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-12, -8 + squishY, 5, 12);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-11, -12 + squishY, 2, 4);
      ctx.fillRect(-9, -13 + squishY, 2, 5);

      // Wooden Bow
      if (this.bowBroken) {
        // Broken snapped bow
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(dir * 6, -6);
        ctx.lineTo(dir * 12, -1);
        ctx.moveTo(dir * 7, 2);
        ctx.lineTo(dir * 13, 8);
        ctx.stroke();
      } else {
        // Full Recurve Bow
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        const bowX = dir * 8;
        ctx.arc(bowX, 0 + squishY, 12, -Math.PI * 0.45, Math.PI * 0.45, dir < 0);
        ctx.stroke();

        // Bowstring
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (this.isAiming) {
          // Pulled back bowstring pointing along aimAngle
          const pullX = bowX - Math.cos(this.aimAngle) * 8;
          const pullY = Math.sin(this.aimAngle) * 8;
          ctx.moveTo(bowX, -10 + squishY);
          ctx.lineTo(pullX, pullY);
          ctx.lineTo(bowX, 10 + squishY);

          // Glowing aimed arrow on bow
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.moveTo(pullX, pullY);
          ctx.lineTo(pullX + Math.cos(this.aimAngle) * 20, pullY + Math.sin(this.aimAngle) * 20);
        } else {
          ctx.moveTo(bowX, -10 + squishY);
          ctx.lineTo(bowX, 10 + squishY);
        }
        ctx.stroke();
      }

      if (isStunned) {
        // Dizzy X eyes
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 1.8;
        // Left Eye X
        ctx.beginPath();
        ctx.moveTo(-5 + dir, -11 + squishY);
        ctx.lineTo(-2 + dir, -8 + squishY);
        ctx.moveTo(-2 + dir, -11 + squishY);
        ctx.lineTo(-5 + dir, -8 + squishY);
        // Right Eye X
        ctx.moveTo(2 + dir, -11 + squishY);
        ctx.lineTo(5 + dir, -8 + squishY);
        ctx.moveTo(5 + dir, -11 + squishY);
        ctx.lineTo(2 + dir, -8 + squishY);
        ctx.stroke();

        // 3 Orbiting Stars above elf head
        for (let i = 0; i < 3; i++) {
          const angle = this.dizzyAngle * 3 + (i * Math.PI * 2) / 3;
          const starX = Math.cos(angle) * 15;
          const starY = -23 + Math.sin(angle) * 4.5;
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(starX, starY, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Alert Elf Eyes
        ctx.fillStyle = '#1e3a8a';
        ctx.beginPath();
        ctx.arc(-3 + dir * 1.5, -9 + squishY, 1.8, 0, Math.PI * 2);
        ctx.arc(3 + dir * 1.5, -9 + squishY, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

    } else if (this.type === 'zombie') {
      // Zombie Monster (Green skin, tattered purple tunic, outstretched zombie arms)
      if (isStunned) {
        ctx.rotate(Math.sin(this.dizzyAngle) * 0.25);
      }

      // Tattered clothes / Body
      ctx.fillStyle = '#4c1d95';
      ctx.beginPath();
      ctx.roundRect(-10, -4 + squishY, 20, 18, [4, 4, 2, 2]);
      ctx.fill();

      // Torn cloth hem
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.moveTo(-10, 14 + squishY);
      ctx.lineTo(-6, 11 + squishY);
      ctx.lineTo(-2, 14 + squishY);
      ctx.lineTo(2, 11 + squishY);
      ctx.lineTo(6, 14 + squishY);
      ctx.lineTo(10, 11 + squishY);
      ctx.lineTo(10, 14 + squishY);
      ctx.fill();

      // Zombie Green Head
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(0, -10 + squishY, 11, 0, Math.PI * 2);
      ctx.fill();

      // Scalp stitch / brain scar
      ctx.strokeStyle = '#14532d';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-5, -17 + squishY);
      ctx.lineTo(2, -19 + squishY);
      ctx.moveTo(-2, -20 + squishY);
      ctx.lineTo(-3, -16 + squishY);
      ctx.stroke();

      // Outstretched Zombie Arms
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.roundRect(dir > 0 ? 0 : -16, -2 + squishY, 16, 5, 2);
      ctx.fill();

      if (isStunned) {
        // Dizzy Spiral / X Eyes
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-6 + dir * 2, -12 + squishY);
        ctx.lineTo(-2 + dir * 2, -8 + squishY);
        ctx.moveTo(-2 + dir * 2, -12 + squishY);
        ctx.lineTo(-6 + dir * 2, -8 + squishY);
        ctx.moveTo(2 + dir * 2, -12 + squishY);
        ctx.lineTo(6 + dir * 2, -8 + squishY);
        ctx.moveTo(6 + dir * 2, -12 + squishY);
        ctx.lineTo(2 + dir * 2, -8 + squishY);
        ctx.stroke();

        for (let i = 0; i < 3; i++) {
          const angle = this.dizzyAngle * 3 + (i * Math.PI * 2) / 3;
          const starX = Math.cos(angle) * 16;
          const starY = -24 + Math.sin(angle) * 5;
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(starX, starY, 2.8, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-4 + dir * 2, -10 + squishY, 3, 0, Math.PI * 2);
        ctx.arc(4 + dir * 2, -10 + squishY, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(-4 + dir * 3, -10 + squishY, 1.6, 0, Math.PI * 2);
        ctx.arc(4 + dir * 3, -10 + squishY, 1.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#052e16';
        ctx.beginPath();
        ctx.roundRect(-4 + dir * 2, -4 + squishY, 8, 3, 1);
        ctx.fill();
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-2 + dir * 2, -4 + squishY, 2, 2);
      }

    } else if (this.type === 'slime') {
      ctx.fillStyle = '#9333ea';
      ctx.beginPath();
      ctx.ellipse(0, 4 - squishY, 14, 11 + squishY, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.ellipse(-4, -1 - squishY, 4, 3, -0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-5 + dir * 2, 0 - squishY, 3.5, 0, Math.PI * 2);
      ctx.arc(5 + dir * 2, 0 - squishY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.arc(-5 + dir * 3.5, 0 - squishY, 1.8, 0, Math.PI * 2);
      ctx.arc(5 + dir * 3.5, 0 - squishY, 1.8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.roundRect(-12, -12 + squishY, 24, 24, 8);
      ctx.fill();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(-9, -12 + squishY);
      ctx.lineTo(-12, -19 + squishY);
      ctx.lineTo(-5, -12 + squishY);
      ctx.moveTo(9, -12 + squishY);
      ctx.lineTo(12, -19 + squishY);
      ctx.lineTo(5, -12 + squishY);
      ctx.fill();

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
