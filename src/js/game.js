// game.js
// Estado y reglas. Depende de globals de maze.js: MAZE, TUNNEL_ROW,
// PACMAN_START, GHOST_STARTS.

const DIRS = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
};
const OPPOSITE = { left: 'right', right: 'left', up: 'down', down: 'up' };

const PACMAN_SPEED = 0.125; // 1/8 celda/frame -> alinea cada 8 frames
const GHOST_SPEED = 0.1;    // 1/10 celda/frame

// Crea una partida nueva. Copia MAZE (pristino) a game.grid para poder comer
// dots sin destruir el original, y reiniciar.
function createGame() {
  const grid = MAZE.map( ( row ) => row.slice() );
  grid[ PACMAN_START.y ][ PACMAN_START.x ] = 0;

  let dots = 0;
  const powerPellets = [];
  for ( let y = 0; y < grid.length; y++ ) {
    for ( let x = 0; x < grid[ 0 ].length; x++ ) {
      if ( grid[ y ][ x ] === 2 ) dots++;
      if ( grid[ y ][ x ] === 4 ) powerPellets.push( { x, y } );
    }
  }

  return {
    state: 'start',
    score: 0,
    lives: 3,
    dotsRemaining: dots,
    powerPellets,
    grid,
    pacman: {
      x: PACMAN_START.x,
      y: PACMAN_START.y,
      dir: 'left',
      nextDir: null,
      speed: PACMAN_SPEED,
    },
    ghosts: GHOST_STARTS.map( ( g, i ) => ( {
      x: g.x,
      y: g.y,
      dir: 'up',
      speed: GHOST_SPEED,
      kind: g.kind,
      penState: 'waiting',
      penTimer: GHOST_EXIT_TIMES[ i ],
    } ) ),
  };
}

function aligned( v ) {
  return Math.abs( v - Math.round( v ) ) < 1e-3;
}

// Una celda es muro para el actor dado?
//   pacman:  bloqueado por pared (1) y puerta (3)
//   ghost:   bloqueado por pared (1); puerta (3) bloquea solo si penState === 'active'
function isWall( grid, x, y, actor ) {
  if ( y < 0 || y >= grid.length ) return true;
  if ( x < 0 || x >= grid[ 0 ].length ) return true;
  const v = grid[ y ][ x ];
  if ( v === 1 ) return true;
  if ( v === 3 ) {
    if ( actor === 'pacman' ) return true;
    if ( actor.penState === 'active' ) return true;
    return false;
  }
  return false;
}

// Puede el actor avanzar desde (x,y) en la direccion dir?
function canMove( grid, x, y, dir, actor ) {
  const d = DIRS[ dir ];
  if ( !d ) return false;
  const tx = x + d.x;
  const ty = y + d.y;
  // Tunel: salir por un borde en la fila del tunel siempre es valido.
  if ( ty === TUNNEL_ROW && ( tx < 0 || tx >= grid[ 0 ].length ) ) return true;
  return !isWall( grid, tx, ty, actor );
}

function wrapTunnel( a, width ) {
  if ( Math.round( a.y ) === TUNNEL_ROW ) {
    if ( a.x < 0 ) a.x += width;
    else if ( a.x >= width ) a.x -= width;
  }
}

function movePacman( game ) {
  const p = game.pacman;
  const grid = game.grid;
  const width = grid[ 0 ].length;

  if ( aligned( p.x ) && aligned( p.y ) ) {
    p.x = Math.round( p.x );
    p.y = Math.round( p.y );

    // Aplicar giro pendiente si es posible.
    if ( p.nextDir && canMove( grid, p.x, p.y, p.nextDir, 'pacman' ) ) {
      p.dir = p.nextDir;
      p.nextDir = null;
    }
    // Comer dot.
    if ( grid[ p.y ][ p.x ] === 2 ) {
      grid[ p.y ][ p.x ] = 0;
      game.score += 10;
      game.dotsRemaining--;
    }
    // Comer power pellet.
    if ( grid[ p.y ][ p.x ] === 4 ) {
      grid[ p.y ][ p.x ] = 0;
      game.score += 50;
      game.powerPellets = game.powerPellets.filter(
        ( pp ) => !( pp.x === p.x && pp.y === p.y )
      );
    }
    // Si no puede seguir, se detiene en la celda.
    if ( !canMove( grid, p.x, p.y, p.dir, 'pacman' ) ) return;
  }

  const d = DIRS[ p.dir ];
  p.x += d.x * p.speed;
  p.y += d.y * p.speed;
  wrapTunnel( p, width );
}

