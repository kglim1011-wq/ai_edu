@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if not errorlevel 1 (
  node scripts\launch.mjs
) else if exist "C:\Program Files\nodejs\node.exe" (
  "C:\Program Files\nodejs\node.exe" scripts\launch.mjs
) else (
  echo Please install Node.js 22 or newer and try again.
  pause
  exit /b 1
)
if errorlevel 1 pause
