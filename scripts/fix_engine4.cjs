const fs = require('fs');
let c = fs.readFileSync('src/lib/gameEngine.js', 'utf8');

// 1. Fix blurriness: replace the item render logic around line 1100.
// Look for:
// const bounce=Math.sin(Date.now()/180)*1.5;
// ctx.font='22px serif';
// ctx.textAlign='center';ctx.textBaseline='middle';
// ctx.fillText(it.emoji,cx,cy+bounce);
c = c.replace(/const bounce=Math\.sin\(Date\.now\(\)\/180\)\*1\.5;\s*ctx\.font='22px serif';\s*ctx\.textAlign='center';ctx\.textBaseline='middle';\s*ctx\.fillText\(it\.emoji,cx,cy\+bounce\);/g, 
`const bounce=Math.sin(Date.now()/180)*1.5;
      ctx.font='22px serif';
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(it.emoji, Math.round(cx), Math.round(cy+bounce));`);

// Also fix the points text
c = c.replace(/ctx\.fillText\('\+'\+it\.pts, cx, cy-16\);/g, "ctx.fillText('+'+it.pts, Math.round(cx), Math.round(cy-16));");


// 2. Fix gameLoop to use setInterval cleanly
c = c.replace(/let reqId;\nfunction gameLoop\(\)\{update\(\); reqId = requestAnimationFrame\(gameLoop\);\}/g,
`let reqId;
let updateIntervalId;
function gameLoop(){
  if (updateIntervalId) clearInterval(updateIntervalId);
  updateIntervalId = setInterval(update, 1000/60);
}`);


// 3. Update cleanup
c = c.replace(/cleanup: \(\) => \{\n\s*gameActive = false;\n\s*cancelAnimationFrame\(reqId\);/g,
`cleanup: () => {
      gameActive = false;
      cancelAnimationFrame(reqId);
      if (updateIntervalId) clearInterval(updateIntervalId);`);

// 4. In start(), we just call gameLoop(), but wait, `reqId = requestAnimationFrame(gameLoop);` was removed!
// We STILL need `requestAnimationFrame(render)` to loop! But wait, `render` ALREADY loops via `requestAnimationFrame(render)`!
// Look at `gameEngine.js` line 1179: `requestAnimationFrame(render);`
// So `render` is completely self-sustaining.
// `gameLoop` with `setInterval` is also self-sustaining.
// Wait! Previously `reqId = requestAnimationFrame(gameLoop)` was used. Now `reqId` is unused!
// Should we use `reqId` to track `render` so `cancelAnimationFrame(reqId)` actually cancels the render loop?
// Let's modify render to save reqId!
c = c.replace(/requestAnimationFrame\(render\);\n\}/g,
`reqId = requestAnimationFrame(render);
}`);

// Wait, the initial call to `render` in `start`: `requestAnimationFrame(render);`
c = c.replace(/requestAnimationFrame\(render\);\n\s*gameLoop\(\);/g,
`reqId = requestAnimationFrame(render);
      gameLoop();`);

fs.writeFileSync('src/lib/gameEngine.js', c);
console.log('Fixed gameEngine.js completely');
