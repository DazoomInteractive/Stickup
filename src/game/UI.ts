// ============================================================
// Sky Jumper - UI Renderer
// Draws all overlay elements on the canvas: main menu, in-game
// HUD, game over screen, and the mute toggle. Buttons have smooth
// hover/press scale transitions and state fades are handled by
// GameEngine via the transitionAlpha value passed in.
// ============================================================

import {
  GAME_WIDTH,
  GAME_HEIGHT,
  COLORS,
  STATE,
  type GameState,
} from './constants';
import type { Button } from './types';

export class UI {
  private buttons: Record<string, Button> = {};
  private hoverScale: Record<string, number> = {};
  private pressScale: Record<string, number> = {};

  // Mute button state
  private muteHover = false;
  // Pause button state
  private pauseHover = false;

  private pauseCallback: (() => void) | null = null;

  // New Record celebration banner state
  private recordBannerTimer = 0;
  private recordBannerDuration = 2.8;
  private recordBannerScore = 0;

  constructor() {
    this.createButtons();
  }

  private createButtons(): void {
    const btnW = 200;
    const btnH = 60;

    this.buttons.play = {
      label: 'PLAY',
      x: (GAME_WIDTH - btnW) / 2,
      y: GAME_HEIGHT * 0.52,
      width: btnW,
      height: btnH,
      color: COLORS.button,
      hoverColor: COLORS.buttonHover,
      activeColor: COLORS.buttonActive,
      onClick: () => {},
    };

    this.buttons.restart = {
      label: 'RESTART',
      x: (GAME_WIDTH - btnW) / 2,
      y: GAME_HEIGHT * 0.6,
      width: btnW,
      height: btnH,
      color: COLORS.button,
      hoverColor: COLORS.buttonHover,
      activeColor: COLORS.buttonActive,
      onClick: () => {},
    };

    // Pause Menu buttons
    const pauseBtnW = 240;
    const pauseBtnH = 50;
    const pauseStartY = GAME_HEIGHT * 0.36;
    const gap = 58;

    this.buttons.resume = {
      label: '▶  RESUME',
      x: (GAME_WIDTH - pauseBtnW) / 2,
      y: pauseStartY,
      width: pauseBtnW,
      height: pauseBtnH,
      color: '#2563eb',
      hoverColor: '#3b82f6',
      activeColor: '#1d4ed8',
      onClick: () => {},
    };

    this.buttons.restartPause = {
      label: '🔄  RESTART',
      x: (GAME_WIDTH - pauseBtnW) / 2,
      y: pauseStartY + gap,
      width: pauseBtnW,
      height: pauseBtnH,
      color: '#16a34a',
      hoverColor: '#22c55e',
      activeColor: '#15803d',
      onClick: () => {},
    };

    this.buttons.soundToggle = {
      label: '🔊  SOUND: ON',
      x: (GAME_WIDTH - pauseBtnW) / 2,
      y: pauseStartY + gap * 2,
      width: pauseBtnW,
      height: pauseBtnH,
      color: '#d97706',
      hoverColor: '#f59e0b',
      activeColor: '#b45309',
      onClick: () => {},
    };

    this.buttons.mainMenu = {
      label: '🏠  MAIN MENU',
      x: (GAME_WIDTH - pauseBtnW) / 2,
      y: pauseStartY + gap * 3,
      width: pauseBtnW,
      height: pauseBtnH,
      color: '#475569',
      hoverColor: '#64748b',
      activeColor: '#334155',
      onClick: () => {},
    };

    for (const key of Object.keys(this.buttons)) {
      this.hoverScale[key] = 1;
      this.pressScale[key] = 1;
    }
  }

  setPlayCallback(cb: () => void): void {
    this.buttons.play.onClick = cb;
  }

  setRestartCallback(cb: () => void): void {
    this.buttons.restart.onClick = cb;
  }

  setResumeCallback(cb: () => void): void {
    this.buttons.resume.onClick = cb;
  }

  setRestartPauseCallback(cb: () => void): void {
    this.buttons.restartPause.onClick = cb;
  }

  setSoundToggleCallback(cb: () => void): void {
    this.buttons.soundToggle.onClick = cb;
  }

  setMainMenuCallback(cb: () => void): void {
    this.buttons.mainMenu.onClick = cb;
  }

