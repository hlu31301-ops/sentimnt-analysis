/**
 * ==============================================================================
 * MoodLens 감성, 스트레스, 우울감 및 식단 칼로리 통합 분석 백엔드 API
 * 파일명: api/analyze.js
 * 기술 스택: Node.js (CommonJS), OpenAI SDK, Supabase JS Client
 * 역할:
 *   1. 클라이언트가 전송한 텍스트의 유효성 검사 (빈 값, 글자 수 제한 등)
 *   2. OpenAI API(gpt-4o-mini)에 요청하여:
 *      - 감성 상태 & 확신도 & 분석 이유
 *      - 스트레스 지수 & 케어 조언
 *      - 우울감 지수 & 상태 & 위로 조언
 *      - 언급된 음식 식별 & 섭취 칼로리(kcal) 추정 & 영양 팁
 *   3. Supabase 데이터베이스(sentiment_logs 테이블)에 안전한 저장 및 에러 방어
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
 * 감성, 스트레스, 우울감, 칼로리 분석 처리 메인 핸들러 함수
 * 
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 */
async function analyzeHandler(req, res) {
  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'POST 요청만 지원합니다.'
    });
  }

  try {
    // --------------------------------------------------------------------------
    // [단계 1] 클라이언트 요청 데이터 추출 및 유효성 검사
    // --------------------------------------------------------------------------
    const { text } = req.body || {};

    // 1.1 빈 값 검사
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({
        error: 'Bad Request',
        message: '분석할 텍스트가 비어 있습니다.'
      });
    }

    // 1.2 글자 수 초과 검사 (최대 1,000자 제한)
    const trimmedText = text.trim();
    if (trimmedText.length > 1000) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '분석 텍스트는 최대 1,000자까지 입력 가능합니다.'
      });
    }

    // --------------------------------------------------------------------------
    // [단계 2] OpenAI API 키 등록 여부 검증
    // --------------------------------------------------------------------------
    if (!openai) {
      return res.status(500).json({
        error: 'Configuration Error',
        message: '.env 파일에 유효한 OPENAI_API_KEY가 설정되지 않았습니다. 관리자 설정을 확인해주세요.'
      });
    }

    // --------------------------------------------------------------------------
    // [단계 3] OpenAI API를 통한 복합 분석 수행 (JSON 모드)
    // --------------------------------------------------------------------------
    const systemPrompt = `
당신은 사람들의 감정과 심리 상태(스트레스, 우울감), 그리고 식습관/섭취 칼로리를 종합적으로 분석하는 전문 웰니스 AI 코치입니다.
사용자가 제공한 텍스트를 읽고, 아래 JSON 규격에 맞추어 순수 JSON 객체로만 응답하세요.

분석 및 응답 규칙:
1. "sentiment": 반드시 "긍정", "부정", "중립" 세 단어 중 하나를 선택하세요.
2. "confidence": 감정 판단 확신도를 0~100 사이의 정수로 기재하세요. (예: 95)
3. "reason": 감정 판단 이유를 정중하고 자연스러운 한국어로 1~2문장으로 설명하세요.
4. "stress_level": 텍스트에 나타난 심리적 압박감/긴장감/스트레스 정도를 0~100 사이의 정수로 진단하세요.
5. "stress_message": 스트레스 완화를 위한 다정한 맞춤 조언을 1문장으로 작성하세요.
6. "depression_level": 텍스트 속 무기력감, 슬픔, 공허함, 우울감 정도를 0~100 사이의 정수로 진단하세요.
   - 0~20: 활기차고 평온함 (맑음)
   - 21~50: 가벼운 울적함/가라앉음
   - 51~75: 뚜렷한 무기력 및 슬픔 (주의 필요)
   - 76~100: 깊은 우울감 및 고립감 (심층 케어 권장)
7. "depression_status": 우울감 상태를 "맑음", "가벼운 울적함", "주의 필요", "심층 케어 권장" 중 하나로 표기하세요.
8. "depression_message": 우울감을 보듬어주는 따뜻하고 공감 어린 한 줄 위로를 작성하세요.
9. "food_detected": 텍스트에서 언급된 음식/간식/음료를 식별하여 쉼표로 나열하세요. (음식 언급이 전혀 없으면 "언급된 음식 없음"으로 기재)
10. "calories_estimated": 식별된 음식들의 총 추정 칼로리를 정수(kcal 단위)로 계산하세요. (음식 언급이 없으면 0)
11. "nutrition_tip": 식습관에 관한 건강하고 유익한 한 줄 영양 팁을 작성하세요. (음식 언급이 없으면 "식사나 간식 이야기를 함께 적어주시면 영양과 칼로리를 분석해 드려요!"로 기재)

JSON 출력 형식 예시:
{
  "sentiment": "긍정",
  "confidence": 92,
  "reason": "맛있는 음식을 즐기며 느낀 행복감이 문장 전체에 잘 드러나 있습니다.",
  "stress_level": 15,
  "stress_message": "마음이 매우 평온하고 여유로운 상태입니다.",
  "depression_level": 10,
  "depression_status": "맑음",
  "depression_message": "마음속에 밝고 따뜻한 햇살이 가득한 하루예요.",
  "food_detected": "양념치킨 반 마리, 맥주 500ml",
  "calories_estimated": 1150,
  "nutrition_tip": "맛있는 야식으로 힐링하셨네요! 내일 아침에는 따뜻한 물 한 잔과 가벼운 채소 위주 식단을 추천해요."
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
    
    // 스트레스
    const finalStressLevel = Math.min(100, Math.max(0, parseInt(analysisResult.stress_level, 10) || 0));
    const finalStressMessage = analysisResult.stress_message || '편안한 마음으로 하루를 마무리해 보세요.';

    // 우울감
    const finalDepressionLevel = Math.min(100, Math.max(0, parseInt(analysisResult.depression_level, 10) || 0));
    const finalDepressionStatus = analysisResult.depression_status || (finalDepressionLevel <= 20 ? '맑음' : finalDepressionLevel <= 50 ? '가벼운 울적함' : '주의 필요');
    const finalDepressionMessage = analysisResult.depression_message || '소중한 당신의 오늘 하루를 진심으로 응원합니다.';

    // 음식 및 칼로리
    const finalFoodDetected = analysisResult.food_detected || '언급된 음식 없음';
    const finalCalories = Math.max(0, parseInt(analysisResult.calories_estimated, 10) || 0);
    const finalNutritionTip = analysisResult.nutrition_tip || '건강하고 균형 잡힌 식사로 몸과 마음을 든든하게 채워보세요.';

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
      nutrition_tip: finalNutritionTip
    };

    // --------------------------------------------------------------------------
    // [단계 4] Supabase 데이터베이스에 분석 이력 저장 (단계별 안전 Fallback)
    // --------------------------------------------------------------------------
    if (supabase) {
      try {
        // 1차 시도: 전체 신규 컬럼(우울감, 음식, 칼로리) 포함 저장
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
          console.warn('[Supabase 안내]: 신규 컬럼 포함 저장 중 에러, 기본/스트레스 컬럼으로 안전 저장합니다:', fullError.message);
          // 2차 시도: 기본 컬럼 저장 (DB 테이블이 구버전이어도 사용자 응답은 안전 보장)
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
        } else {
          console.log('[Supabase 저장 성공]: sentiment_logs 테이블에 전체 웰니스 기록 저장 완료');
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
