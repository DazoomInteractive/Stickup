// ============================================================
// Sky Jumper - Game Constants
// Central tuning values. Tweak here to rebalance the game.
// ============================================================

// Logical canvas dimensions (9:16 aspect ratio). The canvas is
// scaled to fit the viewport while preserving this aspect ratio.
export const GAME_WIDTH = 450;
export const GAME_HEIGHT = 800;

// Physics — tuned in pixels-per-second for frame-rate independence.
export const GRAVITY = 1800;          // px/s^2 applied to player vy
export const JUMP_VELOCITY = -1050;   // initial upward velocity on bounce
export const SPRING_VELOCITY = -2100;  // spring boost velocity (2x jump)
export const MOVE_SPEED = 320;        // horizontal player speed (px/s)
export const MAX_FALL_SPEED = 1400;   // terminal velocity clamp

// Player dimensions
export const PLAYER_WIDTH = 40;
export const PLAYER_HEIGHT = 56;

// Platform dimensions
export const PLATFORM_WIDTH = 90;
export const PLATFORM_HEIGHT = 16;

// Coin / Relic dimensions
export const COIN_RADIUS = 12;
export const RELIC_RADIUS = 14;
export const COIN_VALUE = 1;

// Generation & Spawns
export const PLATFORM_MIN_GAP = 65;   // min vertical gap between platforms
export const PLATFORM_MAX_GAP = 125;  // max vertical gap
export const MOVING_PLATFORM_START = 45;   // height (m) where moving platforms begin
export const BREAKABLE_PLATFORM_START = 90; // height (m) where breakable platforms begin
export const FADING_PLATFORM_START = 180;   // height (m) where fading platforms begin
export const SPRING_SPAWN_CHANCE = 0.22;   // 22% chance a platform gets a spring on top
export const SPRING_BOOST_MULTIPLIER = 2.0; // spring launches player 2x higher
export const RELIC_SPAWN_CHANCE = 0.36;     // 36% chance: Sparkling Diamonds (💎 Olmoslar) to collect!
export const COIN_SPAWN_CHANCE = 0;         // Coins come from trading 💎 with Merchants!

// Action & Merchant Balance
export const MERCHANT_SPAWN_CHANCE = 0.08;  // 8% chance on solid platform after 30m
export const MERCHANT_MIN_METER = 30;       // First merchant appears after 30m
export const ENEMY_MIN_METER = 80;          // Enemies start appearing after 80m
export const ENEMY_SPAWN_CHANCE = 0.10;     // 10% chance
export const HAZARD_MIN_METER = 999999;     // Disabled unfair hazards
export const HAZARD_INTERVAL_MIN = 999;
export const HAZARD_INTERVAL_MAX = 999;
export const DEATH_RELIC_KEEP_RATE = 0.50;  // Keep 50% unsold diamonds on death (50% risk penalty)

// Power-up balance constants
export const SHIELD_SPAWN_CHANCE = 0.055;  // 5.5% spawn rate for Shield
export const JETPACK_SPAWN_CHANCE = 0.04;  // 4% spawn rate for Jetpack
export const JETPACK_DURATION = 2.2;       // base 2.2s (up to 4.0s with full upgrade)
export const JETPACK_SPEED = 1500;         // upward flight speed px/s
export const MAGNET_SPAWN_CHANCE = 0.055;  // 5.5% spawn rate for Magnet
export const MAGNET_DURATION = 3.6;        // base 3.6s (up to 6.0s with full upgrade)
export const MAGNET_RADIUS = 220;          // diamond attraction radius
export const MULTIPLIER_SPAWN_CHANCE = 0.05; // 5% spawn rate for 2X Coin Multiplier item
export const MULTIPLIER_DURATION = 2.2;    // base 2.2s (up to 4.0s with full upgrade)

// Camera
export const CAMERA_OFFSET = 250;     // player stays this many px from bottom

// Height scoring: 1 meter per 35 px of ascent
export const PIXELS_PER_METER = 35;

// Colors (paper / grid vector style palette)
export const COLORS = {
  bgTop: '#a3d4f5',
  bgMid: '#6bb6e8',
  bgBottom: '#2e7bc7',
  cloud: '#ffffff',
  cloudShadow: '#d6e8f7',
  gridLine: '#d7dee8',
  gridLineBold: '#c4cdda',
  player: '#2b2b2b',
  playerAccent: '#4a90d9',
  staticPlatform: '#4caf50',
  staticPlatformDark: '#388e3c',
  movingPlatform: '#42a5f5',
  movingPlatformDark: '#1976d2',
  breakablePlatform: '#a1887f',
  breakablePlatformDark: '#795548',
  fadingPlatform: '#ce93d8',
  fadingPlatformDark: '#ab47bc',
  spring: '#66bb6a',
  springDark: '#43a047',
  springCoil: '#2e7d32',
  coin: '#ffc107',
  coinDark: '#ff9800',
  coinText: '#ff8f00',
  relic: '#c084fc',
  relicDark: '#9333ea',
  relicText: '#a855f7',
  text: '#37474f',
  textLight: '#e3f2fd',
  button: '#4a90d9',
  buttonHover: '#5ba0e9',
  buttonActive: '#3a7dc0',
  buttonDanger: '#ef5350',
  buttonDangerHover: '#f06292',
  shadow: 'rgba(0,0,0,0.12)',
  dust: '#cfd8dc',
  sparkle: '#ffd54f',
  overlay: 'rgba(255,255,255,0.55)',
} as const;

// Game metadata & Anti-Piracy Notice
export const GAME_VERSION = 'v2.0.0';
export const STUDIO_NAME = 'DazzomInteractive';
export const COPYRIGHT_NOTICE = '© 2026 DazzomInteractive. All Rights Reserved.';

// Game states
export const STATE = {
  SPLASH: 'SPLASH',
  MAIN_MENU: 'MAIN_MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
  SHOP: 'SHOP',
} as const;

export type GameState = (typeof STATE)[keyof typeof STATE];
