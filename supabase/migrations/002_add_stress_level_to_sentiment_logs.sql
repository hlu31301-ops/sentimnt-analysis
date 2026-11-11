-- Supabase SQL Editor에서 실행할 쿼리
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sentiment_logs' 
        AND column_name = 'stress_level'
    ) THEN 
        ALTER TABLE sentiment_logs 
        ADD COLUMN stress_level INTEGER DEFAULT 0 
        CHECK (stress_level >= 0 AND stress_level <= 100);
    END IF;
END $$;

COMMENT ON COLUMN sentiment_logs.stress_level IS 'AI가 진단한 사용자의 스트레스 지수 백분율 (0-100)';   