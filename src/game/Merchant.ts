// ============================================================
// Sky Jumper - Merchant (Real-Time Dynamic Trader)
// Appears on platforms during the run.
// Offers 5 random market prices for Diamonds (💎 Olmoslar).
// OR rarely (12% chance) a Mystery Shard Trader offering
// Background/Skin Shards for 50-100 Diamonds!
// Trading happens in REAL TIME without pausing the game!
// ============================================================

import type { Platform } from './Platform';

// 5 Market Price Tiers for Diamonds (Coins per Diamond)
// 15, 30, 55, 90, 160 coins per 💎
export const MERCHANT_PRICE_TIERS = [15, 30, 55, 90, 160] as const;

export interface ShardOffer {
  type: 'background' | 'skin';
  id: string;
  name: string;
  icon: string;
  requiredDiamonds: number;
  shardsGiven: number;
}

export const SHARD_OFFERS: ShardOffer[] = [
  // 5 Special Backgrounds
  { type: 'background', id: 'cyberpunk_city', name: 'Cyber Megacity', icon: '🏙️', requiredDiamonds: 50, shardsGiven: 2 },
  { type: 'background', id: 'arctic_aurora', name: 'Arctic Aurora', icon: '🌌', requiredDiamonds: 60, shardsGiven: 2 },
  { type: 'background', id: 'blood_moon', name: 'Blood Moon', icon: '🌕', requiredDiamonds: 75, shardsGiven: 1 },
  { type: 'background', id: 'mars_planet', name: 'Mars Surface', icon: '🪐', requiredDiamonds: 90, shardsGiven: 1 },
  { type: 'background', id: 'cosmic_space', name: 'Cosmic Space', icon: '🚀', requiredDiamonds: 100, shardsGiven: 1 },
  // 5 Special Skins
  { type: 'skin', id: 'cyber_neon', name: 'Cyber Neon', icon: '🤖', requiredDiamonds: 50, shardsGiven: 2 },
  { type: 'skin', id: 'royal_knight', name: 'Royal Knight', icon: '🛡️', requiredDiamonds: 60, shardsGiven: 2 },
  { type: 'skin', id: 'astronaut', name: 'Astronaut', icon: '🧑‍🚀', requiredDiamonds: 75, shardsGiven: 1 },
  { type: 'skin', id: 'dragon_king', name: 'Dragon King', icon: '🐉', requiredDiamonds: 90, shardsGiven: 1 },
  { type: 'skin', id: 'cosmic_god', name: 'Cosmic Entity', icon: '🌌', requiredDiamonds: 100, shardsGiven: 1 },
];

export class Merchant {
  platform: Platform;
  x: number;
  y: number;
  width = 54;
  height = 58;
  pricePerRelic: number; // Selected from 5 random tiers
  sold = false;
  timer = 18; // Time in seconds before merchant departs
  active = true;
  tierIndex = 0;
  isShardMerchant = false;
  shardOffer: ShardOffer | null = null;
  private animTimer = 0;

