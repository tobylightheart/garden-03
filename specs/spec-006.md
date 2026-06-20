# The Weight of Shadow

## Background & Inspiration
Inspired by the tension of balancing on a thin beam and the psychological pressure of forced momentum. The game explores the theme of "stasis vs. progress" – how some obstacles require you to stop, even when your environment is designed to push you forward.

## Technical Implementation Plan
- **Core Mechanics**:
    - **Momentum System**: The player character has a velocity. If the player stops providing input for more than 0.5 seconds, a "Tilt" value begins to increase.
    - **Tilt Physics**: As the Tilt value increases, the camera/viewport slightly tilts, and a global "Gravity Force" is applied to the player, pushing them towards the "downhill" side of the maze.
    - **Stasis Gates**: Specific points in the maze where the player must reach a velocity of 0 and remain there for 3 continuous seconds. A progress bar will appear above the player's head.
    - **Pitfalls**: If the player slides into a "pit" (represented by a specific color or texture), the level restarts.
- **Rendering**:
    - Use a 2D Canvas API for smooth movement and tilt effects.
    - The maze walls should have a slight "shimmer" to reflect the unstable nature of the environment.
- **Level Design**:
    - 10-15 rooms.
    - The first 3 rooms serve as tutorials (learning to move, then learning the tilt).
    - The middle rooms introduce Stasis Gates.
    - The final room requires a sequence of 3 Stasis Gates in a row to open the exit.

## Creativity Focus
- **Juice**: The "Tilt" effect should feel heavy. Use a slight screen shake and a low-frequency hum that gets louder as the tilt increases.
- **Visuals**: A dark, moody aesthetic with deep purples and greys. The "pits" should look like bottomless voids.
- **Control**: Ensure the movement feels "slippery" but still controllable.

## Links
- **From**: `games/shadow_path.html` (The Shadow Path ends in a "Stasis" chamber that requires the player to stand still, which is the opposite of its own mechanic).
- **To**: `games/entry.html` (The final exit leads back to the start).
