(function () {
  const STORAGE_KEY = "dodge-mint-high-score-ms";
  const HITBOX_SCALE = 0.82;
  const SPAWN_PROTECTION_MS = 1000;
  const PLAYER_SPEED = 320;
  const PLAYER_SIZE = 44;
  const OBSTACLE_SIZE = 26;
  const RECENT_SPAWN_LIMIT = 4;
  const MINIMUM_SPAWN_SPACING = 58;

  const scoreEl = document.getElementById("score");
  const highScoreEl = document.getElementById("high-score");
  const finalScoreEl = document.getElementById("final-score");
  const finalHighScoreEl = document.getElementById("final-high-score");
  const overlayEl = document.getElementById("overlay");
  const overlayTitleEl = document.getElementById("overlay-title");
  const overlayBodyEl = document.getElementById("overlay-body");
  const startButtonEl = document.getElementById("start-button");
  const arenaEl = document.getElementById("arena");
  const playerEl = document.getElementById("player");
  const obstaclesEl = document.getElementById("obstacles");
  const leftButtonEl = document.getElementById("left-button");
  const rightButtonEl = document.getElementById("right-button");

  const state = {
    phase: "idle",
    direction: 0,
    playerX: 0,
    playerY: 0,
    elapsedMs: 0,
    highScoreMs: loadHighScoreMs(),
    obstacles: [],
    recentSpawnXs: [],
    spawnAccumulator: 0,
    lastTimestamp: null,
    rafId: null,
    obstacleId: 1,
    arenaWidth: 0,
    arenaHeight: 0,
  };

  function loadHighScoreMs() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? Number(raw) : 0;
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    } catch {
      return 0;
    }
  }

  function saveHighScoreMs(elapsedMs) {
    const next = Math.max(elapsedMs, state.highScoreMs);
    state.highScoreMs = next;

    try {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      return next;
    }

    return next;
  }

  function getDisplayScore(elapsedMs) {
    return Math.floor(elapsedMs / 1000);
  }

  function updateScoreDisplays() {
    const displayScore = getDisplayScore(state.elapsedMs);
    const displayHighScore = getDisplayScore(state.highScoreMs);

    scoreEl.textContent = String(displayScore);
    highScoreEl.textContent = String(displayHighScore);
    finalScoreEl.textContent = String(displayScore);
    finalHighScoreEl.textContent = String(displayHighScore);
  }

  function syncArenaMetrics() {
    state.arenaWidth = arenaEl.clientWidth;
    state.arenaHeight = arenaEl.clientHeight;
    state.playerY = state.arenaHeight - PLAYER_SIZE - 18;
    state.playerX = clamp(state.playerX, 0, state.arenaWidth - PLAYER_SIZE);
    renderPlayer();
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function getSpawnInterval(seconds) {
    if (seconds < 10) return 900;
    if (seconds < 30) return Math.max(540, 900 - (seconds - 10) * 16);
    if (seconds < 60) return Math.max(290, 580 - (seconds - 30) * 9.5);
    return 250;
  }

  function getFallSpeed(seconds) {
    if (seconds < 10) return 130;
    if (seconds < 30) return Math.min(235, 130 + (seconds - 10) * 5.2);
    if (seconds < 60) return Math.min(360, 235 + (seconds - 30) * 4.1);
    return 372;
  }

  function getScaledRect(rect, scale) {
    const width = rect.width * scale;
    const height = rect.height * scale;

    return {
      x: rect.x + (rect.width - width) / 2,
      y: rect.y + (rect.height - height) / 2,
      width,
      height,
    };
  }

  function overlaps(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  function pickSpawnX() {
    const maxX = Math.max(0, state.arenaWidth - OBSTACLE_SIZE);
    let fallbackX = 0;
    let fallbackDistance = -1;

    for (let attempt = 0; attempt < 7; attempt += 1) {
      const candidate = Math.random() * maxX;
      const distance = state.recentSpawnXs.length
        ? Math.min.apply(
            null,
            state.recentSpawnXs.map((recentX) => Math.abs(recentX - candidate)),
          )
        : Number.POSITIVE_INFINITY;

      if (distance >= MINIMUM_SPAWN_SPACING) {
        return candidate;
      }

      if (distance > fallbackDistance) {
        fallbackDistance = distance;
        fallbackX = candidate;
      }
    }

    return fallbackX;
  }

  function createObstacle() {
    const x = pickSpawnX();
    const obstacle = {
      id: state.obstacleId,
      x,
      y: -OBSTACLE_SIZE,
      size: OBSTACLE_SIZE,
      element: document.createElement("div"),
    };

    state.obstacleId += 1;
    state.recentSpawnXs = [x].concat(state.recentSpawnXs).slice(0, RECENT_SPAWN_LIMIT);

    obstacle.element.className = "obstacle";
    obstacle.element.style.width = OBSTACLE_SIZE + "px";
    obstacle.element.style.height = OBSTACLE_SIZE + "px";

    state.obstacles.push(obstacle);
    obstaclesEl.appendChild(obstacle.element);
    renderObstacle(obstacle);
  }

  function renderPlayer() {
    playerEl.style.transform = "translate(" + state.playerX + "px, " + state.playerY + "px)";
  }

  function renderObstacle(obstacle) {
    obstacle.element.style.transform = "translate(" + obstacle.x + "px, " + obstacle.y + "px)";
  }

  function clearObstacles() {
    for (const obstacle of state.obstacles) {
      obstacle.element.remove();
    }
    state.obstacles = [];
  }

  function setOverlay(mode) {
    if (mode === "playing") {
      overlayEl.classList.add("hidden");
      return;
    }

    overlayEl.classList.remove("hidden");

    if (mode === "idle") {
      overlayTitleEl.textContent = "READY?";
      overlayBodyEl.textContent = "왼쪽과 오른쪽 버튼을 누른 채로 이동해서 떨어지는 장애물을 피하세요.";
      startButtonEl.textContent = "게임 시작";
    } else {
      overlayTitleEl.textContent = "GAME OVER";
      overlayBodyEl.textContent = "최대한 오래 버티면서 최고 기록을 갱신해 보세요.";
      startButtonEl.textContent = "다시 시작";
    }
  }

  function setControlState(disabled) {
    leftButtonEl.disabled = disabled;
    rightButtonEl.disabled = disabled;

    if (disabled) {
      leftButtonEl.classList.remove("active");
      rightButtonEl.classList.remove("active");
    }
  }

  function startGame() {
    cancelLoop();
    syncArenaMetrics();
    state.phase = "playing";
    state.direction = 0;
    state.elapsedMs = 0;
    state.spawnAccumulator = 0;
    state.lastTimestamp = null;
    state.recentSpawnXs = [];
    state.playerX = (state.arenaWidth - PLAYER_SIZE) / 2;
    clearObstacles();
    updateScoreDisplays();
    renderPlayer();
    setControlState(false);
    setOverlay("playing");
    state.rafId = requestAnimationFrame(tick);
  }

  function endGame() {
    state.phase = "gameOver";
    saveHighScoreMs(state.elapsedMs);
    updateScoreDisplays();
    setControlState(true);
    setOverlay("gameOver");
    cancelLoop();
  }

  function cancelLoop() {
    if (state.rafId !== null) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }
    state.lastTimestamp = null;
  }

  function updateObstacles(deltaSeconds) {
    const speed = getFallSpeed(state.elapsedMs / 1000);
    const nextObstacles = [];

    for (const obstacle of state.obstacles) {
      obstacle.y += speed * deltaSeconds;

      if (obstacle.y <= state.arenaHeight + obstacle.size) {
        renderObstacle(obstacle);
        nextObstacles.push(obstacle);
      } else {
        obstacle.element.remove();
      }
    }

    state.obstacles = nextObstacles;
  }

  function checkCollision() {
    if (state.elapsedMs < SPAWN_PROTECTION_MS) {
      return false;
    }

    const playerRect = getScaledRect(
      { x: state.playerX, y: state.playerY, width: PLAYER_SIZE, height: PLAYER_SIZE },
      HITBOX_SCALE,
    );

    for (const obstacle of state.obstacles) {
      const obstacleRect = getScaledRect(
        { x: obstacle.x, y: obstacle.y, width: obstacle.size, height: obstacle.size },
        HITBOX_SCALE,
      );

      if (overlaps(playerRect, obstacleRect)) {
        return true;
      }
    }

    return false;
  }

  function tick(timestamp) {
    if (state.phase !== "playing") {
      return;
    }

    if (state.lastTimestamp === null) {
      state.lastTimestamp = timestamp;
      state.rafId = requestAnimationFrame(tick);
      return;
    }

    const deltaMs = Math.min(32, timestamp - state.lastTimestamp);
    const deltaSeconds = deltaMs / 1000;

    state.lastTimestamp = timestamp;
    state.elapsedMs += deltaMs;
    state.spawnAccumulator += deltaMs;

    state.playerX = clamp(
      state.playerX + state.direction * PLAYER_SPEED * deltaSeconds,
      0,
      state.arenaWidth - PLAYER_SIZE,
    );
    renderPlayer();

    const spawnInterval = getSpawnInterval(state.elapsedMs / 1000);
    while (state.spawnAccumulator >= spawnInterval) {
      state.spawnAccumulator -= spawnInterval;
      createObstacle();
    }

    updateObstacles(deltaSeconds);
    updateScoreDisplays();

    if (checkCollision()) {
      endGame();
      return;
    }

    state.rafId = requestAnimationFrame(tick);
  }

  function setDirection(direction) {
    if (state.phase !== "playing") {
      return;
    }
    state.direction = direction;
  }

  function bindControl(button, direction) {
    button.addEventListener("pointerdown", function (event) {
      event.preventDefault();
      setDirection(direction);
      button.classList.add("active");
    });

    const release = function () {
      if (state.direction === direction) {
        setDirection(0);
      }
      button.classList.remove("active");
    };

    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("pointerleave", release);
  }

  function bindKeyboard() {
    window.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") {
        setDirection(-1);
        leftButtonEl.classList.add("active");
      }
      if (event.key === "ArrowRight") {
        setDirection(1);
        rightButtonEl.classList.add("active");
      }
    });

    window.addEventListener("keyup", function (event) {
      if (event.key === "ArrowLeft" && state.direction === -1) {
        setDirection(0);
      }
      if (event.key === "ArrowRight" && state.direction === 1) {
        setDirection(0);
      }
      if (event.key === "ArrowLeft") {
        leftButtonEl.classList.remove("active");
      }
      if (event.key === "ArrowRight") {
        rightButtonEl.classList.remove("active");
      }
    });
  }

  function init() {
    syncArenaMetrics();
    renderPlayer();
    updateScoreDisplays();
    setOverlay("idle");
    setControlState(true);
    bindControl(leftButtonEl, -1);
    bindControl(rightButtonEl, 1);
    bindKeyboard();

    startButtonEl.addEventListener("click", startGame);
    window.addEventListener("resize", syncArenaMetrics);
  }

  init();
})();
