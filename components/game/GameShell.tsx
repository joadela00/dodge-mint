"use client";

import React from "react";

import { GameArena } from "./GameArena";
import { GameControls } from "./GameControls";
import { GameOverlay } from "./GameOverlay";
import { useDodgeMintGame } from "./useDodgeMintGame";

export function GameShell() {
  const game = useDodgeMintGame();

  return (
    <main className="shell">
      <header className="hud">
        <span>Score: {game.score}</span>
        <span>Best: {game.highScore}</span>
      </header>

      <GameArena
        playerX={game.player.x}
        playerSize={game.player.size}
        playerY={game.player.y}
        obstacles={game.obstacles}
      />

      <GameControls
        disabled={game.phase !== "playing"}
        onDirectionChange={game.setDirection}
      />

      <GameOverlay
        phase={game.phase}
        score={game.score}
        highScore={game.highScore}
        onStart={game.startGame}
      />
    </main>
  );
}
