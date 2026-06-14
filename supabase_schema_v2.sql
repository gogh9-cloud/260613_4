-- ============================================================
-- V2 추가 스키마: 관리자용 문제 은행 시스템
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

-- 1. question_banks (관리자가 업로드한 문제 은행)
CREATE TABLE question_banks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT,
  description TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  question_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. bank_questions (문제 은행에 속한 문제들)
CREATE TABLE bank_questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  bank_id UUID REFERENCES question_banks(id) ON DELETE CASCADE,
  question_num TEXT,
  question_text TEXT NOT NULL,
  options JSONB DEFAULT '[]'::jsonb,
  answers JSONB DEFAULT '[]'::jsonb,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. quiz_sets에 bank_id 컬럼 추가 (기존 테이블에)
ALTER TABLE quiz_sets ADD COLUMN IF NOT EXISTS bank_id UUID REFERENCES question_banks(id);

-- RLS 설정
ALTER TABLE question_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_questions ENABLE ROW LEVEL SECURITY;

-- 관리자만 문제 은행 생성/수정/삭제
CREATE POLICY "Admins can manage question banks"
ON question_banks FOR ALL
USING (auth.uid() = uploaded_by);

-- 모든 로그인 사용자가 문제 은행 목록 조회 가능
CREATE POLICY "Anyone can read question banks"
ON question_banks FOR SELECT
USING (true);

-- 관리자만 bank_questions 수정
CREATE POLICY "Admins can manage bank questions"
ON bank_questions FOR ALL
USING (
  bank_id IN (SELECT id FROM question_banks WHERE uploaded_by = auth.uid())
);

-- 모든 사용자가 bank_questions 읽기 가능 (게임 중 문제 로딩)
CREATE POLICY "Anyone can read bank questions"
ON bank_questions FOR SELECT
USING (true);
