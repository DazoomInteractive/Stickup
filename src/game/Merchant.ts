// ============================================================
// Sky Jumper - Merchant (Real-Time Dynamic Trader)
// Appears on platforms during the run.
// Offers 5 random market prices for Diamonds (💎 Olmoslar).
// Trading happens in REAL TIME without pausing the game!
// ============================================================

import type { Platform } from './Platform';

// 5 Market Price Tiers for Diamonds (Coins per Diamond)
// 15, 30, 55, 90, 160 coins per 💎
export const MERCHANT_PRICE_TIERS = [15, 30, 55, 90, 160] as const;

export class Merchant {
  platform: Platform;
  x: number;
  y: number;
  width = 54;
  height = 58;
  pricePerRelic: number; // Selected from 5 random tiers
  sold = false;
  timer = 16; // Time in seconds before merchant departs
  active = true;
  tierIndex = 0;
  private animTimer = 0;

  constructor(platform: Platform) {
    this.platform = platform;
    this.x = platform.x + platform.width / 2;
    this.y = platform.y - 29;
    
    // Weighted random selection of 5 market tiers:
    // Tier 1 (15 coins): 35% chance (Oddiy)
    // Tier 2 (30 coins): 30% chance (O'rtacha)
    // Tier 3 (55 coins): 20% chance (Saxiy)
    // Tier 4 (90 coins): 10% chance (Boy)
    // Tier 5 (160 coins): 5% chance (Afsonaviy Jackpot!)
    const roll = Math.random();
    if (roll < 0.35) {
      this.pricePerRelic = 15;
      this.tierIndex = 0;
    } else if (roll < 0.65) {
      this.pricePerRelic = 30;
      this.tierIndex = 1;
    } else if (roll < 0.85) {
      this.pricePerRelic = 55;
      this.tierIndex = 2;
    } else if (roll < 0.95) {
      this.pricePerRelic = 90;
      this.tierIndex = 3;
    } else {
      this.pricePerRelic = 160;
      this.tierIndex = 4;
    }
  }

  update(dt: number): void {
    this.animTimer += dt * 4;
    this.timer -= dt;
    if (this.timer <= 0) {
      this.active = false;
    }

    // Follow moving platforms
    this.x = this.platform.x + this.platform.width / 2;
    this.y = this.platform.y - 29;
  }

  draw(ctx: CanvasRenderingContext2D, screenX: number, screenY: number): void {
    if (!this.active) return;

    ctx.save();
    ctx.translate(screenX, screenY);

    const bobY = Math.sin(this.animTimer) * 2.5;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 24, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Merchant Cloak & Body
    ctx.fillStyle = this.tierIndex >= 3 ? '#b45309' : '#6d28d9'; // Mystic or Gold robe
    ctx.beginPath();
    ctx.moveTo(-18, 22 + bobY);
    ctx.lineTo(18, 22 + bobY);
    ctx.lineTo(14, -8 + bobY);
    ctx.lineTo(-14, -8 + bobY);
    ctx.closePath();
    ctx.fill();

    // Gold trim on robe
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Hood / Head
    ctx.fillStyle = this.tierIndex >= 3 ? '#78350f' : '#4c1d95';
    ctx.beginPath();
    ctx.arc(0, -12 + bobY, 14, 0, Math.PI * 2);
    ctx.fill();

    // Glowing Trader Eyes (Curious look)
    ctx.fillStyle = this.tierIndex === 4 ? '#fde047' : '#38bdf8';
    ctx.beginPath();
    ctx.arc(-4, -13 + bobY, 2.5, 0, Math.PI * 2);
    ctx.arc(4, -13 + bobY, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Big Backpack / Cargo of treasures
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.roundRect(-24, -6 + bobY, 10, 24, 4);
    ctx.fill();
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.roundRect(-23, -4 + bobY, 8, 8, 2);
    ctx.fill();

    // Market Price Floating Tag
    const tagWidth = 96;
    const tagHeight = 28;
    const tagY = -50 + bobY;

    // Glowing background based on tier
    let tagColor = '#1e293b';
    let borderColor = '#94a3b8';
    if (this.tierIndex === 4) {
      borderColor = '#e11d48'; // Legendary Crimson/Gold
      tagColor = '#881337';
    } else if (this.tierIndex === 3) {
      borderColor = '#f59e0b'; // Gold
      tagColor = '#78350f';
    } else if (this.tierIndex === 2) {
      borderColor = '#10b981'; // Emerald
      tagColor = '#064e3b';
    }

    ctx.fillStyle = tagColor;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-tagWidth / 2, tagY, tagWidth, tagHeight, 8);
    ctx.fill();
    ctx.stroke();

    // Price text
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 13px Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`💎 1 = ${this.pricePerRelic} 🪙`, 0, tagY + tagHeight / 2);

    // Quick Sell Prompt / Hint
    if (!this.sold) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 11px Roboto, sans-serif';
      ctx.fillText('⚡ TOUCH TO SELL', 0, tagY - 10);
    } else {
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 11px Roboto, sans-serif';
      ctx.fillText('✓ SOLD!', 0, tagY - 10);
    }

    ctx.restore();
  }
}
