@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if not errorlevel 1 (
  node scripts\stop.mjs
) else if exist "C:\Program Files\nodejs\node.exe" (
  "C:\Program Files\nodejs\node.exe" scripts\stop.mjs
) else (
  echo Node.js was not found.
)
pause
