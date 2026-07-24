// ============================================================
// Sky Jumper - Type Definitions
// Shared types used across the game modules.
// ============================================================

export interface Vec2 {
  x: number;
  y: number;
}

export interface Button {
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  hoverColor: string;
  activeColor: string;
  onClick: () => void;
}

export type ParticleType = 'dust' | 'sparkle';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  type: ParticleType;
  color: string;
}

export interface FloatingText {
  x: number;
  y: number;
  vy: number;
  life: number;
  maxLife: number;
  text: string;
  color: string;
}
