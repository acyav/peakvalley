@echo off
chcp 65001 >nul
echo ============================================
echo    PeakValley - Stop Services
echo ============================================
echo.

echo [1/2] Stopping Frontend (Node.js :3000)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 "') do (
    echo   - Killing PID: %%a
    taskkill /PID %%a /F >nul 2>&1
)

echo [2/2] Stopping Backend (Python :3001)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001 "') do (
    echo   - Killing PID: %%a
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo ============================================
echo    All services stopped
echo ============================================
echo.
pause
