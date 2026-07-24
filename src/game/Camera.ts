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

  get y(): number {
    return this.cameraY;
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
  update(playerY: number, _dt: number): void {
    // Desired top-of-screen = player Y minus half the screen height
    const target = playerY - GAME_HEIGHT / 2;
    // Only allow the camera to move upward (target must be smaller / higher)
    if (target < this.cameraY) {
      this.cameraY = target;
    }
  }

  reset(): void {
    this.cameraY = 0;
  }
}
