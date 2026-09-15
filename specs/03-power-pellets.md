# SPEC 03 — Power Pellets y modo frightened

> **Status:** Aprobado
> **Depends on:** SPEC 01
> **Date:** 2026-09-15
> **Objective:** Implementar Power Pellets que activan el modo frightened (fantasmas azules comestibles) por 7 segundos, con sistema de puntuación progresivo y modo eyes para fantasmas comidos.

## Scope

**In:**

- 4 Power Pellets en las esquinas del laberinto: (1,1), (26,1), (1,29), (26,29)
- Al comer un Power Pellet, todos los fantasmas entran en modo frightened (azules) por 7 segundos
- Fantasmas azules parpadean en los últimos 2 segundos antes de que termine el efecto
- Puntos progresivos al comer fantasmas: 200, 400, 800, 1600 (se reinicia al comer un Power Pellet nuevo)
- Modo eyes: fantasma comido se convierte en ojos que regresan al pen
- Ojos se mueven más rápido que fantasmas normales
- Al llegar al pen, los ojos se convierten en fantasma normal y salen con un pequeño retraso (0.5s)
- Power Pellets se eliminan del laberinto al ser comidos (no reaparecen al reiniciar nivel)

**Out of scope (for future specs):**

- Sonidos de efectos (comer pellet, comer fantasma, modo frightened)
- Dificultad progresiva por nivel (velocidad de frightened, tiempo de frightened)
- Animaciones de sprites (se usa colores planos)
- Modo scatter
- Cruise Elroy (Blinky se acelera)

## Data model

```js
// Posiciones de los Power Pellets (coordenadas de celda)
const POWER_PELLET_POSITIONS = [
  { x: 1, y: 1 },
  { x: 26, y: 1 },
  { x: 1, y: 29 },
  { x: 26, y: 29 },
];

// Duración del modo frightened (segundos)
const FRIGHTENED_DURATION = 7;

// Duración del parpadeo antes de que termine el efecto (segundos)
const FRIGHTENED_BLINK_START = 5; // Empieza a parpadear a los 5s (quedan 2s)

// Puntos progresivos al comer fantasmas durante frightened
const GHOST_EAT_POINTS = [200, 400, 800, 1600];

// Velocidad del modo eyes (multiplicador sobre velocidad normal)
const EYES_SPEED_MULTIPLIER = 1.5;

// Tiempo de retraso antes de que un fantasma comido salga del pen
const GHOST_RESPAWN_DELAY = 0.5; // segundos
```

## Implementation plan

1. **Agregar Power Pellets al laberinto en `src/js/maze.js`**
   - Definir `POWER_PELLET_POSITIONS` con las 4 esquinas
   - El maze grid ya tiene un carácter para Power Pellets (verificar o asignar uno, ej: `'O'`)
   - Actualizar `MAZE` para que las 4 posiciones tengan el carácter de Power Pellet

2. **Agregar estado de Power Pellets al game state en `src/js/game.js`**
   - En `createGame`, inicializar array `powerPellets` con las 4 posiciones
   - Agregar `ghostEatCombo` (contador de fantasmas comidos en el atual frightened)
   - Agregar `frightenedTimer` (tiempo restante del modo frightened)
   - Agregar `frightenedPhase` ('normal' | 'blinking')

3. **Implementar activación del modo frightened en `src/js/game.js`**
   - En `eatDot` (o función equivalente), detectar si PacMan come un Power Pellet
   - Al comer pellet: activar `frightenedTimer = FRIGHTENED_DURATION`, resetear `ghostEatCombo = 0`
   - Cambiar estado de todos los fantasmas a 'frightened'
   - Eliminar el Power Pellet del array `powerPellets` y del grid

4. **Implementar comportamiento de fantasmas frightened en `src/js/game.js`**
   - Los fantasmas en modo frightened se mueven aleatoriamente (no persiguen a PacMan)
   - Velocidad reducida (0.5x la velocidad normal)
   - No pueden revertir dirección espontáneamente
   - Cuando el timer llega a `FRIGHTENED_BLINK_START`, cambiar fase a 'blinking'
   - Cuando el timer llega a 0, volver a estado 'chase'

