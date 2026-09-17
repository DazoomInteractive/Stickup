// ============================================================
// Sky Jumper - Upgrades, Trails, Skins & Backgrounds Manager
// Comprehensive progression economy:
// - 10-Level Upgrades with +0.25s incremental boost per level
// - 21 Collectible Character Skins with custom accessories & auras
// - 21 Dynamic Jump Trails with unique particle effects
// - 20 Atmospheric Sky Backgrounds from Dawn to Deep Space
// ============================================================

export interface UpgradeInfo {
  id: 'magnet' | 'jetpack' | 'shield' | 'coin_multiplier';
  name: string;
  icon: string;
  level: number;
  maxLevel: number;
  currentBonus: string;
  nextBonus: string;
  cost: number;
}

export interface TrailItem {
  id: string;
  name: string;
  icon: string;
  desc: string;
  cost: number;
  previewColor: string;
}

export interface SkinItem {
  id: string;
  name: string;
  icon: string;
  desc: string;
  cost: number;
  color: string;
  accent: string;
  glow: string;
  hasHat?: 'crown' | 'ninja_bandana' | 'visor' | 'viking_horns' | 'diver_goggles' | 'astronaut_dome' | 'pharaoh_nemes' | 'dragon_horns' | 'knight_helmet' | 'vampire_cape' | 'halo';
}

export interface BackgroundItem {
  id: string;
  name: string;
  icon: string;
  desc: string;
  cost: number;
  topColor: string;
  midColor: string;
  botColor: string;
  cloudColor: string;
  ambientGlow?: string;
}

export const TRAILS: TrailItem[] = [
  { id: 'none', name: 'Default White', icon: '⚪', desc: 'Clean white leap dust', cost: 0, previewColor: '#94a3b8' },
  { id: 'mint', name: 'Mint Breeze', icon: '🍃', desc: 'Fresh green forest breeze', cost: 40, previewColor: '#34d399' },
  { id: 'gold_spark', name: 'Golden Spark', icon: '🪙', desc: 'Warm golden coin sparks', cost: 90, previewColor: '#fbbf24' },
  { id: 'bubbles', name: 'Bubble Pop', icon: '🫧', desc: 'Bouncing aqua water spheres', cost: 150, previewColor: '#38bdf8' },
  { id: 'sakura', name: 'Sakura Petals', icon: '🌸', desc: 'Falling cherry blossom petals', cost: 220, previewColor: '#f472b6' },
  { id: 'fire', name: 'Fire Blast', icon: '🔥', desc: 'Blazing flame sparks & embers', cost: 320, previewColor: '#f97316' },
  { id: 'lightning', name: 'Electric Volt', icon: '⚡', desc: 'Yellow electric shocks', cost: 450, previewColor: '#eab308' },
  { id: 'neon_cyan', name: 'Neon Cyan', icon: '💠', desc: 'Glowing cybernetic energy', cost: 600, previewColor: '#06b6d4' },
  { id: 'void', name: 'Purple Void', icon: '🔮', desc: 'Dark mystical shadow rift', cost: 800, previewColor: '#a855f7' },
  { id: 'crimson', name: 'Crimson Blood', icon: '🩸', desc: 'Deep ruby red combat flare', cost: 1000, previewColor: '#ef4444' },
  { id: 'emerald', name: 'Emerald Shine', icon: '💎', desc: 'Gleaming emerald crystal dust', cost: 1250, previewColor: '#10b981' },
  { id: 'rainbow', name: 'Rainbow Wave', icon: '🌈', desc: 'Vibrant prismatic color stream', cost: 1550, previewColor: '#ec4899' },
  { id: 'frost', name: 'Frost Blizzard', icon: '❄️', desc: 'Chilled snowflakes & ice gems', cost: 1900, previewColor: '#bae6fd' },
  { id: 'music', name: 'Music Notes', icon: '🎵', desc: 'Dancing musical symphony beats', cost: 2300, previewColor: '#8b5cf6' },
  { id: 'toxic', name: 'Toxic Acid', icon: '🧪', desc: 'Bioluminescent radioactive drips', cost: 2800, previewColor: '#84cc16' },
  { id: 'starlight', name: 'Starlight Shimmer', icon: '✨', desc: 'Twinkling celestial astral dust', cost: 3400, previewColor: '#fde047' },
  { id: 'magma', name: 'Magma Burst', icon: '🌋', desc: 'Molten volcanic rock particles', cost: 4100, previewColor: '#ea580c' },
  { id: 'diamond_glow', name: 'Diamond Shards', icon: '💠', desc: 'Pure faceted diamond crystals', cost: 5000, previewColor: '#38bdf8' },
  { id: 'matrix', name: 'Cyber Matrix', icon: '💻', desc: 'Digital binary green streams', cost: 6200, previewColor: '#22c55e' },
  { id: 'solar', name: 'Solar Flare', icon: '☀️', desc: 'Blinding sun plasma energy', cost: 7800, previewColor: '#f59e0b' },
  { id: 'galaxy', name: 'Galaxy Nebula', icon: '🌌', desc: 'Infinite interstellar cosmic stardust', cost: 10000, previewColor: '#c084fc' },
];

