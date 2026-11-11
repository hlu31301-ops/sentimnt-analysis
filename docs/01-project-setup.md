# 01. 프로젝트 생성 및 환경 설정 지침

## 1. 구현 범위
- Node.js 프로젝트 초기화 (`package.json` 생성)
- 필수 패키지 설치 (`express`, `dotenv`, `openai`, `@supabase/supabase-js`, `cors`)
- 프로젝트 기본 폴더 및 환경 변수 파일(`.env`, `.gitignore`) 생성

## 2. 폴더 구조
```text
/
├── api/
│   └── analyze.js         # (Vercel 배포용 또는 백엔드 라우터)
├── public/
│   ├── index.html         # 메인 웹 페이지
│   ├── style.css          # 스타일시트
│   └── app.js             # 프론트엔드 로직
├── server.js              # 로컬 테스트용 Node.js 서버
├── package.json
├── vercel.json            # Vercel 배포 설정
├── .env                   # 환경 변수 (GitHub 업로드 제외)
└── .gitignore
```

## 3. 제약 조건
- `.env` 파일은 반드시 `.gitignore`에 포함하여 Git에 올라가지 않도록 합니다.
- `package.json`의 `"type"`은 `"module"`(ES Modules) 또는 기본값(CommonJS) 중 하나로 통일하고 전체 코드에서 일관되게 사용하세요. (초보자 호환성을 위해 CommonJS `require` 권장)

## 4. 완료 기준 (DoD)
- `npm install` 실행 시 오류 없이 모든 패키지가 설치되어야 합니다.
- `.env.example` 파일을 함께 생성하여 어떤 환경 변수가 필요한지 안내해야 합니다. (`OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`)

## 5. 검증 기준
- 터미널에서 `node -v` 및 `npm list` 명령어로 설치된 패키지를 확인할 수 있어야 합니다.
