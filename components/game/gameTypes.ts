export type GamePhase = "idle" | "playing" | "gameOver";

export type Direction = -1 | 0 | 1;

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SpawnPickInput = {
  arenaWidth: number;
  obstacleSize: number;
  minimumSpacing: number;
  recentXs: number[];
  randomValues?: number[];
};

export const HITBOX_SCALE = 0.82;
export const SPAWN_PROTECTION_MS = 1000;