  setPauseTriggerCallback(cb: () => void): void {
    this.pauseCallback = cb;
  }

  /** Handle pointer move for hover detection. */
  handlePointerMove(px: number, py: number, state: GameState): void {
    if (state === STATE.MAIN_MENU) {
      this.hoverScale.play = this.contains(this.buttons.play, px, py) ? 1.06 : 1;
    } else if (state === STATE.GAME_OVER) {
      this.hoverScale.restart = this.contains(this.buttons.restart, px, py) ? 1.06 : 1;
    } else if (state === STATE.PAUSED) {
      const pauseKeys = ['resume', 'restartPause', 'soundToggle', 'mainMenu'];
      for (const k of pauseKeys) {
        this.hoverScale[k] = this.contains(this.buttons[k], px, py) ? 1.05 : 1;
      }
    } else if (state === STATE.PLAYING) {
      this.pauseHover = this.inPauseButton(px, py);
    }
    // Mute button hover in main menu
    this.muteHover = this.inMuteButton(px, py);
  }

  /** Handle click/tap. Returns true if a button consumed the event. */
  handleClick(px: number, py: number, state: GameState): boolean {
    if (state === STATE.MAIN_MENU && this.inMuteButton(px, py)) {
      return false; // GameEngine handles mute toggle directly
    }

    if (state === STATE.PLAYING) {
      if (this.inPauseButton(px, py)) {
        if (this.pauseCallback) {
          this.pauseCallback();
        }
        return true;
      }
      return false;
    }

    if (state === STATE.PAUSED) {
      const pauseKeys = ['resume', 'restartPause', 'soundToggle', 'mainMenu'];
      for (const k of pauseKeys) {
        const btn = this.buttons[k];
        if (this.contains(btn, px, py)) {
          this.pressScale[k] = 0.92;
          btn.onClick();
          return true;
        }
      }
      return true;
    }

    const activeKey = state === STATE.MAIN_MENU ? 'play' : state === STATE.GAME_OVER ? 'restart' : null;
    if (activeKey) {
      const btn = this.buttons[activeKey];
      if (this.contains(btn, px, py)) {
        this.pressScale[activeKey] = 0.92;
        btn.onClick();
        return true;
      }
    }
    return false;
  }

  private contains(btn: Button, px: number, py: number): boolean {
    return px >= btn.x && px <= btn.x + btn.width && py >= btn.y && py <= btn.y + btn.height;
  }

  private inMuteButton(px: number, py: number): boolean {
    const r = 18;
    const cx = GAME_WIDTH - 32;
    const cy = 32;
    const dx = px - cx;
    const dy = py - cy;
    return dx * dx + dy * dy <= r * r;
  }

  getMuteButtonRect(): { x: number; y: number; r: number } {
    return { x: GAME_WIDTH - 32, y: 32, r: 18 };
  }

  inPauseButton(px: number, py: number): boolean {
    const rect = this.getPauseButtonRect();
    const dx = px - rect.x;
    const dy = py - rect.y;
    return dx * dx + dy * dy <= rect.r * rect.r;
  }

  getPauseButtonRect(): { x: number; y: number; r: number } {
    return { x: GAME_WIDTH - 28, y: 26, r: 24 };
  }

  private updateScales(dt: number): void {
    for (const key of Object.keys(this.hoverScale)) {
      const target = this.pressScale[key] < 1 ? this.pressScale[key] : this.hoverScale[key];
      this.hoverScale[key] += (target - this.hoverScale[key]) * Math.min(1, dt * 15);
      this.pressScale[key] += (1 - this.pressScale[key]) * Math.min(1, dt * 15);
    }
  }

  showRecordBanner(score: number): void {
    this.recordBannerScore = score;
    this.recordBannerTimer = this.recordBannerDuration;
  }

  update(dt: number): void {
    this.updateScales(dt);
    if (this.recordBannerTimer > 0) {
      this.recordBannerTimer = Math.max(0, this.recordBannerTimer - dt);
    }
  }

  // ---- Drawing ----

