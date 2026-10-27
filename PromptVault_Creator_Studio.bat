@echo off
title PromptVault Creator Studio
echo ========================================================
echo        🚀 PROMPTVAULT LOCAL CREATOR STUDIO
echo ========================================================
echo.
cd /d "%~dp0"

:: Check if server is running
curl -s http://localhost:3000 >nul
if %errorlevel% neq 0 (
    echo Starting local background engine...
    start /b node server.js
    timeout /t 2 >nul
)

echo Opening Creator Studio in your browser...
start "" http://localhost:3000/uploader.html

echo.
echo ========================================================
echo  ✓ Creator Studio is now active!
echo  You can drag-and-drop images, type prompts, and upload!
echo ========================================================
timeout /t 4 >nul
exit
