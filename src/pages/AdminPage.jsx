import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';
import { Upload, Trash2, LogOut, Eye, ChevronDown, ChevronRight, FileSpreadsheet, Lock, Globe, Download } from 'lucide-react';
import { BUB_IMG_SRC } from '../lib/assets';

// 구글 드라이브 링크를 직접 열람 가능한 URL로 변환
function convertDriveUrl(url) {
  if (!url || !url.trim()) return '';
  const raw = url.trim();
  // 이미 thumbnail 형식이면 그대로
  if (raw.includes('drive.google.com/thumbnail')) return raw;
  // /file/d/{ID}/ 형식
  let m = raw.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w800`;
  // ?id= 또는 &id= 형식
  m = raw.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m) return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w800`;
  // 구버전 uc?export=view 형식에서 ID 추출
  m = raw.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m) return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w800`;
  // 일반 URL은 그대로
  return raw;
}

// 선택지 셀 파싱: 쉼표로 구분된 여러 선택지
function parseOptions(cell) {
  if (!cell && cell !== 0) return [];
  const str = String(cell).trim();
  if (!str) return [];
  // 쉼표로 구분
  return str.split(',').map(s => s.trim()).filter(Boolean);
}

// 정답 파싱: 쉼표로 구분 가능
function parseAnswers(cell) {
  if (!cell && cell !== 0) return [];
  const str = String(cell).trim();
  if (!str) return [];
  return str.split(',').map(s => s.trim()).filter(Boolean);
}

const AdminPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [expandedBank, setExpandedBank] = useState(null);
  const [bankQuestions, setBankQuestions] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [uploadData, setUploadData] = useState({ title: '', subject: '', isPublic: true, validRows: [] });
  const fileRef = useRef();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate('/'); return; }
      setUser(user);
      fetchBanks();
    });
  }, []);

  const fetchBanks = async () => {
    const { data } = await supabase
      .from('question_banks')
      .select('*')
      .order('created_at', { ascending: false });
    setBanks(data || []);
    setLoading(false);
  };

  const fetchBankQuestions = async (bankId) => {
    if (bankQuestions[bankId]) return; // 이미 로드됨
    const { data } = await supabase
      .from('bank_questions')
      .select('*')
      .eq('bank_id', bankId)
      .order('question_num', { ascending: true });
    setBankQuestions(prev => ({ ...prev, [bankId]: data || [] }));
  };

  const toggleExpand = async (bankId) => {
    if (expandedBank === bankId) {
      setExpandedBank(null);
    } else {
      setExpandedBank(bankId);
      await fetchBankQuestions(bankId);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';

    setUploading(true);
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

      const firstRow = rows[0];
      const hasHeader = firstRow && (
        String(firstRow[0] || '').includes('문항') || 
        String(firstRow[0] || '').toLowerCase().includes('num') ||
        String(firstRow[0] || '').toLowerCase().includes('no')
      );
      const dataRows = hasHeader ? rows.slice(1) : rows;

      const validRows = dataRows.filter(r => r && r[1] && String(r[1]).trim());

      if (validRows.length === 0) {
        alert('유효한 문제가 없습니다. 엑셀 형식을 확인하세요.\n(A:문항번호 B:문항 C:선택지 D:이미지 E:정답)');
        setUploading(false);
        return;
      }

      setUploadData({ title: '', subject: '', isPublic: true, validRows });
      setShowModal(true);
    } catch (err) {
      console.error(err);
      alert('파일 읽기 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const confirmUpload = async () => {
    if (!uploadData.title.trim()) {
      alert('문제 은행 이름을 입력해주세요.');
      return;
    }

    setUploading(true);
    setShowModal(false);
    try {
      const { data: bank, error: bankErr } = await supabase
        .from('question_banks')
        .insert([{
          title: uploadData.title,
          subject: uploadData.subject,
          is_public: uploadData.isPublic,
          uploaded_by: user.id,
          question_count: uploadData.validRows.length
        }])
        .select()
        .single();

      if (bankErr) throw bankErr;

      // 2. bank_questions 삽입
      const questions = uploadData.validRows.map(r => ({
        bank_id: bank.id,
        question_num: r[0] ? String(r[0]).trim() : '',
        question_text: String(r[1] || '').trim(),
        options: parseOptions(r[2]),
        answers: parseAnswers(r[4]),
        image_url: convertDriveUrl(r[3])
      }));

      const { error: qErr } = await supabase
        .from('bank_questions')
        .insert(questions);

      if (qErr) throw qErr;

      alert(`✅ "${uploadData.title}" 업로드 완료!\n총 ${uploadData.validRows.length}개 문제가 저장되었습니다.`);
      setBanks(prev => [bank, ...prev]);
    } catch (err) {
      console.error(err);
      alert('업로드 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['문항번호', '문항', '선택지', '이미지링크(선택)', '정답'],
      [1, '다음 중 한국의 수도는 어디인가요?', '서울, 부산, 인천, 제주', '', '서울'],
      [2, '태양계에서 가장 큰 행성은 무엇인가요?', '지구, 화성, 목성, 금성', '', '목성'],
      [3, '단답형 예시: 1+1은 무엇인가요? (선택지를 비워두면 단답형이 됩니다)', '', '', '2'],
      [4, '이 동물의 이름은 무엇인가요?', '고양이, 강아지, 사자, 호랑이', 'https://drive.google.com/uc?id=1exampleId_replace_this', '고양이']
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, '문제은행_템플릿.xlsx');
  };

  const deleteBank = async (bank) => {
    if (!window.confirm(`"${bank.title}" 문제 은행을 삭제하시겠습니까?\n이 은행을 사용하는 게임방에도 영향을 줄 수 있습니다.`)) return;
    const { error } = await supabase.from('question_banks').delete().eq('id', bank.id);
    if (!error) {
      setBanks(prev => prev.filter(b => b.id !== bank.id));
      setBankQuestions(prev => { const n = {...prev}; delete n[bank.id]; return n; });
      if (expandedBank === bank.id) setExpandedBank(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) return <div className="screen"><div style={{color:'white'}}>Loading...</div></div>;

  return (
    <div className="screen" style={{ alignItems: 'flex-start', padding: '20px', overflowY: 'auto' }}>
      <div style={{ width: '900px', maxWidth: '98vw', margin: '0 auto' }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', background: 'var(--surface-1)', border: 'none', boxShadow: 'rgba(0,0,0,0.3) 0px 8px 8px', borderRadius: 'var(--r-lg)', padding: '16px 24px' }}>
          <div>
            <div className="login-title" style={{ fontSize: '20px', textAlign: 'left', margin: 0, display: 'flex', alignItems: 'center' }}>
              <img src={BUB_IMG_SRC} alt="icon" style={{ width: '32px', height: '32px', marginRight: '12px', imageRendering: 'pixelated' }} />
              관리자 페이지
            </div>
            <div className="login-sub" style={{ textAlign: 'left', margin: 0, marginTop: '4px' }}>{user?.email}</div>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{ padding: '8px 16px', background: 'var(--surface-2)', border: 'none', borderRadius: 'var(--r-pill)', color: 'var(--ink)', cursor: 'pointer', fontSize: '14px' }}
            >
              대시보드로
            </button>
            <button
              onClick={handleLogout}
              style={{ padding: '8px 16px', background: 'var(--surface-2)', border: 'none', borderRadius: 'var(--r-pill)', color: 'var(--ink-muted)', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <LogOut size={16} /> 로그아웃
            </button>
          </div>
        </div>

        {/* 업로드 영역 */}
        <div
          onClick={() => !uploading && fileRef.current.click()}
          style={{
            background: 'var(--surface-1)',
            border: `2px dashed ${uploading ? 'var(--primary)' : 'var(--hairline-strong)'}`,
            borderRadius: 'var(--r-lg)',
            padding: '48px',
            textAlign: 'center',
            cursor: uploading ? 'not-allowed' : 'pointer',
            marginBottom: '32px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => !uploading && (e.currentTarget.style.borderColor = 'var(--primary)', e.currentTarget.style.background = 'var(--surface-1)')}
          onMouseLeave={e => !uploading && (e.currentTarget.style.borderColor = 'var(--ink-muted)', e.currentTarget.style.background = 'var(--canvas)')}
        >
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleFileUpload} />
          <div style={{ fontSize: '32px', marginBottom: '16px', color: 'var(--primary)' }}>{uploading ? '⏳' : <Upload size={32} />}</div>
          <div style={{ fontFamily: 'var(--fp)', fontSize: '14px', color: 'var(--primary)', marginBottom: '8px', fontWeight: '600' }}>
            {uploading ? '업로드 중...' : 'EXCEL / CSV 업로드'}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--ink-muted)', lineHeight: 1.5 }}>
            클릭하여 엑셀 파일을 선택하세요<br />
            <span style={{ color: 'var(--ink-subtle)', fontSize: '12px', marginTop: '8px', display: 'inline-block' }}>
              열 순서: A(문항번호) · B(문항) · C(선택지, 쉼표 구분) · D(이미지 링크) · E(정답)
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <button
            onClick={downloadTemplate}
            style={{ padding: '12px 24px', background: 'var(--surface-2)', border: '1px solid var(--primary)', borderRadius: 'var(--r-pill)', color: 'var(--primary)', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}
          >
            <Download size={18} /> 양식 템플릿 다운로드
          </button>
        </div>

        {/* 문제 은행 목록 */}
        <div style={{ fontFamily: 'var(--fp)', fontSize: '14px', color: 'var(--ink)', fontWeight: '600', marginBottom: '16px' }}>
          QUESTION BANKS ({banks.length})
        </div>

        {banks.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--ink-muted)', padding: '60px 0', background: 'var(--surface-1)', border: 'none', borderRadius: 'var(--r-lg)', boxShadow: 'rgba(0,0,0,0.3) 0px 8px 8px' }}>
            <div style={{ marginBottom: '16px', color: 'var(--ink-subtle)' }}><FileSpreadsheet size={48} style={{margin:'0 auto'}} /></div>
            아직 업로드된 문제 은행이 없습니다.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {banks.map(bank => (
              <div key={bank.id} style={{ background: 'var(--surface-1)', border: 'none', borderRadius: 'var(--r-md)', boxShadow: 'rgba(0,0,0,0.3) 0px 8px 8px', overflow: 'hidden' }}>
                {/* 은행 헤더 */}
                <div style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', gap: '16px', cursor: 'pointer', background: expandedBank === bank.id ? 'var(--surface-2)' : 'var(--surface-1)' }}
                  onClick={() => toggleExpand(bank.id)}>
                  {expandedBank === bank.id ? <ChevronDown size={20} color="var(--primary)" /> : <ChevronRight size={20} color="var(--ink-muted)" />}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--ink)', fontSize: '16px' }}>{bank.title}</div>
                      {bank.is_public === false ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', background: 'rgba(255,255,255,0.1)', color: 'var(--ink-muted)', padding: '2px 8px', borderRadius: 'var(--r-pill)' }}>
                          <Lock size={12} /> 비공개
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', background: 'rgba(30,215,96,0.1)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 'var(--r-pill)' }}>
                          <Globe size={12} /> 공유됨
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--ink-muted)', marginTop: '4px' }}>
                      {bank.subject && <span style={{ marginRight: '16px', color: 'var(--ink)' }}>#{bank.subject}</span>}
                      <span>문제 {bank.question_count}개</span>
                      <span style={{ marginLeft: '16px' }}>업로드: {new Date(bank.created_at).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); deleteBank(bank); }}
                    style={{ padding: '8px', background: 'transparent', border: 'none', color: 'var(--semantic-error)', cursor: 'pointer' }}
                    title="삭제"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                {/* 문제 목록 (펼쳐졌을 때) */}
                {expandedBank === bank.id && (
                  <div style={{ borderTop: '1px solid var(--hairline)', padding: '24px', background: 'var(--surface-1)' }}>
                    {!bankQuestions[bank.id] ? (
                      <div style={{ color: 'var(--ink-muted)', fontSize: '14px' }}>로딩 중...</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                        {bankQuestions[bank.id].map((q, idx) => (
                          <div key={q.id} style={{ background: 'var(--surface-2)', padding: '16px', borderRadius: 'var(--r-sm)', border: 'none', fontSize: '14px' }}>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                              <span style={{ fontFamily: 'var(--fp)', fontSize: '12px', color: 'var(--primary)', flexShrink: 0, marginTop: '2px', fontWeight: '600' }}>{q.question_num || idx + 1}</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ color: 'var(--ink)', lineHeight: 1.5, fontWeight: '400' }}>{q.question_text}</div>
                                {q.image_url && (
                                  <div style={{ marginTop: '12px' }}>
                                    <img src={q.image_url} alt="문제 이미지"
                                      style={{ maxHeight: '120px', maxWidth: '200px', objectFit: 'contain', borderRadius: 'var(--r-sm)', border: 'none' }}
                                      onError={e => { e.target.style.display = 'none'; }}
                                    />
                                  </div>
                                )}
                                {q.options && q.options.length > 0 && (
                                  <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {q.options.map((opt, i) => (
                                      <span key={i} style={{ padding: '4px 12px', background: 'var(--surface-3)', borderRadius: 'var(--r-pill)', fontSize: '12px', color: 'var(--ink)' }}>
                                        {i + 1}. {opt}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <span style={{ padding: '4px 12px', background: 'var(--surface-3)', borderRadius: 'var(--r-pill)', fontSize: '12px', color: 'var(--semantic-success)', fontWeight: '600' }}>
                                  {Array.isArray(q.answers) ? q.answers.join(', ') : q.answers}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 업로드 설정 모달 */}
      {showModal && (
        <div className="c-overlay show" style={{ zIndex: 1000 }}>
          <div className="qz-card qz-body" style={{ width: '480px', transform: 'none' }}>
            <div style={{ fontFamily: 'var(--ft)', fontSize: '24px', color: 'var(--ink)', fontWeight: 'bold', marginBottom: '24px' }}>
              문제 등록
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label className="f-label">주제(단원)</label>
              <div className="f-wrap">
                <input
                  type="text"
                  value={uploadData.title}
                  onChange={e => setUploadData({ ...uploadData, title: e.target.value })}
                />
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label className="f-label">공유 설정</label>
              <div style={{ display: 'flex', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--ink)' }}>
                  <input
                    type="radio"
                    checked={uploadData.isPublic === true}
                    onChange={() => setUploadData({ ...uploadData, isPublic: true })}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <Globe size={16} /> 전체 공개 (공유)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--ink)' }}>
                  <input
                    type="radio"
                    checked={uploadData.isPublic === false}
                    onChange={() => setUploadData({ ...uploadData, isPublic: false })}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <Lock size={16} /> 나만 보기 (비공개)
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn-sub"
                onClick={() => setShowModal(false)}
                style={{ flex: 1 }}
              >
                취소
              </button>
              <button
                className="btn-teal"
                onClick={confirmUpload}
                style={{ flex: 1, margin: 0 }}
                disabled={uploading}
              >
                {uploading ? '저장 중...' : '업로드 완료'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