  drawMainMenu(ctx: CanvasRenderingContext2D, alpha: number, muted: boolean, bestScore: number): void {
    ctx.globalAlpha = alpha;

    // Cartoon logo: stickman bouncing on a green platform
    this.drawLogo(ctx, GAME_WIDTH / 2, GAME_HEIGHT * 0.16);

    // Title — 3D layered sky-blue with white outline
    this.drawTitle(ctx, 'Sky Jumper', GAME_WIDTH / 2, GAME_HEIGHT * 0.30);

    // Best score badge (just below the title)
    ctx.fillStyle = COLORS.coinText;
    ctx.font = 'bold 20px Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Best Score: ${bestScore}m`, GAME_WIDTH / 2, GAME_HEIGHT * 0.37);

    // Subtitle
    ctx.fillStyle = COLORS.textLight;
    ctx.font = '400 18px Roboto, sans-serif';
    ctx.fillText('How high can you climb?', GAME_WIDTH / 2, GAME_HEIGHT * 0.42);

    // Play button
    this.drawButton(ctx, 'play');

    // Controls hint
    ctx.fillStyle = COLORS.textLight;
    ctx.font = '400 14px Roboto, sans-serif';
    ctx.fillText('← → or A / D to move', GAME_WIDTH / 2, GAME_HEIGHT * 0.70);
    ctx.fillText('Space / Enter or Tap to jump into action', GAME_WIDTH / 2, GAME_HEIGHT * 0.74);

    // Mute button + tooltip
    this.drawMuteButton(ctx, muted);
    this.drawMuteLabel(ctx, muted);

    ctx.globalAlpha = 1;
  }

  drawHUD(
    ctx: CanvasRenderingContext2D,
    height: number,
    coins: number,
    bestScore: number,
    isBest = false,
    hasShield = false,
    hasJetpack = false,
    jetpackTimer = 0,
    hasMagnet = false,
    magnetTimer = 0,
  ): void {
    ctx.save();

    // Clean drop-shadow on all HUD text for readability across any sky color
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 1.5;

    // 1. Current SCORE on top-left
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 19px Roboto, sans-serif';
    ctx.fillText(`SCORE: ${height}m`, 16, 26);

    // If currently beating previous record, highlight with glowing star badge
    if (isBest && height > 0) {
      const scoreWidth = ctx.measureText(`SCORE: ${height}m`).width;
      ctx.fillStyle = '#fde047'; // Bright gold
      ctx.font = '900 13px Roboto, sans-serif';
      ctx.fillText('★ BEST', 24 + scoreWidth, 26);
    } else if (bestScore > 0) {
      // 2. Persistent BEST RECORD target in subtle gold
      const scoreWidth = ctx.measureText(`SCORE: ${height}m`).width;
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 13px Roboto, sans-serif';
      ctx.fillText(`(BEST: ${bestScore}m)`, 24 + scoreWidth, 26);
    }

    // 3. Power-Up indicators stacked cleanly on top-left
    let powerupY = 50;

    if (hasShield) {
      ctx.fillStyle = '#38bdf8';
      ctx.font = '900 13px Roboto, sans-serif';
      ctx.shadowColor = 'rgba(56, 189, 248, 0.7)';
      ctx.shadowBlur = 6;
      ctx.fillText('🛡️ SHIELD ON', 16, powerupY);
      powerupY += 22;
    }

    if (hasJetpack) {
      ctx.fillStyle = '#f97316';
      ctx.font = '900 13px Roboto, sans-serif';
      ctx.shadowColor = 'rgba(249, 115, 22, 0.7)';
      ctx.shadowBlur = 6;
      ctx.fillText(`🚀 JETPACK ${Math.max(0, jetpackTimer).toFixed(1)}s`, 16, powerupY);
      powerupY += 22;
    }

    if (hasMagnet) {
      ctx.fillStyle = '#c084fc';
      ctx.font = '900 13px Roboto, sans-serif';
      ctx.shadowColor = 'rgba(192, 132, 252, 0.7)';
      ctx.shadowBlur = 6;
      ctx.fillText(`🧲 MAGNET ${Math.max(0, magnetTimer).toFixed(1)}s`, 16, powerupY);
    }

    ctx.shadowBlur = 4;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';

    // 4. COIN on top-right (to the left of pause button)
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fef08a';
    ctx.font = '900 18px Roboto, sans-serif';
    ctx.fillText(`🪙 ${coins}`, GAME_WIDTH - 60, 26);

    ctx.restore();

    // In-game Pause / Menu button
    this.drawPauseButton(ctx);

    // New Record banner notification
    if (this.recordBannerTimer > 0) {
      this.drawRecordBanner(ctx);
    }
  }

