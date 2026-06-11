# Dodge Mint v1 Design

## Goal

Build a mobile-first single-page arcade survival game in Next.js where the player dodges falling obstacles for as long as possible. The first version is intentionally narrow: validate movement feel, collision fairness, difficulty pacing, and high score retention.

## Scope

Included in v1:

- Start button and restart loop
- Player movement with hold-to-move controls
- Random falling obstacles
- Immediate game over on collision
- Survival-time score with integer display
- Persistent high score with `localStorage`

Excluded from v1:

- Sound
- Vibration / haptics
- Items or power-ups
- Special effects or particle systems
- Authentication, backend, multiplayer, or progression systems

## Product Constraints

- Stack: Next.js, TypeScript, React
- Single-page experience
- Mobile-first layout for portrait orientation
- Mobile Safari support
- Repeat play without page refresh
- Minimal dependencies
- Placeholder graphics only
- Target smooth play close to 60fps on modern mobile browsers

## Core UX

### Flow

1. Idle screen shows game title, short instruction, start button, and current high score.
2. When the user taps start, the game resets all transient state and enters active play immediately.
3. During play, the player holds left or right controls to move at a constant speed.
4. Obstacles spawn from the top, fall downward, and become more dangerous over time.
5. On collision, the game stops immediately and shows a game-over overlay with current score, high score, and restart button.

### Interaction Rules

- Left and right controls are always visible in the lower area of the screen.
- Pressing and holding a control starts continuous movement in that direction.
- Releasing the control stops movement immediately.
- No acceleration, momentum, or fixed-step movement is used.
- Player movement is clamped to the arena bounds.

### Fairness Rules

- Collision detection is forgiving.
- Effective hitboxes for both player and obstacles are reduced to roughly 82% of rendered size.
- Near-miss deaths should be rare.

## Technical Design

### Architecture

Use DOM rendering for visible game objects and an imperative game loop driven by `requestAnimationFrame`.

React owns only UI-level state:

- Game phase: `idle | playing | gameOver`
- Integer score
- High score
- Optional transient metadata needed by overlays

Imperative refs own frame-critical state:

- Player position and movement direction
- Obstacle list
- Spawn timing
- Difficulty progression
- Animation frame handle
- Last frame timestamp
- Collision flag / stop flag

### Recommended Structure

- `app/page.tsx`: page composition for the game screen
- `components/game/GameShell.tsx`: layout wrapper and high-level orchestration
- `components/game/GameArena.tsx`: visible playfield and DOM object rendering
- `components/game/GameOverlay.tsx`: idle and game-over overlays
- `components/game/GameControls.tsx`: touch-friendly hold controls
- `components/game/useDodgeMintGame.ts`: imperative loop, spawn logic, movement, collision, restart lifecycle
- `components/game/gameTypes.ts`: shared types and constants
- `components/game/storage.ts`: high score load/save helpers

Exact file names may adapt to the scaffold, but responsibilities should stay separated this way.

### Rendering Model

- The arena is a fixed-aspect portrait-oriented container sized responsively for mobile screens.
- Player and obstacles render as absolutely positioned DOM elements inside the arena.
- The loop updates positions in refs and emits throttled UI snapshots for React rendering.
- React re-renders should happen only when visible object positions need repainting and when UI state changes.

Because object counts in v1 are small, DOM rendering is sufficient and simpler than introducing canvas.

### State Ownership

#### React state

- `phase`
- `score`
- `highScore`
- Render snapshot of player/obstacles for display

#### Mutable refs

- `playerX`
- `moveDirection`
- `obstacles`
- `elapsedMs`
- `spawnAccumulator`
- `rafId`
- `lastTimestamp`
- `isRunning`

The loop should update refs every frame and publish only the data React needs to paint the current scene.

## Game Systems

### Arena

- Portrait playfield centered on the page
- Bottom safe area reserved visually for the player
- No scrolling during gameplay
- Touch actions on controls should avoid browser gestures where possible

### Player

- Rendered as a simple rounded square or circle near the bottom of the arena
- Starts centered horizontally
- Moves only on the x-axis
- Constant speed while a direction is held
- Stops immediately when no direction is held

### Obstacles

- Rendered as simple circular objects
- Spawn at random x positions at the top edge
- Move only downward
- Removed once they leave the arena
- Initial count and speed are intentionally gentle

### Difficulty Scaling

Difficulty is time-based and deterministic from elapsed survival time.

- `0-10s`: very easy, low spawn rate, slow fall speed
- `10-30s`: gradual linear increase in spawn rate and fall speed
- `30-60s`: steeper increase
- `60s+`: high sustained pressure, still bounded to avoid impossible spikes

Implementation approach:

- Use helper functions such as `getSpawnInterval(elapsedSeconds)` and `getFallSpeed(elapsedSeconds)`.
- Keep functions continuous or near-continuous so difficulty does not jump abruptly.
- Clamp maximum spawn density and speed to maintain fairness.

### Scoring

- Score is based on elapsed survival time
- `floor(elapsedMs / 1000)` for display
- UI updates once per second for score are acceptable even if the loop tracks finer-grained time internally

### Collision

- Use simple axis-aligned bounding box overlap for v1
- Apply reduced effective bounds at roughly 82% scale for both entities before overlap checks
- Collision ends the run immediately and freezes updates

### Persistence

- Store high score in `localStorage`
- Read on initial client load
- Update only when the current run beats the stored value
- Guard storage access so server render paths do not throw

## UI Design

### In-Game HUD

- Top row shows current score and high score
- Clear contrast and legible numerals on mobile
- Minimal chrome so the arena remains the focus

### Controls

- Two large semi-transparent buttons anchored at the bottom
- Sized for thumb use
- Respond to pointer and touch input
- Use press start / press end semantics instead of click toggles

### Overlays

Idle overlay:

- Title
- One-line instruction
- Start button
- High score

Game-over overlay:

- `GAME OVER`
- Current score
- High score
- Restart button

## Error Handling

- Missing or blocked `localStorage` should fail gracefully by treating high score as `0`
- Cancel animation frame and clear loop state on unmount
- Prevent duplicate loop starts from repeated button presses

## Testing Strategy

Primary automated tests should target pure logic first:

- Difficulty helpers return expected ranges over time
- Collision helper respects forgiving hitbox scaling
- Score conversion truncates fractional seconds
- High score storage helpers load and save safely

Integration behavior to verify manually:

- Hold left/right moves continuously and stops on release
- Player cannot leave arena bounds
- Collision ends run immediately
- Restart works repeatedly without refresh
- High score persists across reload
- Touch controls behave correctly on mobile-sized viewport

## Extensibility Notes

Do not implement effects systems now, but preserve separation so they can be added later:

- Sound and vibration can attach to phase changes and collision events
- Visual effects can subscribe to obstacle spawn and collision events
- Items can be added as another falling entity type without changing the basic loop structure

## Success Criteria

The v1 build is successful if:

- The game is understandable within a few seconds
- Touch controls feel responsive and predictable
- Players perceive collisions as fair
- Difficulty ramps from gentle to challenging over extended survival
- High score persistence works reliably without backend infrastructure
