const fs = require('fs');

let content = fs.readFileSync('public/pacman.html', 'utf-8');

// 1. Image loading
const imgInitStr = `
const pacImage = new Image(); pacImage.src = 'pacman_char.png';
const ghostImages = [new Image(), new Image(), new Image(), new Image()];
ghostImages[0].src = 'ghost1.png';
ghostImages[1].src = 'ghost2.png';
ghostImages[2].src = 'ghost3.png';
ghostImages[3].src = 'ghost4.png';
let ghosts = [];
let invincibilityEndTime = 0;
let lastGhostMove = 0;
const GHOST_MOVE_MS = 250;
`;
if(!content.includes('pacman_char.png')) {
  content = content.replace('let quizSolved = 0;', 'let quizSolved = 0;\n' + imgInitStr);
}

// 2. calcLayout and resize listener
content = content.replace(/const availW = Math\.min\(window\.innerWidth - 20, 1100\);/g, 'const availW = window.innerWidth - 20;');
content = content.replace(/TILE      = Math\.max\(22, Math\.min\(tH, tW, 48\)\);/g, 'TILE      = Math.max(16, Math.min(tH, tW));');

if(!content.includes('window.addEventListener(\'resize\'')) {
  content = content.replace(
    'window.addEventListener(\'message\', (event) => {',
    'window.addEventListener(\'resize\', () => { if(typeof curMapIdx !== "undefined") { calcLayout(curMapIdx); resizeCanvas(); } });\n  window.addEventListener(\'message\', (event) => {'
  );
}

// 3. Update initStage for ghosts and random map
if(!content.includes('Math.floor(Math.random() * MAPS.length)')) {
  content = content.replace('initStage(0, true);', 'initStage(Math.floor(Math.random() * MAPS.length), true);');
}

if(!content.includes('ghosts = [];')) {
  const initStageInjection = `
  ghosts = [];
  let emptySpots = [];
  for(let r=0; r<ROWS; r++){
    for(let c=0; c<COLS; c++){
      if(stageGrid[r][c] === 2 || stageGrid[r][c] === 0) {
        if(Math.abs(c - player.x) + Math.abs(r - player.y) > 10) {
          emptySpots.push({c, r});
        }
      }
    }
  }
  emptySpots.sort(() => Math.random() - 0.5);
  for(let i=0; i<4; i++){
    if(emptySpots[i]){
      ghosts.push({
        x: emptySpots[i].c, y: emptySpots[i].r,
        dir: Math.floor(Math.random()*4), // 0:R, 1:L, 2:U, 3:D
        type: i
      });
    }
  }
  `;
  content = content.replace('clearShown = false;', 'clearShown = false;\n' + initStageInjection);
}

