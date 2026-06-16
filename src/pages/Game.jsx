import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { initGameEngine } from '../lib/gameEngine';
import { BUB_IMG_SRC } from '../lib/assets';
import PacmanWrapper from './PacmanWrapper';

// 퀴즈 팝업 전용 스타일 — index.css 전역 스타일(.btn-sub, .si-inp 등)에 덮어씌워지는 것을 막기 위해
// document.head에 직접 주입합니다.
const QUIZ_STYLE_ID = 'bubble-quiz-override';
const QUIZ_CSS = `
  /* === Bubble Bobble 퀴즈 팝업 — Pac-Man 스타일 적용 === */
  #qz-ov { position:fixed !important; inset:0 !important; background:rgba(0,0,0,.82) !important; display:flex !important; align-items:center !important; justify-content:center !important; z-index:9999 !important; backdrop-filter:blur(6px) !important; opacity:0 !important; pointer-events:none !important; transition:opacity .25s !important; }
  #qz-ov.open { opacity:1 !important; pointer-events:all !important; }
  #qz-ov .qz-card { background:#121212 !important; border:2px solid #ffffff !important; border-radius:20px !important; width:460px !important; max-height:88vh !important; overflow-y:auto !important; box-shadow:0 32px 80px rgba(0,0,0,.9) !important; transform:translateY(16px) scale(.97) !important; transition:transform .3s cubic-bezier(.22,1,.36,1) !important; position:relative !important; }
  #qz-ov.open .qz-card { transform:none !important; }
  #qz-ov .qz-body { padding:20px 22px !important; }
  #qz-ov .qz-xbtn { width:28px !important; height:28px !important; background:#181818 !important; border:1px solid #ffffff !important; border-radius:4px !important; color:#b3b3b3 !important; font-size:15px !important; cursor:pointer !important; display:flex !important; align-items:center !important; justify-content:center !important; transition:all .15s !important; line-height:1 !important; position:absolute !important; top:10px !important; right:10px !important; padding:0 !important; }
  #qz-ov .qz-xbtn:hover { background:#252525 !important; color:#ffffff !important; }
  #qz-ov .qz-q { font-size:18px !important; font-weight:600 !important; font-family:'Noto Sans KR',sans-serif !important; line-height:1.6 !important; color:#ffffff !important; margin-bottom:20px !important; white-space:pre-line !important; }
  #qz-ov .opts { display:flex !important; flex-direction:column !important; gap:7px !important; }
  #qz-ov .opt { display:flex !important; align-items:center !important; gap:11px !important; width:100% !important; padding:12px 14px !important; background:#0d1220 !important; border:1px solid rgba(255,255,255,.1) !important; border-radius:6px !important; color:#ffffff !important; font-size:14px !important; font-family:'Noto Sans KR',sans-serif !important; cursor:pointer !important; text-align:left !important; box-shadow:none !important; transition:background .15s,border-color .15s,transform .1s !important; }
  #qz-ov .opt:hover:not(:disabled) { background:#1a2440 !important; border-color:rgba(255,255,255,.3) !important; transform:translateX(3px) !important; }
  #qz-ov .opt:disabled { cursor:default !important; }
  #qz-ov .opt.ok { background:rgba(74,222,128,.1) !important; border-color:rgba(74,222,128,.5) !important; color:#4ade80 !important; }
  #qz-ov .opt.ng { background:rgba(244,63,94,.08) !important; border-color:rgba(244,63,94,.4) !important; color:#f87171 !important; }
  #qz-ov .onum { width:26px !important; height:26px !important; border-radius:3px !important; background:#181818 !important; border:1px solid #4d4d4d !important; display:flex !important; align-items:center !important; justify-content:center !important; font-size:11px !important; font-weight:700 !important; color:#b3b3b3 !important; flex-shrink:0 !important; }
  #qz-ov .opt.ok .onum { background:rgba(74,222,128,.2) !important; border-color:rgba(74,222,128,.4) !important; color:#4ade80 !important; }
  #qz-ov .opt.ng .onum { background:rgba(244,63,94,.15) !important; border-color:rgba(244,63,94,.3) !important; color:#f87171 !important; }
  #qz-ov .si-wrap { display:flex !important; gap:7px !important; }
  #qz-ov .si-inp { flex:1 !important; padding:11px 14px !important; background:#0d1220 !important; border:1px solid #4d4d4d !important; border-radius:6px !important; color:#ffffff !important; font-size:16px !important; font-family:'Noto Sans KR',sans-serif !important; font-weight:500 !important; outline:none !important; transition:border-color .2s,box-shadow .2s !important; box-shadow:none !important; width:auto !important; }
  #qz-ov .si-inp:focus { border-color:rgba(45,212,191,.6) !important; box-shadow:0 0 0 3px rgba(45,212,191,.15) !important; }
  #qz-ov .btn-sub { width:auto !important; padding:11px 18px !important; background:#2dd4bf !important; border:none !important; border-radius:6px !important; color:#030e0d !important; font-family:'Noto Sans KR',sans-serif !important; font-weight:700 !important; font-size:14px !important; cursor:pointer !important; transition:all .15s !important; box-shadow:0 4px 14px rgba(45,212,191,.35) !important; letter-spacing:0 !important; text-transform:none !important; margin-top:0 !important; transform:none !important; }
  #qz-ov .btn-sub:hover { background:#5eead4 !important; transform:translateY(-1px) !important; }
  #qz-ov .btn-sub:disabled { opacity:.4 !important; cursor:not-allowed !important; transform:none !important; }
  #qz-ov .res { display:flex !important; align-items:center !important; gap:11px !important; padding:13px 14px !important; border-radius:6px !important; margin-top:14px !important; font-size:13px !important; font-weight:500 !important; font-family:'Noto Sans KR',sans-serif !important; animation:qz-slideUp .3s cubic-bezier(.22,1,.36,1) both !important; }
  #qz-ov .res.ok-res { background:rgba(74,222,128,.1) !important; border:1px solid rgba(74,222,128,.3) !important; color:#4ade80 !important; box-shadow:none !important; }
  #qz-ov .res.ng-res { background:rgba(244,63,94,.08) !important; border:1px solid rgba(244,63,94,.25) !important; color:#ff8099 !important; box-shadow:none !important; }
  #qz-ov .ri { font-size:21px !important; }
  #qz-ov .rt { flex:1 !important; line-height:1.5 !important; }
  #qz-ov .rp { font-size:13px !important; font-weight:700 !important; white-space:nowrap !important; }
  #qz-ov .save-s { font-size:10px !important; color:#b3b3b3 !important; margin-top:6px !important; text-align:right !important; min-height:14px !important; }
  #qz-ov .qz-img-wrap { margin:0 0 16px !important; text-align:center !important; border-radius:6px !important; overflow:hidden !important; background:#181818 !important; border:1px solid #272727 !important; }
  #qz-ov .qz-img-wrap img { max-width:100% !important; max-height:260px !important; object-fit:contain !important; display:block !important; margin:0 auto !important; }
  #qz-ov #qz-cont { display:block !important; width:100% !important; padding:14px !important; background:transparent !important; border:1px solid #4d4d4d !important; border-radius:500px !important; color:#ffffff !important; font-family:'Noto Sans KR',sans-serif !important; font-size:13px !important; font-weight:700 !important; text-transform:uppercase !important; letter-spacing:1.5px !important; cursor:pointer !important; text-align:center !important; transition:all .15s !important; margin-top:14px !important; }
  #qz-ov #qz-cont:hover { background:#1f1f1f !important; border-color:#b3b3b3 !important; transform:scale(1.02) !important; }
  @keyframes qz-slideUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
`;

