const fs = require('fs');
let c = fs.readFileSync('src/lib/gameEngine.js', 'utf8');

c = c.replace(/  \/\/ 드롭 아이템\r?\n  for \(const it of items\)\{\r?\n[\s\S]*?    ctx\.restore\(\);/m,
`  // 드롭 아이템
  for (const it of items){
    const cx=it.x+it.w/2, cy=it.y+it.h/2;
    
    ctx.save();
    
    // 이모지 뒤에 항상 밝고 선명한 원을 깔아주어 어두운 배경에 묻히지 않게 함
    ctx.globalAlpha = 1.0;
    ctx.beginPath();
    ctx.arc(Math.round(cx), Math.round(cy), 18, 0, Math.PI*2);
    ctx.fillStyle = '#ffffff'; // 완전한 흰색 배경
    ctx.fill();
    
    // 외곽에 빛나는 오라(Glow) 효과 추가
    const glow = 0.4 + Math.sin(Date.now()/250)*0.3; // 0.1 ~ 0.7
    ctx.globalAlpha = glow;
    ctx.beginPath();
    ctx.arc(Math.round(cx), Math.round(cy), 22, 0, Math.PI*2);
    ctx.fillStyle = '#f5c842';
    ctx.fill();
    
    ctx.globalAlpha = 1.0;
    // 이모지 (Arial/sans-serif 사용하여 윈도우 컬러 이모지 강제 적용)
    if(!it.landed){
      // 날아가는 중 — 속도 방향으로 살짝 기울기
      const angle=Math.atan2(it.vy,it.vx);
      ctx.translate(Math.round(cx), Math.round(cy));
      ctx.rotate(angle*0.3);
      ctx.font='22px "Segoe UI Emoji", Arial, sans-serif';
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(it.emoji,0,0);
    } else {
      // 착지 후 — 살짝 바운스
      const bounce=Math.round(Math.sin(Date.now()/180)*1.5);
      ctx.font='22px "Segoe UI Emoji", Arial, sans-serif';
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(it.emoji, Math.round(cx), Math.round(cy+bounce));
    }
    ctx.restore();`);

fs.writeFileSync('src/lib/gameEngine.js', c);
console.log('Fixed gameEngine.js visually completely');
