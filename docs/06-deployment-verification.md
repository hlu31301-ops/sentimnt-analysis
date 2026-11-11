# 06. Vercel 배포 및 최종 검증 기준

## 1. 구현 범위
- `vercel.json` 설정 파일 작성 (정적 파일 `public/` 서빙 및 `/api/*` 서버리스 함수 라우팅)
- 배포 후 전체 기능 정상 작동 검증 체크리스트 제공

## 2. `vercel.json` 설정 예시
```json
{
  "version": 2,
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/public/$1" }
  ]
}
```

## 3. Vercel 환경 변수 설정 안내
Vercel 대시보드 → Project Settings → Environment Variables에 아래 3가지를 반드시 등록해야 합니다.
1. `OPENAI_API_KEY`
2. `SUPABASE_URL`
3. `SUPABASE_ANON_KEY`

## 4. 최종 검증 기준 (Final Checklist)
에이전트는 배포 전후로 아래 모든 항목이 통과하는지 확인해야 합니다.
- [ ] **UI 확인**: 레퍼런스 이미지와 같은 밝은 하늘색·화이트 톤과 깔끔한 카드 레이아웃이 적용되었는가?
- [ ] **빈 값 예외 처리**: 텍스트 없이 버튼 클릭 시 친절한 오류 메시지가 표시되는가?
- [ ] **긍정/부정/중립 분석**: 각각에 맞는 텍스트 입력 시 올바른 감정, 신뢰도(%), 분석 이유가 출력되는가?
- [ ] **DB 저장 확인**: 분석 결과가 Supabase `sentiment_logs` 테이블에 기록되는가?
- [ ] **보안 확인**: 브라우저 개발자 도구(F12) → Network/Sources 탭에서 `OPENAI_API_KEY`가 노출되지 않는가?
