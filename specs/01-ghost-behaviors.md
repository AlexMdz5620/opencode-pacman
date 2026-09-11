# SPEC 01 — Comportamientos de los 4 fantasmas originales

> **Status:** Approved
> **Depends on:** Ninguno
> **Date:** 2026-09-11
> **Objective:** Implementar los 4 fantasmas originales de Pac-Man (Blinky, Pinky, Inky, Clyde) con sus comportamientos de persecución fielmente replicados del juego arcade de 1980.

## Scope

**In:**

- 4 fantasmas con nombres, colores y comportamientos originales
- Blinky: persigue directamente la celda actual de PacMan
- Pinky: apunta 4 celdas adelante de la dirección de PacMan (con bug de overflow al mirar arriba)
- Inky: usa la posición de Blinky para calcular su objetivo mediante vector duplicado
- Clyde: persigue cuando está a más de 8 celdas, retrocede a su esquina cuando está más cerca
- Todos los fantasmas empiezan en el pen y salen cada 1.5 segundos
- Misma velocidad para todos los fantasmas

**Out of scope (for future specs):**

- Modo scatter (fantasmas van a esquinas fijas)
- Modo frightened (fantasmas azules, comestibles)
- Modo eaten (ojos regresan al pen)
- Cruise Elroy (Blinky se acelera)
- Velocidades diferentes por fantasma
- Dificultad progresiva por nivel

## Data model

```js
// Colores de los fantasmas
const GHOST_COLORS = {
  blinky: "#FF0000", // Rojo
  pinky: "#FFB8FF", // Rosa
  inky: "#00FFFF", // Cian
  clyde: "#FFB852", // Naranja
};

// Nombres de los fantasmas
const GHOST_NAMES = {
  blinky: "Shadow",
  pinky: "Speedy",
  inky: "Bashful",
  clyde: "Pokey",
};

// Posiciones iniciales en el pen (dentro de la caja)
const GHOST_STARTS = [
  { x: 13, y: 14, kind: "blinky" },
  { x: 14, y: 14, kind: "pinky" },
  { x: 13, y: 15, kind: "inky" },
  { x: 14, y: 15, kind: "clyde" },
];

// Timer de salida del pen (1.5 segundos por fantasma)
const GHOST_EXIT_INTERVAL = 1.5; // segundos
```

## Implementation plan

1. **Actualizar `src/js/maze.js`** con los 4 fantasmas en GHOST_STARTS
   - Agregar constantes GHOST_COLORS y GHOST_NAMES
   - Mantener las posiciones iniciales dentro del pen
   - Verificar que el laberinto soporta 4 fantasmas en el pen

2. **Implementar sistema de salida del pen en `src/js/game.js`**
   - Agregar timer de salida por fantasma (1.5 segundos entre cada uno)
   - Los fantasmas salen en orden: Blinky, Pinky, Inky, Clyde
   - Los fantasmas esperan en posiciones fijas dentro del pen hasta su turno

3. **Implementar comportamiento de Blinky en `src/js/game.js`**
   - Objetivo: celda actual de PacMan
   - Fórmula: `target = { x: pacman.x, y: pacman.y }`
   - Selección de dirección: elegir la dirección que minimize la distancia Manhattan al objetivo

4. **Implementar comportamiento de Pinky en `src/js/game.js`**
   - Objetivo: 4 celdas adelante de la dirección de PacMan
   - Fórmula: `target = { x: pacman.x + 4 * dir.x, y: pacman.y + 4 * dir.y }`
   - Bug preservado: cuando PacMan mira arriba, el objetivo se desplaza 4 izquierda también
   - Selección de dirección: misma lógica que Blinky

5. **Implementar comportamiento de Inky en `src/js/game.js`**
   - Objetivo: vector desde Blinky hasta 2 celdas adelante de PacMan, duplicado
   - Fórmula:
     ```
     ahead = { x: pacman.x + 2 * dir.x, y: pacman.y + 2 * dir.y }
     vector = { x: ahead.x - blinky.x, y: ahead.y - blinky.y }
     target = { x: ahead.x + vector.x, y: ahead.y + vector.y }
     ```
   - Selección de dirección: misma lógica que Blinky

