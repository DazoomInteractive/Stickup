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
  MOVING_PLATFORM_START,
  BREAKABLE_PLATFORM_START,
  FADING_PLATFORM_START,
  COIN_SPAWN_CHANCE,
  PIXELS_PER_METER,
  PLAYER_WIDTH,
} from './constants';
import { Player } from './Player';
import { Platform, type PlatformType } from './Platform';
import { Coin } from './Coin';
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
  private camera: Camera;
  private input: InputHandler;
  private vfx: VFX;
  private ui: UI;
  private audio: AudioManager;

  private state: GameState = STATE.MAIN_MENU;
  private height = 0;
  private coinCount = 0;
  private highestY = 0; // track lowest world Y value (highest point)

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
    this.input = new InputHandler();
    this.vfx = new VFX();
    this.ui = new UI();
    this.audio = new AudioManager();

    this.ui.setPlayCallback(() => this.startGame());
    this.ui.setRestartCallback(() => this.startGame());

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

    this.boundPointerMove = (e: PointerEvent) => this.onPointerMove(e);
    this.boundPointerDown = (e: PointerEvent) => this.onPointerDown(e);
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

  private fadeTo(newState: GameState): void {
    this.transitionTarget = 0;
    // After fade-out, switch state and fade in
    window.setTimeout(() => {
      this.state = newState;
      this.transitionTarget = 1;
    }, 200);
  }

  private resetGame(): void {
    this.player.reset(
      (GAME_WIDTH - PLAYER_WIDTH) / 2,
      GAME_HEIGHT - 200,
    );
    this.player.vy = -600; // initial hop
    this.camera.reset();
    this.vfx.clear();
    this.platforms = [];
    this.coins = [];
    this.height = 0;
    this.coinCount = 0;
    this.highestY = this.player.y;
    this.generateInitialPlatforms();
  }

  private gameOver(): void {
    this.audio.playGameOver();
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
    }
  }

  private pickType(): PlatformType {
    const r = Math.random();
    if (this.height < BREAKABLE_PLATFORM_START) {
      // Early game: only static + moving
      if (this.height < MOVING_PLATFORM_START) return 'static';
      return r < 0.35 ? 'moving' : 'static';
    }
    // Mid-late game: mix in breakable, fading, moving, spring
    if (this.height < FADING_PLATFORM_START) {
      if (r < 0.2) return 'breakable';
      if (r < 0.5) return 'moving';
      if (r < 0.58) return 'spring';
      return 'static';
    }
    // Late game: all types
    if (r < 0.18) return 'breakable';
    if (r < 0.33) return 'fading';
    if (r < 0.58) return 'moving';
    if (r < 0.66) return 'spring';
    return 'static';
  }

  private makePlatform(x: number, y: number, type: PlatformType): Platform {
    if (type === 'moving' || type === 'spring') {
      const range = 60 + Math.random() * 80;
      const speed = 60 + Math.random() * 60;
      return new Platform(x, y, type, range, speed);
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
        new Coin(platform.x + platform.width / 2, platform.y - offset),
      );
    }
  }

  private spawnPlatformsAbove(): void {
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
      highest = platform;
    }
  }

  private cleanupOffscreen(): void {
    const bottomWorldY = this.camera.y + GAME_HEIGHT + 100;
    this.platforms = this.platforms.filter(
      (p) => p.y < bottomWorldY && !p.shouldRemove(),
    );
    this.coins = this.coins.filter((c) => !c.collected && c.y < bottomWorldY);
  }

  // ---- Collision ----

  private checkCollisions(): void {
    // Only collide when falling
    if (this.player.vy < 0) return;

    const feet = this.player.feetY;
    const prevFeet = feet - this.player.vy * (1 / 60);
    const px = this.player.x;
    const pw = this.player.width;

    for (const p of this.platforms) {
      if (!p.isSolid()) continue;
      // Horizontal overlap
      if (px + pw < p.x || px > p.x + p.width) continue;
      // Feet crossing the platform top
      if (feet >= p.y && prevFeet <= p.y + 4) {
        this.player.y = p.y - this.player.height;

        if (p.hasSpring()) {
          this.player.springBoost();
        } else {
          this.player.bounce();
        }

        // Breakable platforms crumble after one bounce
        if (p.type === 'breakable') {
          p.break();
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

    if (this.state === STATE.PLAYING) {
      this.player.update(dt, this.input);

      // Track peak height before camera update
      if (this.player.y < this.highestY) {
        this.highestY = this.player.y;
        this.height = Math.floor(
          (GAME_HEIGHT - 200 - this.highestY) / PIXELS_PER_METER,
        );
        if (this.height < 0) this.height = 0;
      }

      // Camera follows player upward only (never scrolls down)
      this.camera.update(this.player.y, dt);

      for (const p of this.platforms) p.update(dt);
      for (const c of this.coins) c.update(dt);

      this.checkCollisions();
      this.spawnPlatformsAbove();
      this.cleanupOffscreen();

      // Game over: player fell below the bottom edge of the camera view
      if (this.player.y > this.camera.y + GAME_HEIGHT) {
        this.gameOver();
      }
    }

    this.vfx.update(dt);
  }

  // ---- Rendering ----

  private render(): void {
    this.drawBackground();

    if (this.state === STATE.MAIN_MENU) {
      this.ui.drawMainMenu(this.ctx, this.transitionAlpha, this.audio.isMuted());
      return;
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

    // Player in screen space
    const playerScreenY = this.camera.worldToScreenY(this.player.y);
    this.player.draw(this.ctx, this.player.x, playerScreenY);

    // VFX in screen space
    this.vfx.drawParticles(this.ctx);
    this.vfx.drawTexts(this.ctx);

    // HUD
    if (this.state === STATE.PLAYING) {
      this.ui.drawHUD(this.ctx, this.height, this.coinCount);
    }

    if (this.state === STATE.GAME_OVER) {
      this.ui.drawGameOver(this.ctx, this.transitionAlpha, this.height, this.coinCount);
    }
  }

  private drawBackground(): void {
    // Gradient
    const grad = this.ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    grad.addColorStop(0, COLORS.bgTop);
    grad.addColorStop(1, COLORS.bgBottom);
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Grid lines (parallax with camera)
    const gridSize = 40;
    const offsetY = this.camera.y * 0.3; // slow parallax
    const startY = -(offsetY % gridSize);

    this.ctx.strokeStyle = COLORS.gridLine;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    for (let x = 0; x <= GAME_WIDTH; x += gridSize) {
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, GAME_HEIGHT);
    }
    for (let y = startY; y <= GAME_HEIGHT; y += gridSize) {
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(GAME_WIDTH, y);
    }
    this.ctx.stroke();

    // Bold lines every 5 cells
    this.ctx.strokeStyle = COLORS.gridLineBold;
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    const boldSize = gridSize * 5;
    const boldStartY = -(offsetY % boldSize);
    for (let y = boldStartY; y <= GAME_HEIGHT; y += boldSize) {
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(GAME_WIDTH, y);
    }
    this.ctx.stroke();
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
    const pos = this.getPointerPos(e);
    // Mute button check
    const muteRect = this.ui.getMuteButtonRect();
    const dx = pos.x - muteRect.x;
    const dy = pos.y - muteRect.y;
    if (dx * dx + dy * dy <= muteRect.r * muteRect.r) {
      this.toggleMute();
      return;
    }
    this.ui.handleClick(pos.x, pos.y, this.state);
  }

  getState(): GameState {
    return this.state;
  }
}
