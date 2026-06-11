const STORAGE_KEY = "dodge-mint-high-score-ms";

export function loadHighScoreMs() {
  if (typeof window === "undefined") {
    return 0;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? Number(raw) : 0;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

export function saveHighScoreMs(elapsedMs: number) {
  if (typeof window === "undefined") {
    return elapsedMs;
  }

  const current = loadHighScoreMs();
  const next = elapsedMs > current ? elapsedMs : current;

  try {
    window.localStorage.setItem(STORAGE_KEY, String(next));
  } catch {
    return current;
  }

  return next;
}