6. **Implementar comportamiento de Clyde en `src/js/game.js`**
   - Distancia a PacMan: `d = |pacman.x - clyde.x| + |pacman.y - clyde.y|`
   - Si `d > 8`: target = posición de PacMan (como Blinky)
   - Si `d <= 8`: target = esquina inferior izquierda `{ x: 0, y: grid.length - 1 }`
   - Selección de dirección: misma lógica que Blinky

7. **Unificar lógica de selección de dirección**
   - Crear función `chooseDirection(game, ghost, target)` que:
     - Obtenga direcciones válidas (no muros, no reversión)
     - Calcule distancia Manhattan de cada opción al target
     - Elija la dirección con menor distancia
     - En caso de empate: prioridad up > left > down > right

8. **Refactorizar `decideGhost` para usar la nueva lógica**
   - Reemplazar la lógica actual por un switch/case por tipo de fantasma
   - Cada caso calcula su target y llama a `chooseDirection`

## Acceptance criteria

- [ ] Los 4 fantasmas aparecen en el pen al iniciar la partida
- [ ] Blinky sale del pen primero (al inicio o tras 1.5s)
- [ ] Cada fantasma sale del pen cada 1.5 segundos en orden
- [ ] Blinky persigue directamente la celda actual de PacMan
- [ ] Pinky apunta 4 celdas adelante de la dirección de PacMan
- [ ] Pinky se comporta diferente cuando PacMan mira arriba (bug original)
- [ ] Inky usa la posición de Blinky para calcular su objetivo
- [ ] Clyde persigue a PacMan cuando está a más de 8 celdas
- [ ] Clyde retrocede a su esquina cuando está a 8 celdas o menos
- [ ] Todos los fantasmas usan la misma velocidad
- [ ] Los fantasmas no pueden revertir dirección excepto al cambiar de modo
- [ ] El juego funciona sin errores en consola

## Decisions

- **Sí:** Preservar el bug de Pinky al mirar arriba. Es parte del juego original y los jugadores experimentados lo explotan.
- **Sí:** Usar distancia Manhattan para selección de dirección. Es fiel al algoritmo original y más rápido que Euclidiana.
- **Sí:** Prioridad de direcciones: up > left > down > right. Coincide con el comportamiento del arcade original.
- **Sí:** Todos los fantasmas salen del pen en secuencia con el mismo intervalo. Simplifica la implementación manteniendo la esencia.
- **No:** Implementar scatter/frightened/eaten. Queda para specs futuros.
- **No:** Implementar Cruise Elroy (Blinky se acelera). Queda para spec de dificultad progresiva.
- **No:** Velocidades diferentes por fantasma. El usuario especificó misma velocidad para todos.

## Risks

| Risk                                                                            | Mitigation                                                                                                    |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| El pen no soporta 4 fantasmas visualmente                                       | Verificar que las posiciones en el pen no se superpongan y que el sprite sheet tenga sprites para 4 fantasmas |
| Inky depende de Blinky, si Blinky no se ha movido el cálculo puede ser errático | Inky usa la posición actual de Blinky, incluso si está en el pen                                              |
| El bug de Pinky puede confundir a jugadores nuevos                              | Es fiel al original; documentar en el código que es intencional                                               |

## What is **not** in this spec

- Modo scatter (fantasmas van a esquinas fijas en intervalos)
- Modo frightened (fantasmas azules al comer power pellet)
- Modo eaten (ojos regresan al pen después de ser comidos)
- Cruise Elroy (Blinky se acelera tras comer ciertos dots)
- Velocidades diferentes por fantasma
- Dificultad progresiva por nivel
- Sprite sheet o animaciones de fantasmas

Cada uno de estos, si se implementa, va en su propio spec.
