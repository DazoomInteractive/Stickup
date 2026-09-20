// ============================================================
// Sky Jumper - Game Engine
// Owns the game loop, state machine (MAIN_MENU / PLAYING /
// GAME_OVER), procedural platform + coin generation, collision
// detection, camera, and VFX orchestration.
//
// FUTURE (Phase 3): PlatformManager and CoinManager can be split
// out of here when breakable platforms / enemies / shop arrive.
// For now, generation lives here for simplicity and readability.
// ============================================================

import {
  GAME_WIDTH,
  GAME_HEIGHT,
  COLORS,
  STATE,
  type GameState,
  PLATFORM_MIN_GAP,
  PLATFORM_MAX_GAP,
  PLATFORM_WIDTH,
  RELIC_SPAWN_CHANCE,
  COIN_SPAWN_CHANCE,
  MERCHANT_SPAWN_CHANCE,
  MERCHANT_MIN_METER,
  ENEMY_MIN_METER,
  ENEMY_SPAWN_CHANCE,
  DEATH_RELIC_KEEP_RATE,
  SHIELD_SPAWN_CHANCE,
  JETPACK_SPAWN_CHANCE,
  MAGNET_SPAWN_CHANCE,
  MULTIPLIER_SPAWN_CHANCE,
  PIXELS_PER_METER,
  PLAYER_WIDTH,
} from './constants';
import { Player } from './Player';
import { Platform, type PlatformType } from './Platform';
import { Relic } from './Relic';
import { Merchant } from './Merchant';
import { Enemy } from './Enemy';
import { Arrow } from './Arrow';
import { FallingHazard } from './FallingHazard';
import { Coin } from './Coin';
import { Shield } from './Shield';
import { Jetpack } from './Jetpack';
import { Magnet } from './Magnet';
import { CoinMultiplierItem } from './CoinMultiplierItem';
import { Lava } from './Lava';
import { Camera } from './Camera';
import { InputHandler } from './InputHandler';
import { VFX } from './VFX';
import { UI, openPrivacyPolicy } from './UI';
import { AudioManager } from './Audio';
import { AdsService } from './AdsService';
import { ShopManager, SKINS, TRAILS, BACKGROUNDS } from './ShopManager';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private player: Player;
  private platforms: Platform[] = [];
  private coins: Coin[] = [];
  private relics: Relic[] = [];
  private merchants: Merchant[] = [];
  private enemies: Enemy[] = [];
  private arrows: Arrow[] = [];
  private hazards: FallingHazard[] = [];
  private shields: Shield[] = [];
  private jetpacks: Jetpack[] = [];
  private magnets: Magnet[] = [];
  private multipliers: CoinMultiplierItem[] = [];
  private lava: Lava;
  private camera: Camera;
  private input: InputHandler;
  private vfx: VFX;
  private ui: UI;
  private audio: AudioManager;

  // First-Launch Privacy Policy & Terms Consent
  private static readonly PRIVACY_ACCEPTED_KEY = 'stickup_privacy_accepted';
  private privacyConsentAccepted = false;
  private isPrivacyModalOpen = false;
  private privacyCheckboxChecked = false;

  private state: GameState = STATE.SPLASH;
  private splashElapsed = 0;
  private height = 0;
  private coinCount = 0;
  private relicCount = 0;
  private sessionSavedRelics = 0;
  private sessionLostRelics = 0;
  private sessionRecoveredRelics = 0;
  private hasRevivedInRun = false;
  private diamondsRecoveredInRun = false;
  private highestY = 0; // track lowest world Y value (highest point)
  private bestScore = 0;
  private initialBestScore = 0; // previous session record to show on the sky line
  private isNewBest = false;
  private recordCelebrated = false;

  // Shop & Progression State
  private shop: ShopManager = new ShopManager();
  private isShopOpen = false;
  private shopActiveTab: 'upgrades' | 'skins' | 'trails' | 'backgrounds' = 'upgrades';
  private shopPage = 0;
  private persistentCoins = 0;
  private static readonly BANKED_COINS_KEY = 'stickup_banked_coins';

  onStateChange: ((state: GameState) => void) | null = null;

  private static readonly BEST_SCORE_KEY = 'stickup_best_score';

  // Loop
  private rafId = 0;
  private lastTime = 0;
  private running = false;
  private smoothDt = 1 / 60;

  // Performance & Stutter-prevention caches
  private skyGradient: CanvasGradient | null = null;
  private cloudCanvas: HTMLCanvasElement | null = null;
  private cleanupTimer = 0;
  private highestPlatformY = 0;

  // State transition fade
  private transitionAlpha = 1;
  private transitionTarget = 1;

  // Bound handlers (for cleanup & multi-platform touch support)
  private boundPointerMove: (e: PointerEvent) => void;
  private boundPointerDown: (e: PointerEvent) => void;
  private boundTouchStart: (e: TouchEvent) => void;
  private boundClick: (e: MouseEvent) => void;
  private lastTapTime = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas context unavailable');
    this.ctx = ctx;

    this.initPrecomputedAssets();

    this.player = new Player(
      (GAME_WIDTH - PLAYER_WIDTH) / 2,
      GAME_HEIGHT - 200,
    );
    this.camera = new Camera();
    this.lava = new Lava();
    this.input = new InputHandler();
    this.vfx = new VFX();
    this.ui = new UI();
    this.audio = new AudioManager();

    this.ui.setPlayCallback(() => {
      this.audio.playButton();
      this.startGame();
    });
    this.ui.setRestartCallback(() => {
      this.audio.playButton();
      this.startGame();
    });

    this.ui.setPauseTriggerCallback(() => {
      this.audio.playButton();
      this.pauseGame();
    });

    this.ui.setResumeCallback(() => {
      this.audio.playButton();
      this.resumeGame();
    });

    this.ui.setRestartPauseCallback(() => {
      this.audio.playButton();
      this.startGame();
    });

    this.ui.setSoundToggleCallback(() => {
      this.toggleMute();
      this.audio.playButton();
    });

    this.ui.setMainMenuCallback(() => {
      this.audio.playButton();
      this.goToMainMenu();
    });

    this.ui.setRecoverDiamondsCallback(() => {
      this.handleRecoverDiamondsAd();
    });

    this.ui.setReviveCallback(() => {
      this.handleReviveAd();
    });

    this.ui.setShopCallback(() => {
      this.audio.playButton();
      this.openShop();
    });

    this.input.onPauseToggle = () => {
      if (this.state === STATE.PLAYING) {
        this.pauseGame();
      } else if (this.state === STATE.PAUSED) {
        this.resumeGame();
      }
    };

    this.input.onAction = () => {
      this.audio.resume();
      if (this.state === STATE.SPLASH) {
        this.audio.playButton();
        this.goToMainMenu();
        return;
      }
      if (this.isPrivacyModalOpen) return;
      if (this.state === STATE.MAIN_MENU || this.state === STATE.GAME_OVER) {
        this.startGame();
      }
    };

    // Player bounce hook: dust + sound
    this.player.onBounce = () => {
      const sx = this.player.centerX;
      const sy = this.camera.worldToScreenY(this.player.feetY);
      this.vfx.spawnDust(sx, sy);
      this.audio.playJump();
    };

    // Spring boost hook: extra dust + spring sound
    this.player.onSpring = () => {
      const sx = this.player.centerX;
      const sy = this.camera.worldToScreenY(this.player.feetY);
      this.vfx.spawnDust(sx, sy);
      this.vfx.spawnSparkle(sx, sy);
      this.audio.playSpring();
    };

    // Jetpack burn out hook: sound + release burst
    this.player.onJetpackEnd = () => {
      this.audio.playJetpackEnd();
      const sx = this.player.centerX;
      const sy = this.camera.worldToScreenY(this.player.centerY);
      this.vfx.spawnJetpackBurst(sx, sy);
    };

    this.boundPointerMove = (e: PointerEvent) => this.onPointerMove(e);
    this.boundPointerDown = (e: PointerEvent) => this.handleTapAt(e.clientX, e.clientY);
    this.boundTouchStart = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 0) {
        const touch = e.touches[0];
        e.preventDefault();
        this.handleTapAt(touch.clientX, touch.clientY);
      }
    };
    this.boundClick = (e: MouseEvent) => this.handleTapAt(e.clientX, e.clientY);

    try {
      const stored = localStorage.getItem(GameEngine.BEST_SCORE_KEY) || localStorage.getItem('skyjumper_best_score');
      this.bestScore = stored ? parseInt(stored, 10) || 0 : 0;
    } catch {
      this.bestScore = 0;
    }

    try {
      this.privacyConsentAccepted = (localStorage.getItem(GameEngine.PRIVACY_ACCEPTED_KEY) || localStorage.getItem('sky_jumper_privacy_accepted')) === 'true';
    } catch {
      this.privacyConsentAccepted = false;
    }
    this.isPrivacyModalOpen = false;
    this.privacyCheckboxChecked = false;

    this.loadPersistentCoins();
    this.applyPlayerCustomization();
    this.applyBackgroundCustomization();
  }

  /** Apply active background sky palette */
  private applyBackgroundCustomization(): void {
    const bg = this.shop.getCurrentBackground();
    const grad = this.ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    grad.addColorStop(0, bg.topColor);
    grad.addColorStop(0.55, bg.midColor);
    grad.addColorStop(1, bg.botColor);
    this.skyGradient = grad;
  }

  /** Precompute textures and gradients once to avoid 60fps GC & canvas redraw overhead */
  private initPrecomputedAssets(): void {
    // 1. Sky Gradient (cached)
    const grad = this.ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    grad.addColorStop(0, COLORS.bgTop);
    grad.addColorStop(0.55, COLORS.bgMid);
    grad.addColorStop(1, COLORS.bgBottom);
    this.skyGradient = grad;

    // 2. Offscreen pre-rendered Cloud sprite for GPU-accelerated drawImage
    try {
      const cCanvas = document.createElement('canvas');
      cCanvas.width = 140;
      cCanvas.height = 100;
      const cCtx = cCanvas.getContext('2d');
      if (cCtx) {
        const cx = 45;
        const cy = 40;

        // Soft shadow underneath
        cCtx.fillStyle = COLORS.cloudShadow;
        cCtx.beginPath();
        for (const p of GameEngine.CLOUD_PUFFS) {
          cCtx.moveTo(cx + p.x + p.r, cy + 6 + p.y);
          cCtx.arc(cx + p.x, cy + 6 + p.y, p.r, 0, Math.PI * 2);
        }
        cCtx.fill();

        // Main cloud body
        cCtx.fillStyle = COLORS.cloud;
        cCtx.beginPath();
        for (const p of GameEngine.CLOUD_PUFFS) {
          cCtx.moveTo(cx + p.x + p.r, cy + p.y);
          cCtx.arc(cx + p.x, cy + p.y, p.r, 0, Math.PI * 2);
        }
        cCtx.fill();
      }
      this.cloudCanvas = cCanvas;
    } catch {
      this.cloudCanvas = null;
    }
  }

  // ---- Lifecycle ----

  start(): void {
    if (this.running) return;
    this.running = true;
    this.input.attach();
    this.canvas.addEventListener('pointermove', this.boundPointerMove);
    this.canvas.addEventListener('pointerdown', this.boundPointerDown);
    this.canvas.addEventListener('touchstart', this.boundTouchStart, { passive: false });
    this.canvas.addEventListener('click', this.boundClick);
    this.generateInitialPlatforms();
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
  }

  destroy(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    this.input.detach();
    this.canvas.removeEventListener('pointermove', this.boundPointerMove);
    this.canvas.removeEventListener('pointerdown', this.boundPointerDown);
    this.canvas.removeEventListener('touchstart', this.boundTouchStart);
    this.canvas.removeEventListener('click', this.boundClick);
  }

  // ---- State transitions with fade ----

  private startGame(): void {
    this.isShopOpen = false;
    this.audio.resume();
    this.resetGame();
    this.state = STATE.PLAYING;
    this.transitionAlpha = 1;
    this.transitionTarget = 1;
    if (this.onStateChange) {
      this.onStateChange(STATE.PLAYING);
    }
  }

  pauseGame(): void {
    if (this.state !== STATE.PLAYING) return;
    this.state = STATE.PAUSED;
    this.input.reset();
    if (this.onStateChange) {
      this.onStateChange(STATE.PAUSED);
    }
  }

  resumeGame(): void {
    if (this.state !== STATE.PAUSED) return;
    this.state = STATE.PLAYING;
    this.lastTime = performance.now();
    if (this.onStateChange) {
      this.onStateChange(STATE.PLAYING);
    }
  }

  goToMainMenu(): void {
    this.input.reset();
    this.state = STATE.MAIN_MENU;
    this.transitionAlpha = 1;
    this.transitionTarget = 1;
    if (!this.privacyConsentAccepted) {
      this.isPrivacyModalOpen = true;
      this.privacyCheckboxChecked = false;
    }
    if (this.onStateChange) {
      this.onStateChange(STATE.MAIN_MENU);
    }
  }

  private fadeTo(newState: GameState): void {
    this.transitionTarget = 0;
    // After fade-out, switch state and fade in
    window.setTimeout(() => {
      this.state = newState;
      this.transitionTarget = 1;
      if (this.onStateChange) {
        this.onStateChange(newState);
      }
    }, 200);
  }

  private resetGame(): void {
    this.input.reset();
    this.player.reset(
      (GAME_WIDTH - PLAYER_WIDTH) / 2,
      GAME_HEIGHT - 200,
    );
    this.player.vy = -600; // initial hop
    this.camera.reset();
    this.lava.reset();
    this.vfx.clear();
    this.platforms = [];
    this.coins = [];
    this.relics = [];
    this.merchants = [];
    this.enemies = [];
    this.arrows = [];
    this.hazards = [];
    this.shields = [];
    this.jetpacks = [];
    this.magnets = [];
    this.multipliers = [];
    this.height = 0;
    this.coinCount = 0;
    this.relicCount = 0;
    this.sessionSavedRelics = 0;
    this.sessionLostRelics = 0;
    this.sessionRecoveredRelics = 0;
    this.hasRevivedInRun = false;
    this.diamondsRecoveredInRun = false;
    this.highestY = this.player.y;
    this.initialBestScore = this.bestScore;
    this.isNewBest = false;
    this.recordCelebrated = false;
    this.cleanupTimer = 0;
    this.generateInitialPlatforms();
  }

  private gameOver(): void {
    this.audio.playGameOver();
    this.camera.shake(12, 0.45); // Juicy camera shake on fall/defeat
    this.input.reset();

    // Risk & Reward: Keep 65% of unsold relics, 35% are lost to the abyss
    if (this.relicCount > 0) {
      this.sessionSavedRelics = Math.ceil(this.relicCount * DEATH_RELIC_KEEP_RATE);
      this.sessionLostRelics = this.relicCount - this.sessionSavedRelics;
    } else {
      this.sessionSavedRelics = 0;
      this.sessionLostRelics = 0;
    }

    this.isNewBest = this.height > this.bestScore;
    if (this.isNewBest) {
      this.bestScore = this.height;
      try {
        localStorage.setItem(GameEngine.BEST_SCORE_KEY, String(this.bestScore));
      } catch {
        // Ignore storage errors in sandboxed iframes
      }
    }
    this.fadeTo(STATE.GAME_OVER);
  }

  // ---- Procedural generation ----

  private generateInitialPlatforms(): void {
    // Ground platform under the player
    this.platforms.push(
      new Platform(
        (GAME_WIDTH - PLATFORM_WIDTH) / 2,
        GAME_HEIGHT - 120,
        'static',
      ),
    );

    let lastY = GAME_HEIGHT - 120;
    while (lastY > -200) {
      const gap = PLATFORM_MIN_GAP + Math.random() * (PLATFORM_MAX_GAP - PLATFORM_MIN_GAP);
      lastY -= gap;
      const x = Math.random() * (GAME_WIDTH - PLATFORM_WIDTH);
      const type = this.pickType();
      const platform = this.makePlatform(x, lastY, type);
      this.platforms.push(platform);
      this.maybeSpawnRelic(platform);
      this.maybeSpawnMerchant(platform);
      this.maybeSpawnCoin(platform);
      this.maybeSpawnEnemy(platform);
      this.maybeSpawnShield(platform);
      this.maybeSpawnJetpack(platform);
      this.maybeSpawnMagnet(platform);
      this.maybeSpawnMultiplier(platform);
    }
    this.highestPlatformY = lastY;
  }

  private pickType(): PlatformType {
    const r = Math.random();

    // Springs can spawn early (from 10m+) with ~15% chance
    if (this.height >= 10 && r < 0.15) {
      return 'spring';
    }

    // Early game: predominantly static + gradual moving
    if (this.height < 50) {
      return 'static';
    }
    if (this.height < 120) {
      return r < 0.35 ? 'moving' : 'static';
    }
    if (this.height < 250) {
      if (r < 0.22) return 'breakable';
      if (r < 0.55) return 'moving';
      return 'static';
    }

    // High altitudes: all platform types
    if (r < 0.20) return 'breakable';
    if (r < 0.35) return 'fading';
    if (r < 0.60) return 'moving';
    return 'static';
  }

  private makePlatform(x: number, y: number, type: PlatformType): Platform {
    if (type === 'moving') {
      const range = 60 + Math.random() * 80;
      const speed = 60 + Math.random() * 60;
      return new Platform(x, y, type, range, speed);
    }
    if (type === 'spring') {
      // 50% static spring, 50% moving spring
      const isMoving = Math.random() < 0.45;
      const range = isMoving ? 50 + Math.random() * 60 : 0;
      const speed = isMoving ? 55 + Math.random() * 50 : 0;
      return new Platform(x, y, 'spring', range, speed);
    }
    if (type === 'fading') {
      // Random phase offset so platforms don't all blink in sync
      const fadeOffset = Math.random() * 4;
      return new Platform(x, y, 'fading', 0, 0, fadeOffset);
    }
    if (type === 'breakable') {
      return new Platform(x, y, 'breakable');
    }
    return new Platform(x, y, 'static');
  }

  private maybeSpawnRelic(platform: Platform): void {
    if (platform.type === 'breakable' || platform.type === 'fading') return;
    if (Math.random() < RELIC_SPAWN_CHANCE) {
      const offset = platform.type === 'spring' ? 52 : 30;
      this.relics.push(
        new Relic(platform.x + platform.width / 2, platform.y - offset, platform),
      );
    }
  }

  private maybeSpawnMerchant(platform: Platform): void {
    if (this.height < MERCHANT_MIN_METER) return;
    if (platform.type === 'breakable' || platform.type === 'fading' || platform.type === 'spring') return;

    // Avoid placing merchants too close to each other
    for (const m of this.merchants) {
      if (Math.abs(m.y - platform.y) < 380) return;
    }

    if (Math.random() < MERCHANT_SPAWN_CHANCE) {
      this.merchants.push(new Merchant(platform));
    }
  }

  private maybeSpawnCoin(platform: Platform): void {
    if (platform.type === 'breakable' || platform.type === 'fading') return;
    if (Math.random() < COIN_SPAWN_CHANCE) {
      const offset = platform.type === 'spring' ? 48 : 26;
      this.coins.push(
        new Coin(platform.x + platform.width / 2, platform.y - offset, platform),
      );
    }
  }

  private maybeSpawnEnemy(platform: Platform): void {
    if (this.height < ENEMY_MIN_METER) return;
    if (platform.type === 'breakable' || platform.type === 'fading' || platform.type === 'spring') return;

    // Avoid placing an enemy on the exact same platform as a merchant
    if (this.merchants.some((m) => m.platform === platform)) return;

    if (Math.random() < ENEMY_SPAWN_CHANCE) {
      this.enemies.push(new Enemy(platform));
    }
  }

  private maybeSpawnShield(platform: Platform): void {
    // Shields spawn on non-hazardous platforms with configured chance
    if (platform.type === 'breakable' || platform.type === 'fading' || platform.type === 'spring') return;
    if (Math.random() < SHIELD_SPAWN_CHANCE) {
      this.shields.push(
        new Shield(platform.x + platform.width / 2, platform.y - 32, platform),
      );
    }
  }

  private maybeSpawnJetpack(platform: Platform): void {
    // High-thrill rocket pack
    if (platform.type === 'breakable' || platform.type === 'fading' || platform.type === 'spring') return;
    if (Math.random() < JETPACK_SPAWN_CHANCE) {
      this.jetpacks.push(
        new Jetpack(platform.x + platform.width / 2, platform.y - 32, platform),
      );
    }
  }

  private maybeSpawnMagnet(platform: Platform): void {
    // Diamond magnet power-up
    if (platform.type === 'breakable' || platform.type === 'fading' || platform.type === 'spring') return;
    if (Math.random() < MAGNET_SPAWN_CHANCE) {
      this.magnets.push(
        new Magnet(platform.x + platform.width / 2, platform.y - 32, platform),
      );
    }
  }

  private maybeSpawnMultiplier(platform: Platform): void {
    // 2X Coin Multiplier token for merchant diamond selling
    if (platform.type === 'breakable' || platform.type === 'fading' || platform.type === 'spring') return;
    if (Math.random() < MULTIPLIER_SPAWN_CHANCE) {
      this.multipliers.push(
        new CoinMultiplierItem(platform.x + platform.width / 2, platform.y - 32, platform),
      );
    }
  }

  private spawnPlatformsAbove(): void {
    const topScreenWorldY = this.camera.y - 100;
    while (this.highestPlatformY > topScreenWorldY - PLATFORM_MAX_GAP) {
      const gap = PLATFORM_MIN_GAP + Math.random() * (PLATFORM_MAX_GAP - PLATFORM_MIN_GAP);
      const newY = this.highestPlatformY - gap;
      const x = Math.random() * (GAME_WIDTH - PLATFORM_WIDTH);
      const type = this.pickType();
      const platform = this.makePlatform(x, newY, type);
      this.platforms.push(platform);
      this.maybeSpawnRelic(platform);
      this.maybeSpawnMerchant(platform);
      this.maybeSpawnCoin(platform);
      this.maybeSpawnEnemy(platform);
      this.maybeSpawnShield(platform);
      this.maybeSpawnJetpack(platform);
      this.maybeSpawnMagnet(platform);
      this.maybeSpawnMultiplier(platform);
      this.highestPlatformY = newY;
    }
  }

  private cleanupOffscreen(): void {
    const bottomWorldY = this.camera.y + GAME_HEIGHT + 100;
    this.platforms = this.platforms.filter(
      (p) => p.y < bottomWorldY && !p.shouldRemove(),
    );
    this.coins = this.coins.filter((c) => !c.collected && c.y < bottomWorldY);
    this.relics = this.relics.filter((r) => !r.collected && r.y < bottomWorldY);
    this.merchants = this.merchants.filter((m) => m.active && m.y < bottomWorldY);
    this.enemies = this.enemies.filter((e) => e.active && e.y < bottomWorldY);
    this.arrows = this.arrows.filter((a) => a.active && a.y < bottomWorldY && a.y > this.camera.y - 200);
    this.hazards = this.hazards.filter((h) => h.active && h.y < bottomWorldY);
    this.shields = this.shields.filter((s) => !s.collected && s.y < bottomWorldY);
    this.jetpacks = this.jetpacks.filter((j) => !j.collected && j.y < bottomWorldY);
    this.magnets = this.magnets.filter((m) => !m.collected && m.y < bottomWorldY);
    this.multipliers = this.multipliers.filter((m) => !m.collected && m.y < bottomWorldY);
  }

  // ---- Collision ----

  private checkCollisions(dt: number): void {
    // Only collide when falling
    if (this.player.vy < 0) return;

    const feet = this.player.feetY;
    // Real time-dependent previous position to prevent frame-drop tunneling
    const prevFeet = feet - this.player.vy * dt;
    const px = this.player.x;
    const pw = this.player.width;

    for (const p of this.platforms) {
      if (!p.isSolid()) continue;
      // Horizontal overlap (with generous 4px forgiving margin)
      if (px + pw < p.x - 2 || px > p.x + p.width + 2) continue;
      // Feet crossing the platform top:
      // prevFeet was above/at platform and feet reached or fell through during this step
      const maxFallTolerance = Math.max(12, this.player.vy * dt + 6);
      if (feet >= p.y && prevFeet <= p.y + maxFallTolerance && feet <= p.y + p.height + 24) {
        this.player.y = p.y - this.player.height;

        // Trigger elastic dip on platform
        p.triggerBounce(p.hasSpring());

        if (p.hasSpring()) {
          this.player.springBoost();
          this.camera.shake(6, 0.25);
          const sx = this.player.centerX;
          const sy = this.camera.worldToScreenY(this.player.y);
          this.vfx.spawnFloatingText(sx, sy, 'BOING! +BOOST', '#4ade80');
          this.triggerHaptic([15, 20, 30]);
        } else {
          this.player.bounce();
          this.triggerHaptic(10);
        }

        // Breakable platforms crumble after one bounce
        if (p.type === 'breakable') {
          p.break();
          this.camera.shake(5, 0.22);
        }
        break;
      }
    }

    // Diamonds (💎 Olmoslar)
    for (const r of this.relics) {
      if (r.collected) continue;
      const dx = this.player.centerX - r.x;
      const dy = this.player.centerY - r.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < r.radius + this.player.width * 0.45) {
        r.collected = true;
        this.relicCount++;
        this.audio.playCoin();
        const sx = r.x;
        const sy = this.camera.worldToScreenY(r.y);
        this.vfx.spawnSparkle(sx, sy);
        this.vfx.spawnFloatingText(sx, sy, '+1 💎 DIAMOND', '#38bdf8');
        this.triggerHaptic(15);
      }
    }

    // Merchants (Real-time dynamic trade without pausing)
    for (const m of this.merchants) {
      if (!m.active || m.sold) continue;
      const dx = this.player.centerX - m.x;
      const dy = this.player.centerY - m.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      // Touch merchant to sell all collected diamonds for his current price!
      if (dist < 48) {
        if (this.relicCount > 0) {
          m.sold = true;
          const soldCount = this.relicCount;
          const is2x = this.player.hasMultiplier;
          const multiplierFactor = is2x ? 2 : 1;
          const earnedCoins = soldCount * m.pricePerRelic * multiplierFactor;
          this.coinCount += earnedCoins;
          this.addCoins(earnedCoins);
          this.sessionSavedRelics += soldCount;
          this.relicCount = 0;
          
          // Boost player upward on successful deal!
          this.player.bounce();
          this.player.vy = -1200;

          this.audio.playTrade();
          this.camera.shake(6, 0.25);
          const sx = m.x;
          const sy = this.camera.worldToScreenY(m.y);
          this.vfx.spawnSparkle(sx, sy);
          this.vfx.spawnSparkle(sx - 15, sy - 15);
          this.vfx.spawnSparkle(sx + 15, sy - 15);
          const dealText = is2x ? `🔥 2X DEAL! +${earnedCoins} 🪙!` : `SOLD ${soldCount} 💎 FOR +${earnedCoins} 🪙!`;
          this.vfx.spawnFloatingText(sx, sy - 25, dealText, is2x ? '#f59e0b' : '#fbbf24');
          this.triggerHaptic([30, 40, 60]);
        } else if (this.player.vy > 0) {
          // Friendly bounce and feedback when touching merchant with 0 diamonds
          this.player.bounce();
          this.player.vy = -950;
          this.audio.playButton();
          const sx = m.x;
          const sy = this.camera.worldToScreenY(m.y);
          this.vfx.spawnFloatingText(sx, sy - 25, 'NEED 💎 DIAMONDS!', '#38bdf8');
          this.triggerHaptic(15);
        }
      }
    }

    // Enemies (Stomp from above or hit!)
    for (const e of this.enemies) {
      if (!e.active) continue;
      const dx = this.player.centerX - e.x;
      const dy = this.player.centerY - e.y;
      if (Math.abs(dx) < (this.player.width + e.width) * 0.42 && Math.abs(dy) < (this.player.height + e.height) * 0.42) {
        // Did player stomp the enemy from above while falling?
        if (this.player.vy > 0 && this.player.feetY < e.y + 12) {
          e.active = false;
          this.player.bounce();
          this.player.vy = -1150; // Extra bounce boost
          this.audio.playEnemyStomp();
          this.camera.shake(6, 0.22);
          const sx = e.x;
          const sy = this.camera.worldToScreenY(e.y);
          this.vfx.spawnDust(sx, sy);
          this.vfx.spawnFloatingText(sx, sy, 'STOMPED! +5 🪙', '#4ade80');
          this.coinCount += 5;
          this.addCoins(5);
          this.triggerHaptic([20, 30]);
        } else if (this.player.hasJetpack) {
          // Jetpack invincibility destroys enemy without consuming shield
          e.active = false;
          this.audio.playEnemyStomp();
          this.camera.shake(4, 0.15);
          const sx = e.x;
          const sy = this.camera.worldToScreenY(e.y);
          this.vfx.spawnDust(sx, sy);
          this.vfx.spawnFloatingText(sx, sy, '🚀 BLASTED!', '#f97316');
        } else {
          // Player hit enemy from side/bottom
          if (this.player.hasShield) {
            e.active = false;
            this.player.hasShield = false;
            this.player.vy = -1400;
            this.audio.playShieldBreak();
            this.camera.shake(10, 0.35);
            const sx = this.player.centerX;
            const sy = this.camera.worldToScreenY(this.player.centerY);
            this.vfx.spawnShieldBurst(sx, sy, true);
            this.vfx.spawnFloatingText(sx, sy, '🛡️ SHIELD DEFENDED!', '#38bdf8');
            this.triggerHaptic([30, 40, 50]);
          } else {
            // Defeated by enemy
            this.camera.shake(12, 0.45);
            this.gameOver();
            return;
          }
        }
      }
    }

    // Falling Hazards (Adrenaline Rocks)
    for (const h of this.hazards) {
      if (!h.active || h.warningTimer > 0) continue;
      const dx = this.player.centerX - h.x;
      const dy = this.player.centerY - h.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < h.radius + this.player.width * 0.42) {
        h.active = false;
        if (this.player.hasJetpack) {
          // Jetpack crushes rock without losing shield
          const sx = this.player.centerX;
          const sy = this.camera.worldToScreenY(this.player.centerY);
          this.vfx.spawnDust(sx, sy);
          this.vfx.spawnFloatingText(sx, sy, '🚀 DEFLECTED!', '#f97316');
        } else if (this.player.hasShield) {
          this.player.hasShield = false;
          this.player.vy = -1450;
          this.audio.playShieldBreak();
          this.camera.shake(12, 0.38);
          const sx = this.player.centerX;
          const sy = this.camera.worldToScreenY(this.player.centerY);
          this.vfx.spawnShieldBurst(sx, sy, true);
          this.vfx.spawnFloatingText(sx, sy, '🛡️ SHIELD SAVED ROCK!', '#38bdf8');
          this.triggerHaptic([30, 45, 60]);
        } else {
          this.camera.shake(15, 0.5);
          this.gameOver();
          return;
        }
      }
    }

    // Coins (Legacy compatibility / bonus)
    for (const c of this.coins) {
      if (c.collected) continue;
      const dx = this.player.centerX - c.x;
      const dy = this.player.centerY - c.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < c.radius + this.player.width * 0.4) {
        c.collected = true;
        const multiplier = this.shop.getCoinMultiplier();
        const earned = Math.max(1, Math.round(1 * multiplier));
        this.coinCount += earned;
        this.addCoins(earned);
        this.audio.playCoin();
        const sx = c.x;
        const sy = this.camera.worldToScreenY(c.y);
        this.vfx.spawnSparkle(sx, sy);
        this.vfx.spawnFloatingText(sx, sy, `+${earned}`, COLORS.coinText);
      }
    }

    // Arrows (Fired by Archer Enemies)
    for (const a of this.arrows) {
      if (!a.active) continue;
      const dx = this.player.centerX - a.x;
      const dy = this.player.centerY - a.y;
      if (Math.abs(dx) < (this.player.width + a.width) * 0.4 && Math.abs(dy) < (this.player.height + a.height) * 0.4) {
        a.active = false;
        if (this.player.hasJetpack) {
          // Jetpack deflects arrows safely
          const sx = this.player.centerX;
          const sy = this.camera.worldToScreenY(this.player.centerY);
          this.vfx.spawnSparkle(sx, sy);
        } else if (this.player.hasShield) {
          this.player.hasShield = false;
          this.player.vy = -1400;
          this.audio.playShieldBreak();
          this.camera.shake(8, 0.3);
          const sx = this.player.centerX;
          const sy = this.camera.worldToScreenY(this.player.centerY);
          this.vfx.spawnShieldBurst(sx, sy, true);
          this.vfx.spawnFloatingText(sx, sy, '🛡️ SHIELD DEFENDED!', '#38bdf8');
          this.triggerHaptic([20, 30, 40]);
        } else {
          this.camera.shake(12, 0.45);
          this.gameOver();
          return;
        }
      }
    }

    // Shields
    for (const s of this.shields) {
      if (s.collected) continue;
      const dx = this.player.centerX - s.x;
      const dy = this.player.centerY - s.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < s.radius + this.player.width * 0.45) {
        s.collected = true;
        this.player.hasShield = true;
        this.audio.playShieldCollect();
        const sx = s.x;
        const sy = this.camera.worldToScreenY(s.y);
        this.vfx.spawnShieldBurst(sx, sy, false);
        this.vfx.spawnFloatingText(sx, sy, '🛡️ SHIELD!', '#38bdf8');
        this.triggerHaptic(25);
      }
    }

    // Jetpacks
    for (const j of this.jetpacks) {
      if (j.collected) continue;
      const dx = this.player.centerX - j.x;
      const dy = this.player.centerY - j.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < j.radius + this.player.width * 0.45) {
        j.collected = true;
        this.player.activateJetpack(this.shop.getJetpackDuration());
        this.audio.playJetpack();
        const sx = j.x;
        const sy = this.camera.worldToScreenY(j.y);
        this.vfx.spawnJetpackBurst(sx, sy);
        this.vfx.spawnFloatingText(sx, sy, '🚀 JETPACK!', '#f97316');
        this.triggerHaptic([20, 35, 20]);
      }
    }

    // Magnets
    for (const m of this.magnets) {
      if (m.collected) continue;
      const dx = this.player.centerX - m.x;
      const dy = this.player.centerY - m.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < m.radius + this.player.width * 0.45) {
        m.collected = true;
        this.player.activateMagnet(this.shop.getMagnetDuration());
        this.audio.playMagnetCollect();
        const sx = m.x;
        const sy = this.camera.worldToScreenY(m.y);
        this.vfx.spawnMagnetBurst(sx, sy);
        this.vfx.spawnFloatingText(sx, sy, '🧲 MAGNET!', '#c084fc');
        this.triggerHaptic(20);
      }
    }

    // 2X Coin Multiplier Tokens (doubles merchant diamond selling)
    for (const m of this.multipliers) {
      if (m.collected) continue;
      const dx = this.player.centerX - m.x;
      const dy = this.player.centerY - m.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < m.radius + this.player.width * 0.45) {
        m.collected = true;
        this.player.activateMultiplier(this.shop.getCoinMultiplierDuration());
        this.audio.playCoin();
        const sx = m.x;
        const sy = this.camera.worldToScreenY(m.y);
        this.vfx.spawnSparkle(sx, sy);
        this.vfx.spawnFloatingText(sx, sy, '🪙 2X COIN BOOST!', '#f59e0b');
        this.triggerHaptic([25, 35]);
      }
    }
  }

  private triggerHaptic(pattern: number | number[]): void {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Haptics safely ignored in restricted browser/sandbox environments
      }
    }
  }

  // ---- Main loop ----

  private loop = (now: number): void => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.loop);

    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // Safety clamp for tab switching or first frame
    if (rawDt <= 0 || rawDt > 0.1) {
      this.update(1 / 60);
      this.render();
      return;
    }

    // Delta smoothing & VSync stabilization:
    // Browser timer jitter causes dt to fluctuate (e.g. 15.6ms vs 17.4ms on 60Hz).
    // Snapping to steady display refreshes eliminates physics micro-stutters.
    let dt = rawDt;
    if (Math.abs(dt - 0.016667) < 0.0028) {
      dt = 0.016667; // 60 FPS lock
    } else if (Math.abs(dt - 0.008333) < 0.0018) {
      dt = 0.008333; // 120 FPS lock
    } else if (Math.abs(dt - 0.011111) < 0.002) {
      dt = 0.011111; // 90 FPS lock
    } else {
      // Rolling average to prevent sudden frame spikes
      this.smoothDt += (dt - this.smoothDt) * 0.25;
      dt = Math.min(this.smoothDt, 0.033);
    }

    this.update(dt);
    this.render();
  };

  private update(dt: number): void {
    // Fade transition
    this.transitionAlpha += (this.transitionTarget - this.transitionAlpha) * Math.min(1, dt * 8);

    this.ui.update(dt);

    if (this.state === STATE.SPLASH) {
      this.splashElapsed += dt;
      // Do not auto-enter: wait for user to tap the screen or press a key
      return;
    }

    if (this.state === STATE.PLAYING) {
      this.player.update(dt, this.input);

      // Track peak height before camera update
      if (this.player.y < this.highestY) {
        this.highestY = this.player.y;
        this.height = Math.floor(
          (GAME_HEIGHT - 200 - this.highestY) / PIXELS_PER_METER,
        );
        if (this.height < 0) this.height = 0;

        // Celebrate beating personal high score during gameplay!
        if (this.height > this.bestScore && this.bestScore > 0 && !this.recordCelebrated) {
          this.recordCelebrated = true;
          this.isNewBest = true;
          this.ui.showRecordBanner(this.height);
          this.audio.playNewRecord();
          this.camera.shake(5, 0.28);
        }
      }

      // Camera follows player upward only (never scrolls down)
      this.camera.update(this.player.y, dt);

      for (const p of this.platforms) p.update(dt);
      for (const r of this.relics) r.update(dt);
      for (const m of this.merchants) m.update(dt);
      for (const c of this.coins) c.update(dt);
      for (const e of this.enemies) e.update(dt);
      for (const s of this.shields) s.update(dt);
      for (const j of this.jetpacks) j.update(dt);
      for (const m of this.magnets) m.update(dt);
      for (const m of this.multipliers) m.update(dt);

      // Jetpack continuous thruster exhaust
      if (this.player.hasJetpack) {
        this.vfx.spawnJetpackThruster(
          this.player.centerX,
          this.camera.worldToScreenY(this.player.bottomY),
        );
        if (Math.random() < 0.2) {
          this.camera.shake(1.2, 0.05);
        }
      }

      // Emit jump trail if selected and active movement
      if (Math.abs(this.player.vy) > 100) {
        this.vfx.spawnTrail(
          this.player.centerX,
          this.camera.worldToScreenY(this.player.feetY),
          this.shop.selectedTrail,
        );
      }

      // Magnet active: pull nearby relics and coins toward player
      if (this.player.hasMagnet) {
        const pullRadius = this.shop.getMagnetRadius();
        for (const r of this.relics) {
          if (r.collected) continue;
          const dx = this.player.centerX - r.x;
          const dy = this.player.centerY - r.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < pullRadius && dist > 1) {
            const pullSpeed = 540 * dt;
            r.x += (dx / dist) * pullSpeed;
            r.y += (dy / dist) * pullSpeed;
            if (Math.random() < 0.2) {
              this.vfx.spawnMagnetSpark(r.x, this.camera.worldToScreenY(r.y));
            }
          }
        }
        for (const c of this.coins) {
          if (c.collected) continue;
          const dx = this.player.centerX - c.x;
          const dy = this.player.centerY - c.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < pullRadius && dist > 1) {
            const pullSpeed = 540 * dt;
            c.x += (dx / dist) * pullSpeed;
            c.y += (dy / dist) * pullSpeed;
            if (Math.random() < 0.2) {
              this.vfx.spawnMagnetSpark(c.x, this.camera.worldToScreenY(c.y));
            }
          }
        }
      }

      this.checkCollisions(dt);
      this.spawnPlatformsAbove();

      // Throttle offscreen cleanup to avoid GC spikes every frame
      this.cleanupTimer += dt;
      if (this.cleanupTimer >= 0.35) {
        this.cleanupTimer = 0;
        this.cleanupOffscreen();
      }

      // Update Rising Lava mechanic
      this.lava.update(dt, this.height, this.camera.y, this.vfx);

      // Check if player touched the rising lava
      if (this.lava.touches(this.player.feetY)) {
        if (this.player.hasShield) {
          // Shield absorbs the lava and propels player safely upward!
          this.player.hasShield = false;
          this.player.vy = -1650;
          this.audio.playShieldBreak();
          this.camera.shake(11, 0.38);
          const sx = this.player.centerX;
          const sy = this.camera.worldToScreenY(this.player.centerY);
          this.vfx.spawnShieldBurst(sx, sy, true);
          this.vfx.spawnFloatingText(sx, sy, '🛡️ SHIELD SAVED!', '#38bdf8');
          this.triggerHaptic([30, 40, 60]);
        } else {
          // Melted by rising lava
          this.audio.playLavaBurn();
          this.camera.shake(14, 0.5);
          const sx = this.player.centerX;
          const sy = this.camera.worldToScreenY(this.player.centerY);
          this.vfx.spawnLavaEmber(sx, sy);
          this.gameOver();
        }
      }

      // Game over or Shield rescue: player fell below the bottom edge of the camera view
      if (this.player.y > this.camera.y + GAME_HEIGHT) {
        if (this.player.hasShield) {
          // Shield rescues player from falling off screen!
          this.player.hasShield = false;
          this.player.y = this.camera.y + GAME_HEIGHT - 80;
          this.player.vy = -1750;
          this.audio.playShieldBreak();
          this.camera.shake(12, 0.4);
          const sx = this.player.centerX;
          const sy = this.camera.worldToScreenY(this.player.centerY);
          this.vfx.spawnShieldBurst(sx, sy, true);
          this.vfx.spawnFloatingText(sx, sy, '🛡️ SHIELD SAVED!', '#38bdf8');
          this.triggerHaptic([30, 40, 60]);
        } else {
          this.gameOver();
        }
      }
    }

    this.vfx.update(dt);
  }

  // ---- Rendering ----

  private render(): void {
    if (this.state === STATE.SPLASH) {
      this.ui.drawSplash(this.ctx, this.transitionAlpha, this.splashElapsed);
      return;
    }

    this.drawBackground();

    if (this.state === STATE.MAIN_MENU) {
      this.ui.drawMainMenu(this.ctx, this.transitionAlpha, this.audio.isMuted(), this.bestScore);
      if (this.isShopOpen) {
        this.ui.drawShopMenu(
          this.ctx,
          this.persistentCoins,
          this.shop,
          this.shopActiveTab,
          this.shopPage,
        );
      }
      if (this.isPrivacyModalOpen) {
        this.ui.drawPrivacyModal(this.ctx, this.privacyCheckboxChecked);
      }
      return;
    }

    // Apply Camera Shake offset to all world game objects
    this.ctx.save();
    if (this.camera.shakeOffsetX !== 0 || this.camera.shakeOffsetY !== 0) {
      this.ctx.translate(this.camera.shakeOffsetX, this.camera.shakeOffsetY);
    }

    // All objects are drawn in screen space using worldToScreenY()
    for (const p of this.platforms) {
      const screenY = this.camera.worldToScreenY(p.y);
      if (screenY < -50 || screenY > GAME_HEIGHT + 50) continue;
      p.draw(this.ctx, p.x, screenY);
    }

    for (const c of this.coins) {
      const screenY = this.camera.worldToScreenY(c.y);
      if (screenY < -50 || screenY > GAME_HEIGHT + 50) continue;
      c.draw(this.ctx, c.x, screenY);
    }

    for (const r of this.relics) {
      const screenY = this.camera.worldToScreenY(r.y);
      if (screenY < -50 || screenY > GAME_HEIGHT + 50) continue;
      r.draw(this.ctx, r.x, screenY);
    }

    for (const m of this.merchants) {
      const screenY = this.camera.worldToScreenY(m.y);
      if (screenY < -60 || screenY > GAME_HEIGHT + 60) continue;
      m.draw(this.ctx, m.x, screenY);
    }

    for (const e of this.enemies) {
      const screenY = this.camera.worldToScreenY(e.y);
      if (screenY < -50 || screenY > GAME_HEIGHT + 50) continue;
      e.draw(this.ctx, e.x, screenY);
    }

    for (const a of this.arrows) {
      const screenY = this.camera.worldToScreenY(a.y);
      if (screenY < -50 || screenY > GAME_HEIGHT + 50) continue;
      a.draw(this.ctx, a.x, screenY);
    }

    for (const h of this.hazards) {
      const screenY = this.camera.worldToScreenY(h.y);
      h.draw(this.ctx, h.x, screenY, this.camera.y);
    }

    for (const s of this.shields) {
      const screenY = this.camera.worldToScreenY(s.y);
      if (screenY < -50 || screenY > GAME_HEIGHT + 50) continue;
      s.draw(this.ctx, s.x, screenY);
    }

    for (const j of this.jetpacks) {
      const screenY = this.camera.worldToScreenY(j.y);
      if (screenY < -50 || screenY > GAME_HEIGHT + 50) continue;
      j.draw(this.ctx, j.x, screenY);
    }

    for (const m of this.magnets) {
      const screenY = this.camera.worldToScreenY(m.y);
      if (screenY < -50 || screenY > GAME_HEIGHT + 50) continue;
      m.draw(this.ctx, m.x, screenY);
    }

    for (const m of this.multipliers) {
      const screenY = this.camera.worldToScreenY(m.y);
      if (screenY < -50 || screenY > GAME_HEIGHT + 50) continue;
      m.draw(this.ctx, m.x, screenY);
    }

    // Draw Sky High-Score Record Line if a previous record exists
    if (this.initialBestScore > 0) {
      this.drawSkyRecordLine(this.initialBestScore);
    }

    // Player in screen space
    const playerScreenY = this.camera.worldToScreenY(this.player.y);
    this.player.draw(this.ctx, this.player.x, playerScreenY);

    // VFX in screen space
    this.vfx.drawParticles(this.ctx);
    this.vfx.drawTexts(this.ctx);

    // Rising Lava front rendering
    this.lava.draw(this.ctx, this.camera);

    this.ctx.restore();

    // HUD (clean and unaffected by shake)
    if (this.state === STATE.PLAYING || this.state === STATE.PAUSED) {
      this.ui.drawHUD(
        this.ctx,
        this.height,
        this.coinCount,
        this.relicCount,
        this.bestScore,
        this.isNewBest,
        this.player.hasShield,
        this.player.hasJetpack,
        this.player.jetpackTimer,
        this.player.hasMagnet,
        this.player.magnetTimer,
        this.player.hasMultiplier,
        this.player.multiplierTimer,
      );
    }

    // Pause Menu modal
    if (this.state === STATE.PAUSED) {
      this.ui.drawPauseMenu(
        this.ctx,
        this.height,
        this.coinCount,
        this.audio.isMuted(),
      );
    }

    if (this.state === STATE.GAME_OVER) {
      this.ui.drawGameOver(
        this.ctx,
        this.transitionAlpha,
        this.height,
        this.coinCount,
        this.sessionSavedRelics,
        this.sessionLostRelics,
        this.bestScore,
        this.isNewBest,
        !this.hasRevivedInRun,
        !this.diamondsRecoveredInRun,
        this.sessionRecoveredRelics,
      );
    }

    // Shop & Upgrades Modal Overlay
    if (this.isShopOpen) {
      this.ui.drawShopMenu(
        this.ctx,
        this.persistentCoins,
        this.shop,
        this.shopActiveTab,
        this.shopPage,
      );
    }

    // First-Launch Privacy Policy & Terms Modal
    if (this.isPrivacyModalOpen) {
      this.ui.drawPrivacyModal(this.ctx, this.privacyCheckboxChecked);
    }
  }

  private drawBackground(): void {
    // Sky gradient: dynamic custom background or default
    this.ctx.fillStyle = this.skyGradient || COLORS.bgMid;
    this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Soft stylized cartoon clouds (parallax with camera)
    this.drawClouds();
  }

  // Predefined cloud shapes at fixed world positions so they parallax
  // naturally as the camera rises. Each cloud is a cluster of circles.
  private static readonly CLOUDS: { x: number; y: number; scale: number; speed: number }[] = [
    { x: 60, y: 120, scale: 1.0, speed: 0.15 },
    { x: 300, y: 60, scale: 0.7, speed: 0.10 },
    { x: 380, y: 600, scale: 0.85, speed: 0.12 },
    { x: 100, y: 680, scale: 1.1, speed: 0.18 },
    { x: 340, y: 650, scale: 0.6, speed: 0.08 },
    { x: 220, y: 760, scale: 1.3, speed: 0.22 },
    { x: 50, y: 740, scale: 0.75, speed: 0.11 },
  ];

  static readonly CLOUD_PUFFS = [
    { x: 0, y: 0, r: 26 },
    { x: 24, y: -6, r: 22 },
    { x: 48, y: 0, r: 26 },
    { x: 20, y: 12, r: 24 },
    { x: -16, y: 8, r: 20 },
  ];

  private drawClouds(): void {
    const span = 900; // vertical repeat distance for cloud wrapping
    for (const c of GameEngine.CLOUDS) {
      const parallaxY = this.camera.y * c.speed;
      // Wrap clouds so they always cover the screen as camera rises
      let screenY = c.y - parallaxY;
      screenY = ((screenY % span) + span) % span;
      // Draw two copies to cover the wrap seam
      this.drawCloud(c.x, screenY, c.scale);
      this.drawCloud(c.x, screenY - span, c.scale);
    }
  }

  private drawCloud(x: number, y: number, scale: number): void {
    if (this.cloudCanvas) {
      // Blazing-fast GPU hardware blit (0 allocations per frame)
      const w = 140 * scale;
      const h = 100 * scale;
      this.ctx.drawImage(this.cloudCanvas, x - 45 * scale, y - 40 * scale, w, h);
    } else {
      // Fallback
      this.ctx.save();
      this.ctx.translate(x, y);
      this.ctx.scale(scale, scale);
      this.ctx.fillStyle = COLORS.cloud;
      this.ctx.beginPath();
      for (const p of GameEngine.CLOUD_PUFFS) {
        this.ctx.moveTo(p.x + p.r, p.y);
        this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      }
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  /**
   * Renders the floating golden record marker in the sky.
   * Gives players an exciting visual target to cross.
   */
  private drawSkyRecordLine(recordMeters: number): void {
    // Convert height (m) back to world Y: height = (GAME_HEIGHT - 200 - worldY) / PIXELS_PER_METER
    const worldY = GAME_HEIGHT - 200 - recordMeters * PIXELS_PER_METER;
    const screenY = this.camera.worldToScreenY(worldY);

    // Only draw if within visible screen bounds
    if (screenY < -40 || screenY > GAME_HEIGHT + 40) return;

    this.ctx.save();

    // 1. Glowing dashed golden finish line across the canvas
    this.ctx.lineWidth = 2.5;
    this.ctx.setLineDash([12, 8]);
    this.ctx.strokeStyle = '#f59e0b';
    this.ctx.shadowColor = 'rgba(245, 158, 11, 0.7)';
    this.ctx.shadowBlur = 8;
    this.ctx.beginPath();
    this.ctx.moveTo(0, screenY);
    this.ctx.lineTo(GAME_WIDTH, screenY);
    this.ctx.stroke();

    // 2. Center badge: "🏆 YOUR RECORD: 120m"
    this.ctx.setLineDash([]);
    const badgeW = 210;
    const badgeH = 28;
    const badgeX = (GAME_WIDTH - badgeW) / 2;
    const badgeY = screenY - badgeH / 2;

    // Badge pill background
    this.ctx.fillStyle = '#f59e0b';
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    this.ctx.shadowBlur = 6;
    this.ctx.shadowOffsetY = 2;
    this.ctx.beginPath();
    if (typeof this.ctx.roundRect === 'function') {
      this.ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 14);
    } else {
      this.ctx.rect(badgeX, badgeY, badgeW, badgeH);
    }
    this.ctx.fill();

    // Badge outline
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeStyle = '#fef08a';
    this.ctx.stroke();

    // Badge text
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '900 13px Roboto, sans-serif';
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    this.ctx.shadowBlur = 3;
    this.ctx.shadowOffsetY = 1;
    this.ctx.fillText(`🏆 YOUR RECORD: ${recordMeters}m`, GAME_WIDTH / 2, screenY);

    this.ctx.restore();
  }

  // ---- Input from on-screen touch buttons ----

  setTouchLeft(active: boolean): void {
    this.input.setLeft(active);
  }

  setTouchRight(active: boolean): void {
    this.input.setRight(active);
  }

  toggleMute(): boolean {
    return this.audio.toggleMute();
  }

  isMuted(): boolean {
    return this.audio.isMuted();
  }

  // ---- Pointer & Touch events for canvas buttons ----

  private onPointerMove(e: PointerEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / (rect.width || GAME_WIDTH);
    const scaleY = GAME_HEIGHT / (rect.height || GAME_HEIGHT);
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    this.ui.handlePointerMove(x, y, this.state);
  }

  private handleTapAt(clientX: number, clientY: number): void {
    const now = performance.now();
    if (now - this.lastTapTime < 80) return; // Debounce rapid pointerdown + touchstart/click
    this.lastTapTime = now;

    this.audio.resume();

    const rect = this.canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / (rect.width || GAME_WIDTH);
    const scaleY = GAME_HEIGHT / (rect.height || GAME_HEIGHT);
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    // 0. Tap to skip splash screen always advances to main menu
    if (this.state === STATE.SPLASH) {
      this.audio.playButton();
      this.goToMainMenu();
      return;
    }

    // 1. First-Launch Privacy Policy & Terms Modal takes precedence on main menu
    if (this.isPrivacyModalOpen) {
      const layout = this.ui.getPrivacyModalLayout();

      // Tap "READ PRIVACY POLICY & TERMS" button
      if (
        x >= layout.viewPolicyBtn.x &&
        x <= layout.viewPolicyBtn.x + layout.viewPolicyBtn.width &&
        y >= layout.viewPolicyBtn.y &&
        y <= layout.viewPolicyBtn.y + layout.viewPolicyBtn.height
      ) {
        this.audio.playButton();
        openPrivacyPolicy();
        return;
      }

      // Tap Checkbox or text row to toggle checkmark ("galochka")
      if (
        x >= layout.checkboxRow.x &&
        x <= layout.checkboxRow.x + layout.checkboxRow.width &&
        y >= layout.checkboxRow.y &&
        y <= layout.checkboxRow.y + layout.checkboxRow.height
      ) {
        this.privacyCheckboxChecked = !this.privacyCheckboxChecked;
        this.audio.playButton();
        this.triggerHaptic(20);
        return;
      }

      // Tap "ACCEPT & PLAY" button
      if (
        x >= layout.acceptBtn.x &&
        x <= layout.acceptBtn.x + layout.acceptBtn.width &&
        y >= layout.acceptBtn.y &&
        y <= layout.acceptBtn.y + layout.acceptBtn.height
      ) {
        if (this.privacyCheckboxChecked) {
          this.privacyConsentAccepted = true;
          this.isPrivacyModalOpen = false;
          try {
            localStorage.setItem(GameEngine.PRIVACY_ACCEPTED_KEY, 'true');
          } catch {
            // ignore
          }
          this.audio.playShieldCollect();
          this.vfx.spawnSparkle(GAME_WIDTH / 2, GAME_HEIGHT / 2);
          this.vfx.spawnFloatingText(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, '✓ WELCOME!', '#22c55e');
          this.triggerHaptic([30, 40]);
        } else {
          this.audio.playError();
          this.camera.shake(3, 0.12);
          this.vfx.spawnFloatingText(GAME_WIDTH / 2, layout.acceptBtn.y - 14, '⚠️ CHECK THE BOX FIRST!', '#ef4444');
          this.triggerHaptic(40);
        }
        return;
      }

      // Block all clicks behind modal
      return;
    }

    // 2. Shop interaction takes precedence when shop is open
    if (this.isShopOpen) {
      const action = this.ui.handleShopClick(x, y, this.shopActiveTab, this.shopPage);
      if (action) {
        this.handleShopAction(action);
      }
      return;
    }

    // 3. Mute button check on main menu
    if (this.state === STATE.MAIN_MENU) {
      const muteRect = this.ui.getMuteButtonRect();
      const dx = x - muteRect.x;
      const dy = y - muteRect.y;
      if (dx * dx + dy * dy <= (muteRect.r + 6) * (muteRect.r + 6)) {
        this.toggleMute();
        this.audio.playButton();
        return;
      }
    }

    // 4. Main menu buttons (Play, Shop), Game Over buttons, Pause buttons
    this.ui.handleClick(x, y, this.state);
  }

  private loadPersistentCoins(): void {
    try {
      const stored = localStorage.getItem(GameEngine.BANKED_COINS_KEY) || localStorage.getItem('skyjumper_banked_coins');
      this.persistentCoins = stored !== null ? parseInt(stored, 10) || 0 : 0;
    } catch {
      this.persistentCoins = 0;
    }
  }

  private savePersistentCoins(): void {
    try {
      localStorage.setItem(GameEngine.BANKED_COINS_KEY, this.persistentCoins.toString());
    } catch {
      // ignore
    }
  }

  private addCoins(amount: number): void {
    this.persistentCoins += amount;
    this.savePersistentCoins();
  }

  private openShop(): void {
    this.isShopOpen = true;
    this.shopPage = 0;
  }

  private closeShop(): void {
    this.isShopOpen = false;
    this.applyPlayerCustomization();
    this.applyBackgroundCustomization();
  }

  private applyPlayerCustomization(): void {
    const skin = this.shop.getCurrentSkin();
    this.player.skinColor = skin.color;
    this.player.skinAccent = skin.accent;
    this.player.skinGlow = skin.glow;
    this.player.hat = skin.hasHat;
  }

  private handleShopAction(action: string): void {
    this.audio.playButton();

    if (action === 'close') {
      this.closeShop();
      return;
    }

    // Tab switching
    if (action === 'tab_upgrades') {
      this.shopActiveTab = 'upgrades';
      this.shopPage = 0;
      return;
    }
    if (action === 'tab_skins') {
      this.shopActiveTab = 'skins';
      this.shopPage = 0;
      return;
    }
    if (action === 'tab_trails') {
      this.shopActiveTab = 'trails';
      this.shopPage = 0;
      return;
    }
    if (action === 'tab_backgrounds') {
      this.shopActiveTab = 'backgrounds';
      this.shopPage = 0;
      return;
    }

    // Pagination
    if (action === 'shop_prev_page') {
      this.shopPage = Math.max(0, this.shopPage - 1);
      return;
    }
    if (action === 'shop_next_page') {
      const items = this.shopActiveTab === 'skins' ? SKINS : this.shopActiveTab === 'trails' ? TRAILS : BACKGROUNDS;
      const totalPages = Math.ceil(items.length / 4);
      if (this.shopPage < totalPages - 1) {
        this.shopPage += 1;
      }
      return;
    }

    // 10-Level Upgrades
    if (action.startsWith('upgrade_')) {
      const type = action.replace('upgrade_', '') as 'magnet' | 'jetpack' | 'shield' | 'coin_multiplier';
      const curLevel = type === 'magnet' ? this.shop.magnetLevel
        : type === 'jetpack' ? this.shop.jetpackLevel
        : type === 'shield' ? this.shop.shieldLevel
        : this.shop.coinMultiplierLevel;

      if (curLevel >= 10) {
        this.audio.playButton();
        this.vfx.spawnFloatingText(GAME_WIDTH / 2, GAME_HEIGHT * 0.45, 'MAX LEVEL REACHED! ⭐', '#f59e0b');
        return;
      }

      const cost = type === 'shield'
        ? this.shop.shieldCosts[curLevel]
        : this.shop.upgradeCosts[curLevel];

      const res = this.shop.upgrade(type, this.persistentCoins);
      if (res.success) {
        this.persistentCoins = res.newCoins;
        this.savePersistentCoins();
        this.audio.playTrade();
        this.vfx.spawnSparkle(GAME_WIDTH / 2, GAME_HEIGHT * 0.4);
        this.vfx.spawnFloatingText(GAME_WIDTH / 2, GAME_HEIGHT * 0.45, `UPGRADED TO LV.${curLevel + 1}! ⚡`, '#22c55e');
        this.triggerHaptic([20, 30, 40]);
      } else {
        this.audio.playError();
        this.vfx.spawnFloatingText(GAME_WIDTH / 2, GAME_HEIGHT * 0.45, `Need ${cost} 🪙 Coins!`, '#ef4444');
        this.triggerHaptic(40);
      }
      return;
    }

    // Trails (21)
    if (action.startsWith('trail_')) {
      const trailId = action.replace('trail_', '');
      const alreadyUnlocked = this.shop.unlockedTrails.includes(trailId);
      const res = this.shop.buyOrSelectTrail(trailId, this.persistentCoins);
      if (res.success) {
        this.persistentCoins = res.newCoins;
        this.savePersistentCoins();
        this.audio.playTrade();
        this.vfx.spawnTrail(GAME_WIDTH / 2, GAME_HEIGHT * 0.4, trailId);
        this.vfx.spawnFloatingText(
          GAME_WIDTH / 2,
          GAME_HEIGHT * 0.45,
          alreadyUnlocked ? 'TRAIL EQUIPPED! ✨' : 'TRAIL UNLOCKED! 🎉',
          '#22c55e',
        );
        this.triggerHaptic(25);
      } else {
        this.audio.playError();
        this.vfx.spawnFloatingText(GAME_WIDTH / 2, GAME_HEIGHT * 0.45, 'Need more 🪙 coins!', '#ef4444');
        this.triggerHaptic(40);
      }
      return;
    }

    // Skins (21)
    if (action.startsWith('skin_')) {
      const skinId = action.replace('skin_', '');
      const alreadyUnlocked = this.shop.unlockedSkins.includes(skinId);
      const res = this.shop.buyOrSelectSkin(skinId, this.persistentCoins);
      if (res.success) {
        this.persistentCoins = res.newCoins;
        this.savePersistentCoins();
        this.audio.playTrade();
        this.applyPlayerCustomization();
        this.vfx.spawnSparkle(GAME_WIDTH / 2, GAME_HEIGHT * 0.4);
        this.vfx.spawnFloatingText(
          GAME_WIDTH / 2,
          GAME_HEIGHT * 0.45,
          alreadyUnlocked ? 'SKIN EQUIPPED! 🎭' : 'SKIN UNLOCKED! 👑',
          '#22c55e',
        );
        this.triggerHaptic(25);
      } else {
        this.audio.playError();
        this.vfx.spawnFloatingText(GAME_WIDTH / 2, GAME_HEIGHT * 0.45, 'Need more 🪙 coins!', '#ef4444');
        this.triggerHaptic(40);
      }
      return;
    }

    // Backgrounds (20)
    if (action.startsWith('bg_')) {
      const bgId = action.replace('bg_', '');
      const alreadyUnlocked = this.shop.unlockedBackgrounds.includes(bgId);
      const res = this.shop.buyOrSelectBackground(bgId, this.persistentCoins);
      if (res.success) {
        this.persistentCoins = res.newCoins;
        this.savePersistentCoins();
        this.audio.playTrade();
        this.applyBackgroundCustomization();
        this.vfx.spawnSparkle(GAME_WIDTH / 2, GAME_HEIGHT * 0.4);
        this.vfx.spawnFloatingText(
          GAME_WIDTH / 2,
          GAME_HEIGHT * 0.45,
          alreadyUnlocked ? 'SKY ACTIVE! 🌄' : 'SKY UNLOCKED! 🌅',
          '#22c55e',
        );
        this.triggerHaptic(25);
      } else {
        this.audio.playError();
        this.vfx.spawnFloatingText(GAME_WIDTH / 2, GAME_HEIGHT * 0.45, 'Need more 🪙 coins!', '#ef4444');
        this.triggerHaptic(40);
      }
      return;
    }
  }

  private handleRecoverDiamondsAd(): void {
    if (this.diamondsRecoveredInRun) return;
    this.audio.playButton();
    AdsService.getInstance().showRewardedAd(
      'recover_diamonds',
      () => {
        this.diamondsRecoveredInRun = true;
        let recovered = 0;
        if (this.sessionLostRelics > 0) {
          const totalRelics = this.sessionSavedRelics + this.sessionLostRelics;
          const targetTotal = Math.ceil(totalRelics * 0.5);
          recovered = Math.max(1, targetTotal - this.sessionSavedRelics);
          this.sessionSavedRelics += recovered;
          this.sessionLostRelics = Math.max(0, this.sessionLostRelics - recovered);
        } else {
          // If 0 lost diamonds, watching ad rewards +1 bonus diamond!
          this.sessionSavedRelics += 1;
          recovered = 1;
        }
        this.sessionRecoveredRelics = recovered;
        this.audio.playTrade();
        this.camera.shake(6, 0.25);
        this.vfx.spawnSparkle(GAME_WIDTH / 2, GAME_HEIGHT * 0.35);
        this.vfx.spawnFloatingText(GAME_WIDTH / 2, GAME_HEIGHT * 0.35, `💎 +${recovered} RECOVERED!`, '#38bdf8');
        this.triggerHaptic([30, 40, 60]);
      },
      (errorReason) => {
        this.audio.playError();
        this.camera.shake(4, 0.15);
        if (errorReason === 'NO_INTERNET') {
          this.vfx.spawnFloatingText(GAME_WIDTH / 2, GAME_HEIGHT * 0.35, '⚠️ NO INTERNET! CONNECT TO WATCH AD', '#ef4444');
        } else {
          this.vfx.spawnFloatingText(GAME_WIDTH / 2, GAME_HEIGHT * 0.35, '⚠️ AD UNAVAILABLE', '#ef4444');
        }
        this.triggerHaptic(50);
      },
    );
  }

  private handleReviveAd(): void {
    if (this.hasRevivedInRun) return;
    this.audio.playButton();
    AdsService.getInstance().showRewardedAd(
      'revive',
      () => {
        this.hasRevivedInRun = true;
        this.input.reset();
        this.lastTime = performance.now();

        // Respawn player in safety with shield and jump upward
        this.player.x = (GAME_WIDTH - this.player.width) / 2;
        this.player.y = this.camera.y + GAME_HEIGHT * 0.45;
        this.player.vy = -1350; // Super launch upward
        this.player.hasShield = true;

        // Spawn solid safety platform directly below player
        const safePlatform = new Platform((GAME_WIDTH - PLATFORM_WIDTH) / 2, this.player.y + 60, 'static');
        this.platforms.push(safePlatform);

        // Push rising lava back down
        this.lava.worldY = this.player.y + GAME_HEIGHT + 240;

        // Return to PLAYING state and notify React listener
        this.state = STATE.PLAYING;
        this.transitionAlpha = 1;
        this.transitionTarget = 1;
        if (this.onStateChange) {
          this.onStateChange(STATE.PLAYING);
        }

        this.audio.playShieldCollect();
        this.audio.playSpring();
        this.camera.shake(8, 0.3);
        const sx = this.player.centerX;
        const sy = this.camera.worldToScreenY(this.player.centerY);
        this.vfx.spawnShieldBurst(sx, sy, false);
        this.vfx.spawnFloatingText(sx, sy, '🚀 RESCUED & REVIVED!', '#4ade80');
        this.triggerHaptic([40, 50, 70]);
      },
      (errorReason) => {
        this.audio.playError();
        this.camera.shake(4, 0.15);
        if (errorReason === 'NO_INTERNET') {
          this.vfx.spawnFloatingText(GAME_WIDTH / 2, GAME_HEIGHT * 0.35, '⚠️ NO INTERNET! CONNECT TO RESCUE', '#ef4444');
        } else {
          this.vfx.spawnFloatingText(GAME_WIDTH / 2, GAME_HEIGHT * 0.35, '⚠️ AD UNAVAILABLE', '#ef4444');
        }
        this.triggerHaptic(50);
      },
    );
  }

  getState(): GameState {
    return this.state;
  }
}
