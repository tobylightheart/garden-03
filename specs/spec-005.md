# The Fractal Fold

## Background & Inspiration
Inspired by origami and non-Euclidean geometry. The goal is to challenge the player's mental map of the space. Instead of just navigating a static maze, the player is actively reshaping the maze.

## Technical Implementation Plan
- **HTML Structure**: A central `canvas` or a container for a 2D grid-based maze.
- **State Management**: 
    - A `Room` object with a set of `Passages`.
    - A `FoldState` (0-3) that determines which passages are active.
    - A `Player` object with (x, y) coordinates.
- **Mechanics**:
    - The player moves in 4 directions.
    - The player can press a button (e.g., 'F') to "Fold" the room.
    - Folding rotates the connectivity matrix of the current room. For example, a passage that was "North" might now connect to "East".
    - Visuals: A smooth transition animation (CSS transform or Canvas animation) to show the room "folding".
- **Level Design**:
    - A series of 5-10 rooms.
    - Some rooms are "Stable" (cannot fold), some are "Foldable".
    - The exit is only accessible if the final room is folded into a specific configuration.

## Creativity Focus
- Focus on the "Fold" animation. It should feel tactile and satisfying, not just a sudden snap of the layout.
- The visual style should be minimalist—perhaps just lines and solid colors to emphasize the geometry.

## Links
- **From**: `games/shadow_path.html` (The Shadow Path ends in a "Foldable" room that leads to this maze).
- **To**: `games/entry.html` (This could be the ultimate hidden "end" of the garden).
