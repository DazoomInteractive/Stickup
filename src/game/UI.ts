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
  GAME_VERSION,
  type GameState,
} from './constants';
import type { Button } from './types';
import {
  ShopManager,
  TRAILS,
  SKINS,
  BACKGROUNDS,
} from './ShopManager';
import { AdsService } from './AdsService';

export const PRIVACY_POLICY_URL =
  'https://telegra.ph/Sky-Jumper-2D---Privacy-Policy--Terms-of-Service-09-15';

export function openPrivacyPolicy(): void {
  if (typeof window !== 'undefined') {
    try {
      window.open(PRIVACY_POLICY_URL, '_blank', 'noopener,noreferrer');
    } catch {
      window.location.href = PRIVACY_POLICY_URL;
    }
  }
}

export class UI {
  private buttons: Record<string, Button> = {};
  private hoverScale: Record<string, number> = {};
  private pressScale: Record<string, number> = {};

  // Mute button state
  private muteHover = false;
  // Pause button state
  private pauseHover = false;

  private pauseCallback: (() => void) | null = null;

  // Game over ad state tracking to prevent phantom button clicks
  private gameOverCanRevive = true;
  private gameOverCanRecover = true;

  // New Record celebration banner state
  private recordBannerTimer = 0;
  private recordBannerDuration = 2.8;
  private recordBannerScore = 0;

  constructor() {
    this.createButtons();
  }

