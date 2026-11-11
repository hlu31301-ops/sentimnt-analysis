/**
 * ==============================================================================
 * MoodLens (AI 감성, 마음건강 & 칼로리 웰니스 케어) - 프론트엔드 비즈니스 로직
 * 파일명: public/app.js
 * 기술 스택: Vanilla JavaScript (순수 자바스크립트)
 * 설명: 사용자의 입력을 검증하고, 백엔드 API(/api/analyze)를 호출하여
 *       감성, 스트레스, 우울감 지수 및 섭취 칼로리를 화면에 시각적으로 렌더링합니다.
 * ==============================================================================
 */

// DOM이 완전히 로드된 후 스크립트 실행
document.addEventListener('DOMContentLoaded', () => {

  // --------------------------------------------------------------------------
  // 1. 필요한 HTML DOM 요소 선택
  // --------------------------------------------------------------------------
  const textInput = document.getElementById('text-input');           // 텍스트 입력 textarea
  const currentLength = document.getElementById('current-length');   // 현재 글자 수 표시 span
  const analyzeBtn = document.getElementById('analyze-btn');         // 분석하기 버튼
  const btnText = document.getElementById('btn-text');               // 버튼 내부 텍스트 span
  const sampleChips = document.querySelectorAll('.btn-sample-chip'); // 예시 칩 버튼들
  
  const errorBox = document.getElementById('error-box');             // 오류 알림 컨테이너
  const errorMessage = document.getElementById('error-message');     // 오류 문구 span

  const resultCard = document.getElementById('result-card');         // 결과 카드 컨테이너
  
  // 1) 감성 결과 요소
  const sentimentBadge = document.getElementById('sentiment-badge');
  const badgeIcon = document.getElementById('badge-icon');
  const badgeText = document.getElementById('badge-text');
  const confidenceText = document.getElementById('confidence-text');
  const progressFill = document.getElementById('progress-fill');

  // 2) 스트레스 결과 요소
  const stressBadge = document.getElementById('stress-badge');
  const stressLevelText = document.getElementById('stress-level-text');
  const stressFill = document.getElementById('stress-fill');
  const stressMessage = document.getElementById('stress-message');

  // 3) [신규] 우울감 결과 요소
  const depressionBadge = document.getElementById('depression-badge');
  const depressionLevelText = document.getElementById('depression-level-text');
  const depressionFill = document.getElementById('depression-fill');
  const depressionMessage = document.getElementById('depression-message');

  // 4) [신규] 식단 및 칼로리 결과 요소
  const caloriesBadge = document.getElementById('calories-badge');
  const foodDetectedText = document.getElementById('food-detected-text');
  const nutritionTipText = document.getElementById('nutrition-tip-text');

  // 5) 종합 분석 이유
  const reasonText = document.getElementById('reason-text');

  // --------------------------------------------------------------------------
  // 2. 글자 수 카운터 및 헬퍼 함수
  // --------------------------------------------------------------------------
  function updateCharCount() {
    const length = textInput.value.length;
    currentLength.textContent = length.toLocaleString();
  }

  textInput.addEventListener('input', () => {
    updateCharCount();
    if (!errorBox.classList.contains('hidden')) {
      hideError();
    }
  });

  // --------------------------------------------------------------------------
  // 3. 원클릭 예시 문장 칩 버튼 이벤트
  // --------------------------------------------------------------------------
  sampleChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const sampleText = chip.getAttribute('data-sample');
      if (sampleText) {
        textInput.value = sampleText;
        updateCharCount();
        hideError();
        hideResult();
        textInput.focus();
      }
    });
  });

  // --------------------------------------------------------------------------
  // 4. '분석하기' 버튼 클릭 이벤트 리스너
  // --------------------------------------------------------------------------
  analyzeBtn.addEventListener('click', async () => {
    const inputText = textInput.value.trim();

    // 유효성 검사
    if (!inputText) {
      showError('분석할 텍스트를 입력해주세요.');
      textInput.focus();
      return;
    }

    // 로딩 상태 시작
    setLoadingState(true);
    hideError();
    hideResult();

    try {
      // 백엔드 종합 분석 API 호출
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }

      // 화면에 결과 렌더링
      renderResult(data);

    } catch (error) {
      console.error('[MoodLens 분석 오류]:', error);
      showError(error.message || '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoadingState(false);
    }
  });

  // --------------------------------------------------------------------------
  // 5. 종합 분석 결과 렌더링 함수
  // --------------------------------------------------------------------------
  /**
   * 서버로부터 받은 종합 분석 데이터(감성, 스트레스, 우울감, 칼로리)를 화면에 렌더링합니다.
   */
  function renderResult(resultData) {
    const { 
      sentiment, 
      confidence, 
      reason, 
      stress_level, 
      stress_message,
      depression_level,
      depression_status,
      depression_message,
      food_detected,
      calories_estimated,
      nutrition_tip
    } = resultData;

    // ------------------------------------------------------------------------
    // 5.1 감정 상태 뱃지 & 확신도 바
    // ------------------------------------------------------------------------
    sentimentBadge.className = 'sentiment-badge';
    progressFill.className = 'progress-fill';

    const normalizedSentiment = String(sentiment).toLowerCase();
    if (normalizedSentiment.includes('긍정') || normalizedSentiment.includes('positive')) {
      sentimentBadge.classList.add('badge-positive');
      progressFill.classList.add('fill-positive');
      badgeIcon.textContent = '🌿';
      badgeText.textContent = '긍정 (Positive)';
    } else if (normalizedSentiment.includes('부정') || normalizedSentiment.includes('negative')) {
      sentimentBadge.classList.add('badge-negative');
      progressFill.classList.add('fill-negative');
      badgeIcon.textContent = '🌧️';
      badgeText.textContent = '부정 (Negative)';
    } else {
      sentimentBadge.classList.add('badge-neutral');
      progressFill.classList.add('fill-neutral');
      badgeIcon.textContent = '☁️';
      badgeText.textContent = '중립 (Neutral)';
    }

    const safeConfidence = Math.min(100, Math.max(0, Number(confidence) || 0));
    confidenceText.textContent = `${safeConfidence}%`;
    progressFill.style.width = '0%';
    setTimeout(() => {
      progressFill.style.width = `${safeConfidence}%`;
    }, 50);

    // ------------------------------------------------------------------------
    // 5.2 스트레스 지수 게이지
    // ------------------------------------------------------------------------
    const safeStress = Math.min(100, Math.max(0, Number(stress_level) || 0));
    stressLevelText.textContent = `${safeStress}점`;

    stressBadge.className = 'stress-badge';
    stressFill.className = 'stress-fill';

    if (safeStress <= 20) {
      stressBadge.classList.add('stress-peace');
      stressFill.classList.add('fill-peace');
      stressBadge.textContent = '🌱 평온';
    } else if (safeStress <= 40) {
      stressBadge.classList.add('stress-low');
      stressFill.classList.add('fill-low');
      stressBadge.textContent = '💧 안정';
    } else if (safeStress <= 60) {
      stressBadge.classList.add('stress-medium');
      stressFill.classList.add('fill-medium');
      stressBadge.textContent = '⚡ 보통';
    } else if (safeStress <= 80) {
      stressBadge.classList.add('stress-high');
      stressFill.classList.add('fill-high');
      stressBadge.textContent = '⚠️ 주의 (피로)';
    } else {
      stressBadge.classList.add('stress-extreme');
      stressFill.classList.add('fill-extreme');
      stressBadge.textContent = '🚨 경고 (과부하)';
    }

    stressFill.style.width = '0%';
    setTimeout(() => {
      stressFill.style.width = `${safeStress}%`;
    }, 80);

    stressMessage.textContent = stress_message || '편안한 마음으로 충분한 휴식을 취해보세요.';

    // ------------------------------------------------------------------------
    // 5.3 [신규] 우울감 지수 게이지 & 맞춤 위로
    // ------------------------------------------------------------------------
    const safeDepression = Math.min(100, Math.max(0, Number(depression_level) || 0));
    depressionLevelText.textContent = `${safeDepression}점`;

    depressionBadge.className = 'depression-badge';

    if (safeDepression <= 20) {
      depressionBadge.classList.add('depression-clear');
      depressionBadge.textContent = '☀️ 맑음';
    } else if (safeDepression <= 50) {
      depressionBadge.classList.add('depression-mild');
      depressionBadge.textContent = '⛅ 가벼운 울적함';
    } else if (safeDepression <= 75) {
      depressionBadge.classList.add('depression-caution');
      depressionBadge.textContent = '🌧️ 주의 필요';
    } else {
      depressionBadge.classList.add('depression-deep');
      depressionBadge.textContent = '⛈️ 심층 케어 권장';
    }

    depressionFill.style.width = '0%';
    setTimeout(() => {
      depressionFill.style.width = `${safeDepression}%`;
    }, 120);

    depressionMessage.textContent = depression_message || '소중한 당신의 오늘 하루를 진심으로 안아드립니다.';

    // ------------------------------------------------------------------------
    // 5.4 [신규] 식단 & 섭취 칼로리 분석
    // ------------------------------------------------------------------------
    const safeCalories = Math.max(0, Number(calories_estimated) || 0);
    if (safeCalories > 0) {
      caloriesBadge.textContent = `🔥 약 ${safeCalories.toLocaleString()} kcal`;
    } else {
      caloriesBadge.textContent = `🍽️ 칼로리 정보 없음`;
    }

    foodDetectedText.textContent = food_detected || '언급된 음식 없음';
    nutritionTipText.textContent = nutrition_tip || '건강하고 맛있는 식사로 활력을 채워보세요!';

    // ------------------------------------------------------------------------
    // 5.5 종합 분석 이유 텍스트
    // ------------------------------------------------------------------------
    reasonText.textContent = reason || '입력된 문맥을 바탕으로 종합 웰니스 분석을 완료했습니다.';

    // 결과 카드 노출 및 스크롤 이동
    resultCard.classList.remove('hidden');
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // --------------------------------------------------------------------------
  // 6. 유틸리티 도우미 함수들
  // --------------------------------------------------------------------------
  function setLoadingState(isLoading) {
    if (isLoading) {
      analyzeBtn.disabled = true;
      btnText.innerHTML = '<span class="spinner" aria-hidden="true"></span> AI 정밀 분석 중...';
    } else {
      analyzeBtn.disabled = false;
      btnText.textContent = '감정 & 칼로리 종합 분석하기';
    }
  }

  function showError(msg) {
    errorMessage.textContent = msg;
    errorBox.classList.remove('hidden');
  }

  function hideError() {
    errorBox.classList.add('hidden');
    errorMessage.textContent = '';
  }

  function hideResult() {
    resultCard.classList.add('hidden');
    progressFill.style.width = '0%';
    stressFill.style.width = '0%';
    depressionFill.style.width = '0%';
  }

});
