/**
 * ==============================================================================
 * MoodLens (AI 감성 분석 웹 서비스) - 로컬 실행용 Node.js (Express) 서버
 * 파일명: server.js
 * 설명: 
 *   - public/ 폴더의 프론트엔드 파일(HTML, CSS, JS)을 웹 브라우저에 서빙합니다.
 *   - /api/analyze 엔드포인트를 통해 감성 분석 및 스트레스 지수 요청을 처리합니다.
 *   - 포트 충돌(EADDRINUSE) 방지 로직 탑재: 3000번이 사용 중이면 다음 포트(3001...)로 자동 연결
 * ==============================================================================
 */

// 1. 환경 변수(.env) 로드
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

// 감성 분석 API 핸들러 불러오기
const analyzeHandler = require('./api/analyze');

// Express 앱 인스턴스 생성
const app = express();

// 초기 포트 설정 (.env의 PORT 또는 기본 3000)
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;

// ------------------------------------------------------------------------------
// 2. 미들웨어 설정
// ------------------------------------------------------------------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ------------------------------------------------------------------------------
// 3. 정적 파일 서빙
// ------------------------------------------------------------------------------
app.use(express.static(path.join(__dirname, 'public')));

// ------------------------------------------------------------------------------
// 4. API 라우터 등록
// ------------------------------------------------------------------------------
app.post('/api/analyze', analyzeHandler);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'MoodLens 서버가 정상적으로 동작 중입니다.',
    timestamp: new Date().toISOString()
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ------------------------------------------------------------------------------
// 5. 스마트 서버 실행 함수 (포트 충돌 완전 자동 해결)
// ------------------------------------------------------------------------------
/**
 * 지정된 포트로 서버를 띄우고, 만약 이미 사용 중(EADDRINUSE)이면
 * 에러를 뿜으며 죽는 대신 다음 포트(포트 번호 + 1)로 자동 실행합니다.
 * 
 * @param {number} portToTry 
 */
function startServer(portToTry) {
  const server = app.listen(portToTry, () => {
    console.log('\n====================================================');
    console.log('🌿 [MoodLens] AI 감성 분석 서버가 성공적으로 시작되었습니다!');
    console.log(`📡 서버 접속 주소: http://localhost:${portToTry}`);
    console.log('----------------------------------------------------');
    console.log('💡 웹 브라우저를 열고 위 주소로 접속해 보세요.');
    console.log('💡 서버를 종료하려면 터미널에서 Ctrl + C 를 누르세요.');
    console.log('====================================================\n');
  });

  // 포트 충돌 이벤트 감지 및 자동 복구
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️  [안내] 포트 ${portToTry}번이 이미 사용 중입니다.`);
      console.log(`🔄 다음 포트인 ${portToTry + 1}번으로 자동 전환하여 다시 시작합니다...`);
      startServer(portToTry + 1);
    } else {
      console.error('❌ 서버 실행 중 예상치 못한 오류 발생:', err);
    }
  });
}

// 최초 서버 실행 시도
startServer(DEFAULT_PORT);
