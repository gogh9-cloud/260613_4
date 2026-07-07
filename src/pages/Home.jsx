import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BUB_IMG_SRC } from '../lib/assets';

const privacyText = `RETRO GAME QUIZ ADVENTURE(이하 "본 서비스")는 이용자의 개인정보를 중요시하며, "개인정보 보호법" 등 관련 법령을 준수합니다.

1. 수집하는 개인정보 항목
본 서비스는 Google OAuth 로그인을 통해 아래와 같은 정보를 수집합니다.
- 필수항목: 구글 계정 이메일 주소, 이름, 프로필 이미지

2. 개인정보의 수집 및 이용 목적
수집된 개인정보는 다음의 목적을 위해 활용됩니다.
- 서비스 제공 및 본인 식별
- 퀴즈 출제자(작성자) 정보 기록 및 표시
- 서비스 이용에 따른 이력 관리

3. 개인정보의 보유 및 이용 기간
이용자의 개인정보는 원칙적으로 서비스 제공 목적이 달성되면 지체 없이 파기합니다. 단, 사용자 식별 및 서비스의 원활한 제공을 위해 회원 탈퇴 시까지 보유합니다.

4. 개인정보의 파기절차 및 방법
이용자가 탈퇴를 요청하거나 개인정보 수집 목적이 달성된 경우, 저장된 데이터를 즉시 파기합니다.

5. 이용자의 권리
이용자는 언제든지 자신의 개인정보를 조회하거나 수정할 수 있으며, 수집 및 이용에 대한 동의를 철회(회원 탈퇴)할 수 있습니다.`;

const termsText = `본 약관은 RETRO GAME QUIZ ADVENTURE(이하 "서비스")를 이용함에 있어 서비스와 이용자 간의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.

1. 서비스의 목적
본 서비스는 레트로 게임 스타일의 퀴즈를 제작하고 즐길 수 있도록 교육적 목적으로 제공되는 비상업적 서비스입니다.

2. 이용자의 의무
- 이용자는 서비스의 지적 재산권을 존중해야 합니다.
- 타인에게 불쾌감을 주는 내용이나 유해한 콘텐츠를 퀴즈 형태로 등록해서는 안 됩니다.
- 서비스 운영을 방해하거나 비정상적인 방법으로 이용하는 행위를 금지합니다.

3. 저작권의 귀속
- 서비스에 사용된 게임 캐릭터 및 이미지는 원저작권자(주식회사 타이토, 주식회사 반다이남코 엔터테인먼트 등)에게 귀속됩니다.
- 본 서비스는 해당 리소스를 교육적 목적으로만 사용하며, 이용자 또한 상업적 목적으로 재배포하거나 변형하여 사용할 수 없습니다.

4. 책임 및 손해배상
- 서비스는 교육용 무료 서비스로서 무중단 운영 또는 데이터 백업을 완전히 보장하지 않습니다.
- 서비스 이용 중 발생한 불이익에 대해 서비스 제공자는 법적 책임을 지지 않습니다.

5. 서비스 변경 및 종료
운영자의 사정에 따라 사전 공지 없이 서비스 내용이 변경되거나 서비스 제공이 영구적으로 중단될 수 있습니다.`;

const Home = () => {
  const [loading, setLoading] = useState(false);
  const [modalType, setModalType] = useState(null);
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
        <div className="login-sub" style={{ marginTop: '20px', marginBottom: '20px' }}>교사용 대시보드</div>
        <button 
          className="btn-teal" 
          onClick={handleLogin} 
          disabled={loading}
        >
          {loading ? '로그인 중...' : 'Google 로그인'}
        </button>
        <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--ink-muted)', textAlign: 'center' }}>
          powerd by sota / gogh999@gmail.com
        </div>

        <div style={{ marginTop: '24px', fontSize: '12px', color: 'var(--ink-subtle)', textAlign: 'center', lineHeight: '1.4', wordBreak: 'keep-all' }}>
          본 앱에 사용된 캐릭터 이미지는 주식회사 타이토(TAITO Corporation)의 게임 '버블보블(Bubble Bobble)' 및 주식회사 반다이남코 엔터테인먼트(Bandai Namco Entertainment)의 게임 '팩맨(Pac-Man)'의 자산이며, 교육적 목적으로만 사용되었습니다. 모든 권리는 원저작권자에게 있습니다. 교육적 목적 이외의 사용은 금지합니다.
        </div>

        {/* 개인정보처리방침 & 사용약관 링크 */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '24px', fontSize: '13px' }}>
          <button 
            type="button" 
            onClick={() => setModalType('privacy')} 
            style={{ background: 'none', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer', textDecoration: 'underline', font: 'inherit' }}
          >
            개인정보처리방침
          </button>
          <span style={{ color: 'var(--ink-subtle)' }}>|</span>
          <button 
            type="button" 
            onClick={() => setModalType('terms')} 
            style={{ background: 'none', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer', textDecoration: 'underline', font: 'inherit' }}
          >
            사용약관
          </button>
        </div>
      </div>

      {/* 모달 팝업 */}
      {modalType && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--surface-1)',
            padding: '32px',
            borderRadius: 'var(--r-lg)',
            width: '500px',
            maxWidth: '90vw',
            maxHeight: '80vh',
            overflowY: 'auto',
            border: '1px solid var(--border)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--ink)' }}>
              {modalType === 'privacy' ? '개인정보처리방침' : '사용약관'}
            </h2>
            <div style={{
              fontSize: '14px',
              color: 'var(--ink-muted)',
              lineHeight: '1.6',
              whiteSpace: 'pre-line',
              textAlign: 'left'
            }}>
              {modalType === 'privacy' ? privacyText : termsText}
            </div>
            <button
              onClick={() => setModalType(null)}
              className="btn-sub"
              style={{
                alignSelf: 'flex-end',
                marginTop: '16px',
                padding: '8px 24px',
                width: 'auto'
              }}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
