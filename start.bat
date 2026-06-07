@echo off
chcp 65001 >nul
echo ============================================
echo    PeakValley - Start Services
echo ============================================
echo.

REM === Check port ===
echo [Check] Port 3000 / 3001 ...
netstat -ano | findstr ":3000 " >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo [!] Warning: Port 3000 is in use
)
netstat -ano | findstr ":3001 " >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo [!] Warning: Port 3001 is in use, backend may be running
    goto :SKIP_BACKEND
)

echo.
echo [1/2] Starting Backend (FastAPI :3001)...
start /min "PeakValley Backend" cmd /c "cd /d E:\桌面\PeakValley\backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 3001 --reload"
timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend (Next.js :3000)...
start /min "PeakValley Frontend" cmd /c "cd /d E:\桌面\PeakValley\frontend && npx next dev -p 3000"
timeout /t 3 /nobreak >nul

:SKIP_BACKEND
echo.
echo ============================================
echo    Services Started!
echo    Backend:  http://localhost:3001/docs
echo    Frontend: http://localhost:3000
echo ============================================
echo.
echo Run stop.bat to stop services
echo.
pause