export const SKINS: SkinItem[] = [
  { id: 'classic', name: 'Classic Jumper', icon: '🏃', desc: 'The original agile climber', cost: 0, color: '#2b2b2b', accent: '#4a90d9', glow: 'rgba(74, 144, 217, 0)' },
  { id: 'blue_runner', name: 'Blue Runner', icon: '👟', desc: 'Sleek sky sprinter', cost: 50, color: '#1d4ed8', accent: '#60a5fa', glow: 'rgba(59, 130, 246, 0.25)' },
  { id: 'crimson_bandit', name: 'Crimson Bandit', icon: '🧣', desc: 'Red rogue adventurer', cost: 100, color: '#991b1b', accent: '#f87171', glow: 'rgba(239, 68, 68, 0.3)' },
  { id: 'forest_ranger', name: 'Forest Ranger', icon: '🌲', desc: 'Emerald woodland scout', cost: 150, color: '#065f46', accent: '#34d399', glow: 'rgba(52, 211, 153, 0.3)' },
  { id: 'ninja', name: 'Shadow Ninja', icon: '🥷', desc: 'Stealth suit with flying headband', cost: 220, color: '#1e1b4b', accent: '#ef4444', glow: 'rgba(239, 68, 68, 0.35)', hasHat: 'ninja_bandana' },
  { id: 'desert_nomad', name: 'Desert Nomad', icon: '🏜️', desc: 'Sandy traveler of the dunes', cost: 300, color: '#78350f', accent: '#fde047', glow: 'rgba(245, 158, 11, 0.3)' },
  { id: 'viking', name: 'Viking Warrior', icon: '🪓', desc: 'Nordic hero with horned helmet', cost: 400, color: '#334155', accent: '#e2e8f0', glow: 'rgba(148, 163, 184, 0.3)', hasHat: 'viking_horns' },
  { id: 'cyber_neon', name: 'Cyber Neon', icon: '🤖', desc: 'Futuristic runner with glowing visor', cost: 550, color: '#06b6d4', accent: '#f43f5e', glow: 'rgba(6, 182, 212, 0.5)', hasHat: 'visor' },
  { id: 'retro_arcade', name: 'Retro Arcade', icon: '🕹️', desc: '80s synthwave magenta hero', cost: 700, color: '#86198f', accent: '#22d3ee', glow: 'rgba(217, 70, 239, 0.45)' },
  { id: 'toxic_bio', name: 'Toxic Mutant', icon: '☣️', desc: 'Glowing radioactive biosuit', cost: 850, color: '#3f6212', accent: '#a3e635', glow: 'rgba(163, 230, 53, 0.5)' },
  { id: 'royal_knight', name: 'Royal Knight', icon: '🛡️', desc: 'Silver plate-armored champion', cost: 1050, color: '#475569', accent: '#38bdf8', glow: 'rgba(56, 189, 248, 0.4)', hasHat: 'knight_helmet' },
  { id: 'deep_diver', name: 'Ocean Diver', icon: '🤿', desc: 'Aquamarine deep sea diver', cost: 1300, color: '#0e7490', accent: '#67e8f9', glow: 'rgba(103, 232, 249, 0.45)', hasHat: 'diver_goggles' },
  { id: 'astronaut', name: 'Galactic Astronaut', icon: '🧑‍🚀', desc: 'Spacewalker with white dome visor', cost: 1600, color: '#f8fafc', accent: '#38bdf8', glow: 'rgba(255, 255, 255, 0.6)', hasHat: 'astronaut_dome' },
  { id: 'pharaoh', name: 'Sun Pharaoh', icon: '🏺', desc: 'Ancient monarch with golden nemes', cost: 1950, color: '#854d0e', accent: '#facc15', glow: 'rgba(250, 204, 21, 0.55)', hasHat: 'pharaoh_nemes' },
  { id: 'magma_golem', name: 'Magma Golem', icon: '🌋', desc: 'Molten rock volcanic elemental', cost: 2400, color: '#7f1d1d', accent: '#fb923c', glow: 'rgba(251, 146, 60, 0.6)' },
  { id: 'cyber_samurai', name: 'Cyber Samurai', icon: '⚔️', desc: 'Hi-tech ronin with neon blade aura', cost: 2900, color: '#0f172a', accent: '#a855f7', glow: 'rgba(168, 85, 247, 0.6)' },
  { id: 'vampire_lord', name: 'Vampire Lord', icon: '🧛', desc: 'Midnight noble with crimson cape', cost: 3500, color: '#18181b', accent: '#dc2626', glow: 'rgba(220, 38, 38, 0.55)', hasHat: 'vampire_cape' },
  { id: 'dragon_king', name: 'Dragon King', icon: '🐉', desc: 'Mythic overlord with dragon horns', cost: 4200, color: '#581c87', accent: '#f59e0b', glow: 'rgba(245, 158, 11, 0.6)', hasHat: 'dragon_horns' },
  { id: 'diamond_hero', name: 'Pure Diamond', icon: '💎', desc: 'Crystallized prismatic champion', cost: 5500, color: '#bae6fd', accent: '#ffffff', glow: 'rgba(56, 189, 248, 0.75)' },
  { id: 'gold_king', name: 'Gold King', icon: '👑', desc: 'Pure golden aura & royal crown', cost: 7000, color: '#f59e0b', accent: '#fef08a', glow: 'rgba(245, 158, 11, 0.8)', hasHat: 'crown' },
  { id: 'cosmic_god', name: 'Cosmic Entity', icon: '🌌', desc: 'Infinite celestial being with holy halo', cost: 10000, color: '#312e81', accent: '#e0e7ff', glow: 'rgba(192, 132, 252, 0.9)', hasHat: 'halo' },
];

