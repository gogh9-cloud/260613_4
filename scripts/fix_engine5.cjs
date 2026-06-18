const fs = require('fs');
let c = fs.readFileSync('src/lib/gameEngine.js', 'utf8');

c = c.replace(/const bounce=Math\.sin\(Date\.now\(\)\/180\)\*1\.5;/g, "const bounce=Math.round(Math.sin(Date.now()/180)*1.5);");
c = c.replace(/ctx\.fillText\(it\.emoji,cx,cy\+bounce\);/g, "ctx.fillText(it.emoji, Math.round(cx), Math.round(cy+bounce));");
c = c.replace(/ctx\.fillText\('\+'\+it\.pts, cx, cy-16\);/g, "ctx.fillText('+'+it.pts, Math.round(cx), Math.round(cy-16));");

c = c.replace(/let reqId;\r?\nfunction gameLoop\(\)\{update\(\); reqId = requestAnimationFrame\(gameLoop\);\}/g, 
`let reqId;
let updateIntervalId;
function gameLoop() {
  if (updateIntervalId) clearInterval(updateIntervalId);
  updateIntervalId = setInterval(update, 1000/60);
}`);

c = c.replace(/cleanup: \(\) => \{\r?\n\s*gameActive = false;\r?\n\s*cancelAnimationFrame\(reqId\);/g, 
`cleanup: () => {
      gameActive = false;
      cancelAnimationFrame(reqId);
      if (updateIntervalId) clearInterval(updateIntervalId);`);

c = c.replace(/requestAnimationFrame\(render\);\r?\n\s*gameLoop\(\);/g, 
`reqId = requestAnimationFrame(render);
      gameLoop();`);

fs.writeFileSync('src/lib/gameEngine.js', c);
console.log('Fixed gameEngine.js completely');