const Game = () => {
  const [searchParams] = useSearchParams();
  const room = searchParams.get('room');

  const [quizSet, setQuizSet] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [playerInfo, setPlayerInfo] = useState({ ban: '', num: '', name: '' });
  const [gameState, setGameState] = useState('login'); // 'login', 'playing'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [scale, setScale] = useState(1);

  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  useEffect(() => {
    if (room) {
      fetchQuizSet();
    }
  }, [room]);

  const fetchQuizSet = async () => {
    setLoading(true);
    const { data: qSet, error } = await supabase
      .from('quiz_sets')
      .select('*, question_banks(id, title)')
      .eq('link_code', room)
      .single();

    if (error || !qSet) {
      setErrorMsg('유효하지 않은 링크입니다.');
      setLoading(false);
      return;
    }
    setQuizSet(qSet);

    // v2: bank_id가 있으면 bank_questions에서 로드, 없으면 레거시 questions 테이블 사용
    if (qSet.bank_id) {
      const { data: qData } = await supabase
        .from('bank_questions')
        .select('*')
        .eq('bank_id', qSet.bank_id)
        .order('question_num', { ascending: true });
      setQuestions(qData || []);
    } else {
      // 레거시 폴백: 수동으로 추가한 questions 테이블
      const { data: qData } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_set_id', qSet.id)
        .order('created_at', { ascending: true });
      setQuestions(qData || []);
    }
    setLoading(false);
  };

  const handleStart = async () => {
    if (questions.length === 0) {
      setErrorMsg('��ϵ� ������ �����ϴ�. �����ڿ��� �����ϼ���.');
      return;
    }
    const { ban, num, name } = playerInfo;
    if (!ban || !num || !name) {
      setErrorMsg('모든 정보를 입력해주세요.');
      return;
    }

    setLoading(true);
    // 학생 정보 조회
    let { data: student, error: fetchError } = await supabase
      .from('students')
      .select('*')
      .eq('quiz_set_id', quizSet.id)
      .eq('ban', parseInt(ban))
      .eq('num', parseInt(num))
      .eq('name', name)
      .maybeSingle();

    if (fetchError) {
      setLoading(false);
      console.error(fetchError);
      setErrorMsg('학생 정보를 불러오는 중 오류가 발생했습니다.');
      return;
    }

    if (!student) {
      // 학생 정보가 없으면 새로 생성
      const { data: newStudent, error: insertError } = await supabase
        .from('students')
        .insert([{ quiz_set_id: quizSet.id, ban: parseInt(ban), num: parseInt(num), name }])
        .select()
        .single();

      if (insertError) {
        setLoading(false);
        console.error(insertError);
        setErrorMsg('학생 정보를 생성하는 중 오류가 발생했습니다.');
        return;
      }
      student = newStudent;
    }

    setLoading(false);

    setPlayerInfo(prev => ({ ...prev, id: student.id, score: student.total_score || 0, stageScores: student.stage_scores || {} }));
    setGameState('playing');
  };

  // 퀴즈 팝업 스타일을 document.head에 주입 (컴포넌트 마운트 시)
  useEffect(() => {
    if (document.getElementById(QUIZ_STYLE_ID)) return;
    const styleEl = document.createElement('style');
    styleEl.id = QUIZ_STYLE_ID;
    styleEl.textContent = QUIZ_CSS;
    document.head.appendChild(styleEl);
    return () => {
      const el = document.getElementById(QUIZ_STYLE_ID);
      if (el) el.remove();
    };
  }, []);

  useEffect(() => {
    if (gameState === 'playing' && canvasRef.current) {
      // 퀴즈 데이터를 게임 엔진 포맷으로 변환
      const quizPool = questions.map(q => ({
        id: q.id,
        questionNum: q.question_num,
        question: q.question_text,
        type: q.options && q.options.length > 0 && q.options.some(o => o !== '') ? 'choice' : 'short',
        options: q.options,
        answer: q.answers,
        image: q.image_url
      }));

      const player = {
        id: playerInfo.id,
        ban: playerInfo.ban,
        num: playerInfo.num,
        name: playerInfo.name,
        sheet: quizSet.title,
        score: playerInfo.score,
        stageScore: 0,
        stageScores: playerInfo.stageScores,
        x: 50, y: 50, w: 30, h: 44, vx: 0, vy: 0, facing: 1
      };

      const callbacks = {
        onSaveStageScore: async ({ ban, num, name, stageName, stageScore, solved }) => {
          const newStageScores = { ...player.stageScores, [stageName]: Math.max(stageScore, player.stageScores[stageName] || 0) };
          const newTotal = Object.values(newStageScores).reduce((a, b) => a + b, 0);

          await supabase.from('students').update({
            total_score: newTotal,
            stage_scores: newStageScores
          }).eq('id', player.id);

          return { score: newTotal, stageScores: newStageScores };
        },
        onSubmitAnswer: async ({ id, questionNum, answer, isCorrect }) => {
          const qObj = questions.find(q => q.id === id);
          if (qObj) {
            const { error } = await supabase.from('student_logs').insert([{
              student_id: player.id,
              question_id: qObj.id,
              is_correct: isCorrect,
              submitted_answer: String(answer).slice(0, 300)
            }]);
            if (error) {
              console.error("Insert log error:", error);
              alert("오답 기록 DB 오류: " + error.message);
            }
          }
        },
        onBack: () => {
          if (engineRef.current) {
            engineRef.current.cleanup();
            engineRef.current = null;
          }
          // DOM이 완전히 정리된 후 login으로 전환
          setTimeout(() => {
            setGameState('login');
          }, 50);
        }
      };

      engineRef.current = initGameEngine(canvasRef.current, callbacks, { player, quizPool });

      // Start the game loop after a brief delay to ensure DOM is ready
      setTimeout(() => {
        engineRef.current.start();
      }, 100);
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.cleanup();
      }
    };
  }, [gameState]);

  useEffect(() => {
    const handleResize = () => {
      if (gameState !== 'playing') {
        setScale(1);
        return;
      }
      const availableWidth = window.innerWidth;
      const availableHeight = window.innerHeight;

      // Base game dimensions: width 800px, height ~620px
      // Adding a small margin of 20px
      const scaleX = availableWidth / 800;
      const scaleY = availableHeight / 620;

      const newScale = Math.min(scaleX, scaleY);
      setScale(newScale > 0 ? newScale : 1);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call
    return () => window.removeEventListener('resize', handleResize);
  }, [gameState]);

  if (!room) {
    return <div className="screen"><div className="login-card"><div className="login-sub">방 코드가 없습니다.</div></div></div>;
  }

  if (gameState === 'login') {
    return (
      <div key="login-view" className="screen login-screen" id="scr-login">
        <div className="login-card">
          {quizSet?.game_type === 'pacman' ? (
            <>
              <div className="login-icon">
                <img src="/pacman-icon.png" alt="Pacman" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <div className="login-title">PACMAN<br />QUIZ ADVENTURE</div>
            </>
          ) : (
            <>
              <div className="login-icon">
                <img src={BUB_IMG_SRC} alt="Player" style={{ width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated' }} />
              </div>
              <div className="login-title">BUBBLE BOBBLE<br />QUIZ ADVENTURE</div>
            </>
          )}
          <div className="login-sub">방 코드: {room} {quizSet ? `(${quizSet.title})` : ''}</div>

          {errorMsg && <div style={{ color: 'var(--semantic-error)', fontSize: '14px', textAlign: 'center', marginBottom: '16px' }}>{errorMsg}</div>}

          <label className="f-label">반 · 번호 · 이름</label>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', alignItems: 'stretch' }}>
            <div className="f-wrap" style={{ width: '60px', marginBottom: 0, flexShrink: 0 }}>
              <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="반" value={playerInfo.ban} onChange={e => setPlayerInfo({ ...playerInfo, ban: e.target.value.replace(/[^0-9]/g, '') })} style={{ textAlign: 'center', padding: '12px 4px' }} />
            </div>
            <div className="f-wrap" style={{ width: '60px', marginBottom: 0, flexShrink: 0 }}>
              <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="번호" value={playerInfo.num} onChange={e => setPlayerInfo({ ...playerInfo, num: e.target.value.replace(/[^0-9]/g, '') })} style={{ textAlign: 'center', padding: '12px 4px' }} />
            </div>
            <div className="f-wrap" style={{ flex: 1, marginBottom: 0 }}>
              <input type="text" placeholder="이름" value={playerInfo.name} onChange={e => setPlayerInfo({ ...playerInfo, name: e.target.value })} maxLength="12" />
            </div>
          </div>

          <button className="btn-teal" onClick={handleStart} disabled={loading || !quizSet}>
            {loading ? '접속 중...' : '게임 시작 ▶'}
          </button>

          <div style={{ marginTop: '24px', fontSize: '10px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', lineHeight: '1.4', wordBreak: 'keep-all' }}>
            본 앱에 사용된 캐릭터 이미지는 주식회사 타이토(TAITO Corporation)의 게임 '버블보블(Bubble Bobble)' 및 주식회사 반다이남코 엔터테인먼트(Bandai Namco Entertainment)의 게임 '팩맨(Pac-Man)'의 자산이며, 교육적 목적으로만 사용되었습니다. 모든 권리는 원저작권자에게 있습니다. 교육적 목적 이외의 사용은 금지합니다.
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {quizSet?.game_type === 'pacman' ? (
        <PacmanWrapper 
          quizPool={questions.map(q => ({
            id: q.id,
            questionNum: q.question_num,
            question: q.question_text,
            type: q.options && q.options.length > 0 && q.options.some(o => o !== '') ? 'choice' : 'short',
            options: q.options,
            answer: q.answers,
            image: q.image_url
          }))}
          player={{
            id: playerInfo.id,
            ban: playerInfo.ban,
            num: playerInfo.num,
            name: playerInfo.name,
            sheet: quizSet.title,
            score: playerInfo.score,
            stageScore: 0,
            stageScores: playerInfo.stageScores,
            x: 50, y: 50, w: 30, h: 44, vx: 0, vy: 0, facing: 1
          }}
          callbacks={{
            onSaveStageScore: async ({ ban, num, name, stageName, stageScore, solved }) => {
              const newStageScores = { ...playerInfo.stageScores, [stageName]: Math.max(stageScore, playerInfo.stageScores[stageName] || 0) };
              const newTotal = Object.values(newStageScores).reduce((a, b) => a + b, 0);
              await supabase.from('students').update({ total_score: newTotal, stage_scores: newStageScores }).eq('id', playerInfo.id);
              setPlayerInfo(prev => ({ ...prev, score: newTotal, stageScores: newStageScores }));
              return { score: newTotal, stageScores: newStageScores };
            },
            onSubmitAnswer: async ({ id, questionNum, answer, isCorrect }) => {
              const qObj = questions.find(q => q.id === id);
              if (qObj) {
                await supabase.from('student_logs').insert([{
                  student_id: playerInfo.id,
                  question_id: qObj.id,
                  is_correct: isCorrect,
                  submitted_answer: String(answer).slice(0, 300)
                }]);
              }
            }
          }}
          onExit={() => setGameState('login')}
        />
      ) : (
        <div key="game-view" className="screen" id="scr-game" style={{ background: 'var(--canvas)', justifyContent: 'center' }}>
          <div id="game-container" className="game-wrap" style={{ transform: `scale(${scale})`, transformOrigin: 'center center', width: '800px', height: '620px', flex: 'none' }}>
            {/* HUD */}
            <div id="hud" className="hud">
              <div className="hud-item player"><span className="hud-icon">👾</span> <span className="hud-main teal" id="hv-name">{playerInfo.name}</span></div>
              <div className="hud-item"><span className="hud-icon">⭐</span> <span className="hud-main gold"><span id="hv-score">{playerInfo.score}</span></span></div>
              <div className="hud-item"><span className="hud-icon">🎯</span> <span className="hud-main teal" id="hv-quiz">0/0</span></div>
              <div className="hud-item"><span className="hud-icon">📋</span> <span className="hud-main blue" id="hv-sheet">{quizSet?.title}</span></div>
              <div className="hud-item"><span className="hud-icon">🌱</span> <span className="hud-main" id="hv-lv">Lv1</span></div>
            </div>

            {/* 캔버스 영역 */}
            <div id="cw-wrap" className="canvas-area">
              <canvas id="gc" width="800" height="480" tabIndex="0" ref={canvasRef}></canvas>
              <div id="float-layer"></div>
              <div id="c-ov" className="c-overlay"><span className="ot">READY!</span><br /><span className="oh">화면을 클릭하여 시작</span></div>

              {/* 게임 클리어 오버레이 */}
              <div id="clear-ov" className="clear-overlay">
                <div id="clear-title" className="clear-title">STAGE CLEAR!</div>
                <div id="clear-sub" className="clear-sub"></div>
                <div id="clear-sc" className="clear-score"></div>
                <div style={{ marginTop: '20px' }}>
                  <button id="btn-retry" className="btn-clear sec" style={{ margin: '5px' }}>다시 하기</button>
                  <button id="btn-back" className="btn-clear sec" style={{ margin: '5px' }}>처음으로</button>
                </div>
              </div>
            </div>
          </div>

          {/* 셀렉트박스 (엔진 코드 호환을 위해 숨김) */}
          <select id="sel-sheet" style={{ display: 'none' }}>
            <option value={quizSet?.title}>{quizSet?.title}</option>
          </select>
        </div>
      )}
    </>
  );
};

export default Game;
