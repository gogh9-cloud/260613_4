-- ============================================================
-- V6 추가 스키마: 문제 은행 삭제 시 게임방 오류 해결
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

-- 기존 외래 키 제약 조건 제거
ALTER TABLE quiz_sets DROP CONSTRAINT IF EXISTS quiz_sets_bank_id_fkey;

-- 삭제 시 연결된 게임방의 bank_id를 비워두도록(NULL) 외래 키 재생성
-- 이렇게 하면 문제 은행을 삭제해도 에러가 발생하지 않습니다.
ALTER TABLE quiz_sets
ADD CONSTRAINT quiz_sets_bank_id_fkey
FOREIGN KEY (bank_id)
REFERENCES question_banks(id)
ON DELETE SET NULL;
