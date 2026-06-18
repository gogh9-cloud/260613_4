const fs = require('fs');
let c = fs.readFileSync('src/lib/gameEngine.js', 'utf8');

c = c.replace(/function finishQuiz\(pts,ansStr\)\{[\s\S]*?logAnswer\(true,ansStr\);\s*setTimeout\(\(\)=>\{ closeQuiz\(\); \}, 1000\);/m, 
`function finishQuiz(pts,ansStr){
  if(!curQuizMonster)return;
  const bubbleId = curQuizMonster.bubble?.id;
  if (curQuizMonster.bubble) {
    const bIdx = bubbles.indexOf(curQuizMonster.bubble);
    if (bIdx >= 0) bubbles.splice(bIdx, 1);
  }
  curQuizMonster.state='solved'; curQuizMonster.bubble=null;
  quizSolved++; player.score+=pts; player.stageScore+=pts;
  updateHUD();
  spawnFloat(player.x+player.w/2,player.y-8,'+'+pts+'!','#f5c842');
  // 정답 아이템 드롭 (터진 위치에서)
  dropItem(curPopX, curPopY, curQuizMonster.id, curQuizMonster.attempts, curQuizData.type === 'short', bubbleId);
  logAnswer(true,ansStr);
  setTimeout(()=>{ closeQuiz(); }, 1000);`);

fs.writeFileSync('src/lib/gameEngine.js', c);
console.log('Fixed gameEngine.js');
