import {
  HITBOX_SCALE,
  SPAWN_PROTECTION_MS,
  type Rect,
  type SpawnPickInput,
} from "./gameTypes";

export function getDisplayScore(elapsedMs: number) {
  return Math.floor(elapsedMs / 1000);
}

export function isSpawnProtectionActive(elapsedMs: number) {
  return elapsedMs < SPAWN_PROTECTION_MS;
}

export function getSpawnInterval(elapsedSeconds: number) {
  if (elapsedSeconds < 10) return 850;
  if (elapsedSeconds < 30) return Math.max(520, 850 - (elapsedSeconds - 10) * 14);
  if (elapsedSeconds < 60) return Math.max(300, 570 - (elapsedSeconds - 30) * 9);
  return 280;
}

export function getFallSpeed(elapsedSeconds: number) {
  if (elapsedSeconds < 10) return 140;
  if (elapsedSeconds < 30) return Math.min(220, 140 + (elapsedSeconds - 10) * 4);
  if (elapsedSeconds < 60) return Math.min(320, 220 + (elapsedSeconds - 30) * 3);
  return 330;
}

export function applyHitboxScale(rect: Rect, scale = HITBOX_SCALE): Rect {
  const width = rect.width * scale;
  const height = rect.height * scale;

  return {
    x: rect.x + (rect.width - width) / 2,
    y: rect.y + (rect.height - height) / 2,
    width,
    height,
  };
}

export function rectanglesOverlap(a: Rect, b: Rect) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function pickSpawnX({
  arenaWidth,
  obstacleSize,
  minimumSpacing,
  recentXs,
  randomValues = [],
}: SpawnPickInput) {
  const maxX = arenaWidth - obstacleSize;
  const samples =
    randomValues.length > 0
      ? randomValues
      : Array.from({ length: 6 }, () => Math.random());

  let fallback = 0;
  let fallbackDistance = -1;

  for (const value of samples) {
    const candidate = Math.max(0, Math.min(maxX, value * maxX));
    const distance =
      recentXs.length === 0
        ? Number.POSITIVE_INFINITY
        : Math.min(...recentXs.map((x) => Math.abs(x - candidate)));

    if (distance >= minimumSpacing) {
      return candidate;
    }

    if (distance > fallbackDistance) {
      fallback = candidate;
      fallbackDistance = distance;
    }
  }

  return fallback;
}
