// ============================================================
// Sky Jumper - Input Handler
// Unified keyboard + touch input. Exposes a simple directional
// interface so the Player never cares about the source.
// ============================================================

export class InputHandler {
  private left = false;
  private right = false;

  private keyDown = (e: KeyboardEvent): void => {
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.left = true;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.right = true;
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  private keyUp = (e: KeyboardEvent): void => {
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.left = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.right = false;
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  attach(): void {
    window.addEventListener('keydown', this.keyDown, { passive: false });
    window.addEventListener('keyup', this.keyUp, { passive: false });
  }

  detach(): void {
    window.removeEventListener('keydown', this.keyDown);
    window.removeEventListener('keyup', this.keyUp);
  }

  // Called by on-screen touch buttons.
  setLeft(active: boolean): void {
    this.left = active;
  }

  setRight(active: boolean): void {
    this.right = active;
  }

  isLeft(): boolean {
    return this.left;
  }

  isRight(): boolean {
    return this.right;
  }

  reset(): void {
    this.left = false;
    this.right = false;
  }
}