  private drawRecordBanner(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const totalDuration = this.recordBannerDuration;
    const timeLeft = this.recordBannerTimer;
    const elapsed = totalDuration - timeLeft;

    // Fade in (first 0.3s) and fade out (last 0.4s)
    let alpha = 1;
    if (elapsed < 0.3) {
      alpha = elapsed / 0.3;
    } else if (timeLeft < 0.4) {
      alpha = timeLeft / 0.4;
    }
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

    // Entry slide and bounce
    let y = 84;
    if (elapsed < 0.35) {
      const t = elapsed / 0.35;
      y = 40 + (84 - 40) * (Math.sin(t * Math.PI / 2));
    }

    const pillW = 270;
    const pillH = 46;
    const pillX = (GAME_WIDTH - pillW) / 2;
    const pillY = y;

    // Glowing shadow
    ctx.shadowColor = 'rgba(245, 158, 11, 0.6)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 4;

    // Golden gradient background
    const grad = ctx.createLinearGradient(pillX, pillY, pillX, pillY + pillH);
    grad.addColorStop(0, '#fbbf24');
    grad.addColorStop(1, '#d97706');
    ctx.fillStyle = grad;

    // Rounded pill
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(pillX, pillY, pillW, pillH, 23);
    } else {
      ctx.rect(pillX, pillY, pillW, pillH);
    }
    ctx.fill();

    // Border
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#fef08a';
    ctx.stroke();

    // Text: 🏆 NEW RECORD!
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 17px Roboto, sans-serif';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;
    ctx.fillText(`🏆 NEW RECORD: ${this.recordBannerScore}m!`, GAME_WIDTH / 2, pillY + pillH / 2);

