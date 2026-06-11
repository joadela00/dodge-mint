import React from "react";

import { fireEvent, render, screen } from "@testing-library/react";
import { GameControls } from "@/components/game/GameControls";

test("hold controls start movement on press and stop on release", () => {
  const events: string[] = [];

  render(
    <GameControls
      disabled={false}
      onDirectionChange={(direction) => events.push(String(direction))}
    />,
  );

  const leftButton = screen.getByRole("button", { name: /left/i });

  fireEvent.pointerDown(leftButton);
  fireEvent.pointerUp(leftButton);

  expect(events).toEqual(["-1", "0"]);
});
