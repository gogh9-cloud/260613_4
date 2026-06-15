import React, { useEffect, useRef } from 'react';

const PacmanWrapper = ({ quizPool, player, callbacks, onExit }) => {
  const iframeRef = useRef(null);

  useEffect(() => {
    const handleMessage = async (event) => {
      // 보안 확인 (원한다면 origin 확인 가능)
      const data = event.data;
      if (!data || data.source !== 'pacman') return;

      if (data.type === 'READY') {
        // iframe 로드 완료 시 데이터 전송
        iframeRef.current.contentWindow.postMessage({
          source: 'react',
          type: 'INIT_GAME',
          quizPool,
          player
        }, '*');
      } else if (data.type === 'SAVE_SCORE') {
        const result = await callbacks.onSaveStageScore(data.payload);
        iframeRef.current.contentWindow.postMessage({
          source: 'react',
          type: 'SCORE_SAVED',
          payload: result
        }, '*');
      } else if (data.type === 'SUBMIT_ANSWER') {
        const result = await callbacks.onSubmitAnswer(data.payload);
        iframeRef.current.contentWindow.postMessage({
          source: 'react',
          type: 'ANSWER_SUBMITTED',
          payload: result
        }, '*');
      } else if (data.type === 'EXIT') {
        onExit();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [quizPool, player, callbacks, onExit]);

  return (
    <div style={{ width: '100%', height: '100vh', background: '#000' }}>
      <iframe
        ref={iframeRef}
        src={`/pacman.html?t=${Date.now()}`}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Pacman Game"
      />
    </div>
  );
};

export default PacmanWrapper;
