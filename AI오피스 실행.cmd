@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if not errorlevel 1 (
  node scripts\launch.mjs
) else if exist "C:\Program Files\nodejs\node.exe" (
  "C:\Program Files\nodejs\node.exe" scripts\launch.mjs
) else (
  echo Node.js 22 이상을 설치한 후 다시 실행해 주세요.
  pause
  exit /b 1
)
if errorlevel 1 pause
