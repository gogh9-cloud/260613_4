import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

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
        <div className="login-icon">🫧</div>
        <div className="login-title">BUBBLE BOBBLE<br />QUIZ ADVENTURE</div>
        <div className="login-sub">교사용 대시보드 - 구글 계정으로 로그인하세요!</div>
        <button 
          className="btn-teal" 
          onClick={handleLogin} 
          disabled={loading}
        >
          {loading ? '로그인 중...' : 'Google 로그인'}
        </button>
      </div>
    </div>
  );
};

export default Home;