  constructor(platform: Platform, availableOffers: ShardOffer[] = SHARD_OFFERS) {
    this.platform = platform;
    this.x = platform.x + platform.width / 2;
    this.y = platform.y - 29;

    // 12% chance to be a Rare Mystery Shard Trader ("Kamdan-kam taklif")
    if (availableOffers.length > 0 && Math.random() < 0.12) {
      this.isShardMerchant = true;
      const pick = availableOffers[Math.floor(Math.random() * availableOffers.length)];
      this.shardOffer = pick;
      this.pricePerRelic = 0;
      this.tierIndex = 5; // Special shard tier
    } else {
      // Normal Diamond -> Coins Trader
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

    // Outer magical aura for Shard Trader
    if (this.isShardMerchant) {
      const aura = ctx.createRadialGradient(0, 0, 8, 0, 0, 38);
      aura.addColorStop(0, 'rgba(168, 85, 247, 0.45)');
      aura.addColorStop(0.6, 'rgba(236, 72, 153, 0.25)');
      aura.addColorStop(1, 'rgba(168, 85, 247, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 5 + bobY, 38, 0, Math.PI * 2);
      ctx.fill();
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 24, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Merchant Cloak & Body
    if (this.isShardMerchant) {
      ctx.fillStyle = '#4c0519'; // Mystical dark crimson / violet robe
    } else {
      ctx.fillStyle = this.tierIndex >= 3 ? '#b45309' : '#6d28d9'; // Mystic or Gold robe
    }
    ctx.beginPath();
    ctx.moveTo(-18, 22 + bobY);
    ctx.lineTo(18, 22 + bobY);
    ctx.lineTo(14, -8 + bobY);
    ctx.lineTo(-14, -8 + bobY);
    ctx.closePath();
    ctx.fill();

    // Trim on robe
    ctx.strokeStyle = this.isShardMerchant ? '#ec4899' : '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Hood / Head
    ctx.fillStyle = this.isShardMerchant ? '#831843' : (this.tierIndex >= 3 ? '#78350f' : '#4c1d95');
    ctx.beginPath();
    ctx.arc(0, -12 + bobY, 14, 0, Math.PI * 2);
    ctx.fill();

    // Glowing Trader Eyes (Curious look)
    ctx.fillStyle = this.isShardMerchant ? '#38bdf8' : (this.tierIndex === 4 ? '#fde047' : '#38bdf8');
    ctx.beginPath();
    ctx.arc(-4, -13 + bobY, 2.5, 0, Math.PI * 2);
    ctx.arc(4, -13 + bobY, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Big Backpack / Cargo of treasures
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.roundRect(-24, -6 + bobY, 10, 24, 4);
    ctx.fill();
    ctx.fillStyle = this.isShardMerchant ? '#a855f7' : '#b45309';
    ctx.beginPath();
    ctx.roundRect(-23, -4 + bobY, 8, 8, 2);
    ctx.fill();

    // Market Price Floating Tag
    const tagWidth = this.isShardMerchant ? 122 : 96;
    const tagHeight = this.isShardMerchant ? 34 : 28;
    const tagY = (this.isShardMerchant ? -56 : -50) + bobY;

    // Glowing background based on tier
    let tagColor = '#1e293b';
    let borderColor = '#94a3b8';

    if (this.isShardMerchant) {
      borderColor = '#ec4899'; // Shard Pink
      tagColor = '#500724';
    } else if (this.tierIndex === 4) {
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

    // Tag text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (this.isShardMerchant && this.shardOffer) {
      // Shard Tag
      ctx.fillStyle = '#fbcfe8';
      ctx.font = 'bold 10px Roboto, sans-serif';
      ctx.fillText(`🧩 ${this.shardOffer.icon} ${this.shardOffer.name.slice(0, 11)}`, 0, tagY + 9);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 12px Roboto, sans-serif';
      ctx.fillText(`💎 ${this.shardOffer.requiredDiamonds} = +${this.shardOffer.shardsGiven} 🧩`, 0, tagY + 23);
    } else {
      // Normal Price text
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 13px Roboto, sans-serif';
      ctx.fillText(`💎 1 = ${this.pricePerRelic} 🪙`, 0, tagY + tagHeight / 2);
    }

    // Quick Sell Prompt / Hint
    if (!this.sold) {
      ctx.fillStyle = this.isShardMerchant ? '#f472b6' : '#fbbf24';
      ctx.font = 'bold 11px Roboto, sans-serif';
      ctx.fillText(this.isShardMerchant ? '✨ TOUCH TO GET SHARD!' : '⚡ TOUCH TO SELL', 0, tagY - 10);
    } else {
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 11px Roboto, sans-serif';
      ctx.fillText('✓ DEALT!', 0, tagY - 10);
    }

    ctx.restore();
  }
}
