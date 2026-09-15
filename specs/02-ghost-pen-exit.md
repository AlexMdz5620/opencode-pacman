# SPEC 02 — Corrección de salida del pen y tiempos de fantasmas

> **Status:** Implementado
> **Depends on:** SPEC 01
> **Date:** 2026-09-11
> **Objective:** Corregir la salida del pen para que los fantasmas realmente salgan (actualmente se atoran en la puerta) y ajustar los tiempos de salida para replicar los intervalos originales del arcade.

## Scope

**In:**

- Corregir permeabilidad de la puerta del pen (tile `-`) para que fantasmas puedan atravesarla al salir
- Corregir lógica de movimiento dentro del pen durante el estado `exiting` (fantasma debe llegar a la puerta antes de subir)
- Implementar animación de rebote arriba-abajo dentro del pen mientras los fantasmas esperan
- Cambiar tiempos de salida a valores originales: Blinky 0.5s, Pinky 3s, Inky 6s, Clyde 8.5s

**Out of scope (for future specs):**

- Modo scatter, frightened, eaten
- Velocidades diferentes por fantasma
- Dificultad progresiva por nivel
- Cambios en la lógica de persecución de fantasmas

## Data model

```js
// Tiempos de salida originales del arcade (segundos)
const GHOST_EXIT_TIMES = [0.5, 3, 6, 8.5]; // blinky, pinky, inky, clyde

// Estados del pen
// 'waiting'  — fantasma dentro del pen, rebotando, esperando su turno
// 'exiting'  — fantasma subiendo hacia la puerta para salir
// 'active'   — fantasma fuera del pen, se mueve normalmente
```

No se introducen nuevas estructuras. Se modifica `GHOST_EXIT_INTERVAL` por el array `GHOST_EXIT_TIMES` y se ajusta la lógica de estados en `moveGhost`.

## Implementation plan

1. **Actualizar `src/js/maze.js`** — Reemplazar `GHOST_EXIT_INTERVAL` por `GHOST_EXIT_TIMES` con los valores originales del arcade
2. **Actualizar `src/js/game.js`** — Modificar `createGame` y `resetPositions` para usar `GHOST_EXIT_TIMES` al asignar `penTimer`
3. **Corregir permeabilidad de puerta en `isWall`** — El tile `-` (valor 3) debe ser permeable para fantasmas en todos los estados
4. **Corregir lógica de movimiento en `moveGhost` durante `exiting`** — El fantasma debe: (a) moverse dentro del pen hacia la columna de la puerta (x=13 o x=14), (b) subir hasta y=12 (puerta), (c) subir hasta estar fuera del pen
5. **Implementar rebote en pen durante `waiting`** — Mientras el timer no llega a cero, el fantasma se mueve arriba-abajo dentro del pen (entre y=14 y y=15)
6. **Verificar** — Abrir `src/index.html`, confirmar que Blinky sale rápido, los demás salen después, y todos salen sin atorarse

## Acceptance criteria

- [ ] Blinky sale del pen a los ~0.5 segundos
- [ ] Pinky sale del pen a los ~3 segundos
- [ ] Inky sale del pen a los ~6 segundos
- [ ] Clyde sale del pen a los ~8.5 segundos
- [ ] Los fantasmas se rebotan arriba-abajo dentro del pen mientras esperan
- [ ] Los fantasmas atraviesan la puerta del pen (tile `-`) al salir
- [ ] Ningún fantasma se queda atorado en la puerta
- [ ] Los fantasmas salen en orden: Blinky, Pinky, Inky, Clyde
- [ ] El juego funciona sin errores en consola
- [ ] El comportamiento de persecución fuera del pen no cambia

## Decisions

- **Sí:** Usar tiempos originales del arcade (0.5, 3, 6, 8.5s). Fiabilidad al juego original.
- **Sí:** Hacer el tile `-` siempre permeable para fantasmas. Simplifica la lógica sin efectos secundarios.
- **Sí:** Rebotar entre las posiciones disponibles dentro del pen (y=14 y y=15). Fiel al sprite original.
- **No:** Mantener intervalo uniforme de 1.5s. Los tiempos originales son más fieles.
- **No:** Cambiar la lógica de persecución. Solo se corrige la salida del pen.

## Risks

| Risk                                                                   | Mitigation                                                |
| ---------------------------------------------------------------------- | --------------------------------------------------------- |
| El rebote puede verse raro si las posiciones del pen son limitadas     | Verificar que y=14 y y=15 son transitables dentro del pen |
| Cambiar `GHOST_EXIT_INTERVAL` por array puede romper otras referencias | Buscar todas las referencias antes de cambiar             |

## What is **not** in this spec

- Modo scatter, frightened, eaten
- Velocidades diferentes por fantasma
- Cambios en la lógica de persecución
- Sprite sheet o animaciones
- Dificultad progresiva por nivel

Cada uno de estos, si se implementa, va en su propio spec.
