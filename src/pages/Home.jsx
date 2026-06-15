import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BUB_IMG_SRC } from '../lib/assets';

const Home = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async () => {
    console.log('Login button clicked!'); // 디버깅용 로그 추가
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) {
        console.error('Error logging in:', error);
        alert(`로그인 중 오류가 발생했습니다: ${error.message}`);
        // 권한 관련 에러(401 등) 시 로컬 및 세션 스토리지 모두 초기화
        localStorage.clear();
        sessionStorage.clear();
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Login exception:', err);
      alert(`로그인 중 예외가 발생했습니다: ${err.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="screen login-screen">
      <div className="login-card">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px', marginBottom: '16px' }}>
          <div className="login-icon" style={{ margin: 0, width: '64px', height: '64px' }}>
            <img src={BUB_IMG_SRC} alt="Bubble Bobble" style={{ width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated' }} />
          </div>
          <div className="login-icon" style={{ margin: 0, width: '64px', height: '64px' }}>
            <img src="/pacman-icon.png" alt="Pacman" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
        </div>
        <div className="login-title">RETRO GAME<br />QUIZ ADVENTURE</div>
        <div className="login-sub">교사용 대시보드 - 구글 계정으로 로그인하세요!</div>
        <button 
          className="btn-teal" 
          onClick={handleLogin} 
          disabled={loading}
        >
          {loading ? '로그인 중...' : 'Google 로그인'}
        </button>
        <div style={{ marginTop: '24px', fontSize: '12px', color: 'var(--ink-subtle)', textAlign: 'center', lineHeight: '1.4', wordBreak: 'keep-all' }}>
          본 앱에 사용된 캐릭터 이미지는 주식회사 타이토(TAITO Corporation)의 게임 '버블보블(Bubble Bobble)'의 자산이며, 교육적 목적으로만 사용되었습니다. 모든 권리는 원저작권자에게 있습니다. 교육적 목적 이외의 사용은 금지합니다.
        </div>
      </div>
    </div>
  );
};

export default Home;
