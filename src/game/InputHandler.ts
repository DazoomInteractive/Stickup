// ============================================================
// Sky Jumper - Input Handler
// Unified keyboard + touch input. Exposes a simple directional
// interface so the Player never cares about the source.
// ============================================================

export class InputHandler {
  private left = false;
  private right = false;
  onAction: (() => void) | null = null;

  private keyDown = (e: KeyboardEvent): void => {
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.left = true;
        e.preventDefault();
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.right = true;
        e.preventDefault();
        break;
      case 'ArrowUp':
      case 'ArrowDown':
        e.preventDefault();
        break;
      case 'Space':
      case 'Enter':
        if (this.onAction) {
          this.onAction();
        }
        e.preventDefault();
        break;
      default:
        return;
    }
  };

  private keyUp = (e: KeyboardEvent): void => {
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.left = false;
        e.preventDefault();
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.right = false;
        e.preventDefault();
        break;
      default:
        return;
    }
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
