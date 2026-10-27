@echo off
title PromptVault Creator Studio
color 0A
echo ========================================================
echo        🚀 PROMPTVAULT LIVE CREATOR STUDIO
echo ========================================================
echo.
echo  Connected to Live Website:
echo  https://prompt-vault-xk30.onrender.com
echo.
echo  [1] Open Live Cloud Studio   (Upload prompts directly to live site)
echo  [2] Open Live Website        (View live website in browser)
echo  [3] Open Live Admin Portal   (Manage users, payments & prompts)
echo  [4] Open Local Studio        (localhost:3000 with auto-sync)
echo.
set /p opt="Choose option (1, 2, 3, or 4) [Press Enter for 1]: "
if "%opt%"=="" set opt=1
if "%opt%"=="1" goto LIVE_STUDIO
if "%opt%"=="2" goto LIVE_SITE
if "%opt%"=="3" goto LIVE_ADMIN
if "%opt%"=="4" goto LOCAL_STUDIO

:LIVE_STUDIO
echo Opening Live Cloud Creator Studio...
start "" https://prompt-vault-xk30.onrender.com/uploader.html
exit

:LIVE_SITE
echo Opening Live Website...
start "" https://prompt-vault-xk30.onrender.com
exit

:LIVE_ADMIN
echo Opening Live Admin Portal...
start "" https://prompt-vault-xk30.onrender.com/admin.html
exit

:LOCAL_STUDIO
cd /d "%~dp0"
curl -s http://localhost:3000 >nul
if %errorlevel% neq 0 (
    echo Starting local background engine...
    start /b node server.js
    timeout /t 2 >nul
)
echo Opening Local Creator Studio...
start "" http://localhost:3000/uploader.html
exit
