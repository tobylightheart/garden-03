# Spec: The Synchronized Labyrinth

## Thematic Background
Inspired by quantum entanglement and parallel dimensions. The atmosphere is high-tech and slightly surreal, with a color palette of neon blues, cyans, and deep blacks. The soundscape features synth-heavy, rhythmic pulses that sync with the actions in both rooms.

## Technical Implementation Plan
1. **Core Mechanics**:
   - **Dual Viewport**: A split-screen view or a "switch" mechanic to view Room A and Room B.
   - **Entangled Actions**: A mapping of actions. For example:
     - Move Block in A -> Move Block in B (different position).
     - Open Gate in A -> Create Bridge in B.
     - Toggle Power in A -> Light up Room B.
   - **Synchronization**: The player must navigate both rooms to their respective exits.
2. **Technology Stack**:
   - HTML5 Canvas for rendering both rooms.
   - Vanilla JavaScript for managing the entangled states.
   - CSS for the split-screen UI and animations.
3. **State Management**:
   - `rooms`: Object containing `roomA` and `roomB` states.
   - `entangleMap`: A dictionary defining how actions in A affect B.
   - `playerPos`: Coordinates for both rooms.

## Creativity Focus
- **Visual Feedback**: When an action in Room A affects Room B, there should be a "ripple" effect or a visual "glitch" to indicate the entanglement.
- **Level Design**: Design levels where it's impossible to progress in Room A without first performing a specific sequence in Room B, and vice versa.

## Connections
- **Links to**: `games/echoing_corridor.html`. A "Twin Key" found in the final room of the Synchronized Labyrinth unlocks a hidden chamber in the Echoing Corridor.
- **Links from**: `games/prism_maze.html`. Completing the Prism Maze provides the "Entanglement Lens", which is required to start the Synchronized Labyrinth.