  private createButtons(): void {
    const btnW = 240;
    const btnH = 54;

    this.buttons.play = {
      label: 'PLAY',
      x: (GAME_WIDTH - btnW) / 2,
      y: GAME_HEIGHT * 0.49,
      width: btnW,
      height: btnH,
      color: COLORS.button,
      hoverColor: COLORS.buttonHover,
      activeColor: COLORS.buttonActive,
      onClick: () => {},
    };

    this.buttons.shopMenu = {
      label: '🛒  SHOP & UPGRADES',
      x: (GAME_WIDTH - btnW) / 2,
      y: GAME_HEIGHT * 0.58,
      width: btnW,
      height: 48,
      color: '#7c3aed',
      hoverColor: '#8b5cf6',
      activeColor: '#6d28d9',
      onClick: () => {},
    };

    this.buttons.restart = {
      label: '🔄  RESTART',
      x: (GAME_WIDTH - btnW) / 2,
      y: GAME_HEIGHT * 0.58,
      width: btnW,
      height: btnH,
      color: COLORS.button,
      hoverColor: COLORS.buttonHover,
      activeColor: COLORS.buttonActive,
      onClick: () => {},
    };

    this.buttons.shopGameOver = {
      label: '🛒  SHOP & UPGRADES',
      x: (GAME_WIDTH - btnW) / 2,
      y: GAME_HEIGHT * 0.66,
      width: btnW,
      height: 48,
      color: '#7c3aed',
      hoverColor: '#8b5cf6',
      activeColor: '#6d28d9',
      onClick: () => {},
    };

    // Rewarded Ad Buttons for Mobile / PWA / Uptodown (Strictly hidden on Itch.io)
    this.buttons.recoverDiamonds = {
      label: '📺 RECOVER 100% 💎',
      x: (GAME_WIDTH - 250) / 2,
      y: GAME_HEIGHT * 0.52,
      width: 250,
      height: 46,
      color: '#059669',
      hoverColor: '#10b981',
      activeColor: '#047857',
      onClick: () => {},
    };

    this.buttons.revive = {
      label: '📺 REVIVE & RESCUE 🚀',
      x: (GAME_WIDTH - 250) / 2,
      y: GAME_HEIGHT * 0.59,
      width: 250,
      height: 46,
      color: '#ea580c',
      hoverColor: '#f97316',
      activeColor: '#c2410c',
      onClick: () => {},
    };

    // Pause Menu buttons
    const pauseBtnW = 240;
    const pauseBtnH = 46;
    const pauseStartY = GAME_HEIGHT * 0.17 + 104;
    const gap = 53;

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

    this.buttons.privacyPause = {
      label: '🔒  PRIVACY & TERMS',
      x: (GAME_WIDTH - pauseBtnW) / 2,
      y: pauseStartY + gap * 4,
      width: pauseBtnW,
      height: 42,
      color: '#334155',
      hoverColor: '#475569',
      activeColor: '#1e293b',
      onClick: () => {
        openPrivacyPolicy();
      },
    };

    // Main Menu bottom Privacy Policy link button
    this.buttons.privacyMenu = {
      label: '🔒  Privacy Policy & Terms',
      x: (GAME_WIDTH - 240) / 2,
      y: GAME_HEIGHT * 0.772,
      width: 240,
      height: 34,
      color: 'rgba(15, 23, 42, 0.82)',
      hoverColor: 'rgba(30, 41, 59, 0.95)',
      activeColor: '#0f172a',
      onClick: () => {
        openPrivacyPolicy();
      },
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

  setRecoverDiamondsCallback(cb: () => void): void {
    this.buttons.recoverDiamonds.onClick = cb;
  }

  setReviveCallback(cb: () => void): void {
    this.buttons.revive.onClick = cb;
  }

  setShopCallback(cb: () => void): void {
    this.buttons.shopMenu.onClick = cb;
    this.buttons.shopGameOver.onClick = cb;
  }

  /** Handle pointer move for hover detection. */
  handlePointerMove(px: number, py: number, state: GameState): void {
    if (state === STATE.MAIN_MENU) {
      this.hoverScale.play = this.contains(this.buttons.play, px, py) ? 1.06 : 1;
      this.hoverScale.shopMenu = this.contains(this.buttons.shopMenu, px, py) ? 1.05 : 1;
      this.hoverScale.privacyMenu = this.contains(this.buttons.privacyMenu, px, py) ? 1.05 : 1;
    } else if (state === STATE.GAME_OVER) {
      const adsAvailable = AdsService.getInstance().isAdsEnabled();

      this.hoverScale.revive = adsAvailable && this.gameOverCanRevive && this.contains(this.buttons.revive, px, py) ? 1.05 : 1;
      this.hoverScale.recoverDiamonds = adsAvailable && this.gameOverCanRecover && this.contains(this.buttons.recoverDiamonds, px, py) ? 1.05 : 1;
      this.hoverScale.restart = this.contains(this.buttons.restart, px, py) ? 1.06 : 1;
      this.hoverScale.shopGameOver = this.contains(this.buttons.shopGameOver, px, py) ? 1.05 : 1;
    } else if (state === STATE.PAUSED) {
      const pauseKeys = ['resume', 'restartPause', 'soundToggle', 'mainMenu', 'privacyPause'];
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
      const pauseKeys = ['resume', 'restartPause', 'soundToggle', 'mainMenu', 'privacyPause'];
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

    if (state === STATE.MAIN_MENU) {
      if (this.contains(this.buttons.play, px, py)) {
        this.pressScale.play = 0.92;
        this.buttons.play.onClick();
        return true;
      }
      if (this.contains(this.buttons.shopMenu, px, py)) {
        this.pressScale.shopMenu = 0.92;
        this.buttons.shopMenu.onClick();
        return true;
      }
      if (this.contains(this.buttons.privacyMenu, px, py)) {
        this.pressScale.privacyMenu = 0.92;
        this.buttons.privacyMenu.onClick();
        return true;
      }
    }

    if (state === STATE.GAME_OVER) {
      const adsAvailable = AdsService.getInstance().isAdsEnabled();

      if (adsAvailable && this.gameOverCanRevive && this.contains(this.buttons.revive, px, py)) {
        this.pressScale.revive = 0.92;
        this.buttons.revive.onClick();
        return true;
      }

      if (adsAvailable && this.gameOverCanRecover && this.contains(this.buttons.recoverDiamonds, px, py)) {
        this.pressScale.recoverDiamonds = 0.92;
        this.buttons.recoverDiamonds.onClick();
        return true;
      }

      if (this.contains(this.buttons.restart, px, py)) {
        this.pressScale.restart = 0.92;
        this.buttons.restart.onClick();
        return true;
      }

      if (this.contains(this.buttons.shopGameOver, px, py)) {
        this.pressScale.shopGameOver = 0.92;
        this.buttons.shopGameOver.onClick();
        return true;
      }
    }
    return false;
  }

  private contains(btn: Button, px: number, py: number, pad = 8): boolean {
    return (
      px >= btn.x - pad &&
      px <= btn.x + btn.width + pad &&
      py >= btn.y - pad &&
      py <= btn.y + btn.height + pad
    );
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

  /**
   * High-contrast, cinematic Studio Intro (Заставка)
   * Featuring DazzomInteractive emblem, game logo, and legal anti-piracy warning.
   */
  drawSplash(ctx: CanvasRenderingContext2D, alpha: number, elapsed: number): void {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

    // 1. Sleek dark studio gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    bgGrad.addColorStop(0, '#090d16');
    bgGrad.addColorStop(0.5, '#0f172a');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Subtle background grid accent dots
    ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
    for (let x = 25; x < GAME_WIDTH; x += 40) {
      for (let y = 30; y < GAME_HEIGHT; y += 40) {
        ctx.fillRect(x, y, 2, 2);
      }
    }

    // 2. Glowing Studio Emblem (DazzomInteractive Diamond Emblem)
    const logoY = GAME_HEIGHT * 0.17;
    ctx.save();
    ctx.translate(GAME_WIDTH / 2, logoY);

    // Outer glow aura
    const auraGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 65);
    auraGrad.addColorStop(0, 'rgba(56, 189, 248, 0.28)');
    auraGrad.addColorStop(0.7, 'rgba(99, 102, 241, 0.12)');
    auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 65, 0, Math.PI * 2);
    ctx.fill();

    // Hexagonal diamond emblem badge
    ctx.shadowColor = 'rgba(56, 189, 248, 0.6)';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    const r = 36;
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const hx = Math.cos(angle) * r;
      const hy = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Stylized "D" gaming monogram
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#38bdf8';
    ctx.font = '900 28px Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('D', 0, 1);
    ctx.restore();

    // 3. Studio Branding text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = 'rgba(56, 189, 248, 0.5)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#f8fafc';
    ctx.font = '900 22px Roboto, sans-serif';
    ctx.fillText('DAZZOM INTERACTIVE', GAME_WIDTH / 2, GAME_HEIGHT * 0.26);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px Roboto, sans-serif';
    ctx.fillText('—  P R E S E N T S  —', GAME_WIDTH / 2, GAME_HEIGHT * 0.295);

    // 4. Game Title + Version Pill
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = '#38bdf8';
    ctx.font = '900 36px Roboto, sans-serif';
    ctx.fillText('STICKUP', GAME_WIDTH / 2, GAME_HEIGHT * 0.36);

    // Version pill badge
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    const badgeW = 92;
    const badgeH = 22;
    const badgeX = (GAME_WIDTH - badgeW) / 2;
    const badgeY = GAME_HEIGHT * 0.395;

    ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 11);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#e0f2fe';
    ctx.font = '900 12px Roboto, sans-serif';
    ctx.fillText(`${GAME_VERSION} V`, GAME_WIDTH / 2, badgeY + badgeH / 2);

    // 5. Official Project & Creator Credit Card
    const cardW = 394;
    const cardH = 192;
    const cardX = (GAME_WIDTH - cardW) / 2;
    const cardY = GAME_HEIGHT * 0.44;

    // Card background & glowing border
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.42)';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 14);
    ctx.fill();
    ctx.stroke();

    // Card Header: StickUp v2.0.0
    ctx.shadowBlur = 0;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#38bdf8';
    ctx.font = '900 17px Roboto, sans-serif';
    ctx.fillText('StickUp v2.0.0', GAME_WIDTH / 2, cardY + 28);

    // Divider line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cardX + 28, cardY + 48);
    ctx.lineTo(cardX + cardW - 28, cardY + 48);
    ctx.stroke();

    // Created & Developed by:
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 12px Roboto, sans-serif';
    ctx.fillText('Created & Developed by:', GAME_WIDTH / 2, cardY + 70);

    // DazzomInteractive
    ctx.fillStyle = '#f8fafc';
    ctx.font = '900 17px Roboto, sans-serif';
    ctx.fillText('DazzomInteractive', GAME_WIDTH / 2, cardY + 95);

    // Built with the assistance of AI (Google AI Studio)
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '500 12px Roboto, sans-serif';
    ctx.fillText('Built with the assistance of AI (Google AI Studio)', GAME_WIDTH / 2, cardY + 128);

    // © 2026 DazzomInteractive.
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px Roboto, sans-serif';
    ctx.fillText('© 2026 DazzomInteractive.', GAME_WIDTH / 2, cardY + 158);

    // 6. Progress bar (fills in 2.2 seconds, waits for user tap)
    const progW = 260;
    const progH = 6;
    const progX = (GAME_WIDTH - progW) / 2;
    const progY = cardY + cardH + 24;
    const loadDuration = 2.2;
    const progress = Math.min(1, elapsed / loadDuration);
    const isLoaded = progress >= 1.0;

    // Track background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.roundRect(progX, progY, progW, progH, 3);
    ctx.fill();

    // Filled progress
    ctx.fillStyle = isLoaded ? '#22c55e' : '#38bdf8';
    ctx.shadowColor = isLoaded ? 'rgba(34, 197, 94, 0.8)' : 'rgba(56, 189, 248, 0.8)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(progX, progY, progW * progress, progH, 3);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Loading status text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (!isLoaded) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px Roboto, sans-serif';
      ctx.fillText(`LOADING... ${Math.floor(progress * 100)}%`, GAME_WIDTH / 2, progY + 18);
    } else {
      ctx.fillStyle = '#86efac';
      ctx.font = 'bold 11px Roboto, sans-serif';
      ctx.fillText('100% READY', GAME_WIDTH / 2, progY + 18);
    }

    // 7. Interactive Tap to Continue Button (pulsing when loaded)
    const pulse = 0.7 + 0.3 * Math.sin(elapsed * 5);
    const btnW = 260;
    const btnH = 40;
    const btnX = (GAME_WIDTH - btnW) / 2;
    const btnY = progY + 34;

