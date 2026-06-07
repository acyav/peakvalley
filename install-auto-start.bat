@echo off
chcp 65001 >nul
echo ============================================
echo    Install PeakValley Auto-Start
echo ============================================
echo.

set STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set VBS_NAME=PeakValley-AutoStart.vbs

echo [1/2] Copying to Startup folder...
echo   Target: %STARTUP_FOLDER%\%VBS_NAME%
copy /Y "E:\桌面\PeakValley\hidden-start.vbs" "%STARTUP_FOLDER%\%VBS_NAME%" >nul

if %ERRORLEVEL% == 0 (
    echo   [OK] Copy success
) else (
    echo   [X] Copy failed, check permissions
    pause
    exit /b 1
)

echo.
echo [2/2] Creating stop shortcut...
copy /Y "E:\桌面\PeakValley\stop.bat" "%APPDATA%\Microsoft\Windows\Start Menu\Programs\PeakValley-Stop.bat" >nul 2>&1

echo.
echo ============================================
echo    Auto-start installed!
echo ============================================
echo.
echo Info:
echo   - Services will auto-start silently on boot
echo   - No windows, no popups
echo   - Visit http://localhost:3000 to use
echo.
echo To remove auto-start:
echo   Win+R, type shell:startup, delete %VBS_NAME%
echo.
echo Start now?
pause
start "" "%STARTUP_FOLDER%\%VBS_NAME%"
