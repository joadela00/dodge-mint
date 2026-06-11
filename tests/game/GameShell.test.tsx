import React from "react";

import { render, screen } from "@testing-library/react";
import { GameShell } from "@/components/game/GameShell";

vi.mock("@/components/game/useDodgeMintGame", () => ({
  useDodgeMintGame: () => ({
    phase: "idle",
    score: 0,
    highScore: 12,
    player: { x: 100, y: 420, size: 40 },
    obstacles: [],
    setDirection: vi.fn(),
    startGame: vi.fn(),
  }),
}));

test("idle view shows current best score and start button", () => {
  render(<GameShell />);

  expect(screen.getByText(/best: 12/i)).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /start game/i }),
  ).toBeInTheDocument();
});
