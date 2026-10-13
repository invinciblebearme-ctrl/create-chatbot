@echo off
chcp 65001 > nul
echo ===================================================
echo   CREATE AI 수업 도우미 로컬 통합 실행 스크립트
echo ===================================================
echo.
set "PATH=C:\Program Files\nodejs;C:\Users\user\AppData\Local\Programs\Git\cmd;%PATH%"

echo [1/2] 백엔드 API Worker 및 D1 데이터베이스 실행 중... (포트 8787)
start "CREATE AI API Worker (Port 8787)" cmd /k "cd /d "%~dp0" && npm run dev:api"

echo [2/2] 웹 프런트엔드 React 서버 실행 중... (포트 3000)
start "CREATE AI Chatbot Web (Port 3000)" cmd /k "cd /d "%~dp0" && npm run dev"

echo.
echo ===================================================
echo   서버 가동 후 브라우저에서 아래 주소로 접속해 주세요:
echo   - 챗봇 메인: http://localhost:3000/chatbot/
echo   - 관리자 대시보드: http://localhost:3000/chatbot/admin
echo ===================================================
echo.
pause
