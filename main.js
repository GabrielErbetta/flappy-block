var MAP      = { tw: 50, th: 32 }, // the size of the map (in tiles)
    TILE     = 20,                 // the size of each tile (in game pixels)
    METER    = TILE,               // abitrary choice for 1m
    GRAVITY  = METER * 9.8 * 4,    // very exagerated gravity (6x)
    MINDX    = METER * 5,          // max horizontal speed (20 tiles per second)
    MAXDX    = METER * 20,         // max horizontal speed (20 tiles per second)
    MAXDY    = METER * 20,         // max vertical speed   (60 tiles per second)
    ACCEL    = 1 / 5,              // horizontal acceleration -  take 1/2 second to reach maxdx
    JUMP     = METER * 1500;       // (a large) instantaneous jump impulse

var canvas   = document.getElementById('canvas'),
    ctx      = canvas.getContext('2d'),
    width    = canvas.width  = MAP.tw * TILE,
    height   = canvas.height = MAP.th * TILE,
    player   = { x: 240, y: 20 * 16, dx: MINDX, dy: 0 },
    score    = 0,
    pipes    = [
      { top: Math.floor(Math.random() * 8) + 8, x: 30 * TILE, n: 0, scored: false },
      { top: Math.floor(Math.random() * 8) + 8, x: 50 * TILE, n: 1, scored: false },
      { top: Math.floor(Math.random() * 8) + 8, x: 70 * TILE, n: 2, scored: false }
    ];

var t2p = function(t) { return t*TILE;             },
    p2t = function(p) { return Math.floor(p/TILE); };

var KEY    = { UP: 32, SPACE: 38 };

var COLOR  = { BLACK: '#000000', GREEN: '#2CB733', YELLOW: '#FFE83D', BLUE: '#6AD8D3' },
    COLORS = [ COLOR.BLACK, COLOR.GREEN, COLOR.YELLOW, COLOR.BLUE ];

function generateTiles() {
  var map = [];
  var top;

  for (i = 0; i < 1000; i++) {
    map[i] = [];
    for (j = 0; j < 32; j++) {
      map[i][j] = 3;
    }
  }

  for (i = 40; i < 1000; i += 20) {
    top = Math.floor(Math.random() * 8) + 8;
    for (j = 0; j < 32; j++) {
      if (j <= top || j > top + 8) {
        map[i-1][j] = 1;
        map[i][j] = 1;
        map[i+1][j] = 1;
      }
    }
  }

  return map;
}

var cells = generateTiles(),
    cell  = function(x,y)   { return tcell(p2t(x),p2t(y));    },
    tcell = function(tx,ty) { return cells[tx][ty]; };

function timestamp() {
  if (window.performance && window.performance.now)
    return window.performance.now();
  else
    return new Date().getTime();
}

function bound(num, min, max) {
  return Math.min(Math.max(num, min), max);
}

var fps  = 60,
    step = 1/fps,
    dt   = 0,
    now, last = timestamp();

function frame() {
  now = timestamp();
  dt = dt + Math.min(1, (now - last) / 1000);
  while(dt > step) {
    dt = dt - step;
    update(step);
  }
  render(ctx, dt);
  last = now;
  requestAnimationFrame(frame, canvas);
}

function render(ctx) {
  // render background
  ctx.fillStyle = COLOR.BLUE;
  ctx.fillRect(0, 0, MAP.tw * TILE, MAP.th * TILE);

  // render pipes
  pipes.forEach(function(pipe) {
    ctx.fillStyle = COLOR.GREEN;

    for (i = 0; i < MAP.th; i++) {
      if (i <= pipe.top || i > pipe.top + 8)
        ctx.fillRect(pipe.x, i * TILE, TILE * 3, TILE);
    }
  });

  renderPipesCollisionPoints();

  // render player
  ctx.fillStyle = COLOR.YELLOW;
  ctx.fillRect(240, player.y, TILE, TILE);

  renderPlayerCollisionPoints();

  // render score
  ctx.font = "100px Arial";
  ctx.fillStyle = "white";
  ctx.strokeStyle = "black";
  ctx.textAlign = "center";
  ctx.strokeText(score, 80, MAP.th * TILE - 40);
  ctx.fillText(score, 80, MAP.th * TILE - 40);
}