export const BACKGROUNDS: BackgroundItem[] = [
  { id: 'classic_sky', name: 'Classic Sky', icon: '🌤️', desc: 'Crisp blue sky & soft white clouds', cost: 0, topColor: '#87CEEB', midColor: '#B0E2FF', botColor: '#E0F7FA', cloudColor: 'rgba(255, 255, 255, 0.88)' },
  { id: 'dawn_sunrise', name: 'Dawn Sunrise', icon: '🌅', desc: 'Warm peach & golden morning glow', cost: 60, topColor: '#ff7e5f', midColor: '#feb47b', botColor: '#ffeccc', cloudColor: 'rgba(255, 240, 225, 0.85)' },
  { id: 'sunset_twilight', name: 'Sunset Twilight', icon: '🌇', desc: 'Rich amber & purple dusk gradient', cost: 120, topColor: '#4a154b', midColor: '#bc4e9c', botColor: '#f80759', cloudColor: 'rgba(254, 215, 226, 0.82)' },
  { id: 'emerald_forest', name: 'Emerald Forest', icon: '🌲', desc: 'Lush green woods & canopy mist', cost: 200, topColor: '#0f382c', midColor: '#1b6b54', botColor: '#6ee7b7', cloudColor: 'rgba(209, 250, 229, 0.85)' },
  { id: 'pink_sakura', name: 'Pink Sakura', icon: '🌸', desc: 'Pastel pink dreamlike cherry sky', cost: 300, topColor: '#831843', midColor: '#db2777', botColor: '#fbcfe8', cloudColor: 'rgba(253, 232, 242, 0.9)' },
  { id: 'desert_dunes', name: 'Desert Mirage', icon: '🏜️', desc: 'Warm golden sand & desert horizon', cost: 420, topColor: '#92400e', midColor: '#d97706', botColor: '#fef08a', cloudColor: 'rgba(254, 243, 199, 0.85)' },
  { id: 'midnight_city', name: 'Midnight City', icon: '🌃', desc: 'Deep navy night with skyline glow', cost: 580, topColor: '#020617', midColor: '#0f172a', botColor: '#1e293b', cloudColor: 'rgba(148, 163, 184, 0.65)', ambientGlow: 'rgba(56, 189, 248, 0.15)' },
  { id: 'snowy_alpine', name: 'Snowy Alpine', icon: '🏔️', desc: 'Freezing mountain peak & ice blue', cost: 750, topColor: '#0369a1', midColor: '#38bdf8', botColor: '#f0f9ff', cloudColor: 'rgba(255, 255, 255, 0.95)' },
  { id: 'synthwave_80s', name: 'Synthwave 80s', icon: '🌆', desc: 'Retro neon magenta & purple vibes', cost: 950, topColor: '#2e0249', midColor: '#570a57', botColor: '#a91079', cloudColor: 'rgba(244, 114, 182, 0.75)', ambientGlow: 'rgba(236, 72, 153, 0.2)' },
  { id: 'deep_ocean', name: 'Deep Ocean', icon: '🌊', desc: 'Abyssal turquoise & deep currents', cost: 1200, topColor: '#082f49', midColor: '#0c4a6e', botColor: '#06b6d4', cloudColor: 'rgba(165, 243, 252, 0.7)' },
  { id: 'volcanic_sky', name: 'Volcanic Ash', icon: '🌋', desc: 'Smoldering crimson & magma haze', cost: 1500, topColor: '#450a0a', midColor: '#7f1d1d', botColor: '#ea580c', cloudColor: 'rgba(254, 215, 170, 0.65)', ambientGlow: 'rgba(234, 88, 12, 0.25)' },
  { id: 'toxic_wasteland', name: 'Toxic Wasteland', icon: '🧪', desc: 'Radioactive green mist & dark skies', cost: 1850, topColor: '#142900', midColor: '#365314', botColor: '#84cc16', cloudColor: 'rgba(217, 249, 157, 0.75)' },
  { id: 'cyberpunk_city', name: 'Cyberpunk Megacity', icon: '🏙️', desc: 'Electric cyan & neon purple metropolis', cost: 2300, topColor: '#090014', midColor: '#2b0938', botColor: '#00f0ff', cloudColor: 'rgba(103, 232, 249, 0.65)', ambientGlow: 'rgba(0, 240, 255, 0.2)' },
  { id: 'ancient_egypt', name: 'Ancient Egypt', icon: '🏺', desc: 'Mystical golden pyramid horizon', cost: 2800, topColor: '#713f12', midColor: '#b45309', botColor: '#fde047', cloudColor: 'rgba(254, 240, 138, 0.8)' },
  { id: 'enchanted_realm', name: 'Enchanted Realm', icon: '✨', desc: 'Fairy purple dusk with mystical stars', cost: 3400, topColor: '#3b0764', midColor: '#6b21a8', botColor: '#c084fc', cloudColor: 'rgba(233, 213, 255, 0.85)' },
  { id: 'arctic_aurora', name: 'Arctic Aurora', icon: '🌌', desc: 'Northern lights green & violet aurora', cost: 4100, topColor: '#022c22', midColor: '#065f46', botColor: '#2dd4bf', cloudColor: 'rgba(153, 246, 228, 0.8)', ambientGlow: 'rgba(45, 212, 191, 0.25)' },
  { id: 'blood_moon', name: 'Blood Moon', icon: '🌕', desc: 'Eerie obsidian dark sky & red eclipse', cost: 5000, topColor: '#180000', midColor: '#450a0a', botColor: '#dc2626', cloudColor: 'rgba(254, 202, 202, 0.65)', ambientGlow: 'rgba(220, 38, 38, 0.3)' },
  { id: 'golden_palace', name: 'Golden Palace', icon: '👑', desc: 'Royal opulent gold radiance', cost: 6200, topColor: '#78350f', midColor: '#d97706', botColor: '#fef08a', cloudColor: 'rgba(255, 255, 255, 0.9)', ambientGlow: 'rgba(245, 158, 11, 0.3)' },
  { id: 'mars_planet', name: 'Mars Surface', icon: '🪐', desc: 'Rusty crimson Martian red planet atmosphere', cost: 7800, topColor: '#360909', midColor: '#7c2d12', botColor: '#f97316', cloudColor: 'rgba(255, 237, 213, 0.7)' },
  { id: 'cosmic_space', name: 'Cosmic Deep Space', icon: '🚀', desc: 'Infinite black cosmos & purple nebulae', cost: 10000, topColor: '#000000', midColor: '#0f051d', botColor: '#4c1d95', cloudColor: 'rgba(192, 132, 252, 0.55)', ambientGlow: 'rgba(147, 51, 234, 0.35)' },
];

