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
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
      console.error('Error logging in:', error);
      alert('로그인 중 오류가 발생했습니다.');
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
