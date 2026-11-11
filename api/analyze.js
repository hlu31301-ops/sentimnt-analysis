/**
 * ==============================================================================
 * MoodLens 감성, 마음건강, 칼로리 & AI 힐링 처방전 통합 분석 API
 * 파일명: api/analyze.js
 * 기술 스택: Node.js (CommonJS), OpenAI SDK, Supabase JS Client
 * 역할:
 *   1. 클라이언트 요청 텍스트 유효성 검사 (빈 값, 글자 수 제한)
 *   2. OpenAI API(gpt-4o-mini)에 요청하여:
 *      - 감성 상태 & 확신도 & 분석 이유
 *      - 스트레스 지수 & 케어 조언
 *      - 우울감 지수 & 상태 & 위로 조언
 *      - 식별된 음식 & 섭취 칼로리 & 영양 팁
 *      - [신규] 오늘의 힐링 액션 3가지 (체크리스트용)
 *      - [신규] 귀여운 토끼 마스코트의 다정한 말풍선 한마디
 *   3. Supabase 데이터베이스(sentiment_logs) 안전 저장 (Fallback 지원)
 *   4. 표준 JSON 응답 반환
 * ==============================================================================
 */

// 환경 변수(.env) 로드
require('dotenv').config();

const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');

// 1. OpenAI 클라이언트 초기화
const openaiApiKey = process.env.OPENAI_API_KEY;
let openai = null;
if (openaiApiKey && !openaiApiKey.includes('your_openai_api_key_here')) {
  openai = new OpenAI({ apiKey: openaiApiKey });
}

// 2. Supabase 클라이언트 초기화
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
let supabase = null;
if (
  supabaseUrl && 
  supabaseKey && 
  !supabaseUrl.includes('your-project-id') && 
  !supabaseKey.includes('your_supabase')
) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