export class ShopManager {
  private static readonly STORAGE_KEY = 'stickup_shop_data_v4';

  // Upgrades (levels 0..10)
  magnetLevel = 0;
  jetpackLevel = 0;
  shieldLevel = 0;
  coinMultiplierLevel = 0;

  // Selected & unlocked trails
  unlockedTrails: string[] = ['none'];
  selectedTrail = 'none';

  // Selected & unlocked skins
  unlockedSkins: string[] = ['classic'];
  selectedSkin = 'classic';

  // Selected & unlocked backgrounds
  unlockedBackgrounds: string[] = ['classic_sky'];
  selectedBackground = 'classic_sky';

  // 10-Level Strict 2X Upgrade Costs (25, 50, 100, 200, 400, 800, 1600, 3200, 6400, 12800)
  readonly upgradeCosts = [25, 50, 100, 200, 400, 800, 1600, 3200, 6400, 12800] as const;
  readonly shieldCosts = [15, 30, 60, 120, 240, 480, 960, 1920, 3840, 7680] as const;

  constructor() {
    this.load();
  }

  load(): void {
    try {
      const dataStr = localStorage.getItem(ShopManager.STORAGE_KEY) || localStorage.getItem('skyjumper_shop_data_v4');
      if (dataStr) {
        const data = JSON.parse(dataStr);
        if (typeof data.magnetLevel === 'number') this.magnetLevel = Math.min(10, Math.max(0, data.magnetLevel));
        if (typeof data.jetpackLevel === 'number') this.jetpackLevel = Math.min(10, Math.max(0, data.jetpackLevel));
        if (typeof data.shieldLevel === 'number') this.shieldLevel = Math.min(10, Math.max(0, data.shieldLevel));
        if (typeof data.coinMultiplierLevel === 'number') this.coinMultiplierLevel = Math.min(10, Math.max(0, data.coinMultiplierLevel));
        if (Array.isArray(data.unlockedTrails)) this.unlockedTrails = data.unlockedTrails;
        if (typeof data.selectedTrail === 'string') this.selectedTrail = data.selectedTrail;
        if (Array.isArray(data.unlockedSkins)) this.unlockedSkins = data.unlockedSkins;
        if (typeof data.selectedSkin === 'string') this.selectedSkin = data.selectedSkin;
        if (Array.isArray(data.unlockedBackgrounds)) this.unlockedBackgrounds = data.unlockedBackgrounds;
        if (typeof data.selectedBackground === 'string') this.selectedBackground = data.selectedBackground;
      }
    } catch {
      // Ignore storage errors in sandboxed environments
    }
  }

