# Spec: The Weaver's Thread

## Thematic Background
In a world of unraveling reality, the "Weaver" is the only one who can stitch the fragments of the labyrinth back together. The atmosphere is ethereal and delicate, with a color palette of silvers, deep indigos, and glowing whites. The soundscape should feature soft, plucking string instruments (like a harp or koto) and the sound of threads being pulled or snipped.

## Technical Implementation Plan
1.  **Core Mechanics**:
    -   **Anchor Points**: Static points in the maze where threads can be attached.
    -   **Threading**: Players click an anchor point to select it, then click another to create a "thread" (a wall/path).
    -   **Pathfinding**: The game checks if a continuous path exists from the Start to the Goal using only the threads created by the player.
    -   **Snag Points**: Certain areas in the maze are "snags". If a thread passes through them, it "breaks" (disappears).
    -   **Undo/Redo**: A basic system to remove the last placed thread.
2.  **Technology Stack**:
    -   HTML5 Canvas for rendering the maze and threads.
    -   Vanilla JavaScript for game logic and state management.
    -   CSS for UI overlays (buttons, instructions, "win" screen).
3.  **State Management**:
    -   `anchors`: Array of coordinates.
    -   `threads`: Array of objects `{ start: index, end: index }`.
    -   `snagPoints`: Array of coordinates.
    -   `currentSelection`: Index of the currently selected anchor.

## Creativity Focus
-   **Visual Style**: Focus on the "weaving" animation. When a thread is placed, it shouldn't just appear; it should "zip" across the screen with a slight curve.
-   **Sound Design**: Dynamic music that becomes more harmonious as the player completes more "segments" of the path.
-   **Puzzle Design**: Create levels that require "branching" paths where one thread might be needed for two different route segments.

## Connections
-   **Links to**: `games/prism_maze.html`. A hidden "silver needle" in the Prism Maze's final room can be "picked up" (saved in local storage), which unlocks a special "Golden Thread" in this game.
-   **Links from**: `games/shadow_path.html`. If a player completes the Shadow Path, they are "teleported" to the Weaver's Loom (the start of this game) with their first thread already placed.