function decideGhost( game, g ) {
  const grid = game.grid;
  const p = game.pacman;

  const options = Object.keys( DIRS ).filter(
    ( dir ) => dir !== OPPOSITE[ g.dir ] && canMove( grid, g.x, g.y, dir, g )
  );
  const choices = options.length ? options : [ '' + OPPOSITE[ g.dir ] ];

  let target;
  switch ( g.kind ) {
    case 'blinky':
      target = { x: Math.round( p.x ), y: Math.round( p.y ) };
      break;
    case 'pinky': {
      const px = Math.round( p.x );
      const py = Math.round( p.y );
      const pd = DIRS[ p.dir ];
      target = { x: px + 4 * pd.x, y: py + 4 * pd.y };
      if ( p.dir === 'up' ) target.x -= 4;
      break;
    }
    case 'inky': {
      const px = Math.round( p.x );
      const py = Math.round( p.y );
      const pd = DIRS[ p.dir ];
      const blinky = game.ghosts[ 0 ];
      const ahead = { x: px + 2 * pd.x, y: py + 2 * pd.y };
      const vec = { x: ahead.x - blinky.x, y: ahead.y - blinky.y };
      target = { x: ahead.x + vec.x, y: ahead.y + vec.y };
      break;
    }
    case 'clyde': {
      const px = Math.round( p.x );
      const py = Math.round( p.y );
      const d = Math.abs( px - g.x ) + Math.abs( py - g.y );
      if ( d > 8 ) {
        target = { x: px, y: py };
      } else {
        target = { x: 0, y: grid.length - 1 };
      }
      break;
    }
    default:
      target = { x: Math.round( p.x ), y: Math.round( p.y ) };
  }

  const DIR_PRIORITY = [ 'up', 'left', 'down', 'right' ];
  let best = choices[ 0 ];
  let bestDist = Infinity;
  for ( const dir of DIR_PRIORITY ) {
    if ( !choices.includes( dir ) ) continue;
    const d = DIRS[ dir ];
    const nx = g.x + d.x;
    const ny = g.y + d.y;
    const dist = Math.abs( nx - target.x ) + Math.abs( ny - target.y );
    if ( dist < bestDist ) {
      bestDist = dist;
      best = dir;
    }
  }
  g.dir = best;
}

function moveGhost( game, g ) {
  const grid = game.grid;
  const width = grid[ 0 ].length;

  if ( g.penState === 'waiting' ) {
    if ( g.penTimer > 0 ) {
      g.penTimer -= 1 / 60;
      const d = DIRS[ g.dir ];
      const ny = g.y + d.y * g.speed;
      if ( ny < 14 || ny > 15 ) {
        g.dir = g.dir === 'up' ? 'down' : 'up';
      } else {
        g.y = ny;
      }
      return;
    }
    g.penState = 'exiting';
    g.dir = 'up';
  }

  if ( g.penState === 'exiting' ) {
    if ( aligned( g.x ) && aligned( g.y ) ) {
      g.x = Math.round( g.x );
      g.y = Math.round( g.y );
      if ( g.y < 12 ) {
        g.penState = 'active';
      } else {
        g.dir = 'up';
      }
      if ( g.penState === 'exiting' ) {
        if ( !canMove( grid, g.x, g.y, g.dir, g ) ) return;
      }
    }
    if ( g.penState === 'exiting' ) {
      const d = DIRS[ g.dir ];
      g.x += d.x * g.speed;
      g.y += d.y * g.speed;
      return;
    }
  }

  if ( aligned( g.x ) && aligned( g.y ) ) {
    g.x = Math.round( g.x );
    g.y = Math.round( g.y );
    decideGhost( game, g );
    if ( !canMove( grid, g.x, g.y, g.dir, g ) ) return;
  }

  const d = DIRS[ g.dir ];
  g.x += d.x * g.speed;
  g.y += d.y * g.speed;
  wrapTunnel( g, width );
}

function resetPositions( game ) {
  const p = game.pacman;
  p.x = PACMAN_START.x;
  p.y = PACMAN_START.y;
  p.dir = 'left';
  p.nextDir = null;
  game.ghosts.forEach( ( g, i ) => {
    g.x = GHOST_STARTS[ i ].x;
    g.y = GHOST_STARTS[ i ].y;
    g.dir = 'up';
    g.penState = 'waiting';
    g.penTimer = GHOST_EXIT_TIMES[ i ];
  } );
}

function collides( a, b ) {
  return Math.abs( a.x - b.x ) < 0.5 && Math.abs( a.y - b.y ) < 0.5;
}

function update( game ) {
  movePacman( game );
  game.ghosts.forEach( ( g ) => moveGhost( game, g ) );

  for ( const g of game.ghosts ) {
    if ( collides( game.pacman, g ) ) {
      game.lives--;
      if ( game.lives <= 0 ) {
        game.state = 'lost';
        return;
      }
      resetPositions( game );
      break;
    }
  }

  if ( game.dotsRemaining <= 0 ) game.state = 'won';
}

window.createGame = createGame;
window.update = update;
window.DIRS = DIRS;
