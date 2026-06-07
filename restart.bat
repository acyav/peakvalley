@echo off
chcp 65001 >nul
echo ============================================
echo    PeakValley - Restart Services
echo ============================================
echo.

echo [1/3] Stopping existing services...
call "E:\桌面\PeakValley\stop.bat" >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/3] Waiting for port release...
timeout /t 3 /nobreak >nul

echo [3/3] Starting services...
call "E:\桌面\PeakValley\start.bat" >nul 2>&1
