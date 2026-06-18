const fs = require('fs');
let c = fs.readFileSync('src/lib/gameEngine.js', 'utf8');

// 1. Fix blurriness by rounding the coordinates in fillText
c = c.replace(/ctx\.fillText\(it\.emoji,cx,cy\+bounce\);/g, "ctx.fillText(it.emoji, Math.round(cx), Math.round(cy+bounce));");
c = c.replace(/ctx\.fillText\('\+'\+it\.pts, cx, cy-16\);/g, "ctx.fillText('+'+it.pts, Math.round(cx), Math.round(cy-16));");

// 2. Fix the gameLoop to use a stable setInterval and remove the messy performance.now() logic
c = c.replace(/let reqId;\nlet lastTime = 0;\nfunction gameLoop\(timestamp\)\{[\s\S]*?reqId = requestAnimationFrame\(gameLoop\);\n\}/m, 
`let reqId; // still used for render loop if needed, or we just keep it
let updateIntervalId;
function gameLoop() {
  if (updateIntervalId) clearInterval(updateIntervalId);
  updateIntervalId = setInterval(update, 1000/60);
}`);

// 3. Fix cleanup to clear the interval
c = c.replace(/cleanup: \(\) => \{\n      gameActive = false;\n      cancelAnimationFrame\(reqId\);/,
`cleanup: () => {
      gameActive = false;
      cancelAnimationFrame(reqId);
      if (updateIntervalId) clearInterval(updateIntervalId);`);

fs.writeFileSync('src/lib/gameEngine.js', c);
console.log('Fixed gameEngine.js completely');
