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
  COIN_SPAWN_CHANCE,
  SHIELD_SPAWN_CHANCE,
  JETPACK_SPAWN_CHANCE,
  MAGNET_SPAWN_CHANCE,
  MAGNET_RADIUS,
  PIXELS_PER_METER,
  PLAYER_WIDTH,
} from './constants';
import { Player } from './Player';
import { Platform, type PlatformType } from './Platform';
import { Coin } from './Coin';
import { Shield } from './Shield';
import { Jetpack } from './Jetpack';
import { Magnet } from './Magnet';
import { Lava } from './Lava';
import { Camera } from './Camera';
import { InputHandler } from './InputHandler';
import { VFX } from './VFX';
import { UI } from './UI';
import { AudioManager } from './Audio';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private player: Player;
  private platforms: Platform[] = [];
  private coins: Coin[] = [];
  private shields: Shield[] = [];
  private jetpacks: Jetpack[] = [];
  private magnets: Magnet[] = [];
  private lava: Lava;
  private camera: Camera;
  private input: InputHandler;
  private vfx: VFX;
  private ui: UI;
  private audio: AudioManager;

  private state: GameState = STATE.SPLASH;
  private splashElapsed = 0;
  private height = 0;
  private coinCount = 0;
  private highestY = 0; // track lowest world Y value (highest point)
  private bestScore = 0;
  private initialBestScore = 0; // previous session record to show on the sky line
  private isNewBest = false;
  private recordCelebrated = false;

  onStateChange: ((state: GameState) => void) | null = null;

  private static readonly BEST_SCORE_KEY = 'skyjumper_best_score';

  // Loop
  private rafId = 0;
  private lastTime = 0;
  private running = false;

  // State transition fade
  private transitionAlpha = 1;
  private transitionTarget = 1;

  // Bound handlers (for cleanup)
  private boundPointerMove: (e: PointerEvent) => void;
  private boundPointerDown: (e: PointerEvent) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas context unavailable');
    this.ctx = ctx;

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
      } else if (this.state === STATE.MAIN_MENU || this.state === STATE.GAME_OVER) {
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
    this.boundPointerDown = (e: PointerEvent) => this.onPointerDown(e);

    try {
      const stored = localStorage.getItem(GameEngine.BEST_SCORE_KEY);
      this.bestScore = stored ? parseInt(stored, 10) || 0 : 0;
    } catch {
      this.bestScore = 0;
    }
  }

  // ---- Lifecycle ----

  start(): void {
    if (this.running) return;
    this.running = true;
    this.input.attach();
    this.canvas.addEventListener('pointermove', this.boundPointerMove);
    this.canvas.addEventListener('pointerdown', this.boundPointerDown);
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
  }

  // ---- State transitions with fade ----

  private startGame(): void {
    this.audio.resume();
    this.resetGame();
    this.fadeTo(STATE.PLAYING);
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
    this.fadeTo(STATE.MAIN_MENU);
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
    this.shields = [];
    this.jetpacks = [];
    this.magnets = [];
    this.height = 0;
    this.coinCount = 0;
    this.highestY = this.player.y;
    this.initialBestScore = this.bestScore;
    this.isNewBest = false;
    this.recordCelebrated = false;
    this.generateInitialPlatforms();
  }

  private gameOver(): void {
    this.audio.playGameOver();
    this.camera.shake(12, 0.45); // Juicy camera shake on fall/defeat
    this.input.reset();
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
      this.maybeSpawnCoin(platform);
      this.maybeSpawnShield(platform);
      this.maybeSpawnJetpack(platform);
      this.maybeSpawnMagnet(platform);
    }
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

  private maybeSpawnCoin(platform: Platform): void {
    // Don't spawn coins on breakable or fading platforms — too punishing
    if (platform.type === 'breakable' || platform.type === 'fading') return;
    if (Math.random() < COIN_SPAWN_CHANCE) {
      // For spring platforms, coin goes higher to avoid overlapping the spring
      const offset = platform.type === 'spring' ? 55 : 30;
      this.coins.push(
        new Coin(platform.x + platform.width / 2, platform.y - offset, platform),
      );
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
    // Rare, high-thrill rocket pack (3.5% chance)
    if (platform.type === 'breakable' || platform.type === 'fading' || platform.type === 'spring') return;
    if (Math.random() < JETPACK_SPAWN_CHANCE) {
      this.jetpacks.push(
        new Jetpack(platform.x + platform.width / 2, platform.y - 32, platform),
      );
    }
  }

  private maybeSpawnMagnet(platform: Platform): void {
    // 6.5s coin magnet power-up (4.5% chance)
    if (platform.type === 'breakable' || platform.type === 'fading' || platform.type === 'spring') return;
    if (Math.random() < MAGNET_SPAWN_CHANCE) {
      this.magnets.push(
        new Magnet(platform.x + platform.width / 2, platform.y - 32, platform),
      );
    }
  }

  private spawnPlatformsAbove(): void {
    if (this.platforms.length === 0) return;
    const topScreenWorldY = this.camera.y - 100;
    let highest = this.platforms[0];
    for (const p of this.platforms) {
      if (p.y < highest.y) highest = p;
    }
    while (highest.y > topScreenWorldY - PLATFORM_MAX_GAP) {
      const gap = PLATFORM_MIN_GAP + Math.random() * (PLATFORM_MAX_GAP - PLATFORM_MIN_GAP);
      const newY = highest.y - gap;
      const x = Math.random() * (GAME_WIDTH - PLATFORM_WIDTH);
      const type = this.pickType();
      const platform = this.makePlatform(x, newY, type);
      this.platforms.push(platform);
      this.maybeSpawnCoin(platform);
      this.maybeSpawnShield(platform);
      this.maybeSpawnJetpack(platform);
      this.maybeSpawnMagnet(platform);
      highest = platform;
    }
  }

  private cleanupOffscreen(): void {
    const bottomWorldY = this.camera.y + GAME_HEIGHT + 100;
    this.platforms = this.platforms.filter(
      (p) => p.y < bottomWorldY && !p.shouldRemove(),
    );
    this.coins = this.coins.filter((c) => !c.collected && c.y < bottomWorldY);
    this.shields = this.shields.filter((s) => !s.collected && s.y < bottomWorldY);
    this.jetpacks = this.jetpacks.filter((j) => !j.collected && j.y < bottomWorldY);
    this.magnets = this.magnets.filter((m) => !m.collected && m.y < bottomWorldY);
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

    // Coins
    for (const c of this.coins) {
      if (c.collected) continue;
      const dx = this.player.centerX - c.x;
      const dy = this.player.centerY - c.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < c.radius + this.player.width * 0.4) {
        c.collected = true;
        this.coinCount++;
        this.audio.playCoin();
        const sx = c.x;
        const sy = this.camera.worldToScreenY(c.y);
        this.vfx.spawnSparkle(sx, sy);
        this.vfx.spawnFloatingText(sx, sy, '+1', COLORS.coinText);
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
        this.player.activateJetpack();
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
        this.player.activateMagnet();
        this.audio.playMagnetCollect();
        const sx = m.x;
        const sy = this.camera.worldToScreenY(m.y);
        this.vfx.spawnMagnetBurst(sx, sy);
        this.vfx.spawnFloatingText(sx, sy, '🧲 MAGNET!', '#c084fc');
        this.triggerHaptic(20);
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

    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    // Clamp dt to avoid huge jumps after tab switches
    if (dt > 0.05) dt = 0.05;

    this.update(dt);
    this.render();
  };

  private update(dt: number): void {
    // Fade transition
    this.transitionAlpha += (this.transitionTarget - this.transitionAlpha) * Math.min(1, dt * 8);

    this.ui.update(dt);

    if (this.state === STATE.SPLASH) {
      this.splashElapsed += dt;
      if (this.splashElapsed >= 3.2) {
        this.goToMainMenu();
      }
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
      for (const c of this.coins) c.update(dt);
      for (const s of this.shields) s.update(dt);
      for (const j of this.jetpacks) j.update(dt);
      for (const m of this.magnets) m.update(dt);

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

      // Magnet active: pull nearby coins toward player
      if (this.player.hasMagnet) {
        for (const c of this.coins) {
          if (c.collected) continue;
          const dx = this.player.centerX - c.x;
          const dy = this.player.centerY - c.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAGNET_RADIUS && dist > 1) {
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
      this.cleanupOffscreen();

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
        this.bestScore,
        this.isNewBest,
        this.player.hasShield,
        this.player.hasJetpack,
        this.player.jetpackTimer,
        this.player.hasMagnet,
        this.player.magnetTimer,
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
        this.bestScore,
        this.isNewBest,
      );
    }
  }

  private drawBackground(): void {
    // Sky gradient: light blue at top → mid blue → darker blue at bottom
    const grad = this.ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    grad.addColorStop(0, COLORS.bgTop);
    grad.addColorStop(0.55, COLORS.bgMid);
    grad.addColorStop(1, COLORS.bgBottom);
    this.ctx.fillStyle = grad;
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
    const s = scale;
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.scale(s, s);

    // Soft shadow underneath
    this.ctx.fillStyle = COLORS.cloudShadow;
    this.drawCloudShape(0, 6);
    // Main cloud body
    this.ctx.fillStyle = COLORS.cloud;
    this.drawCloudShape(0, 0);

    this.ctx.restore();
  }

  private drawCloudShape(ox: number, oy: number): void {
    this.ctx.beginPath();
    // A cluster of overlapping circles forming a fluffy cartoon cloud
    const puffs: { x: number; y: number; r: number }[] = [
      { x: 0, y: 0, r: 26 },
      { x: 24, y: -6, r: 22 },
      { x: 48, y: 0, r: 26 },
      { x: 20, y: 12, r: 24 },
      { x: -16, y: 8, r: 20 },
    ];
    for (const p of puffs) {
      this.ctx.moveTo(ox + p.x + p.r, oy + p.y);
      this.ctx.arc(ox + p.x, oy + p.y, p.r, 0, Math.PI * 2);
    }
    this.ctx.fill();
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

  // ---- Pointer events for canvas buttons ----

  private getPointerPos(e: PointerEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const scaleY = GAME_HEIGHT / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  private onPointerMove(e: PointerEvent): void {
    const pos = this.getPointerPos(e);
    this.ui.handlePointerMove(pos.x, pos.y, this.state);
  }

  private onPointerDown(e: PointerEvent): void {
    this.audio.resume();

    // Tap to skip splash screen
    if (this.state === STATE.SPLASH) {
      this.audio.playButton();
      this.goToMainMenu();
      return;
    }

    const pos = this.getPointerPos(e);
    // Mute button check on main menu
    if (this.state === STATE.MAIN_MENU) {
      const muteRect = this.ui.getMuteButtonRect();
      const dx = pos.x - muteRect.x;
      const dy = pos.y - muteRect.y;
      if (dx * dx + dy * dy <= muteRect.r * muteRect.r) {
        this.toggleMute();
        this.audio.playButton();
        return;
      }
    }
    this.ui.handleClick(pos.x, pos.y, this.state);
  }

  getState(): GameState {
    return this.state;
  }
}
