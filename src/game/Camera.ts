// ============================================================
// Sky Jumper - Camera
// Strict upward-only camera tracker.
// cameraY = the world Y coordinate at the TOP of the screen.
// Rule: cameraY can only DECREASE (move upward). Never increase.
// ============================================================

import { GAME_HEIGHT } from './constants';

export class Camera {
  /** World Y at the top of the screen. Lower = higher up in the world. */
  private cameraY = 0;

  // Camera Shake state
  private shakeTimer = 0;
  private shakeDuration = 0;
  private shakeIntensity = 0;
  shakeOffsetX = 0;
  shakeOffsetY = 0;

  get y(): number {
    return this.cameraY;
  }

  /** Trigger a camera shake with given intensity and duration in seconds. */
  shake(intensity = 8, duration = 0.3): void {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = duration;
  }

  /** Convert a world Y coordinate to a screen Y coordinate. */
  worldToScreenY(worldY: number): number {
    return worldY - this.cameraY;
  }

  /**
   * Called every frame with the player's current world Y.
   * When the player rises above the screen midpoint, the camera
   * moves up so the player stays at the centre.
   * cameraY NEVER increases — the camera never scrolls down.
   */
  update(playerY: number, dt: number): void {
    // Desired top-of-screen = player Y minus half the screen height
    const target = playerY - GAME_HEIGHT / 2;
    // Only allow the camera to move upward (target must be smaller / higher)
    if (target < this.cameraY) {
      this.cameraY = target;
    }

    // Update screen shake
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const progress = Math.max(0, this.shakeTimer / this.shakeDuration);
      const currentIntensity = this.shakeIntensity * progress;
      this.shakeOffsetX = (Math.random() * 2 - 1) * currentIntensity;
      this.shakeOffsetY = (Math.random() * 2 - 1) * currentIntensity;
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }
  }

  reset(): void {
    this.cameraY = 0;
    this.shakeTimer = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }
}
