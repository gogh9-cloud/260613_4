import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LogOut, Copy, Trash2, BarChart2, Plus, BookOpen, ShieldCheck } from 'lucide-react';

const ADMIN_EMAILS = ['gogh9@susaek.sen.es.kr'];

const QuizList = ({ user }) => {
  const [quizSets, setQuizSets] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [selectedBankId, setSelectedBankId] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const isAdmin = ADMIN_EMAILS.includes(user?.email);

  useEffect(() => {
    Promise.all([fetchQuizSets(), fetchBanks()]).finally(() => setLoading(false));
  }, []);

  const fetchQuizSets = async () => {
    const { data } = await supabase
      .from('quiz_sets')
      .select('*, question_banks(title, subject)')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false });
    setQuizSets(data || []);
  };

  const fetchBanks = async () => {
    const { data } = await supabase
      .from('question_banks')
      .select('id, title, subject, question_count')
      .order('created_at', { ascending: false });
    setBanks(data || []);
  };

  const createRoom = async () => {
    if (!newRoomTitle.trim() || !selectedBankId) {
      alert('방 이름과 문제 은행을 선택해 주세요.');
      return;
    }
    setCreating(true);
    const linkCode = Math.random().toString(36).substring(2, 10);
    const { data, error } = await supabase
      .from('quiz_sets')
      .insert([{
        title: newRoomTitle.trim(),
        teacher_id: user.id,
        link_code: linkCode,
        bank_id: selectedBankId
      }])
      .select('*, question_banks(title, subject)')
      .single();

    if (error) {
      alert('게임방 생성에 실패했습니다: ' + error.message);
      console.error(error);
    } else {
      setQuizSets(prev => [data, ...prev]);
      setShowCreateModal(false);
      setNewRoomTitle('');
      setSelectedBankId('');
    }
    setCreating(false);
  };

  const deleteQuizSet = async (id) => {
    if (!window.confirm('게임방을 삭제하시겠습니까? 학생 기록도 함께 삭제됩니다.')) return;
    const { error } = await supabase.from('quiz_sets').delete().eq('id', id);
    if (!error) setQuizSets(prev => prev.filter(q => q.id !== id));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const copyLink = (linkCode) => {
    const url = `${window.location.origin}/game?room=${linkCode}`;
    navigator.clipboard.writeText(url);
    alert('공유 링크가 복사되었습니다!\n' + url);
  };

  return (
    <div className="screen" style={{ alignItems: 'flex-start', padding: '20px', overflowY: 'auto' }}>
      <div style={{ width: '800px', maxWidth: '98vw', margin: '0 auto' }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '16px 24px' }}>
          <div>
            <div className="login-title" style={{ fontSize: '14px', textAlign: 'left', margin: 0 }}>🫧 BUBBLE QUIZ</div>
            <div className="login-sub" style={{ textAlign: 'left', margin: 0, marginTop: '2px' }}>{user?.email}</div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                style={{ padding: '8px 16px', background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.4)', borderRadius: 'var(--r-md)', color: 'var(--purple)', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ShieldCheck size={14} /> 관리자
              </button>
            )}
            <button
              onClick={handleLogout}
              style={{ padding: '8px 16px', background: 'var(--raised)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--muted)', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <LogOut size={14} /> 로그아웃
            </button>
          </div>
        </div>

        {/* 새 게임방 만들기 버튼 */}
        <button
          className="btn-teal"
          onClick={() => setShowCreateModal(true)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}
        >
          <Plus size={18} /> 새 게임방 만들기
        </button>

        {/* 게임방 목록 */}
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--subdued)', padding: '40px' }}>로딩 중...</div>
        ) : quizSets.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--subdued)', padding: '60px 0', background: 'var(--surface)', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎮</div>
            아직 만든 게임방이 없습니다.<br />
            <span style={{ fontSize: '13px', color: 'var(--muted)' }}>문제 은행에서 문제를 선택해 게임방을 만들어 보세요!</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {quizSets.map(quiz => (
              <div key={quiz.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--txt)', fontSize: '15px', marginBottom: '4px' }}>{quiz.title}</div>
                  {quiz.question_banks && (
                    <div style={{ fontSize: '12px', color: 'var(--teal)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                      <BookOpen size={11} />
                      {quiz.question_banks.title}
                      {quiz.question_banks.subject && <span style={{ color: 'var(--muted)' }}> · #{quiz.question_banks.subject}</span>}
                    </div>
                  )}
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>방 코드: {quiz.link_code}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button onClick={() => copyLink(quiz.link_code)} title="학생 링크 복사"
                    style={{ padding: '8px 12px', background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.3)', borderRadius: 'var(--r-sm)', color: 'var(--teal)', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Copy size={14} /> 링크 복사
                  </button>
                  <button onClick={() => navigate(`/dashboard/${quiz.id}/results`)} title="결과 보기"
                    style={{ padding: '8px 12px', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 'var(--r-sm)', color: 'var(--blue)', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <BarChart2 size={14} /> 결과
                  </button>
                  <button onClick={() => deleteQuizSet(quiz.id)} title="삭제"
                    style={{ padding: '8px', background: 'var(--raised)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--red)', cursor: 'pointer' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 게임방 생성 모달 */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(6px)' }}
          onClick={e => e.target === e.currentTarget && setShowCreateModal(false)}>
          <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '32px', width: '480px', maxWidth: '95vw' }}>
            <div className="login-title" style={{ fontSize: '13px', textAlign: 'center', marginBottom: '8px' }}>🎮 새 게임방 만들기</div>
            <div className="login-sub" style={{ marginBottom: '24px' }}>문제 은행을 선택하고 게임방 이름을 정하세요.</div>

            <label className="f-label">게임방 이름</label>
            <div className="f-wrap" style={{ marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="예: 3반 사회 퀴즈"
                value={newRoomTitle}
                onChange={e => setNewRoomTitle(e.target.value)}
                autoFocus
              />
            </div>

            <label className="f-label">문제 은행 선택</label>
            {banks.length === 0 ? (
              <div style={{ padding: '16px', background: 'var(--surface)', borderRadius: 'var(--r-md)', color: 'var(--muted)', fontSize: '13px', textAlign: 'center', marginBottom: '16px' }}>
                등록된 문제 은행이 없습니다.<br />
                <span style={{ color: 'var(--teal)', cursor: 'pointer' }} onClick={() => { setShowCreateModal(false); navigate('/admin'); }}>
                  관리자 페이지에서 업로드하세요 →
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', maxHeight: '220px', overflowY: 'auto' }}>
                {banks.map(bank => (
                  <div key={bank.id}
                    onClick={() => setSelectedBankId(bank.id)}
                    style={{
                      padding: '12px 16px',
                      background: selectedBankId === bank.id ? 'rgba(45,212,191,0.12)' : 'var(--surface)',
                      border: `1px solid ${selectedBankId === bank.id ? 'rgba(45,212,191,0.5)' : 'var(--border)'}`,
                      borderRadius: 'var(--r-md)',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--txt)', fontSize: '14px' }}>{bank.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--subdued)', marginTop: '2px' }}>
                      {bank.subject && <span style={{ color: 'var(--blue)', marginRight: '8px' }}>#{bank.subject}</span>}
                      문제 {bank.question_count}개
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowCreateModal(false)}
                style={{ flex: 1, padding: '12px', background: 'var(--raised)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--subdued)', cursor: 'pointer', fontSize: '14px' }}>
                취소
              </button>
              <button onClick={createRoom} disabled={creating || !selectedBankId || !newRoomTitle.trim()}
                className="btn-teal" style={{ flex: 1, margin: 0, padding: '12px' }}>
                {creating ? '생성 중...' : '게임방 만들기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizList;
