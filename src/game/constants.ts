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

// Coin
export const COIN_RADIUS = 12;
export const COIN_VALUE = 1;

// Generation
export const PLATFORM_MIN_GAP = 70;   // min vertical gap between platforms
export const PLATFORM_MAX_GAP = 130;  // max vertical gap
export const MOVING_PLATFORM_START = 600; // height (m) where moving platforms begin
export const BREAKABLE_PLATFORM_START = 400; // height (m) where breakable platforms begin
export const FADING_PLATFORM_START = 800; // height (m) where fading platforms begin
export const SPRING_SPAWN_CHANCE = 0.18; // chance a platform gets a spring on top
export const SPRING_BOOST_MULTIPLIER = 2.0; // spring launches player 2x higher
export const COIN_SPAWN_CHANCE = 0.45; // chance a platform gets a coin above it

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

// Game states
export const STATE = {
  MAIN_MENU: 'MAIN_MENU',
  PLAYING: 'PLAYING',
  GAME_OVER: 'GAME_OVER',
} as const;

export type GameState = (typeof STATE)[keyof typeof STATE];
