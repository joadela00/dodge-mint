import {
  applyHitboxScale,
  getDisplayScore,
  getFallSpeed,
  getSpawnInterval,
  isSpawnProtectionActive,
  pickSpawnX,
  rectanglesOverlap,
} from "@/components/game/gameLogic";

describe("game logic", () => {
  test("display score floors fractional seconds", () => {
    expect(getDisplayScore(1999)).toBe(1);
    expect(getDisplayScore(2000)).toBe(2);
  });

  test("spawn protection stays active for about one second", () => {
    expect(isSpawnProtectionActive(0)).toBe(true);
    expect(isSpawnProtectionActive(999)).toBe(true);
    expect(isSpawnProtectionActive(1000)).toBe(false);
  });

  test("difficulty ramps by reducing spawn interval and increasing fall speed", () => {
    expect(getSpawnInterval(0)).toBeGreaterThan(getSpawnInterval(45));
    expect(getFallSpeed(0)).toBeLessThan(getFallSpeed(45));
  });

  test("hitbox scaling shrinks the effective rectangle from center", () => {
    const result = applyHitboxScale({ x: 10, y: 20, width: 40, height: 20 }, 0.82);

    expect(result.x).toBeCloseTo(13.6);
    expect(result.y).toBeCloseTo(21.8);
    expect(result.width).toBeCloseTo(32.8);
    expect(result.height).toBeCloseTo(16.4);
  });

  test("collision uses the scaled bounds rather than visible bounds", () => {
    const player = applyHitboxScale({ x: 0, y: 0, width: 40, height: 40 }, 0.82);
    const obstacle = applyHitboxScale(
      { x: 35, y: 35, width: 24, height: 24 },
      0.82,
    );

    expect(rectanglesOverlap(player, obstacle)).toBe(false);
  });

  test("spawn placement respects minimum spacing from recent spawns", () => {
    const result = pickSpawnX({
      arenaWidth: 320,
      obstacleSize: 24,
      minimumSpacing: 56,
      recentXs: [40, 120, 200],
      randomValues: [0.13, 0.39, 0.75, 0.94],
    });

    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(296);
    expect(Math.abs(result - 40)).toBeGreaterThanOrEqual(56);
    expect(Math.abs(result - 120)).toBeGreaterThanOrEqual(56);
    expect(Math.abs(result - 200)).toBeGreaterThanOrEqual(56);
  });
});
