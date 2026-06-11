"use client";

import { useEffect, useRef, useState } from "react";

import {
  applyHitboxScale,
  getDisplayScore,
  getFallSpeed,
  getSpawnInterval,
  isSpawnProtectionActive,
  pickSpawnX,
  rectanglesOverlap,
} from "./gameLogic";
import { HITBOX_SCALE, type Direction, type GamePhase } from "./gameTypes";
import { loadHighScoreMs, saveHighScoreMs } from "./storage";

type Obstacle = {
  id: number;
  x: number;
  y: number;
  size: number;
};

const ARENA_WIDTH = 320;
const ARENA_HEIGHT = 520;
const PLAYER_SIZE = 40;
const PLAYER_Y = 460;
const PLAYER_SPEED = 280;
const OBSTACLE_SIZE = 24;
const RECENT_SPAWN_LIMIT = 3;
const MINIMUM_SPAWN_SPACING = 56;

export function useDodgeMintGame() {
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [score, setScore] = useState(0);
  const [highScoreMs, setHighScoreMs] = useState(0);
  const [playerXView, setPlayerXView] = useState((ARENA_WIDTH - PLAYER_SIZE) / 2);
  const [obstaclesView, setObstaclesView] = useState<Obstacle[]>([]);

  const frameRef = useRef<number | null>(null);
  const directionRef = useRef<Direction>(0);
  const elapsedMsRef = useRef(0);
  const lastTimestampRef = useRef<number | null>(null);
  const spawnAccumulatorRef = useRef(0);
  const obstacleIdRef = useRef(1);
  const playerXRef = useRef((ARENA_WIDTH - PLAYER_SIZE) / 2);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const recentSpawnXsRef = useRef<number[]>([]);
  const runningRef = useRef(false);

  useEffect(() => {
    setHighScoreMs(loadHighScoreMs());

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const stopLoop = () => {
    runningRef.current = false;

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }

    frameRef.current = null;
    lastTimestampRef.current = null;
  };

  const publishView = () => {
    setPlayerXView(playerXRef.current);
    setObstaclesView([...obstaclesRef.current]);
    setScore(getDisplayScore(elapsedMsRef.current));
  };

  const endGame = () => {
    stopLoop();
    const nextHighScoreMs = saveHighScoreMs(elapsedMsRef.current);
    setHighScoreMs(nextHighScoreMs);
    setPhase("gameOver");
    publishView();
  };

  const tick = (timestamp: number) => {
    if (!runningRef.current) {
      return;
    }

    if (lastTimestampRef.current === null) {
      lastTimestampRef.current = timestamp;
      frameRef.current = requestAnimationFrame(tick);
      return;
    }

    const deltaMs = timestamp - lastTimestampRef.current;
    lastTimestampRef.current = timestamp;
    elapsedMsRef.current += deltaMs;

    const deltaSeconds = deltaMs / 1000;
    const elapsedSeconds = elapsedMsRef.current / 1000;

    playerXRef.current = Math.max(
      0,
      Math.min(
        ARENA_WIDTH - PLAYER_SIZE,
        playerXRef.current + directionRef.current * PLAYER_SPEED * deltaSeconds,
      ),
    );

    spawnAccumulatorRef.current += deltaMs;
    const spawnInterval = getSpawnInterval(elapsedSeconds);

    while (spawnAccumulatorRef.current >= spawnInterval) {
      spawnAccumulatorRef.current -= spawnInterval;

      const x = pickSpawnX({
        arenaWidth: ARENA_WIDTH,
        obstacleSize: OBSTACLE_SIZE,
        minimumSpacing: MINIMUM_SPAWN_SPACING,
        recentXs: recentSpawnXsRef.current,
      });

      obstaclesRef.current.push({
        id: obstacleIdRef.current++,
        x,
        y: -OBSTACLE_SIZE,
        size: OBSTACLE_SIZE,
      });

      recentSpawnXsRef.current = [x, ...recentSpawnXsRef.current].slice(
        0,
        RECENT_SPAWN_LIMIT,
      );
    }

    const fallSpeed = getFallSpeed(elapsedSeconds);
    obstaclesRef.current = obstaclesRef.current
      .map((obstacle) => ({
        ...obstacle,
        y: obstacle.y + fallSpeed * deltaSeconds,
      }))
      .filter((obstacle) => obstacle.y <= ARENA_HEIGHT + obstacle.size);

    if (!isSpawnProtectionActive(elapsedMsRef.current)) {
      const playerRect = applyHitboxScale(
        { x: playerXRef.current, y: PLAYER_Y, width: PLAYER_SIZE, height: PLAYER_SIZE },
        HITBOX_SCALE,
      );

      const hit = obstaclesRef.current.some((obstacle) =>
        rectanglesOverlap(
          playerRect,
          applyHitboxScale(
            { x: obstacle.x, y: obstacle.y, width: obstacle.size, height: obstacle.size },
            HITBOX_SCALE,
          ),
        ),
      );

      if (hit) {
        endGame();
        return;
      }
    }

    publishView();
    frameRef.current = requestAnimationFrame(tick);
  };

  const startGame = () => {
    stopLoop();
    setPhase("playing");
    setScore(0);
    playerXRef.current = (ARENA_WIDTH - PLAYER_SIZE) / 2;
    obstaclesRef.current = [];
    recentSpawnXsRef.current = [];
    elapsedMsRef.current = 0;
    spawnAccumulatorRef.current = 0;
    directionRef.current = 0;
    runningRef.current = true;
    publishView();
    frameRef.current = requestAnimationFrame(tick);
  };

  return {
    phase,
    score,
    highScore: getDisplayScore(highScoreMs),
    highScoreMs,
    player: { x: playerXView, y: PLAYER_Y, size: PLAYER_SIZE },
    obstacles: obstaclesView,
    setDirection: (direction: Direction) => {
      directionRef.current = direction;
    },
    startGame,
  };
}
