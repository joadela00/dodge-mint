(function () {
  const STORAGE_KEY = "dodge-mint-high-score-ms";
  const HITBOX_SCALE = 0.8;
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
  const bestBadgeEl = document.getElementById("best-badge");
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
    heldLeft: false,
    heldRight: false,
    lastHeldDirection: 0,
    displayScore: -1,
    displayHighScore: -1,
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

  function updateScoreDisplays(force) {
    const displayScore = getDisplayScore(state.elapsedMs);
    const displayHighScore = getDisplayScore(state.highScoreMs);

    if (force || displayScore !== state.displayScore) {
      state.displayScore = displayScore;
      scoreEl.textContent = String(displayScore);
      finalScoreEl.textContent = String(displayScore);
    }

    if (force || displayHighScore !== state.displayHighScore) {
      state.displayHighScore = displayHighScore;
      highScoreEl.textContent = String(displayHighScore);
      finalHighScoreEl.textContent = String(displayHighScore);
    }
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
    playerEl.style.transform = "translate3d(" + state.playerX + "px, " + state.playerY + "px, 0)";
  }

  function renderObstacle(obstacle) {
    obstacle.element.style.transform = "translate3d(" + obstacle.x + "px, " + obstacle.y + "px, 0)";
  }

  function clearObstacles() {
    for (const obstacle of state.obstacles) {
      obstacle.element.remove();
    }
    state.obstacles = [];
  }

  function setBestBadgeVisible(visible) {
    bestBadgeEl.classList.toggle("best-badge-hidden", !visible);
  }

  function setOverlay(mode, isNewBest) {
    if (mode === "playing") {
      setBestBadgeVisible(false);
      overlayEl.classList.add("hidden");
      return;
    }

    overlayEl.classList.remove("hidden");
    setBestBadgeVisible(Boolean(isNewBest));

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

  function syncDirectionFromHeld() {
    if (state.phase !== "playing") {
      state.direction = 0;
      return;
    }

    if (state.heldLeft && state.heldRight) {
      state.direction = state.lastHeldDirection;
      return;
    }

    if (state.heldLeft) {
      state.direction = -1;
      return;
    }

    if (state.heldRight) {
      state.direction = 1;
      return;
    }

    state.direction = 0;
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
    state.heldLeft = false;
    state.heldRight = false;
    state.lastHeldDirection = 0;
    state.playerX = (state.arenaWidth - PLAYER_SIZE) / 2;
    clearObstacles();
    updateScoreDisplays(true);
    renderPlayer();
    setControlState(false);
    setOverlay("playing", false);
    state.rafId = requestAnimationFrame(tick);
  }

  function endGame() {
    const isNewBest = state.elapsedMs > state.highScoreMs;

    state.phase = "gameOver";
    state.direction = 0;
    state.heldLeft = false;
    state.heldRight = false;
    saveHighScoreMs(state.elapsedMs);
    updateScoreDisplays(true);
    setControlState(true);
    setOverlay("gameOver", isNewBest);
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
    updateScoreDisplays(false);

    if (checkCollision()) {
      endGame();
      return;
    }

    state.rafId = requestAnimationFrame(tick);
  }

  function bindControl(button, direction) {
    const heldKey = direction < 0 ? "heldLeft" : "heldRight";
    let activePointerId = null;

    function release(pointerId) {
      if (pointerId !== undefined && activePointerId !== pointerId) {
        return;
      }

      state[heldKey] = false;
      syncDirectionFromHeld();
      button.classList.remove("active");

      if (pointerId !== undefined && button.hasPointerCapture && button.hasPointerCapture(pointerId)) {
        button.releasePointerCapture(pointerId);
      }

      activePointerId = null;
    }

    button.addEventListener("pointerdown", function (event) {
      if (activePointerId !== null) {
        return;
      }

      event.preventDefault();
      activePointerId = event.pointerId;
      state[heldKey] = true;
      state.lastHeldDirection = direction;
      syncDirectionFromHeld();
      button.classList.add("active");

      if (button.setPointerCapture) {
        button.setPointerCapture(event.pointerId);
      }
    });

    button.addEventListener("pointerup", function (event) {
      release(event.pointerId);
    });

    button.addEventListener("pointercancel", function (event) {
      release(event.pointerId);
    });

    button.addEventListener("lostpointercapture", function (event) {
      release(event.pointerId);
    });
  }

  function bindKeyboard() {
    window.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") {
        state.heldLeft = true;
        state.lastHeldDirection = -1;
        leftButtonEl.classList.add("active");
        syncDirectionFromHeld();
      }
      if (event.key === "ArrowRight") {
        state.heldRight = true;
        state.lastHeldDirection = 1;
        rightButtonEl.classList.add("active");
        syncDirectionFromHeld();
      }
    });

    window.addEventListener("keyup", function (event) {
      if (event.key === "ArrowLeft") {
        state.heldLeft = false;
        leftButtonEl.classList.remove("active");
        syncDirectionFromHeld();
      }
      if (event.key === "ArrowRight") {
        state.heldRight = false;
        rightButtonEl.classList.remove("active");
        syncDirectionFromHeld();
      }
    });
  }

  function init() {
    syncArenaMetrics();
    renderPlayer();
    updateScoreDisplays(true);
    setOverlay("idle", false);
    setControlState(true);
    bindControl(leftButtonEl, -1);
    bindControl(rightButtonEl, 1);
    bindKeyboard();

    startButtonEl.addEventListener("click", startGame);
    window.addEventListener("resize", syncArenaMetrics);
  }

  init();
})();
