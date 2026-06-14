import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Download } from 'lucide-react';

const Results = ({ user }) => {
  const { quizSetId } = useParams();
  const navigate = useNavigate();
  const [quizSet, setQuizSet] = useState(null);
  const [students, setStudents] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [quizSetId]);

  const fetchResults = async () => {
    const [setRes, stuRes] = await Promise.all([
      supabase.from('quiz_sets').select('*').eq('id', quizSetId).single(),
      supabase.from('students').select('*, student_logs(*)').eq('quiz_set_id', quizSetId).order('ban', { ascending: true }).order('num', { ascending: true })
    ]);
    if (setRes.data) {
      setQuizSet(setRes.data);
      if (setRes.data.bank_id) {
        const { data: qData } = await supabase.from('bank_questions').select('*').eq('bank_id', setRes.data.bank_id);
        setQuestions(qData || []);
      } else {
        const { data: qData } = await supabase.from('questions').select('*').eq('quiz_set_id', setRes.data.id);
        setQuestions(qData || []);
      }
    }
    if (stuRes.data) setStudents(stuRes.data);
    setLoading(false);
  };

  const downloadCSV = () => {
    const header = '반,번호,이름,총점,틀린 문제,최종접속';
    const rows = students.map(s => {
      const wrongLogs = s.student_logs?.filter(log => !log.is_correct) || [];
      const wrongQuestions = wrongLogs.map(log => {
        const q = questions.find(q => q.id === log.question_id);
        return q ? (q.question_num ? `${q.question_num}번` : q.question_text) : '알 수 없음';
      }).join(', ');
      
      return `${s.ban},${s.num},"${s.name}",${s.total_score},"${wrongQuestions}","${new Date(s.last_accessed).toLocaleString('ko-KR')}"`
    });
    const csv = '\uFEFF' + [header, ...rows].join('\n'); // BOM for Korean Excel
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${quizSet?.title || 'results'}_결과.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="screen"><div style={{color:'white'}}>Loading...</div></div>;

  const rankColors = ['#f5c842', '#8fa3c0', '#cd7f32'];

  return (
    <div className="screen dashboard-screen" style={{ overflowY: 'auto', alignItems: 'flex-start', paddingTop: '24px', background: 'var(--surface-1)' }}>
      <div className="login-card" style={{ width: '900px', maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--canvas)', border: '1px solid var(--hairline)', borderRadius: '0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <button onClick={() => navigate('/dashboard')} style={{ background: 'transparent', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeft size={20} /> 대시보드
          </button>
          <h2 className="login-title" style={{ fontSize: '24px', margin: 0, fontWeight: '400' }}>{quizSet?.title} - 결과</h2>
          <button className="btn-teal" onClick={downloadCSV} style={{ width: 'auto', padding: '8px 16px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={16} /> CSV 다운로드
          </button>
        </div>

        {students.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--ink-muted)', padding: '64px 0', border: '1px solid var(--hairline)' }}>아직 참여한 학생이 없습니다.</div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--hairline)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--surface-2)' }}>
                  <th style={thStyle}>반</th>
                  <th style={thStyle}>번호</th>
                  <th style={thStyle}>이름</th>
                  <th style={thStyle}>총점</th>
                  <th style={thStyle}>틀린 문제</th>
                  <th style={thStyle}>최종 접속</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, idx) => {
                  const wrongLogs = s.student_logs?.filter(log => !log.is_correct) || [];
                  const wrongQuestions = wrongLogs.map(log => {
                    const q = questions.find(q => q.id === log.question_id);
                    return q ? (q.question_num ? `${q.question_num}번` : q.question_text.substring(0, 10) + '...') : '알 수 없음';
                  }).join(', ');

                  return (
                    <tr key={s.id} style={{ background: idx % 2 === 0 ? 'var(--canvas)' : 'var(--surface-1)', borderBottom: '1px solid var(--hairline)' }}>
                      <td style={tdStyle}>{s.ban}</td>
                      <td style={tdStyle}>{s.num}</td>
                      <td style={{ ...tdStyle, fontWeight: '600', color: 'var(--ink)' }}>{s.name}</td>
                      <td style={{ ...tdStyle, fontWeight: '600', color: 'var(--ink)', fontSize: '16px' }}>{s.total_score}점</td>
                      <td style={{ ...tdStyle, fontSize: '14px', color: 'var(--semantic-error)' }}>{wrongQuestions || '-'}</td>
                      <td style={{ ...tdStyle, fontSize: '14px', color: 'var(--ink-subtle)' }}>{new Date(s.last_accessed).toLocaleString('ko-KR')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: '24px', padding: '16px', background: 'var(--surface-1)', border: '1px solid var(--hairline)', borderRadius: '0', fontSize: '14px', color: 'var(--ink-muted)', display: 'flex', gap: '24px' }}>
          <span>총 참여자: <strong style={{ color: 'var(--ink)' }}>{students.length}명</strong></span>
          {students.length > 0 && (
            <>
              <span>평균 점수: <strong style={{ color: 'var(--primary)' }}>{Math.round(students.reduce((a, s) => a + s.total_score, 0) / students.length)}점</strong></span>
              <span>최고 점수: <strong style={{ color: 'var(--semantic-warning)' }}>{students[0]?.total_score}점</strong></span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const thStyle = {
  padding: '12px 16px', textAlign: 'left', fontSize: '14px', 
  fontWeight: '600', color: 'var(--ink)', borderBottom: '1px solid var(--hairline-strong)'
};
const tdStyle = {
  padding: '12px 16px', textAlign: 'left', fontSize: '14px', color: 'var(--ink-muted)'
};

export default Results;
