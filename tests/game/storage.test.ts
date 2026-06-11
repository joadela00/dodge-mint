import { loadHighScoreMs, saveHighScoreMs } from "@/components/game/storage";

describe("high score storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("returns zero when storage is empty", () => {
    expect(loadHighScoreMs()).toBe(0);
  });

  test("saves and reloads full elapsed milliseconds", () => {
    saveHighScoreMs(12876);
    expect(loadHighScoreMs()).toBe(12876);
  });

  test("keeps the larger elapsed value when comparing scores", () => {
    saveHighScoreMs(12876);
    saveHighScoreMs(12001);
    expect(loadHighScoreMs()).toBe(12876);
  });
});
