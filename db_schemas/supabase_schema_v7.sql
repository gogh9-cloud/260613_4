-- ============================================================
-- V7 추가 스키마: 퀴즈 세트(게임방)에 게임 종류(game_type) 컬럼 추가
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

ALTER TABLE quiz_sets ADD COLUMN IF NOT EXISTS game_type TEXT DEFAULT 'bubble';
