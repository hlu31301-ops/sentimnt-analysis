# 04. 백엔드 (Node.js) 및 OpenAI API 연동 지침

## 1. 구현 범위
- `server.js` (로컬 실행용) 및 `api/analyze.js` (API 엔드포인트) 구현
- OpenAI API를 호출하여 텍스트의 감성, 신뢰도, 분석 이유를 JSON 형태로 받아오는 로직 작성

## 2. API 명세
- **Endpoint**: `POST /api/analyze`
- **Request Body**:
  ```json
  {
    "text": "오늘 날씨가 너무 좋아서 기분이 최고예요!"
  }
  ```
- **Response Body (성공 시 - 200 OK)**:
  ```json
  {
    "sentiment": "긍정",
    "confidence": 95,
    "reason": "맑은 날씨에 대한 기쁨과 '최고'라는 긍정적인 감정 표현이 명확하게 드러납니다."
  }
  ```
- **Response Body (실패 시 - 400 또는 500)**:
  ```json
  {
    "error": "분석할 텍스트가 비어 있습니다."
  }
  ```

## 3. OpenAI 프롬프트 및 응답 규칙
- `response_format: { type: "json_object" }` 옵션을 사용하여 AI가 반드시 유효한 JSON 형식으로만 응답하도록 강제합니다.
- 시스템 프롬프트에 다음 조건을 명시하세요:
  - `sentiment`는 반드시 `"긍정"`, `"부정"`, `"중립"` 중 하나여야 합니다.
  - `confidence`는 `0`에서 `100` 사이의 정수여야 합니다.
  - `reason`은 한국어로 1~2문장 이내로 작성해야 합니다.

## 4. 제약 조건
- 클라이언트가 보낸 `text`가 없거나 1,000자를 초과할 경우 `400 Bad Request` 오류를 반환하세요.
- OpenAI API 호출 실패 시 서버가 다운되지 않도록 반드시 `try-catch` 문으로 예외 처리를 하세요.

## 5. 완료 및 검증 기준
- 로컬 서버 실행 후 Postman, curl 또는 프론트엔드 화면을 통해 `/api/analyze` 호출 시 정확한 JSON 구조가 반환되는지 확인합니다.
