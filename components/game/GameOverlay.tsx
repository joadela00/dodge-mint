import React from "react";

import type { GamePhase } from "./gameTypes";

type GameOverlayProps = {
  phase: GamePhase;
  score: number;
  highScore: number;
  onStart: () => void;
};

export function GameOverlay({
  phase,
  score,
  highScore,
  onStart,
}: GameOverlayProps) {
  if (phase === "playing") {
    return null;
  }

  return (
    <div className="overlay">
      <h1>{phase === "idle" ? "Dodge Mint" : "GAME OVER"}</h1>
      <p>
        {phase === "idle"
          ? "Hold left or right to dodge falling obstacles."
          : `Score: ${score}`}
      </p>
      <p>Best: {highScore}</p>
      <button onClick={onStart}>
        {phase === "idle" ? "Start Game" : "Play Again"}
      </button>
    </div>
  );
}
