-- ============================================================
-- V3 추가 스키마: 문제 은행 공유/비공개 설정
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

-- 1. question_banks 테이블에 is_public 컬럼 추가 (기존 데이터는 기본적으로 모두 공유로 설정)
ALTER TABLE question_banks ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- 2. 기존 "모든 로그인 사용자가 문제 은행 목록 조회 가능" 정책을 삭제
DROP POLICY IF EXISTS "Anyone can read question banks" ON question_banks;

-- 3. 새로운 정책 생성: is_public이 true이거나, 자신이 업로드한 은행만 조회 가능
CREATE POLICY "Anyone can read question banks"
ON question_banks FOR SELECT
USING (is_public = true OR auth.uid() = uploaded_by);
