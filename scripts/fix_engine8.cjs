const fs = require('fs');
let c = fs.readFileSync('src/lib/gameEngine.js', 'utf8');

c = c.replace(/const glow=0\.2\+Math\.sin\(Date\.now\(\)\/250\)\*\.15;\r?\n[\s\S]*?ctx\.globalAlpha=1;/m,
`// 이모지 뒤에 항상 밝고 선명한 원을 깔아주어 어두운 배경에 묻히지 않게 함
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(Math.round(cx), Math.round(cy), 15, 0, Math.PI*2);
    ctx.fillStyle = '#ffffff'; // 완전한 흰색 배경
    ctx.fill();
    
    // 외곽에 빛나는 오라(Glow) 효과 추가
    const glow = 0.4 + Math.sin(Date.now()/250)*0.3; // 0.1 ~ 0.7
    ctx.globalAlpha = glow;
    ctx.beginPath();
    ctx.arc(Math.round(cx), Math.round(cy), 18, 0, Math.PI*2);
    ctx.fillStyle = '#f5c842';
    ctx.fill();
    
    ctx.globalAlpha = 1;`);

fs.writeFileSync('src/lib/gameEngine.js', c);
console.log('Fixed gameEngine.js visually again');
