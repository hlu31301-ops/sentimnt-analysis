# AGENTS.md - AI 코딩 에이전트 작업 규칙

이 문서는 **Antigravity AI 코딩 에이전트**가 감성 분석 웹 프로젝트를 생성하고 구현할 때 반드시 따라야 하는 작업 규칙과 제약 조건을 정의합니다.

## 1. 기본 원칙 (추측 금지)
- 명시되지 않은 기능, 라이브러리, 프레임워크(예: React, Vue, Next.js, Tailwind CSS 등)를 임의로 추가하지 마세요.
- 프론트엔드는 **순수 HTML, CSS, JavaScript(Vanilla JS)**만 사용합니다.
- 백엔드는 **Node.js (Express 또는 Vercel Serverless Functions)**를 사용합니다.
- 모든 설명과 코드 주석은 비전공자도 이해할 수 있도록 쉽고 명확한 한국어로 작성하세요.

## 2. 작업 순서
반드시 `docs/` 폴더 내의 문서 번호 순서(`01` → `06`)대로 작업을 진행하세요.
1. `01-project-setup.md`: 폴더 구조 및 환경 변수 설정
2. `02-ui-design-guide.md`: 디자인 토큰(색상, 폰트, 여백) CSS 작성
3. `03-frontend-guide.md`: HTML 구조 및 프론트엔드 로직 구현
4. `04-backend-openai-guide.md`: Node.js 서버 및 OpenAI API 연동
5. `05-database-supabase-guide.md`: Supabase 데이터베이스 연동 및 분석 기록 저장
6. `06-deployment-verification.md`: Vercel 배포 설정 및 최종 검증

## 3. 제약 조건 (Don'ts)
- **API 키 노출 금지**: `OPENAI_API_KEY`와 `SUPABASE_SERVICE_ROLE_KEY`는 절대 프론트엔드(`public/` 또는 `.html`, `.js`) 코드에 포함하지 마세요. 반드시 `.env` 파일과 백엔드 서버에서만 사용하세요.
- **과도한 추상화 금지**: 불필요한 디자인 패턴이나 복잡한 빌드 도구(Webpack, Vite 등)를 도입하지 마세요.
- **하드코딩 금지**: 분석 결과를 가짜(Mock) 데이터로 반환하지 마세요. 반드시 OpenAI API의 실제 응답을 받아 처리해야 합니다.

## 4. 완료 및 보고 기준
각 단계의 작업이 끝나면 다음 항목을 점검하고 사용자에게 보고하세요.
- 생성/수정된 파일 목록
- 해당 단계의 **완료 기준(Definition of Done)** 충족 여부
- 실행 및 테스트 방법 (비전공자가 따라 할 수 있는 터미널 명령어 포함)
