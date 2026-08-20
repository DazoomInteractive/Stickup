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

  /** Handle pointer move for hover detection. */
  handlePointerMove(px: number, py: number, state: GameState): void {
    const activeKey = state === STATE.MAIN_MENU ? 'play' : state === STATE.GAME_OVER ? 'restart' : null;
    if (activeKey) {
      const btn = this.buttons[activeKey];
      this.hoverScale[activeKey] = this.contains(btn, px, py) ? 1.06 : 1;
    }
    // Mute button hover
    this.muteHover = this.inMuteButton(px, py);
  }

  /** Handle click/tap. Returns true if a button consumed the event. */
  handleClick(px: number, py: number, state: GameState): boolean {
    if (this.inMuteButton(px, py)) {
      return false; // GameEngine handles mute toggle directly
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

  private updateScales(dt: number): void {
    for (const key of Object.keys(this.hoverScale)) {
      const target = this.pressScale[key] < 1 ? this.pressScale[key] : this.hoverScale[key];
      this.hoverScale[key] += (target - this.hoverScale[key]) * Math.min(1, dt * 15);
      this.pressScale[key] += (1 - this.pressScale[key]) * Math.min(1, dt * 15);
    }
  }

  update(dt: number): void {
    this.updateScales(dt);
  }

  // ---- Drawing ----

  drawMainMenu(ctx: CanvasRenderingContext2D, alpha: number, muted: boolean, bestScore: number): void {
    this.update(0.016); // keep scales alive
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
    ctx.fillText('← → or A / D to move', GAME_WIDTH / 2, GAME_HEIGHT * 0.72);

    // Mute button + tooltip
    this.drawMuteButton(ctx, muted);
    this.drawMuteLabel(ctx, muted);

    ctx.globalAlpha = 1;
  }

  drawHUD(ctx: CanvasRenderingContext2D, height: number, coins: number): void {
    // Frosted strip for legibility over any background
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(0, 0, GAME_WIDTH, 50);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 20px Roboto, sans-serif';
    ctx.fillText(`SCORE: ${height}m`, 16, 26);

    ctx.textAlign = 'right';
    ctx.fillText(`COIN: ${coins}`, GAME_WIDTH - 16, 26);
  }

  drawGameOver(
    ctx: CanvasRenderingContext2D,
    alpha: number,
    height: number,
    coins: number,
  ): void {
    this.update(0.016);
    ctx.globalAlpha = alpha;

    // Overlay
    ctx.fillStyle = COLORS.overlay;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Title
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 48px Roboto, sans-serif';
    ctx.fillText('Game Over', GAME_WIDTH / 2, GAME_HEIGHT * 0.3);

    // Stats
    ctx.font = 'bold 26px Roboto, sans-serif';
    ctx.fillStyle = COLORS.text;
    ctx.fillText(`SCORE: ${height}m`, GAME_WIDTH / 2, GAME_HEIGHT * 0.42);
    ctx.fillText(`COINS: ${coins}`, GAME_WIDTH / 2, GAME_HEIGHT * 0.49);

    // Restart button
    this.drawButton(ctx, 'restart');

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
    ctx.font = 'bold 24px Roboto, sans-serif';
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