    ctx.save();
    ctx.globalAlpha = alpha * (isLoaded ? pulse : 0.65);
    ctx.fillStyle = isLoaded ? 'rgba(14, 165, 233, 0.25)' : 'rgba(15, 23, 42, 0.5)';
    ctx.strokeStyle = isLoaded ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = isLoaded ? 1.8 : 1;
    if (isLoaded) {
      ctx.shadowColor = 'rgba(56, 189, 248, 0.6)';
      ctx.shadowBlur = 10;
    }
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, 20);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = isLoaded ? '#ffffff' : '#94a3b8';
    ctx.font = '900 13px Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isLoaded ? '▶  TAP SCREEN TO PLAY  ◀' : 'TAP TO SKIP  ▶', GAME_WIDTH / 2, btnY + btnH / 2);
    ctx.restore();

    ctx.restore();
  }

  drawMainMenu(ctx: CanvasRenderingContext2D, alpha: number, muted: boolean, bestScore: number): void {
    ctx.globalAlpha = alpha;

    // Top Version badge (2.0.0 V) with solid dark background
    const verBadgeW = 82;
    const verBadgeH = 26;
    const verBadgeX = 16;
    const verBadgeY = 16;

    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(verBadgeX, verBadgeY, verBadgeW, verBadgeH, 13);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = '900 12px Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${GAME_VERSION.replace('v', '')} V`, verBadgeX + verBadgeW / 2, verBadgeY + verBadgeH / 2);
    ctx.restore();

    // Cartoon logo: stickman bouncing on a green platform
    this.drawLogo(ctx, GAME_WIDTH / 2, GAME_HEIGHT * 0.16);

    // Title — 3D layered sky-blue with white outline
    this.drawTitle(ctx, 'StickUp', GAME_WIDTH / 2, GAME_HEIGHT * 0.30);

    // Best score badge in a clean dark pill container (immune to clouds)
    const scorePillW = 210;
    const scorePillH = 36;
    const scorePillX = (GAME_WIDTH - scorePillW) / 2;
    const scorePillY = GAME_HEIGHT * 0.37;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(scorePillX, scorePillY, scorePillW, scorePillH, 18);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 16px Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`🏆 Best Score: ${bestScore}m`, GAME_WIDTH / 2, scorePillY + scorePillH / 2);
    ctx.restore();

    // Subtitle — High contrast dark navy with white rim (crisp over sky and clouds)
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 17px Roboto, sans-serif';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.5;
    ctx.strokeText('How high can you climb?', GAME_WIDTH / 2, GAME_HEIGHT * 0.445);
    ctx.fillStyle = '#0f243c';
    ctx.fillText('How high can you climb?', GAME_WIDTH / 2, GAME_HEIGHT * 0.445);
    ctx.restore();

    // Play button & Shop button
    this.drawButton(ctx, 'play');
    this.drawButton(ctx, 'shopMenu');

    // Controls hint in high-contrast dark card (never blends with white clouds)
    const ctrlW = 348;
    const ctrlH = 54;
    const ctrlX = (GAME_WIDTH - ctrlW) / 2;
    const ctrlY = GAME_HEIGHT * 0.665;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(ctrlX, ctrlY, ctrlW, ctrlH, 14);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 13px Roboto, sans-serif';
    ctx.fillText('🎮 CONTROLS: ← → or A / D to move', GAME_WIDTH / 2, ctrlY + 18);

    ctx.fillStyle = '#93c5fd';
    ctx.font = '500 12px Roboto, sans-serif';
    ctx.fillText('Space / Enter or Tap to jump into action', GAME_WIDTH / 2, ctrlY + 38);
    ctx.restore();

    // Privacy Policy button
    this.drawButton(ctx, 'privacyMenu');

    // Bottom Anti-Piracy Copyright in clean dark pill (fully readable)
    const footW = 310;
    const footH = 34;
    const footX = (GAME_WIDTH - footW) / 2;
    const footY = GAME_HEIGHT * 0.845;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(footX, footY, footW, footH, 17);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 11px Roboto, sans-serif';
    ctx.fillText('© 2026 DazzomInteractive · All Rights Reserved', GAME_WIDTH / 2, footY + 12);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 10px Roboto, sans-serif';
    ctx.fillText('Protected Original IP · Official Release', GAME_WIDTH / 2, footY + 23);
    ctx.restore();

    // Mute button + tooltip
    this.drawMuteButton(ctx, muted);
    this.drawMuteLabel(ctx, muted);

    ctx.globalAlpha = 1;
  }

  drawHUD(
    ctx: CanvasRenderingContext2D,
    height: number,
    coins: number,
    relics = 0,
    bestScore: number,
    isBest = false,
    hasShield = false,
    hasJetpack = false,
    jetpackTimer = 0,
    hasMagnet = false,
    magnetTimer = 0,
    hasMultiplier = false,
    multiplierTimer = 0,
  ): void {
    ctx.save();

    // Clean drop-shadow on all HUD text for readability across any sky color
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 1.5;

    // 1. Current SCORE on top-left (with dark pill backing so white clouds never obscure it)
    const scorePillW = isBest ? 195 : (bestScore > 0 ? 215 : 135);
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(10, 10, scorePillW, 32, 16);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 18px Roboto, sans-serif';
    ctx.fillText(`SCORE: ${height}m`, 20, 26);

    // If currently beating previous record, highlight with glowing star badge
    if (isBest && height > 0) {
      const scoreWidth = ctx.measureText(`SCORE: ${height}m`).width;
      ctx.fillStyle = '#fde047'; // Bright gold
      ctx.font = '900 12px Roboto, sans-serif';
      ctx.fillText('★ BEST', 26 + scoreWidth, 26);
    } else if (bestScore > 0) {
      // 2. Persistent BEST RECORD target in subtle gold
      const scoreWidth = ctx.measureText(`SCORE: ${height}m`).width;
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 12px Roboto, sans-serif';
      ctx.fillText(`(BEST: ${bestScore}m)`, 26 + scoreWidth, 26);
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
      powerupY += 22;
    }

    if (hasMultiplier) {
      ctx.fillStyle = '#f59e0b';
      ctx.font = '900 13px Roboto, sans-serif';
      ctx.shadowColor = 'rgba(245, 158, 11, 0.7)';
      ctx.shadowBlur = 6;
      ctx.fillText(`🪙 2X MULTIPLIER ${Math.max(0, multiplierTimer).toFixed(1)}s`, 16, powerupY);
      powerupY += 22;
    }

    ctx.shadowBlur = 4;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';

    // 4. COIN on top-right (with dark pill backing)
    const coinText = `🪙 ${coins}`;
    ctx.font = '900 15px Roboto, sans-serif';
    const coinMeasure = ctx.measureText(coinText).width;
    const coinPillW = Math.max(74, coinMeasure + 20);
    const coinPillX = GAME_WIDTH - 56 - coinPillW;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(coinPillX, 10, coinPillW, 32, 16);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fef08a';
    ctx.fillText(coinText, coinPillX + coinPillW / 2, 26);

    // 5. DIAMONDS (💎) on top-right next to coin pill
    const diamondText = `💎 ${relics}`;
    ctx.font = '900 15px Roboto, sans-serif';
    const diamondMeasure = ctx.measureText(diamondText).width;
    const diamondPillW = Math.max(70, diamondMeasure + 20);
    const diamondPillX = coinPillX - diamondPillW - 8;

    ctx.save();
    ctx.fillStyle = 'rgba(12, 74, 110, 0.82)'; // Cyan-blue pill
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(diamondPillX, 10, diamondPillW, 32, 16);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#bae6fd';
    ctx.fillText(diamondText, diamondPillX + diamondPillW / 2, 26);

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
    const cardH = 485;
    const cardX = (GAME_WIDTH - cardW) / 2;
    const cardY = GAME_HEIGHT * 0.17;

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
    ctx.fillText('PAUSED', GAME_WIDTH / 2, cardY + 38);

    // Score & Coins badge
    ctx.fillStyle = '#f1f5f9';
    this.roundRectPath(ctx, cardX + 24, cardY + 64, cardW - 48, 32, 10);
    ctx.fill();

    ctx.fillStyle = '#475569';
    ctx.font = '600 14px Roboto, sans-serif';
    ctx.fillText(`Score: ${height}m   •   Coins: ${coins}`, GAME_WIDTH / 2, cardY + 80);

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
    this.drawButton(ctx, 'privacyPause');

    // Hint at bottom
    ctx.fillStyle = '#94a3b8';
    ctx.font = '400 12px Roboto, sans-serif';
    ctx.fillText('Press Esc or P to resume', GAME_WIDTH / 2, cardY + cardH - 18);
  }

  drawGameOver(
    ctx: CanvasRenderingContext2D,
    alpha: number,
    height: number,
    coins: number,
    relics = 0,
    lostRelics = 0,
    bestScore: number,
    isNewBest: boolean,
    canRevive = true,
    canRecover = true,
    recoveredAmount = 0,
  ): void {
    ctx.globalAlpha = alpha;

    // Save state for safe click and hover detection
    this.gameOverCanRevive = canRevive;
    this.gameOverCanRecover = canRecover;

    // Overlay
    ctx.fillStyle = COLORS.overlay;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const adsAvailable = AdsService.getInstance().isAdsEnabled();

    // Title
    const titleY = adsAvailable ? GAME_HEIGHT * 0.14 : GAME_HEIGHT * 0.18;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 40px Roboto, sans-serif';
    ctx.fillText('Game Over', GAME_WIDTH / 2, titleY);

    // Stats card
    const cardW = 340;
    const cardH = lostRelics > 0 ? 176 : 154;
    const cardX = (GAME_WIDTH - cardW) / 2;
    const cardY = adsAvailable ? GAME_HEIGHT * 0.185 : GAME_HEIGHT * 0.235;

    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 16);
    ctx.fill();
    ctx.stroke();

    // Height Score
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 22px Roboto, sans-serif';
    ctx.fillText(`HEIGHT: ${height}m`, GAME_WIDTH / 2, cardY + 30);

    // Coins
    ctx.fillStyle = '#b45309';
    ctx.font = 'bold 17px Roboto, sans-serif';
    ctx.fillText(`🪙 TOTAL COINS: ${coins}`, GAME_WIDTH / 2, cardY + 60);

    // Saved Diamonds
    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 15px Roboto, sans-serif';
    ctx.fillText(`💎 SAVED DIAMONDS: +${relics}`, GAME_WIDTH / 2, cardY + 88);

    if (lostRelics > 0) {
      ctx.fillStyle = '#ef4444';
      ctx.font = '600 12px Roboto, sans-serif';
      ctx.fillText(`⚠️ Lost ${lostRelics} unsold diamonds on fall!`, GAME_WIDTH / 2, cardY + 112);
    }

    // Best score line with highlight
    const bestY = lostRelics > 0 ? cardY + 144 : cardY + 124;
    if (isNewBest) {
      ctx.fillStyle = '#d97706';
      ctx.font = '900 14px Roboto, sans-serif';
      ctx.fillText(`★ NEW RECORD: ${bestScore}m! ★`, GAME_WIDTH / 2, bestY);
    } else {
      ctx.fillStyle = '#64748b';
      ctx.font = '600 13px Roboto, sans-serif';
      ctx.fillText(`Best Record: ${bestScore}m`, GAME_WIDTH / 2, bestY);
    }
    ctx.restore();

    // Dynamically position action and rewarded ad buttons
    let curY = cardY + cardH + 12;
    const btnW = 260;
    const btnH = 44;
    const gap = 8;

    // 1. Revive & Rescue Ad Button (1x per run)
    if (adsAvailable) {
      this.buttons.revive.x = (GAME_WIDTH - btnW) / 2;
      this.buttons.revive.y = curY;
      this.buttons.revive.width = btnW;
      this.buttons.revive.height = btnH;
      if (canRevive) {
        this.buttons.revive.label = '📺 RESCUE 🚀 (AD)';
        this.buttons.revive.color = '#ea580c';
        this.buttons.revive.hoverColor = '#f97316';
        this.drawButton(ctx, 'revive');
      } else {
        this.buttons.revive.label = '✓ ALREADY RESCUED';
        this.buttons.revive.color = '#64748b';
        this.buttons.revive.hoverColor = '#64748b';
        this.drawButton(ctx, 'revive');
      }
      curY += btnH + gap;
    } else {
      this.buttons.revive.x = -9999;
      this.buttons.revive.y = -9999;
      this.buttons.revive.width = 0;
      this.buttons.revive.height = 0;
    }

    // 2. Recover Diamonds Ad Button
    if (adsAvailable) {
      this.buttons.recoverDiamonds.x = (GAME_WIDTH - btnW) / 2;
      this.buttons.recoverDiamonds.y = curY;
      this.buttons.recoverDiamonds.width = btnW;
      this.buttons.recoverDiamonds.height = btnH;
      if (canRecover) {
        const totalRelics = relics + lostRelics;
        const targetTotal = Math.ceil(totalRelics * 0.5);
        const recoverable = lostRelics > 0 ? Math.max(1, targetTotal - relics) : 1;
        this.buttons.recoverDiamonds.label = lostRelics > 0
          ? `📺 RECOVER +${recoverable} 💎 (AD)`
          : '📺 BONUS +1 💎 (AD)';
        this.buttons.recoverDiamonds.color = '#059669';
        this.buttons.recoverDiamonds.hoverColor = '#10b981';
        this.drawButton(ctx, 'recoverDiamonds');
      } else {
        const shownRecovered = recoveredAmount > 0 ? recoveredAmount : 1;
        this.buttons.recoverDiamonds.label = `✓ +${shownRecovered} 💎 RECOVERED`;
        this.buttons.recoverDiamonds.color = '#64748b';
        this.buttons.recoverDiamonds.hoverColor = '#64748b';
        this.drawButton(ctx, 'recoverDiamonds');
      }
      curY += btnH + gap;
    } else {
      this.buttons.recoverDiamonds.x = -9999;
      this.buttons.recoverDiamonds.y = -9999;
      this.buttons.recoverDiamonds.width = 0;
      this.buttons.recoverDiamonds.height = 0;
    }

    // 3. Restart button
    this.buttons.restart.label = `🔄 RESTART`;
    this.buttons.restart.x = (GAME_WIDTH - btnW) / 2;
    this.buttons.restart.y = curY;
    this.buttons.restart.width = btnW;
    this.buttons.restart.height = btnH;
    this.buttons.restart.color = COLORS.button;
    this.buttons.restart.hoverColor = COLORS.buttonHover;
    this.drawButton(ctx, 'restart');
    curY += btnH + gap;

    // 4. Shop button
    this.buttons.shopGameOver.label = `🛒 SHOP & UPGRADES`;
    this.buttons.shopGameOver.x = (GAME_WIDTH - btnW) / 2;
    this.buttons.shopGameOver.y = curY;
    this.buttons.shopGameOver.width = btnW;
    this.buttons.shopGameOver.height = btnH;
    this.drawButton(ctx, 'shopGameOver');

    // Hint
    ctx.fillStyle = COLORS.text;
    ctx.font = '400 12.5px Roboto, sans-serif';
    ctx.fillText('Tap button or press Space to play again', GAME_WIDTH / 2, curY + btnH + 18);

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

  /**
   * Renders the Shop / Upgrades, Trails, Skins & Backgrounds Screen.
   * Full modern tabbed modal showcasing:
   * - 10-Level Power-ups & Coin Multiplier
   * - 21 Visual Jump Trails
   * - 21 Character Skins & Head Accessories
   * - 20 Atmospheric Sky Backgrounds
   */
  drawShopMenu(
    ctx: CanvasRenderingContext2D,
    coins: number,
    shop: ShopManager,
    activeTab: 'upgrades' | 'skins' | 'trails' | 'backgrounds' = 'upgrades',
    page: number = 0,
  ): void {
    // Dark blur backdrop
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Modal Card
    const cardW = 410;
    const cardH = 690;
    const cardX = (GAME_WIDTH - cardW) / 2;
    const cardY = (GAME_HEIGHT - cardH) / 2;

    // Card container & shadow
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 18;
    this.roundRectPath(ctx, cardX, cardY, cardW, cardH, 20);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Header Banner
    const headH = 54;
    const headGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY);
    headGrad.addColorStop(0, '#6366f1');
    headGrad.addColorStop(1, '#8b5cf6');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, headH, [20, 20, 0, 0]);
    ctx.fill();

    // Header Title
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 16px Roboto, sans-serif';
    ctx.fillText('🛒 SKY SHOP & VAULT', cardX + 16, cardY + headH / 2);

    // Coins Balance Badge
    const coinBadgeW = 100;
    const coinBadgeH = 28;
    const coinBadgeX = cardX + cardW - coinBadgeW - 14;
    const coinBadgeY = cardY + (headH - coinBadgeH) / 2;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
    ctx.beginPath();
    ctx.roundRect(coinBadgeX, coinBadgeY, coinBadgeW, coinBadgeH, 14);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 13px Roboto, sans-serif';
    ctx.fillText(`🪙 ${coins}`, coinBadgeX + coinBadgeW / 2, coinBadgeY + coinBadgeH / 2);

    // 4 Tab Navigation Bar
    const tabY = cardY + headH + 8;
    const tabH = 34;
    const tabMargin = 8;
    const tabSpacing = 4;
    const tabW = (cardW - tabMargin * 2 - tabSpacing * 3) / 4;

    const tabs: Array<{ id: 'upgrades' | 'skins' | 'trails' | 'backgrounds'; label: string }> = [
      { id: 'upgrades', label: '⚡ UPGRADE' },
      { id: 'skins', label: '🥷 SKINS' },
      { id: 'trails', label: '🌈 TRAILS' },
      { id: 'backgrounds', label: '🌄 BACKGROUND' },
    ];

    for (let i = 0; i < tabs.length; i++) {
      const t = tabs[i];
      const tx = cardX + tabMargin + i * (tabW + tabSpacing);
      const isSelected = activeTab === t.id;

      ctx.fillStyle = isSelected ? '#7c3aed' : '#f1f5f9';
      this.roundRectPath(ctx, tx, tabY, tabW, tabH, 8);
      ctx.fill();

      ctx.textAlign = 'center';
      ctx.fillStyle = isSelected ? '#ffffff' : '#64748b';
      ctx.font = isSelected ? 'bold 10px Roboto, sans-serif' : '600 9.5px Roboto, sans-serif';
      ctx.fillText(t.label, tx + tabW / 2, tabY + tabH / 2);
    }

    // --- TAB CONTENTS ---
    const contentY = tabY + tabH + 10;

    if (activeTab === 'upgrades') {
      const upgrades = [
        {
          id: 'magnet' as const,
          name: '🧲 Coin Magnet',
          desc: `Active Time: ${shop.getMagnetDuration().toFixed(2)}s (+0.25s/lv | Max 6.0s)`,
          level: shop.magnetLevel,
          cost: shop.magnetLevel < 10 ? shop.upgradeCosts[shop.magnetLevel] : 0,
        },
        {
          id: 'jetpack' as const,
          name: '🚀 Rocket Jetpack',
          desc: `Flight Time: ${shop.getJetpackDuration().toFixed(2)}s (+0.25s/lv | Max 4.5s)`,
          level: shop.jetpackLevel,
          cost: shop.jetpackLevel < 10 ? shop.upgradeCosts[shop.jetpackLevel] : 0,
        },
        {
          id: 'shield' as const,
          name: '🛡️ Force Shield',
          desc: `Full Lv.10 Max: +350 Bounce | Bonus: +${shop.getShieldBonusBounce()}`,
          level: shop.shieldLevel,
          cost: shop.shieldLevel < 10 ? shop.shieldCosts[shop.shieldLevel] : 0,
        },
        {
          id: 'coin_multiplier' as const,
          name: '🪙 2X Coin Multiplier',
          desc: `Merchant 2X Deal: ${shop.getCoinMultiplierDuration().toFixed(2)}s (+0.25s/lv | Max 4.5s)`,
          level: shop.coinMultiplierLevel,
          cost: shop.coinMultiplierLevel < 10 ? shop.upgradeCosts[shop.coinMultiplierLevel] : 0,
        },
      ];

      const rowH = 92;
      for (let i = 0; i < upgrades.length; i++) {
        const u = upgrades[i];
        const rowY = contentY + i * (rowH + 8);
        const isMax = u.level >= 10;
        const canAfford = coins >= u.cost;

        // Container card
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        this.roundRectPath(ctx, cardX + 12, rowY, cardW - 24, rowH, 10);
        ctx.fill();
        ctx.stroke();

        // 10 Level Segment Pips
        const pipW = 21;
        const pipH = 5;
        const pipGap = 4;
        const pipsStartX = cardX + 22;
        const pipsY = rowY + 12;

        for (let lvl = 0; lvl < 10; lvl++) {
          const px = pipsStartX + lvl * (pipW + pipGap);
          ctx.fillStyle = lvl < u.level ? '#10b981' : '#cbd5e1';
          this.roundRectPath(ctx, px, pipsY, pipW, pipH, 2);
          ctx.fill();
        }

        // Title + Level Badge
        ctx.textAlign = 'left';
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 13px Roboto, sans-serif';
        ctx.fillText(u.name, cardX + 22, rowY + 36);

        ctx.fillStyle = '#6366f1';
        ctx.font = 'bold 11px Roboto, sans-serif';
        ctx.fillText(`Lv. ${u.level}/10`, cardX + cardW - 85, rowY + 36);

        // Description
        ctx.fillStyle = '#64748b';
        ctx.font = '500 11px Roboto, sans-serif';
        ctx.fillText(u.desc, cardX + 22, rowY + 56);

        // Upgrade Action Button
        const btnW = 115;
        const btnH = 28;
        const btnX = cardX + cardW - btnW - 22;
        const btnY = rowY + 58;

        ctx.fillStyle = isMax ? '#94a3b8' : canAfford ? '#16a34a' : '#cbd5e1';
        this.roundRectPath(ctx, btnX, btnY, btnW, btnH, 6);
        ctx.fill();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Roboto, sans-serif';
        ctx.fillText(isMax ? 'MAX (Lv.10) ⭐' : `UPGRADE ${u.cost} 🪙`, btnX + btnW / 2, btnY + btnH / 2);
      }
    } else if (activeTab === 'skins') {
      const itemsPerPage = 4;
      const totalPages = Math.ceil(SKINS.length / itemsPerPage);
      const curPage = Math.max(0, Math.min(page, totalPages - 1));
      const pageItems = SKINS.slice(curPage * itemsPerPage, (curPage + 1) * itemsPerPage);

      const rowH = 78;
      for (let i = 0; i < pageItems.length; i++) {
        const s = pageItems[i];
        const rowY = contentY + i * (rowH + 8);
        const isUnlocked = shop.unlockedSkins.includes(s.id);
        const isSelected = shop.selectedSkin === s.id;
        const canAfford = coins >= s.cost;

        ctx.fillStyle = isSelected ? '#f0fdf4' : '#f8fafc';
        ctx.strokeStyle = isSelected ? '#22c55e' : '#e2e8f0';
        ctx.lineWidth = isSelected ? 1.5 : 1;
        this.roundRectPath(ctx, cardX + 12, rowY, cardW - 24, rowH, 10);
        ctx.fill();
        ctx.stroke();

        // Skin Avatar circle
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(cardX + 38, rowY + rowH / 2, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = s.accent || '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Hat badge icon
        ctx.font = '16px Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(s.icon, cardX + 38, rowY + rowH / 2 + 1);

        // Name & Description
        ctx.textAlign = 'left';
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 13px Roboto, sans-serif';
        ctx.fillText(s.name, cardX + 64, rowY + 24);

        ctx.fillStyle = '#64748b';
        ctx.font = '500 11px Roboto, sans-serif';
        ctx.fillText(s.desc, cardX + 64, rowY + 44);

        // Price badge if locked
        if (!isUnlocked) {
          ctx.fillStyle = '#d97706';
          ctx.font = 'bold 10.5px Roboto, sans-serif';
          ctx.fillText(`Cost: ${s.cost} 🪙`, cardX + 64, rowY + 63);
        }

        // Action button
        const btnW = 90;
        const btnH = 32;
        const btnX = cardX + cardW - 12 - btnW - 10;
        const btnY = rowY + (rowH - btnH) / 2;

        ctx.fillStyle = isSelected ? '#15803d' : isUnlocked ? '#2563eb' : canAfford ? '#d97706' : '#cbd5e1';
        this.roundRectPath(ctx, btnX, btnY, btnW, btnH, 8);
        ctx.fill();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Roboto, sans-serif';
        const label = isSelected ? 'EQUIPPED' : isUnlocked ? 'EQUIP' : `${s.cost} 🪙`;
        ctx.fillText(label, btnX + btnW / 2, btnY + btnH / 2);
      }

      // Pagination controls
      this.drawPaginationControls(ctx, cardX, cardW, contentY + 4 * (rowH + 8) + 8, curPage, totalPages);
    } else if (activeTab === 'trails') {
      const itemsPerPage = 4;
      const totalPages = Math.ceil(TRAILS.length / itemsPerPage);
      const curPage = Math.max(0, Math.min(page, totalPages - 1));
      const pageItems = TRAILS.slice(curPage * itemsPerPage, (curPage + 1) * itemsPerPage);

      const rowH = 78;
      for (let i = 0; i < pageItems.length; i++) {
        const t = pageItems[i];
        const rowY = contentY + i * (rowH + 8);
        const isUnlocked = shop.unlockedTrails.includes(t.id);
        const isSelected = shop.selectedTrail === t.id;
        const canAfford = coins >= t.cost;

        ctx.fillStyle = isSelected ? '#f0fdf4' : '#f8fafc';
        ctx.strokeStyle = isSelected ? '#22c55e' : '#e2e8f0';
        ctx.lineWidth = isSelected ? 1.5 : 1;
        this.roundRectPath(ctx, cardX + 12, rowY, cardW - 24, rowH, 10);
        ctx.fill();
        ctx.stroke();

        // Trail Color Swatch Dot
        ctx.fillStyle = t.previewColor || '#38bdf8';
        ctx.shadowColor = t.previewColor || '#38bdf8';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(cardX + 38, rowY + rowH / 2, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.font = '14px Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(t.icon, cardX + 38, rowY + rowH / 2 + 1);

        // Name & Description
        ctx.textAlign = 'left';
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 13px Roboto, sans-serif';
        ctx.fillText(t.name, cardX + 64, rowY + 24);

        ctx.fillStyle = '#64748b';
        ctx.font = '500 11px Roboto, sans-serif';
        ctx.fillText(t.desc, cardX + 64, rowY + 44);

        if (!isUnlocked) {
          ctx.fillStyle = '#d97706';
          ctx.font = 'bold 10.5px Roboto, sans-serif';
          ctx.fillText(`Cost: ${t.cost} 🪙`, cardX + 64, rowY + 63);
        }

        // Action button
        const btnW = 90;
        const btnH = 32;
        const btnX = cardX + cardW - 12 - btnW - 10;
        const btnY = rowY + (rowH - btnH) / 2;

        ctx.fillStyle = isSelected ? '#15803d' : isUnlocked ? '#2563eb' : canAfford ? '#d97706' : '#cbd5e1';
        this.roundRectPath(ctx, btnX, btnY, btnW, btnH, 8);
        ctx.fill();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Roboto, sans-serif';
        const label = isSelected ? 'EQUIPPED' : isUnlocked ? 'EQUIP' : `${t.cost} 🪙`;
        ctx.fillText(label, btnX + btnW / 2, btnY + btnH / 2);
      }

      this.drawPaginationControls(ctx, cardX, cardW, contentY + 4 * (rowH + 8) + 8, curPage, totalPages);
    } else if (activeTab === 'backgrounds') {
      const itemsPerPage = 4;
      const totalPages = Math.ceil(BACKGROUNDS.length / itemsPerPage);
      const curPage = Math.max(0, Math.min(page, totalPages - 1));
      const pageItems = BACKGROUNDS.slice(curPage * itemsPerPage, (curPage + 1) * itemsPerPage);

      const rowH = 78;
      for (let i = 0; i < pageItems.length; i++) {
        const bg = pageItems[i];
        const rowY = contentY + i * (rowH + 8);
        const isUnlocked = shop.unlockedBackgrounds.includes(bg.id);
        const isSelected = shop.selectedBackground === bg.id;
        const canAfford = coins >= bg.cost;

        ctx.fillStyle = isSelected ? '#f0fdf4' : '#f8fafc';
        ctx.strokeStyle = isSelected ? '#22c55e' : '#e2e8f0';
        ctx.lineWidth = isSelected ? 1.5 : 1;
        this.roundRectPath(ctx, cardX + 12, rowY, cardW - 24, rowH, 10);
        ctx.fill();
        ctx.stroke();

        // Mini gradient swatch box
        const swatchGrad = ctx.createLinearGradient(cardX + 24, rowY + 16, cardX + 24, rowY + rowH - 16);
        swatchGrad.addColorStop(0, bg.topColor);
        swatchGrad.addColorStop(0.5, bg.midColor);
        swatchGrad.addColorStop(1, bg.botColor);
        ctx.fillStyle = swatchGrad;
        this.roundRectPath(ctx, cardX + 24, rowY + 16, 32, rowH - 32, 6);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Icon inside swatch
        ctx.font = '14px Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(bg.icon, cardX + 40, rowY + rowH / 2 + 1);

        // Name & Description
        ctx.textAlign = 'left';
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 13px Roboto, sans-serif';
        ctx.fillText(bg.name, cardX + 68, rowY + 24);

        ctx.fillStyle = '#64748b';
        ctx.font = '500 11px Roboto, sans-serif';
        ctx.fillText(bg.desc, cardX + 68, rowY + 44);

        if (!isUnlocked) {
          ctx.fillStyle = '#d97706';
          ctx.font = 'bold 10.5px Roboto, sans-serif';
          ctx.fillText(`Cost: ${bg.cost} 🪙`, cardX + 68, rowY + 63);
        }

        // Action button
        const btnW = 90;
        const btnH = 32;
        const btnX = cardX + cardW - 12 - btnW - 10;
        const btnY = rowY + (rowH - btnH) / 2;

        ctx.fillStyle = isSelected ? '#15803d' : isUnlocked ? '#2563eb' : canAfford ? '#d97706' : '#cbd5e1';
        this.roundRectPath(ctx, btnX, btnY, btnW, btnH, 8);
        ctx.fill();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Roboto, sans-serif';
        const label = isSelected ? 'ACTIVE' : isUnlocked ? 'SELECT' : `${bg.cost} 🪙`;
        ctx.fillText(label, btnX + btnW / 2, btnY + btnH / 2);
      }

      this.drawPaginationControls(ctx, cardX, cardW, contentY + 4 * (rowH + 8) + 8, curPage, totalPages);
    }

    // Close / Back button at bottom
    const closeW = 240;
    const closeH = 42;
    const closeX = (GAME_WIDTH - closeW) / 2;
    const closeY = cardY + cardH - closeH - 14;

    ctx.fillStyle = '#334155';
    this.roundRectPath(ctx, closeX, closeY, closeW, closeH, 12);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13.5px Roboto, sans-serif';
    ctx.fillText('◀  BACK TO GAME', closeX + closeW / 2, closeY + closeH / 2);

    ctx.restore();
  }

  private drawPaginationControls(
    ctx: CanvasRenderingContext2D,
    cardX: number,
    cardW: number,
    py: number,
    curPage: number,
    totalPages: number,
  ): void {
    const btnW = 92;
    const btnH = 32;

    // Prev button
    const prevX = cardX + 16;
    ctx.fillStyle = curPage > 0 ? '#4f46e5' : '#e2e8f0';
    this.roundRectPath(ctx, prevX, py, btnW, btnH, 8);
    ctx.fill();
    ctx.fillStyle = curPage > 0 ? '#ffffff' : '#94a3b8';
    ctx.font = 'bold 12px Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('◀ PREV', prevX + btnW / 2, py + btnH / 2);

    // Page indicator
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 12.5px Roboto, sans-serif';
    ctx.fillText(`Page ${curPage + 1} / ${totalPages}`, cardX + cardW / 2, py + btnH / 2);

    // Next button
    const nextX = cardX + cardW - btnW - 16;
    ctx.fillStyle = curPage < totalPages - 1 ? '#4f46e5' : '#e2e8f0';
    this.roundRectPath(ctx, nextX, py, btnW, btnH, 8);
    ctx.fill();
    ctx.fillStyle = curPage < totalPages - 1 ? '#ffffff' : '#94a3b8';
    ctx.fillText('NEXT ▶', nextX + btnW / 2, py + btnH / 2);
  }

  /**
   * Hit test for Shop screen elements.
   * Returns action string or null.
   */
  handleShopClick(
    px: number,
    py: number,
    activeTab: 'upgrades' | 'skins' | 'trails' | 'backgrounds' = 'upgrades',
    page: number = 0,
  ): string | null {
    const cardW = 410;
    const cardH = 690;
    const cardX = (GAME_WIDTH - cardW) / 2;
    const cardY = (GAME_HEIGHT - cardH) / 2;

    // 1. Close button
    const closeW = 240;
    const closeH = 42;
    const closeX = (GAME_WIDTH - closeW) / 2;
    const closeY = cardY + cardH - closeH - 14;
    if (px >= closeX - 15 && px <= closeX + closeW + 15 && py >= closeY - 10 && py <= closeY + closeH + 10) {
      return 'close';
    }

    // 2. Tab selection bar
    const headH = 54;
    const tabY = cardY + headH + 8;
    const tabH = 34;
    const tabMargin = 8;
    const tabSpacing = 4;
    const tabW = (cardW - tabMargin * 2 - tabSpacing * 3) / 4;

    if (py >= tabY - 8 && py <= tabY + tabH + 8) {
      for (let i = 0; i < 4; i++) {
        const tx = cardX + tabMargin + i * (tabW + tabSpacing);
        if (px >= tx - 3 && px <= tx + tabW + 3) {
          const tabNames = ['tab_upgrades', 'tab_skins', 'tab_trails', 'tab_backgrounds'];
          return tabNames[i];
        }
      }
    }

    const contentY = tabY + tabH + 10;

    // 3. Tab contents
    if (activeTab === 'upgrades') {
      const rowH = 92;
      const actions = [
        'upgrade_magnet',
        'upgrade_jetpack',
        'upgrade_shield',
        'upgrade_coin_multiplier',
      ];

      for (let i = 0; i < actions.length; i++) {
        const rowY = contentY + i * (rowH + 8);
        if (px >= cardX + 10 && px <= cardX + cardW - 10 && py >= rowY - 4 && py <= rowY + rowH + 4) {
          return actions[i];
        }
      }
    } else {
      const itemsPerPage = 4;
      const items = activeTab === 'skins' ? SKINS : activeTab === 'trails' ? TRAILS : BACKGROUNDS;
      const totalPages = Math.ceil(items.length / itemsPerPage);
      const curPage = Math.max(0, Math.min(page, totalPages - 1));
      const pageItems = items.slice(curPage * itemsPerPage, (curPage + 1) * itemsPerPage);

      const rowH = 78;
      for (let i = 0; i < pageItems.length; i++) {
        const rowY = contentY + i * (rowH + 8);
        if (px >= cardX + 10 && px <= cardX + cardW - 10 && py >= rowY - 4 && py <= rowY + rowH + 4) {
          const item = pageItems[i];
          if (activeTab === 'skins') return `skin_${item.id}`;
          if (activeTab === 'trails') return `trail_${item.id}`;
          if (activeTab === 'backgrounds') return `bg_${item.id}`;
        }
      }

      // Pagination clicks - generous touch bounds
      const paginationY = contentY + 4 * (rowH + 8) + 8;
      if (py >= paginationY - 12 && py <= paginationY + 48) {
        // Prev button (left 40% of pagination bar)
        if (px >= cardX + 8 && px <= cardX + 140 && curPage > 0) {
          return 'shop_prev_page';
        }
        // Next button (right 40% of pagination bar)
        if (px >= cardX + cardW - 140 && px <= cardX + cardW - 8 && curPage < totalPages - 1) {
          return 'shop_next_page';
        }
      }
    }

    return null;
  }

  getPrivacyModalLayout() {
    const cardW = 340;
    const cardH = 430;
    const cardX = (GAME_WIDTH - cardW) / 2;
    const cardY = (GAME_HEIGHT - cardH) / 2;

    const viewPolicyBtn = {
      x: cardX + 25,
      y: cardY + 230,
      width: cardW - 50,
      height: 38,
    };

    const checkboxRow = {
      x: cardX + 20,
      y: cardY + 284,
      width: cardW - 40,
      height: 44,
      boxSize: 26,
    };

    const acceptBtn = {
      x: cardX + 25,
      y: cardY + 348,
      width: cardW - 50,
      height: 50,
    };

    return { cardX, cardY, cardW, cardH, viewPolicyBtn, checkboxRow, acceptBtn };
  }

  drawPrivacyModal(ctx: CanvasRenderingContext2D, isChecked: boolean): void {
    const { cardX, cardY, cardW, cardH, viewPolicyBtn, checkboxRow, acceptBtn } = this.getPrivacyModalLayout();

    ctx.save();
    // Dimmed background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Card shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    this.roundRectPath(ctx, cardX + 4, cardY + 8, cardW, cardH, 20);
    ctx.fill();

    // Card background
    ctx.fillStyle = '#ffffff';
    this.roundRectPath(ctx, cardX, cardY, cardW, cardH, 20);
    ctx.fill();

    // Card border
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    this.roundRectPath(ctx, cardX, cardY, cardW, cardH, 20);
    ctx.stroke();

    // Header Shield Icon & Title
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '28px sans-serif';
    ctx.fillText('🛡️', GAME_WIDTH / 2, cardY + 34);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px Roboto, sans-serif';
    ctx.fillText('PRIVACY & TERMS', GAME_WIDTH / 2, cardY + 68);

    ctx.fillStyle = '#64748b';
    ctx.font = '500 13px Roboto, sans-serif';
    ctx.fillText('Welcome to StickUp 2D!', GAME_WIDTH / 2, cardY + 92);

    // Highlights Card
    const infoW = cardW - 40;
    const infoH = 88;
    const infoX = cardX + 20;
    const infoY = cardY + 114;

    ctx.fillStyle = '#f8fafc';
    this.roundRectPath(ctx, infoX, infoY, infoW, infoH, 12);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    this.roundRectPath(ctx, infoX, infoY, infoW, infoH, 12);
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#334155';
    ctx.font = '500 12px Roboto, sans-serif';
    ctx.fillText('• 100% Free & Family-Friendly arcade game', infoX + 14, infoY + 22);
    ctx.fillText('• No personal data or tracking collected', infoX + 14, infoY + 44);
    ctx.fillText('• Rewarded Ads provided by Google AdMob', infoX + 14, infoY + 66);

    // View Policy Button
    ctx.fillStyle = '#f0f9ff';
    this.roundRectPath(ctx, viewPolicyBtn.x, viewPolicyBtn.y, viewPolicyBtn.width, viewPolicyBtn.height, 10);
    ctx.fill();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.5;
    this.roundRectPath(ctx, viewPolicyBtn.x, viewPolicyBtn.y, viewPolicyBtn.width, viewPolicyBtn.height, 10);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#0369a1';
    ctx.font = 'bold 13px Roboto, sans-serif';
    ctx.fillText('📄 READ PRIVACY POLICY & TERMS ↗', GAME_WIDTH / 2, viewPolicyBtn.y + viewPolicyBtn.height / 2);

    // Checkbox Row
    const boxX = checkboxRow.x + 8;
    const boxY = checkboxRow.y + (checkboxRow.height - checkboxRow.boxSize) / 2;

    // Checkbox box
    ctx.fillStyle = isChecked ? '#16a34a' : '#ffffff';
    this.roundRectPath(ctx, boxX, boxY, checkboxRow.boxSize, checkboxRow.boxSize, 6);
    ctx.fill();
    ctx.strokeStyle = isChecked ? '#15803d' : '#94a3b8';
    ctx.lineWidth = 2;
    this.roundRectPath(ctx, boxX, boxY, checkboxRow.boxSize, checkboxRow.boxSize, 6);
    ctx.stroke();

    if (isChecked) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✓', boxX + checkboxRow.boxSize / 2, boxY + checkboxRow.boxSize / 2 + 1);
    }

    // Checkbox text
    ctx.textAlign = 'left';
    ctx.fillStyle = isChecked ? '#0f172a' : '#475569';
    ctx.font = 'bold 13px Roboto, sans-serif';
    ctx.fillText('I agree to the Terms & Privacy Policy', boxX + checkboxRow.boxSize + 12, checkboxRow.y + checkboxRow.height / 2);

    // Accept & Play Button
    ctx.fillStyle = isChecked ? '#16a34a' : '#94a3b8';
    this.roundRectPath(ctx, acceptBtn.x, acceptBtn.y, acceptBtn.width, acceptBtn.height, 14);
    ctx.fill();
    ctx.strokeStyle = isChecked ? '#15803d' : '#64748b';
    ctx.lineWidth = 1.5;
    this.roundRectPath(ctx, acceptBtn.x, acceptBtn.y, acceptBtn.width, acceptBtn.height, 14);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 17px Roboto, sans-serif';
    ctx.fillText(isChecked ? 'ACCEPT & PLAY  ▶' : 'CHECK BOX TO ACCEPT', GAME_WIDTH / 2, acceptBtn.y + acceptBtn.height / 2);

    ctx.restore();
  }
}