document.addEventListener('keydown', function(ev) { return onkey(ev, ev.keyCode, true);  }, false);
document.addEventListener('keyup',   function(ev) { return onkey(ev, ev.keyCode, false); }, false);

function onkey(ev, key, down) {
  switch(key) {
    case KEY.UP:    player.jump  = down; return false;
    case KEY.SPACE: player.jump  = down; return false;
  }
}

function generatePipe() {
  var top = Math.floor(Math.random() * 8) + 8;
  var x   = pipes[pipes.length - 1].x + 20 * TILE;
  var n   = pipes[pipes.length - 1].n + 1;
  var pipe = { top: top, x: x, n: n, scored: false }

  pipes.push(pipe);
}

function renderPlayerCollisionPoints() {
  var tl = [240, player.y],
      tr = [240 + TILE, player.y],
      bl = [240, player.y + TILE],
      br = [240 + TILE, player.y + TILE];

  ctx.fillStyle = COLOR.BLACK;
  ctx.strokeRect(tl[0], tl[1], tr[0] - tl[0], bl[1] - tl[1]);
}

function renderPipesCollisionPoints() {
  pipes.forEach(function(pipe) {
    ctx.strokeRect(pipe.x, 0, 3 * TILE, (pipe.top + 1) * TILE);
    ctx.strokeRect(pipe.x, (pipe.top + 9) * TILE, 3 * TILE, (MAP.th - (pipe.top + 9)) * TILE);
  });
}

function collisionDetection() {
  var tl = [240, player.y],
      tr = [240 + TILE, player.y],
      bl = [240, player.y + TILE],
      br = [240 + TILE, player.y + TILE];

  for (i = 0; i < pipes.length; i++) {
    pipe = pipes[i];

    var pttl = [pipe.x, 0],
        pttr = [pipe.x + (3 * TILE), 0],
        ptbl = [pipe.x, (pipe.top + 1) * TILE],
        ptbr = [pipe.x + (3 * TILE), (pipe.top + 1) * TILE];

    var pbtl = [pipe.x, (pipe.top + 9) * TILE],
        pbtr = [pipe.x + (3 * TILE), (pipe.top + 9) * TILE],
        pbbl = [pipe.x, MAP.th * TILE],
        pbbr = [pipe.x + (3 * TILE), MAP.th * TILE];

    if ((tl[0] >= pttl[0] && tl[0] <= pttr[0] && tl[1] <= ptbl[1]) ||
        (tr[0] >= pttl[0] && tr[0] <= pttr[0] && tr[1] <= ptbl[1]) ||
        (bl[0] >= pbtl[0] && bl[0] <= pbtr[0] && bl[1] >= pbtl[1]) ||
        (br[0] >= pbtl[0] && br[0] <= pttr[0] && br[1] >= pbtl[1])) {
      pipe.scored = true;
      return true;
    }
  }

  return false;
}

function increaseScore() {
  score ++;
}

function resetScore() {
  score = 0;
}

function update(dt) {
  player.ddx = 0.02;
  player.ddy = GRAVITY;

  if (player.jump && !player.jumping) {
    player.ddy = Math.min(player.ddy - JUMP, JUMP);     // apply an instantaneous (large) vertical impulse
    player.jumping = true;
  } else if (!player.jump && player.jumping) {
    player.jumping = false;
  }

  player.y  = bound(Math.floor(player.y  + (dt * player.dy)), 0, (MAP.th - 1) * TILE);
  player.x  = Math.floor(player.x  + (dt * player.dx));

  player.dx = bound(player.dx + player.ddx, MINDX, MAXDX);
  player.dy = bound(player.dy + (dt * player.ddy), -MAXDY, MAXDY);

  while (pipes.length < 3) generatePipe();
  pipes.forEach(function(pipe) {
    pipe.x = pipe.x - (dt * player.dx);
    if (pipe.x < 0 - (3 * TILE)) pipes.splice(pipes.indexOf(pipe), 1);
  });

  if (collisionDetection()) resetScore();

  pipes.forEach(function(pipe) {
    if (!pipe.scored && pipe.x < 240 - (3 * TILE)) {
      pipe.scored = true;
      increaseScore();
    }
  });
  
}

frame(); // start the first frame