/**
 * ==============================================================================
 * MoodLens (AI 감성, 마음건강 & 토끼의 힐링 케어) - 프론트엔드 비즈니스 로직
 * 파일명: public/app.js
 * 기술 스택: Vanilla JavaScript (순수 자바스크립트)
 * 설명: 사용자의 입력을 검증하고, 백엔드 API(/api/analyze)를 호출하여
 *       감성, 스트레스, 우울감, 칼로리 분석 및 AI 힐링 처방전을 시각화하고,
 *       귀여운 토끼 마스코트 '버니'와 인터랙티브하게 상호작용합니다.
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

  // --------------------------------------------------------------------------
  // 1. 필요한 HTML DOM 요소 선택
  // --------------------------------------------------------------------------
  const textInput = document.getElementById('text-input');           // 텍스트 입력창
  const currentLength = document.getElementById('current-length');   // 현재 글자 수 표시 span
  const analyzeBtn = document.getElementById('analyze-btn');         // 분석하기 버튼
  const btnText = document.getElementById('btn-text');               // 버튼 내부 텍스트 span
  const sampleChips = document.querySelectorAll('.btn-sample-chip'); // 예시 칩 버튼들
  
  // 토끼 마스코트 요소
  const bunnyAvatar = document.getElementById('bunny-avatar');       // 토끼 캐릭터 클릭 영역
  const bunnyBubbleText = document.getElementById('bunny-bubble-text'); // 토끼 말풍선 텍스트

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

  // 3) 우울감 결과 요소
  const depressionBadge = document.getElementById('depression-badge');
  const depressionLevelText = document.getElementById('depression-level-text');
  const depressionFill = document.getElementById('depression-fill');
  const depressionMessage = document.getElementById('depression-message');

  // 4) 식단 및 칼로리 결과 요소
  const caloriesBadge = document.getElementById('calories-badge');
  const foodDetectedText = document.getElementById('food-detected-text');
  const nutritionTipText = document.getElementById('nutrition-tip-text');

  // 5) [신규] AI 오늘의 힐링 처방전 체크리스트 요소
  const healingChecklist = document.getElementById('healing-checklist');

  // 6) 종합 분석 이유
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
  // 3. 토끼 마스코트 '버니' 인터랙션 (클릭 시 깡총 뛰기 & 애교 멘트)
  // --------------------------------------------------------------------------
  const bunnyPlayfulLines = [
    "토끼를 콕 찔렀네요! 깡총깡총~ 🐰🥕",
    "오늘 힘든 일이 있었다면 내가 다 들어줄게!",
    "너는 오늘도 정말 빛나고 소중한 사람이야 ✨",
    "토끼가 옆에서 힘찬 응원 보낼게요, 얍! 💖",
    "당근 하나 먹고 기운 내볼까요? 🥕🐰"
  ];

  bunnyAvatar.addEventListener('click', () => {
    // 깡총 점프 애니메이션 적용
    bunnyAvatar.classList.remove('bunny-jump');
    void bunnyAvatar.offsetWidth; // 리플로우 강제 트리거
    bunnyAvatar.classList.add('bunny-jump');

    // 랜덤 애교 멘트 출력
    const randomLine = bunnyPlayfulLines[Math.floor(Math.random() * bunnyPlayfulLines.length)];
    bunnyBubbleText.textContent = randomLine;
  });

  // --------------------------------------------------------------------------
  // 4. 원클릭 예시 문장 칩 버튼 이벤트
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

        // 토끼 반응
        bunnyBubbleText.textContent = "예시 문장을 불러왔어요! 아래 분석 버튼을 눌러보세요 🐰✨";
      }
    });
  });

  // --------------------------------------------------------------------------
  // 5. '종합 분석하기' 버튼 클릭 이벤트
  // --------------------------------------------------------------------------
  analyzeBtn.addEventListener('click', async () => {
    const inputText = textInput.value.trim();

    if (!inputText) {
      showError('분석할 텍스트를 입력해주세요.');
      bunnyBubbleText.textContent = "앗! 빈 메모장에는 마음을 적을 수 없어요. 한 글자라도 적어주세요 🐰💦";
      textInput.focus();
      return;
    }

    setLoadingState(true);
    hideError();
    hideResult();

    // 분석 중 토끼 반응
    bunnyBubbleText.textContent = "열심히 마음을 읽는 중이에요... 잠시만 기다려줘 🐰💭";

    try {
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

      renderResult(data);

    } catch (error) {
      console.error('[MoodLens 분석 오류]:', error);
      showError(error.message || '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      bunnyBubbleText.textContent = "으앙, 분석 중에 문제가 생겼어요. 잠시 후에 다시 시도해 주세요 🐰🌧️";
    } finally {
      setLoadingState(false);
    }
  });

  // --------------------------------------------------------------------------
  // 6. 종합 분석 결과 렌더링 함수
  // --------------------------------------------------------------------------
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
      nutrition_tip,
      healing_actions,
      rabbit_cheer
    } = resultData;

    // ------------------------------------------------------------------------
    // 6.1 토끼 마스코트 응원 멘트 및 점프
    // ------------------------------------------------------------------------
    if (rabbit_cheer) {
      bunnyBubbleText.textContent = rabbit_cheer;
    }
    bunnyAvatar.classList.remove('bunny-jump');
    void bunnyAvatar.offsetWidth;
    bunnyAvatar.classList.add('bunny-jump');

    // ------------------------------------------------------------------------
    // 6.2 감정 상태 뱃지 & 확신도 바
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
    // 6.3 스트레스 지수 게이지
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
    // 6.4 우울감 지수 게이지 & 맞춤 위로
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
    // 6.5 식단 & 섭취 칼로리 분석
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
    // 6.6 [신규] AI 오늘의 힐링 처방전 (실천 체크리스트 동적 생성)
    // ------------------------------------------------------------------------
    healingChecklist.innerHTML = '';
    const actions = Array.isArray(healing_actions) && healing_actions.length > 0
      ? healing_actions
      : [
          '🍵 따뜻한 허브차나 물 한 잔 마시기',
          '🌿 가볍게 기지개를 켜며 심호흡하기',
          '💖 오늘 하루 고생한 나에게 토닥토닥 칭찬 건네기'
        ];

    actions.forEach((actionText, index) => {
      const li = document.createElement('li');
      li.className = 'healing-item';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'healing-checkbox';
      checkbox.id = `healing-check-${index}`;

      const label = document.createElement('label');
      label.className = 'healing-text';
      label.htmlFor = `healing-check-${index}`;
      label.textContent = actionText;

      // 클릭 시 완료 줄(취소선) 토글 이벤트
      const toggleComplete = () => {
        if (checkbox.checked) {
          li.classList.add('completed');
          // 토끼가 칭찬해 주는 귀여운 반응
          bunnyBubbleText.textContent = "와! 힐링 액션을 실천하셨네요! 최고예요 토끼가 칭찬해요 🐰🎉";
          bunnyAvatar.classList.remove('bunny-jump');
          void bunnyAvatar.offsetWidth;
          bunnyAvatar.classList.add('bunny-jump');
        } else {
          li.classList.remove('completed');
        }
      };

      checkbox.addEventListener('change', toggleComplete);

      li.appendChild(checkbox);
      li.appendChild(label);
      healingChecklist.appendChild(li);
    });

    // ------------------------------------------------------------------------
    // 6.7 종합 분석 이유 텍스트
    // ------------------------------------------------------------------------
    reasonText.textContent = reason || '입력된 문맥을 바탕으로 종합 웰니스 분석을 완료했습니다.';

    // 결과 카드 노출 및 부드러운 스크롤
    resultCard.classList.remove('hidden');
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // --------------------------------------------------------------------------
  // 7. 유틸리티 도우미 함수들
  // --------------------------------------------------------------------------
  function setLoadingState(isLoading) {
    if (isLoading) {
      analyzeBtn.disabled = true;
      btnText.innerHTML = '<span class="spinner" aria-hidden="true"></span> 버니와 AI가 분석 중...';
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
