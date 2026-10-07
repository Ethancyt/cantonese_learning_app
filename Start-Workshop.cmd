@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Please install Node.js 22.3 or newer, then open this launcher again.
  start "" "https://nodejs.org/en/download"
  pause
  exit /b 1
)
node -e "const [a,b]=process.versions.node.split('.').map(Number); process.exit(a>22||(a===22&&b>=3)?0:1)"
if errorlevel 1 (
  echo Please update Node.js to version 22.3 or newer.
  pause
  exit /b 1
)
set OPEN_SETUP_PAGE=true
call npm run dev
pause
