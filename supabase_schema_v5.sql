-- ============================================================
-- V5 추가 스키마: 문제 은행 관리 권한(RLS) 수정
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

-- 기존 RLS 정책 삭제
DROP POLICY IF EXISTS "Admins can manage question banks" ON question_banks;
DROP POLICY IF EXISTS "Admins can manage bank questions" ON bank_questions;

-- 문제 은행 RLS 재설정 (작성자 또는 특정 관리자 이메일)
CREATE POLICY "Users can manage question banks"
ON question_banks FOR ALL
USING (
  auth.uid() = uploaded_by 
  OR auth.jwt()->>'email' = 'gogh9@susaek.sen.es.kr'
);

-- 문제 은행 문항 RLS 재설정
CREATE POLICY "Users can manage bank questions"
ON bank_questions FOR ALL
USING (
  bank_id IN (SELECT id FROM question_banks WHERE uploaded_by = auth.uid())
  OR auth.jwt()->>'email' = 'gogh9@susaek.sen.es.kr'
);
