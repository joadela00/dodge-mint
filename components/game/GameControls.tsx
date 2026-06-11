import React from "react";

type GameControlsProps = {
  disabled: boolean;
  onDirectionChange: (direction: -1 | 0 | 1) => void;
};

function bindHoldHandlers(
  direction: -1 | 1,
  disabled: boolean,
  onDirectionChange: (direction: -1 | 0 | 1) => void,
) {
  return {
    onPointerDown: () => {
      if (!disabled) {
        onDirectionChange(direction);
      }
    },
    onPointerUp: () => onDirectionChange(0),
    onPointerCancel: () => onDirectionChange(0),
    onPointerLeave: () => onDirectionChange(0),
  };
}

export function GameControls({
  disabled,
  onDirectionChange,
}: GameControlsProps) {
  return (
    <div className="controls">
      <button
        aria-label="Move left"
        disabled={disabled}
        {...bindHoldHandlers(-1, disabled, onDirectionChange)}
      >
        Left
      </button>
      <button
        aria-label="Move right"
        disabled={disabled}
        {...bindHoldHandlers(1, disabled, onDirectionChange)}
      >
        Right
      </button>
    </div>
  );
}