    ctx.restore();
  }

  private drawPauseButton(ctx: CanvasRenderingContext2D): void {
    const { x, y } = this.getPauseButtonRect();
    ctx.save();

    // Subtle drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 1.5;

    // Translucent round button
    ctx.fillStyle = this.pauseHover ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.28)';
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fill();

    // Subtle outline
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.stroke();

    // Pause bars || in crisp white
    ctx.fillStyle = '#ffffff';
    const barW = 3.5;
    const barH = 13;
    const offset = 3.5;
    ctx.fillRect(x - offset - barW / 2, y - barH / 2, barW, barH);
    ctx.fillRect(x + offset - barW / 2, y - barH / 2, barW, barH);

    ctx.restore();
  }

  drawPauseMenu(
    ctx: CanvasRenderingContext2D,
    height: number,
    coins: number,
    muted: boolean,
  ): void {
    // Soft dark backdrop overlay
    ctx.fillStyle = 'rgba(15, 23, 42, 0.70)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Modal Card Container
    const cardW = 320;
    const cardH = 430;
    const cardX = (GAME_WIDTH - cardW) / 2;
    const cardY = GAME_HEIGHT * 0.22;

    // Card shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    this.roundRectPath(ctx, cardX + 3, cardY + 5, cardW, cardH, 20);
    ctx.fill();

    // Card background
    ctx.fillStyle = '#ffffff';
    this.roundRectPath(ctx, cardX, cardY, cardW, cardH, 20);
    ctx.fill();

    // Card subtle border
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    this.roundRectPath(ctx, cardX, cardY, cardW, cardH, 20);
    ctx.stroke();

    // Title: PAUSED
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 30px Roboto, sans-serif';
    ctx.fillText('PAUSED', GAME_WIDTH / 2, cardY + 42);

    // Score & Coins badge
    ctx.fillStyle = '#f1f5f9';
    this.roundRectPath(ctx, cardX + 24, cardY + 70, cardW - 48, 34, 10);
    ctx.fill();

    ctx.fillStyle = '#475569';
    ctx.font = '600 15px Roboto, sans-serif';
    ctx.fillText(`Score: ${height}m   •   Coins: ${coins}`, GAME_WIDTH / 2, cardY + 87);

    // Update sound button label and colors dynamically
    this.buttons.soundToggle.label = muted ? '🔇  SOUND: OFF' : '🔊  SOUND: ON';
    this.buttons.soundToggle.color = muted ? '#64748b' : '#d97706';
    this.buttons.soundToggle.hoverColor = muted ? '#94a3b8' : '#f59e0b';
    this.buttons.soundToggle.activeColor = muted ? '#475569' : '#b45309';

    // Draw buttons
    this.drawButton(ctx, 'resume');
    this.drawButton(ctx, 'restartPause');
    this.drawButton(ctx, 'soundToggle');
    this.drawButton(ctx, 'mainMenu');

    // Hint at bottom
    ctx.fillStyle = '#94a3b8';
    ctx.font = '400 13px Roboto, sans-serif';
    ctx.fillText('Press Esc or P to resume', GAME_WIDTH / 2, cardY + cardH - 20);
  }

  drawGameOver(
    ctx: CanvasRenderingContext2D,
    alpha: number,
    height: number,
    coins: number,
    bestScore: number,
    isNewBest: boolean,
  ): void {
    ctx.globalAlpha = alpha;

    // Overlay
    ctx.fillStyle = COLORS.overlay;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Title
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 46px Roboto, sans-serif';
    ctx.fillText('Game Over', GAME_WIDTH / 2, GAME_HEIGHT * 0.26);

    // Stats
    ctx.font = 'bold 26px Roboto, sans-serif';
    ctx.fillStyle = COLORS.text;
    ctx.fillText(`SCORE: ${height}m`, GAME_WIDTH / 2, GAME_HEIGHT * 0.36);
    ctx.fillText(`COINS: ${coins}`, GAME_WIDTH / 2, GAME_HEIGHT * 0.42);

    // Best score line with highlight
    if (isNewBest) {
      ctx.fillStyle = COLORS.coinText;
      ctx.font = 'bold 22px Roboto, sans-serif';
      ctx.fillText(`★ NEW BEST SCORE: ${bestScore}m! ★`, GAME_WIDTH / 2, GAME_HEIGHT * 0.49);
    } else {
      ctx.fillStyle = COLORS.text;
      ctx.font = '500 20px Roboto, sans-serif';
      ctx.fillText(`BEST SCORE: ${bestScore}m`, GAME_WIDTH / 2, GAME_HEIGHT * 0.49);
    }

    // Restart button
    this.drawButton(ctx, 'restart');

    // Hint
    ctx.fillStyle = COLORS.text;
    ctx.font = '400 14px Roboto, sans-serif';
    ctx.fillText('Press Space / Enter or Tap to restart', GAME_WIDTH / 2, GAME_HEIGHT * 0.72);

    ctx.globalAlpha = 1;
  }

  private drawButton(ctx: CanvasRenderingContext2D, key: string): void {
    const btn = this.buttons[key];
    const scale = this.hoverScale[key];
    const cx = btn.x + btn.width / 2;
    const cy = btn.y + btn.height / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);

    // Shadow
    ctx.fillStyle = COLORS.shadow;
    this.roundRectPath(ctx, btn.x + 2, btn.y + 4, btn.width, btn.height, 12);
    ctx.fill();

    // Body
    ctx.fillStyle = scale > 1.02 ? btn.hoverColor : btn.color;
    this.roundRectPath(ctx, btn.x, btn.y, btn.width, btn.height, 12);
    ctx.fill();

    // Label
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = btn.height <= 52 ? 'bold 18px Roboto, sans-serif' : 'bold 24px Roboto, sans-serif';
    ctx.fillText(btn.label, cx, cy);

    ctx.restore();
  }

  private drawMuteButton(ctx: CanvasRenderingContext2D, muted: boolean): void {
    const { x, y, r } = this.getMuteButtonRect();
    ctx.save();

    // Circle
    ctx.fillStyle = this.muteHover ? COLORS.buttonHover : COLORS.button;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Speaker icon
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';

    // Speaker body
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 3);
    ctx.lineTo(x - 2, y - 3);
    ctx.lineTo(x + 3, y - 7);
    ctx.lineTo(x + 3, y + 7);
    ctx.lineTo(x - 2, y + 3);
    ctx.lineTo(x - 6, y + 3);
    ctx.closePath();
    ctx.fill();

    if (muted) {
      // Slash
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x - 9, y - 9);
      ctx.lineTo(x + 9, y + 9);
      ctx.stroke();
    } else {
      // Sound waves
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + 5, y, 5, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawMuteLabel(ctx: CanvasRenderingContext2D, muted: boolean): void {
    const { x, y, r } = this.getMuteButtonRect();
    ctx.save();
    ctx.font = '600 11px Roboto, sans-serif';
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(muted ? 'SOUND: OFF' : 'SOUND: ON', x, y + r + 14);
    ctx.restore();
  }

  private drawLogo(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    ctx.save();

    // Bright green platform
    ctx.fillStyle = COLORS.staticPlatform;
    ctx.strokeStyle = COLORS.staticPlatformDark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 36, 52, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Spring on platform
    ctx.strokeStyle = COLORS.springCoil;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const y0 = cy + 30 - i * 6;
      ctx.moveTo(cx - 8, y0);
      ctx.lineTo(cx + 8, y0 - 3);
    }
    ctx.stroke();

    // Stickman body (mid-bounce, slightly above platform)
    const headY = cy - 18;
    const bodyTop = headY + 14;
    const bodyBottom = bodyTop + 28;

    ctx.strokeStyle = COLORS.player;
    ctx.fillStyle = COLORS.player;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';

    // Head
    ctx.beginPath();
    ctx.arc(cx, headY, 11, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.beginPath();
    ctx.moveTo(cx, bodyTop);
    ctx.lineTo(cx, bodyBottom);
    ctx.stroke();

    // Arms — spread upward in jump pose
    ctx.beginPath();
    ctx.moveTo(cx, bodyTop + 6);
    ctx.lineTo(cx - 16, bodyTop - 4);
    ctx.moveTo(cx, bodyTop + 6);
    ctx.lineTo(cx + 16, bodyTop - 4);
    ctx.stroke();

    // Legs — bent in jump pose
    ctx.beginPath();
    ctx.moveTo(cx, bodyBottom);
    ctx.lineTo(cx - 12, bodyBottom + 14);
    ctx.moveTo(cx, bodyBottom);
    ctx.lineTo(cx + 12, bodyBottom + 14);
    ctx.stroke();

    // Motion lines
    ctx.strokeStyle = COLORS.playerAccent;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx - 22, cy + 20);
    ctx.lineTo(cx - 30, cy + 20);
    ctx.moveTo(cx + 22, cy + 20);
    ctx.lineTo(cx + 30, cy + 20);
    ctx.stroke();

    ctx.restore();
  }

  private drawTitle(ctx: CanvasRenderingContext2D, text: string, cx: number, cy: number): void {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 56px Roboto, sans-serif';

    // Outer glow — soft blue halo around the text
    ctx.shadowColor = '#42a5f5';
    ctx.shadowBlur = 24;

    // 3D depth layers (darker blue receding, stacked behind the face)
    const depthLayers = [
      { dx: 0, dy: 6, color: '#0d47a1' },
      { dx: 0, dy: 5, color: '#1565c0' },
      { dx: 0, dy: 4, color: '#1976d2' },
      { dx: 0, dy: 3, color: '#1e88e5' },
      { dx: 0, dy: 2, color: '#2196f3' },
    ];
    for (const layer of depthLayers) {
      ctx.fillStyle = layer.color;
      ctx.fillText(text, cx + layer.dx, cy + layer.dy);
    }

    // White outline for crisp edge
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.strokeText(text, cx, cy);

    // Main face — saturated blue with a subtle inner glow
    ctx.shadowColor = '#90caf9';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#1976d2';
    ctx.fillText(text, cx, cy);

    // Tiny star accent above the second word
    ctx.shadowBlur = 0;
    const fullWidth = ctx.measureText(text).width;
    const jumperWidth = ctx.measureText('Jumper').width;
    const starX = cx + fullWidth / 2 - jumperWidth / 2;
    this.drawStar(ctx, starX, cy - 34, 5, 7, 3.5);

    ctx.restore();
  }

  private drawStar(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerR: number,
    innerR: number,
  ): void {
    ctx.save();
    ctx.beginPath();
    let rot = -Math.PI / 2;
    const step = Math.PI / spikes;
    ctx.moveTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    for (let i = 0; i < spikes; i++) {
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    }
    ctx.closePath();

    // Golden star with glow
    ctx.shadowColor = '#ffd54f';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffd54f';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ff8f00';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  private roundRectPath(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ): void {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }
}
