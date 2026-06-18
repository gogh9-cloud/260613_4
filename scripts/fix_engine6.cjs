const fs = require('fs');
let c = fs.readFileSync('src/lib/gameEngine.js', 'utf8');

// 1. Remove requestAnimationFrame from render()
c = c.replace(/drawBub\(\);\r?\n\r?\n\s*requestAnimationFrame\(render\);\r?\n\}/g,
`drawBub();\n}`);

// 2. Replace gameLoop and state with the perfect fixed timestep loop
c = c.replace(/let reqId;\r?\n\s*let updateIntervalId;\r?\n\s*function gameLoop\(\) \{\r?\n\s*if \(updateIntervalId\) clearInterval\(updateIntervalId\);\r?\n\s*updateIntervalId = setInterval\(update, 1000\/60\);\r?\n\s*\}/g,
`let reqId;
let lastTime = 0;
let accumulator = 0;
const TICK_RATE = 1000 / 60;

function gameLoop(timestamp) {
  if (!timestamp) timestamp = performance.now();
  if (!lastTime) lastTime = timestamp;
  let dt = timestamp - lastTime;
  lastTime = timestamp;

  if (dt > 250) dt = 250;

  accumulator += dt;
  while (accumulator >= TICK_RATE) {
    update();
    accumulator -= TICK_RATE;
  }
  
  render();

  reqId = requestAnimationFrame(gameLoop);
}`);

// 3. Fix cleanup to just cancel reqId
c = c.replace(/cleanup: \(\) => \{\r?\n\s*gameActive = false;\r?\n\s*cancelAnimationFrame\(reqId\);\r?\n\s*if \(updateIntervalId\) clearInterval\(updateIntervalId\);/g,
`cleanup: () => {
      gameActive = false;
      cancelAnimationFrame(reqId);`);

// 4. Fix start to call gameLoop properly
c = c.replace(/reqId = requestAnimationFrame\(render\);\r?\n\s*gameLoop\(\);/g,
`lastTime = 0;
      accumulator = 0;
      reqId = requestAnimationFrame(gameLoop);`);

fs.writeFileSync('src/lib/gameEngine.js', c);
console.log('Fixed gameEngine.js completely');
