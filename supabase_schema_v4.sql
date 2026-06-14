-- ============================================================
-- V4 추가 스키마: 문제 은행 게시자 이메일 저장
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

-- 1. question_banks 테이블에 uploader_email 컬럼 추가
ALTER TABLE question_banks ADD COLUMN IF NOT EXISTS uploader_email TEXT;