5. **Implementar sistema de ojos (modo eaten) en `src/js/game.js`**
   - Al colisionar con un fantasma frightened: fantasma cambia a estado 'eyes'
   - Sumar puntos según `GHOST_EAT_POINTS[ghostEatCombo]`, incrementar combo
   - Las ojos se mueven a `EYES_SPEED_MULTIPLIER` veces la velocidad normal
   - Las ojos van directamente al pen (target: posición central del pen)
   - Al llegar al pen: fantasma cambia a estado 'waiting' con `penTimer = GHOST_RESPAWN_DELAY`
   - Tras el retraso, fantasma sale del pen normalmente

6. **Dibujar Power Pellets en `src/js/render.js`**
   - Power Pellet: círculo grande (radio ~4px) en color blanco/amarillo
   - Se dibuja solo si la posición está en `powerPellets` (no fue comida)

7. **Dibujar fantasmas frightened en `src/js/render.js`**
   - Fantasma frightened: color azul (#2121DE)
   - Fase blinking: alternar entre azul y blanco cada 0.25s
   - Modo eyes: dibujar solo los ojos (dos óvalos blancos con pupilas)

8. **Actualizar lógica de colisión en `src/js/game.js`**
   - Si PacMan colisiona con fantasma frightened → comer fantasma (modo eyes)
   - Si PacMan colisiona con fantasma normal → PacMan muere
   - Si PacMan colisiona con ojos → ignorar (las ojos no matan)

## Acceptance criteria

- [ ] 4 Power Pellets aparecen en las esquinas del laberinto al iniciar
- [ ] Al comer un Power Pellet, todos los fantasmas cambian a azul
- [ ] Fantasmas azules se mueven aleatoriamente durante 7 segundos
- [ ] Fantasmas azules parpadean (azul/blanco) en los últimos 2 segundos
- [ ] Comer un fantasma azul otorga 200 puntos la primera vez
- [ ] Comer un segundo fantasma azul otorga 400 puntos
- [ ] Comer un tercer fantasma azul otorga 800 puntos
- [ ] Comer un cuarto fantasma azul otorga 1600 puntos
- [ ] Al comer un fantasma, este se convierte en ojos
- [ ] Las ojos se mueven más rápido que los fantasmas normales
- [ ] Las ojos regresan al pen y reaparecen como fantasma normal
- [ ] Al comer un nuevo Power Pellet, el combo de puntos se reinicia
- [ ] Power Pellets desaparecen del laberinto al ser comidas
- [ ] El juego funciona sin errores en consola

## Decisions

- **Sí:** 4 Power Pellets en las esquinas clásicas. Fiel al arcade original.
- **Sí:** 7 segundos de duración. Valor estándar del arcade.
- **Sí:** Parpadeo en los últimos 2 segundos. Señal visual clara de que el efecto termina.
- **Sí:** Puntos progresivos 200/400/800/1600. Incentiva al jugador a comer fantasmas.
- **Sí:** Ojos más rápidos (1.5x). Reduce el tiempo que el fantasma está fuera de juego.
- **Sí:** Retraso de 0.5s antes de salir del pen. Evita que el fantasma reaparezca instantáneamente.
- **Sí:** Velocidad reducida para fantasmas frightened (0.5x). Da tiempo al jugador para comerlos.
- **No:** Sonidos. Queda para otro spec.
- **No:** Dificultad progresiva. Los valores son fijos por ahora.
- **No:** Scatter mode. Se implementa por separado si se necesita.

## Risks

| Risk                                                                           | Mitigation                                                                     |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Power Pellets podrían no ser visibles si el maze no tiene un carácter asignado | Verificar el maze grid y asignar un carácter (ej: 'O') que render.js reconozca |
| El parpadeo podría no ser visible si el intervalo es muy rápido                | Usar intervalo de 0.25s (cambio cada 250ms) para que sea perceptible           |
| Las ojos podrían atorarse si no encuentran camino al pen                       | Implementar pathfinding simple (priorizar dirección hacia el pen)              |
| El combo de puntos podría no resetearse correctamente                          | Resetear `ghostEatCombo` al activar nuevo frightened                           |

## What is **not** in this spec

- Sonidos de efectos
- Dificultad progresiva por nivel
- Animaciones de sprites
- Scatter mode
- Cruise Elroy
- Cambios en la lógica de persecución fuera de frightened

Cada uno de estos, si se implementa, va en su propio spec.
