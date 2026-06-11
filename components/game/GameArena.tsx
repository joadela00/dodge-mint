import React from "react";

type ObstacleView = {
  id: number;
  x: number;
  y: number;
  size: number;
};

type GameArenaProps = {
  playerX: number;
  playerSize: number;
  playerY: number;
  obstacles: ObstacleView[];
};

export function GameArena({
  playerX,
  playerSize,
  playerY,
  obstacles,
}: GameArenaProps) {
  return (
    <div className="arena" aria-label="Game arena">
      <div
        className="player"
        style={{
          width: playerSize,
          height: playerSize,
          transform: `translate(${playerX}px, ${playerY}px)`,
        }}
      />
      {obstacles.map((obstacle) => (
        <div
          key={obstacle.id}
          className="obstacle"
          style={{
            width: obstacle.size,
            height: obstacle.size,
            transform: `translate(${obstacle.x}px, ${obstacle.y}px)`,
          }}
        />
      ))}
    </div>
  );
}
