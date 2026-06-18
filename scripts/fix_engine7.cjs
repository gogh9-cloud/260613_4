const fs = require('fs');
let c = fs.readFileSync('src/lib/gameEngine.js', 'utf8');

// 1. Make the glow permanent so items don't fade into the background when they land.
// Replace:
// if (!it.landed) {
//   ctx.globalAlpha=glow;
//   ctx.beginPath();ctx.arc(cx,cy,18,0,Math.PI*2);
//   ctx.fillStyle='#f5c842';ctx.fill();
// }
c = c.replace(/if \(!it\.landed\) \{\r?\n\s*ctx\.globalAlpha=glow;\r?\n\s*ctx\.beginPath\(\);ctx\.arc\(cx,cy,18,0,Math\.PI\*2\);\r?\n\s*ctx\.fillStyle='#f5c842';ctx\.fill\(\);\r?\n\s*\}/g,
`// 항상 광채를 표시하여 어두운 배경에 묻히지 않게 함
    ctx.globalAlpha=glow;
    ctx.beginPath();ctx.arc(Math.round(cx),Math.round(cy),18,0,Math.PI*2);
    ctx.fillStyle='#f5c842';ctx.fill();`);

// 2. Fix the flying item subpixel rendering
c = c.replace(/ctx\.translate\(cx,cy\);/g, "ctx.translate(Math.round(cx), Math.round(cy));");

// 3. Fix the score hint text to be sharp and visible
// Replace:
// ctx.globalAlpha=0.8;
// ctx.font='bold 10px sans-serif';
// ctx.fillStyle='#ffe566';
// ctx.textAlign='center';
// ctx.fillText('+'+it.pts, Math.round(cx), Math.round(cy-16));
c = c.replace(/ctx\.globalAlpha=0\.8;\r?\n\s*ctx\.font='bold 10px sans-serif';\r?\n\s*ctx\.fillStyle='#ffe566';\r?\n\s*ctx\.textAlign='center';\r?\n\s*ctx\.fillText\('\+'\+it\.pts, Math\.round\(cx\), Math\.round\(cy-16\)\);/g,
`ctx.globalAlpha=1.0;
      ctx.font='bold 13px sans-serif';
      ctx.textAlign='center';
      
      // 검은색 외곽선으로 또렷하게
      ctx.strokeStyle='#000';
      ctx.lineWidth=2;
      ctx.strokeText('+'+it.pts, Math.round(cx), Math.round(cy-20));
      
      ctx.fillStyle='#ffe566';
      ctx.fillText('+'+it.pts, Math.round(cx), Math.round(cy-20));`);

fs.writeFileSync('src/lib/gameEngine.js', c);
console.log('Fixed gameEngine.js visually');
