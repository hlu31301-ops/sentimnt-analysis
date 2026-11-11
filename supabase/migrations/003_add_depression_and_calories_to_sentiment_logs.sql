-- ============================================================================
-- 마이그레이션 번호: 003
-- 파일명: 003_add_depression_and_calories_to_sentiment_logs.sql
-- 설명: sentiment_logs 테이블에 우울감 지수(depression_level) 및 음식 칼로리 분석 컬럼 추가
-- 작성일: 2026-11-10
-- ============================================================================

DO $$ 
BEGIN 
    -- 1. [depression_level] 우울감 지수 컬럼 추가 (0 ~ 100 사이 정수)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sentiment_logs' AND column_name = 'depression_level'
    ) THEN 
        ALTER TABLE sentiment_logs 
        ADD COLUMN depression_level INTEGER DEFAULT 0 
        CHECK (depression_level >= 0 AND depression_level <= 100);
    END IF;

    -- 2. [food_detected] 글에서 감지된 음식 명칭 (예: "치킨 반 마리, 맥주 500ml")
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sentiment_logs' AND column_name = 'food_detected'
    ) THEN 
        ALTER TABLE sentiment_logs 
        ADD COLUMN food_detected TEXT DEFAULT NULL;
    END IF;

    -- 3. [calories_estimated] 추정 칼로리 수치 (kcal 단위, 0 이상의 정수)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sentiment_logs' AND column_name = 'calories_estimated'
    ) THEN 
        ALTER TABLE sentiment_logs 
        ADD COLUMN calories_estimated INTEGER DEFAULT 0;
    END IF;
END $$;

-- 4. 컬럼 설명(주석) 추가
COMMENT ON COLUMN sentiment_logs.depression_level IS 'AI가 분석한 우울감/무기력 지수 백분율 (0-100)';
COMMENT ON COLUMN sentiment_logs.food_detected IS '텍스트에서 식별된 음식/식단 항목';
COMMENT ON COLUMN sentiment_logs.calories_estimated IS '식별된 음식의 AI 추정 섭취 칼로리 (kcal)';

