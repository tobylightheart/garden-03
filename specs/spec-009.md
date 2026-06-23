# Spec: The Echo of Presence

## Theme
A haunted memory. The player is walking through the "memory" of a person who lived here. Every move they make leaves a lingering trace—a ghost of their presence.

## Inspiration
- **Superhot**: Time manipulation and "recording" actions.
- **Portal**: Spatial puzzles requiring specific positioning.
- **Ghostrunner**: Fast-paced movement and "echo" aesthetics.

## Mechanics
- **Recording**: As the player moves, their position is stored in a buffer.
- **Persistence**: The "ghost" of the player follows this path but fades after 10 seconds.
- **Puzzle Design**: 
    - Pressure plates that must be held down.
    - Doors that only stay open if something is blocking a sensor.
    - Hazards that must be blocked by a "ghost" while the player passes through.
- **Time Loop**: Some puzzles might require the player to "loop" back and meet their own ghost at a specific timestamp.

## Technical Implementation
- **Engine**: Vanilla JS with a `requestAnimationFrame` loop.
- **Data Structure**: A `ghostBuffer` (array of `{x, y, time}`).
- **Rendering**: Draw a trail of semi-transparent sprites or a "trail" effect for the ghost.
- **Collision**: Ghosts have no collision with the environment but are "recorded" from the player's collision state.
- **Win Condition**: Reach the "Core of Memories" (end of the maze).

## Creative Focus
- **Atmospheric Lighting**: Flickering torches and a heavy "fog of memory" effect.
- **The "Ghost" Effect**: Should look like a trailing shadow or a blurred, semi-transparent figure.
- **Sound Design**: Muffled echoes of the player's own footsteps, delayed by a second.

## Links
- **From**: None.
- **To**: `spec-008` (The Synchronized Labyrinth) - A "Master" level could involve synchronizing with a ghost from a previous run.