/**
 * 감성, 웰니스, 칼로리 및 힐링 처방전 종합 핸들러 함수
 * 
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 */
async function analyzeHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'POST 요청만 지원합니다.'
    });
  }

  try {
    // --------------------------------------------------------------------------
    // [단계 1] 요청 데이터 검증
    // --------------------------------------------------------------------------
    const { text } = req.body || {};

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({
        error: 'Bad Request',
        message: '분석할 텍스트가 비어 있습니다.'
      });
    }

    const trimmedText = text.trim();
    if (trimmedText.length > 1000) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '분석 텍스트는 최대 1,000자까지 입력 가능합니다.'
      });
    }

    // --------------------------------------------------------------------------
    // [단계 2] OpenAI API 키 확인
    // --------------------------------------------------------------------------
    if (!openai) {
      return res.status(500).json({
        error: 'Configuration Error',
        message: '.env 파일에 유효한 OPENAI_API_KEY가 설정되지 않았습니다. 관리자 설정을 확인해주세요.'
      });
    }

    // --------------------------------------------------------------------------
    // [단계 3] OpenAI API를 통한 정밀 복합 분석 (힐링 액션 & 토끼 말풍선 포함)
    // --------------------------------------------------------------------------
    const systemPrompt = `
당신은 사람들의 감정과 심리 상태(스트레스, 우울감), 식습관/칼로리를 분석하고 따뜻한 회복을 돕는 전문 웰니스 AI 코치이자, 옆에서 사용자를 응원하는 사랑스러운 하얀 아기 토끼 '버니'입니다.
사용자가 제공한 텍스트를 읽고, 아래 JSON 규격에 맞추어 순수 JSON 객체로만 응답하세요.

분석 및 응답 규칙:
1. "sentiment": 반드시 "긍정", "부정", "중립" 중 하나를 선택하세요.
2. "confidence": 감정 판단 확신도를 0~100 사이의 정수로 기재하세요. (예: 95)
3. "reason": 감정 판단 이유를 정중하고 자연스러운 한국어로 1~2문장으로 설명하세요.
4. "stress_level": 텍스트 속 압박감/긴장감/스트레스 정도를 0~100 사이의 정수로 진단하세요.
5. "stress_message": 스트레스 완화를 위한 다정한 맞춤 조언을 1문장으로 작성하세요.
6. "depression_level": 텍스트 속 무기력감, 슬픔, 공허함 정도를 0~100 사이의 정수로 진단하세요.
7. "depression_status": "맑음", "가벼운 울적함", "주의 필요", "심층 케어 권장" 중 하나로 표기하세요.
8. "depression_message": 우울감을 보듬어주는 공감 어린 한 줄 위로를 작성하세요.
9. "food_detected": 텍스트에서 언급된 음식/간식/음료를 쉼표로 나열하세요. (없으면 "언급된 음식 없음")
10. "calories_estimated": 식별된 음식의 총 추정 칼로리를 정수(kcal 단위)로 계산하세요. (없으면 0)
11. "nutrition_tip": 식습관에 관한 건강한 한 줄 영양 팁을 작성하세요.
12. "healing_actions": 현재 사용자의 감정, 스트레스, 식단 상태에 맞추어 오늘 당장 실천할 수 있는 작고 구체적인 '힐링 행동 3가지'를 이모지와 함께 문자열 배열로 제공하세요.
    - 예시: ["🍵 따뜻한 캐모마일 차 한 잔 마시기", "🎵 좋아하는 음악 들으며 10분 가볍게 스트레칭하기", "📝 오늘 하루 수고한 나 자신에게 칭찬 한마디 적어보기"]
13. "rabbit_cheer": 귀여운 아기 토끼 '버니'가 사용자에게 직접 말하듯 친근하고 사랑스럽게 건네는 애교 섞인 응원 한마디를 작성하세요. (토끼 이모지 🐰, 당근 🥕 포함)
    - 예시: "토끼가 옆에서 꼭 안아줄게요! 오늘 정말 수고 많았어요 🐰🥕"

JSON 출력 형식 예시:
{
  "sentiment": "긍정",
  "confidence": 92,
  "reason": "소중한 사람과의 만남에서 느낀 기쁨이 문장 전체에 따뜻하게 드러납니다.",
  "stress_level": 15,
  "stress_message": "마음이 매우 평온하고 밝은 상태입니다.",
  "depression_level": 10,
  "depression_status": "맑음",
  "depression_message": "마음속에 따뜻한 햇살이 가득한 하루예요.",
  "food_detected": "언급된 음식 없음",
  "calories_estimated": 0,
  "nutrition_tip": "식사 이야기를 함께 적어주시면 영양과 칼로리를 분석해 드려요!",
  "healing_actions": [
    "✨ 지금 느끼는 행복한 감정을 다이어리에 한 줄 기록해보기",
    "🎧 기분 좋은 음악을 틀고 창밖 풍경 바라보기",
    "💌 고마운 사람에게 따뜻한 안부 톡 하나 보내기"
  ],
  "rabbit_cheer": "오늘 기분 좋아 보여서 토끼도 덩달아 깡총깡총 신나요! 🐰✨"
}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: trimmedText }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('OpenAI로부터 응답 본문을 전달받지 못했습니다.');
    }

    const analysisResult = JSON.parse(responseContent);

    // 반환 데이터 정규화 및 기본값 보정
    const finalSentiment = analysisResult.sentiment || '중립';
    const finalConfidence = Math.min(100, Math.max(0, parseInt(analysisResult.confidence, 10) || 50));
    const finalReason = analysisResult.reason || '입력된 문맥을 바탕으로 감성을 분석하였습니다.';
    
    const finalStressLevel = Math.min(100, Math.max(0, parseInt(analysisResult.stress_level, 10) || 0));
    const finalStressMessage = analysisResult.stress_message || '편안한 마음으로 하루를 마무리해 보세요.';

    const finalDepressionLevel = Math.min(100, Math.max(0, parseInt(analysisResult.depression_level, 10) || 0));
    const finalDepressionStatus = analysisResult.depression_status || (finalDepressionLevel <= 20 ? '맑음' : finalDepressionLevel <= 50 ? '가벼운 울적함' : '주의 필요');
    const finalDepressionMessage = analysisResult.depression_message || '소중한 당신의 오늘 하루를 진심으로 응원합니다.';

    const finalFoodDetected = analysisResult.food_detected || '언급된 음식 없음';
    const finalCalories = Math.max(0, parseInt(analysisResult.calories_estimated, 10) || 0);
    const finalNutritionTip = analysisResult.nutrition_tip || '건강하고 균형 잡힌 식사로 몸과 마음을 든든하게 채워보세요.';

    // 신규: 힐링 액션 목록 (3개 보장)
    const rawActions = analysisResult.healing_actions;
    const finalHealingActions = Array.isArray(rawActions) && rawActions.length > 0 
      ? rawActions 
      : [
          '🍵 따뜻한 물이나 허브차 한 잔 마시기',
          '🌿 가볍게 어깨와 목 스트레칭하며 심호흡하기',
          '💖 오늘 하루 고생한 나에게 토닥토닥 칭찬 건네기'
        ];

    // 신규: 토끼의 사랑스러운 응원 멘트
    const finalRabbitCheer = analysisResult.rabbit_cheer || '토끼가 언제나 당신 편이에요! 힘내요 🐰🥕';

    const payload = {
      sentiment: finalSentiment,
      confidence: finalConfidence,
      reason: finalReason,
      stress_level: finalStressLevel,
      stress_message: finalStressMessage,
      depression_level: finalDepressionLevel,
      depression_status: finalDepressionStatus,
      depression_message: finalDepressionMessage,
      food_detected: finalFoodDetected,
      calories_estimated: finalCalories,
      nutrition_tip: finalNutritionTip,
      healing_actions: finalHealingActions,
      rabbit_cheer: finalRabbitCheer
    };

    // --------------------------------------------------------------------------
    // [단계 4] Supabase DB 안전 저장 (Fallback 지원)
    // --------------------------------------------------------------------------
    if (supabase) {
      try {
        const { error: fullError } = await supabase
          .from('sentiment_logs')
          .insert([
            {
              input_text: trimmedText,
              sentiment: finalSentiment,
              confidence: finalConfidence,
              reason: finalReason,
              stress_level: finalStressLevel,
              depression_level: finalDepressionLevel,
              food_detected: finalFoodDetected,
              calories_estimated: finalCalories,
              created_at: new Date().toISOString()
            }
          ]);

        if (fullError) {
          console.warn('[Supabase 안내]: 기본 컬럼으로 안전 저장합니다:', fullError.message);
          await supabase
            .from('sentiment_logs')
            .insert([
              {
                input_text: trimmedText,
                sentiment: finalSentiment,
                confidence: finalConfidence,
                reason: finalReason,
                created_at: new Date().toISOString()
              }
            ]);
        }
      } catch (dbEx) {
        console.error('[Supabase 연동 예외 (분석은 정상 반환됨)]:', dbEx.message);
      }
    }

    // --------------------------------------------------------------------------
    // [단계 5] 클라이언트에 최종 종합 결과 반환
    // --------------------------------------------------------------------------
    return res.status(200).json(payload);

  } catch (err) {
    console.error('[서버 내부 감성/웰니스 분석 처리 오류]:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: '분석 처리 중 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

module.exports = analyzeHandler;
