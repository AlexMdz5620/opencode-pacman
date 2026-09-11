# AGENTS.md

## Project

Vanilla JS Pac-Man clone (no framework, no build tools). Static site served from `src/`. Used for learning spec-driven development.

## Architecture

Files communicate via `window` globals, loaded in order by `src/index.html`:

1. `src/js/maze.js` — maze data (`MAZE`, `TUNNEL_ROW`, `PACMAN_START`, `GHOST_STARTS`)
2. `src/js/game.js` — state + rules (`createGame`, `update`, `DIRS`)
3. `src/js/render.js` — canvas drawing (`draw`)
4. `src/js/main.js` — game loop, input, UI overlays

`game.js` mutates `game.grid` (a copy of `MAZE`); `render.js` always reads from `game.grid`, never `MAZE` directly.

## Run

Open `src/index.html` in a browser. No server needed. No npm, no build step.

## Skills

`spec` and `spec-impl` skills are installed (see `.agents/skills/`). Use them for feature work per the project's spec-driven workflow.

## Conventions

- All code is vanilla JS with `window` exports — no modules, no imports.
- Maze uses 28x31 grid: `'#'`=wall(1), `'.'`=dot(2), `' '`=empty(0), `'-'`=pen door(3).
- Spanish comments and UI text throughout.
- Canvas size: 560x620 (`TILE=20`, maze 28 cols x 31 rows).