// 4. Update drawPacman to use image
const newDrawPacman = `
function drawPacman(ts) {
  if (ts < invincibilityEndTime && Math.floor(ts / 100) % 2 === 0) return; // Blink
  const cx = player.x * TILE + TILE/2;
  const cy = player.y * TILE + TILE/2;
  ctx.save();
  ctx.translate(cx, cy);
  if (pacDir === 0) ctx.scale(-1, 1); // Face right by default, but wait, the original image faces left.
  // Actually, Pacman usually faces right in sprites. If our sprite faces right:
  // if pacDir=0(R) -> scale(1), pacDir=1(L) -> scale(-1). We'll assume it faces left.
  if (pacDir === 0) ctx.scale(-1, 1); 
  if (pacDir === 2) { ctx.rotate(Math.PI/2); ctx.scale(-1, 1); }
  if (pacDir === 3) { ctx.rotate(-Math.PI/2); ctx.scale(-1, 1); }
  
  if (pacImage.complete) {
    ctx.drawImage(pacImage, -TILE*0.5, -TILE*0.5, TILE, TILE);
  } else {
    ctx.beginPath(); ctx.arc(0, 0, TILE*0.4, 0, Math.PI*2); ctx.fillStyle='yellow'; ctx.fill();
  }
  ctx.restore();
}
`;
content = content.replace(/function drawPacman\(ts\) \{[\s\S]*?\/\/ right\(0\):/g, newDrawPacman + '\n// right(0):');

// 5. Draw ghosts and move ghosts in render and loop
const newRender = `
  function drawGhosts() {
    ghosts.forEach(g => {
      const cx = g.x * TILE + TILE/2;
      const cy = g.y * TILE + TILE/2;
      ctx.save();
      ctx.translate(cx, cy);
      const img = ghostImages[g.type];
      if (img && img.complete) {
        ctx.drawImage(img, -TILE*0.5, -TILE*0.5, TILE, TILE);
      } else {
        ctx.beginPath(); ctx.arc(0, 0, TILE*0.4, 0, Math.PI*2); ctx.fillStyle='red'; ctx.fill();
      }
      
      // Draw eyes looking at direction (0:R, 1:L, 2:U, 3:D)
      ctx.fillStyle = 'blue';
      const pupilOffset = TILE * 0.1;
      let px = 0, py = 0;
      if (g.dir === 0) px = pupilOffset;
      if (g.dir === 1) px = -pupilOffset;
      if (g.dir === 2) py = -pupilOffset;
      if (g.dir === 3) py = pupilOffset;
      
      ctx.fillRect(-TILE*0.2 + px, -TILE*0.1 + py, TILE*0.15, TILE*0.15);
      ctx.fillRect(TILE*0.05 + px, -TILE*0.1 + py, TILE*0.15, TILE*0.15);
      
      ctx.restore();
    });
  }
`;
if(!content.includes('function drawGhosts()')) {
  content = content.replace('function drawPacman(ts)', newRender + '\nfunction drawPacman(ts)');
  content = content.replace('drawPacman(ts);', 'drawPacman(ts);\n    drawGhosts();');
}

// 6. Ghost movement & collision
const ghostMoveLogic = `
  if (ts - lastGhostMove > GHOST_MOVE_MS) {
    ghosts.forEach(g => {
      // 0:R, 1:L, 2:U, 3:D
      const dirs = [{dx:1,dy:0}, {dx:-1,dy:0}, {dx:0,dy:-1}, {dx:0,dy:1}];
      let possibleDirs = [];
      for(let i=0; i<4; i++){
        // Don't reverse immediately unless necessary
        if((g.dir===0 && i===1) || (g.dir===1 && i===0) || (g.dir===2 && i===3) || (g.dir===3 && i===2)) continue;
        const nx = ((g.x + dirs[i].dx)%COLS + COLS)%COLS;
        const ny = ((g.y + dirs[i].dy)%ROWS + ROWS)%ROWS;
        if(walkable(nx, ny)) possibleDirs.push(i);
      }
      if(possibleDirs.length === 0) {
        // Must reverse
        g.dir = g.dir===0?1 : g.dir===1?0 : g.dir===2?3 : 2;
      } else {
        // Pick random valid direction
        g.dir = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
      }
      g.x = ((g.x + dirs[g.dir].dx)%COLS + COLS)%COLS;
      g.y = ((g.y + dirs[g.dir].dy)%ROWS + ROWS)%ROWS;
    });
    lastGhostMove = ts;
  }
  
  // Collision
  ghosts.forEach(g => {
    if(g.x === player.x && g.y === player.y && ts > invincibilityEndTime) {
      player.score = Math.max(0, player.score - 1);
      invincibilityEndTime = ts + 1500;
      
      // Bounce (reverse directions)
      g.dir = g.dir===0?1 : g.dir===1?0 : g.dir===2?3 : 2;
      g.x = ((g.x + (g.dir===0?1 : g.dir===1?-1 : 0))%COLS + COLS)%COLS;
      g.y = ((g.y + (g.dir===3?1 : g.dir===2?-1 : 0))%ROWS + ROWS)%ROWS;
      
      // Player bounce
      const playerOppDir = pacDir===0?1 : pacDir===1?0 : pacDir===2?3 : 2;
      const nx = ((player.x + (playerOppDir===0?1 : playerOppDir===1?-1 : 0))%COLS + COLS)%COLS;
      const ny = ((player.y + (playerOppDir===3?1 : playerOppDir===2?-1 : 0))%ROWS + ROWS)%ROWS;
      if(walkable(nx, ny)) {
        player.x = nx; player.y = ny;
      }
    }
  });
`;

if(!content.includes('GHOST_MOVE_MS')) { // Ensure we don't inject multiple times
  content = content.replace('requestAnimationFrame(inputLoop);', ghostMoveLogic + '\n    requestAnimationFrame(inputLoop);');
}

fs.writeFileSync('public/pacman.html', content, 'utf-8');
console.log('Patched');