  save(): void {
    try {
      const data = {
        magnetLevel: this.magnetLevel,
        jetpackLevel: this.jetpackLevel,
        shieldLevel: this.shieldLevel,
        coinMultiplierLevel: this.coinMultiplierLevel,
        unlockedTrails: this.unlockedTrails,
        selectedTrail: this.selectedTrail,
        unlockedSkins: this.unlockedSkins,
        selectedSkin: this.selectedSkin,
        unlockedBackgrounds: this.unlockedBackgrounds,
        selectedBackground: this.selectedBackground,
      };
      localStorage.setItem(ShopManager.STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore storage errors
    }
  }

  // --- Gameplay Stat Helpers (+0.25s per level for 10 levels) ---

  getMagnetDuration(): number {
    // Base: 3.5s -> Lv10 (FULL): 6.0s (+0.25s per level)
    return 3.5 + this.magnetLevel * 0.25;
  }

  getMagnetRadius(): number {
    return 190 + this.magnetLevel * 14; // up to 330px
  }

  getJetpackDuration(): number {
    // Base: 2.0s -> Lv10 (FULL): 4.5s (+0.25s per level)
    return 2.0 + this.jetpackLevel * 0.25;
  }

  getShieldBonusBounce(): number {
    return this.shieldLevel * 35; // Extra spring burst on save (up to +350)
  }

  getCoinMultiplierDuration(): number {
    // Base: 2.0s -> Lv10 (FULL): 4.5s (+0.25s per level)
    return 2.0 + this.coinMultiplierLevel * 0.25;
  }

  getCoinMultiplier(): number {
    return 1;
  }

  getCurrentSkin(): SkinItem {
    const skin = SKINS.find(s => s.id === this.selectedSkin);
    return skin || SKINS[0];
  }

  getCurrentTrail(): TrailItem {
    const trail = TRAILS.find(t => t.id === this.selectedTrail);
    return trail || TRAILS[0];
  }

  getCurrentBackground(): BackgroundItem {
    const bg = BACKGROUNDS.find(b => b.id === this.selectedBackground);
    return bg || BACKGROUNDS[0];
  }

  // --- Purchase / Upgrade Actions ---

  upgrade(type: 'magnet' | 'jetpack' | 'shield' | 'coin_multiplier', currentCoins: number): { success: boolean; newCoins: number } {
    if (type === 'magnet') {
      if (this.magnetLevel >= 10) return { success: false, newCoins: currentCoins };
      const cost = this.upgradeCosts[this.magnetLevel];
      if (currentCoins < cost) return { success: false, newCoins: currentCoins };
      this.magnetLevel++;
      this.save();
      return { success: true, newCoins: currentCoins - cost };
    }
    if (type === 'jetpack') {
      if (this.jetpackLevel >= 10) return { success: false, newCoins: currentCoins };
      const cost = this.upgradeCosts[this.jetpackLevel];
      if (currentCoins < cost) return { success: false, newCoins: currentCoins };
      this.jetpackLevel++;
      this.save();
      return { success: true, newCoins: currentCoins - cost };
    }
    if (type === 'shield') {
      if (this.shieldLevel >= 10) return { success: false, newCoins: currentCoins };
      const cost = this.shieldCosts[this.shieldLevel];
      if (currentCoins < cost) return { success: false, newCoins: currentCoins };
      this.shieldLevel++;
      this.save();
      return { success: true, newCoins: currentCoins - cost };
    }
    if (type === 'coin_multiplier') {
      if (this.coinMultiplierLevel >= 10) return { success: false, newCoins: currentCoins };
      const cost = this.upgradeCosts[this.coinMultiplierLevel];
      if (currentCoins < cost) return { success: false, newCoins: currentCoins };
      this.coinMultiplierLevel++;
      this.save();
      return { success: true, newCoins: currentCoins - cost };
    }
    return { success: false, newCoins: currentCoins };
  }

  // Cost accessors for compatibility
  get powerupCosts(): readonly number[] {
    return this.upgradeCosts;
  }

  get multiplierCosts(): readonly number[] {
    return this.upgradeCosts;
  }

  buyOrSelectSkin(skinId: string, currentCoins: number): { success: boolean; newCoins: number } {
    if (this.unlockedSkins.includes(skinId)) {
      this.selectedSkin = skinId;
      this.save();
      return { success: true, newCoins: currentCoins };
    }
    return this.unlockSkin(skinId, currentCoins);
  }

  buyOrSelectTrail(trailId: string, currentCoins: number): { success: boolean; newCoins: number } {
    if (this.unlockedTrails.includes(trailId)) {
      this.selectedTrail = trailId;
      this.save();
      return { success: true, newCoins: currentCoins };
    }
    return this.unlockTrail(trailId, currentCoins);
  }

  buyOrSelectBackground(bgId: string, currentCoins: number): { success: boolean; newCoins: number } {
    if (this.unlockedBackgrounds.includes(bgId)) {
      this.selectedBackground = bgId;
      this.save();
      return { success: true, newCoins: currentCoins };
    }
    return this.unlockBackground(bgId, currentCoins);
  }

  unlockSkin(skinId: string, currentCoins: number): { success: boolean; newCoins: number } {
    const skin = SKINS.find(s => s.id === skinId);
    if (!skin || this.unlockedSkins.includes(skinId)) return { success: false, newCoins: currentCoins };
    if (currentCoins < skin.cost) return { success: false, newCoins: currentCoins };

    this.unlockedSkins.push(skinId);
    this.selectedSkin = skinId;
    this.save();
    return { success: true, newCoins: currentCoins - skin.cost };
  }

  selectSkin(skinId: string): boolean {
    if (this.unlockedSkins.includes(skinId)) {
      this.selectedSkin = skinId;
      this.save();
      return true;
    }
    return false;
  }

  unlockTrail(trailId: string, currentCoins: number): { success: boolean; newCoins: number } {
    const trail = TRAILS.find(t => t.id === trailId);
    if (!trail || this.unlockedTrails.includes(trailId)) return { success: false, newCoins: currentCoins };
    if (currentCoins < trail.cost) return { success: false, newCoins: currentCoins };

    this.unlockedTrails.push(trailId);
    this.selectedTrail = trailId;
    this.save();
    return { success: true, newCoins: currentCoins - trail.cost };
  }

  selectTrail(trailId: string): boolean {
    if (this.unlockedTrails.includes(trailId)) {
      this.selectedTrail = trailId;
      this.save();
      return true;
    }
    return false;
  }

  unlockBackground(bgId: string, currentCoins: number): { success: boolean; newCoins: number } {
    const bg = BACKGROUNDS.find(b => b.id === bgId);
    if (!bg || this.unlockedBackgrounds.includes(bgId)) return { success: false, newCoins: currentCoins };
    if (currentCoins < bg.cost) return { success: false, newCoins: currentCoins };

    this.unlockedBackgrounds.push(bgId);
    this.selectedBackground = bgId;
    this.save();
    return { success: true, newCoins: currentCoins - bg.cost };
  }

  selectBackground(bgId: string): boolean {
    if (this.unlockedBackgrounds.includes(bgId)) {
      this.selectedBackground = bgId;
      this.save();
      return true;
    }
    return false;
  }
}
