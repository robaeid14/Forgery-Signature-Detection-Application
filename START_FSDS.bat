@echo off
title FSDS - WeCare Software Solutions LTD.
color 0B

echo.
echo  ============================================================
echo    FSDS - Forgery Signature Detection System v1.0
echo    WeCare Software Solutions LTD.
echo  ============================================================
echo.

:: Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Python not found. Please install Python 3.10+
    echo  Download: https://www.python.org/downloads/
    pause
    exit /b 1
)

:: Show Python version
for /f "tokens=2 delims= " %%v in ('python --version 2^>^&1') do set PY_VER=%%v
echo  Python found: %PY_VER%

:: Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js not found. Please install Node.js 18+
    echo  Download: https://nodejs.org/
    pause
    exit /b 1
)

:: Store root dir before any cd
set ROOT_DIR=%~dp0

echo  [1/3] Installing Python dependencies...
cd /d "%ROOT_DIR%backend"
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Failed to install Python dependencies!
    echo  Please check the error messages above and resolve them.
    echo  Common fix: python -m pip install --upgrade pip
    pause
    exit /b 1
)
echo  [OK] Python dependencies installed.

echo  [2/3] Installing frontend dependencies...
cd /d "%ROOT_DIR%frontend"
if not exist "node_modules" (
    echo  Running npm install ^(this may take a minute^)...
    call npm install
    if %errorlevel% neq 0 (
        echo  [ERROR] Failed to install frontend dependencies!
        pause
        exit /b 1
    )
) else (
    echo  [OK] node_modules already present, skipping npm install.
)

echo  [3/3] Starting FSDS servers...
echo.
echo  Backend API : http://127.0.0.1:5000
echo  Frontend    : http://127.0.0.1:3000
echo.
echo  Default login  : admin / Admin@123456
echo.
echo  Press Ctrl+C in either window to stop.
echo  ============================================================

:: Write helper launchers to avoid nested-quote issues in start ""
set BACK_LAUNCH=%TEMP%\fsds_backend_launch.bat
set FRONT_LAUNCH=%TEMP%\fsds_frontend_launch.bat

echo @echo off > "%BACK_LAUNCH%"
echo title FSDS Backend API >> "%BACK_LAUNCH%"
echo cd /d "%ROOT_DIR%backend" >> "%BACK_LAUNCH%"
echo python run.py >> "%BACK_LAUNCH%"
echo if %%errorlevel%% neq 0 ( >> "%BACK_LAUNCH%"
echo     echo. >> "%BACK_LAUNCH%"
echo     echo [ERROR] Backend failed to start. See error above. >> "%BACK_LAUNCH%"
echo     pause >> "%BACK_LAUNCH%"
echo ) >> "%BACK_LAUNCH%"

echo @echo off > "%FRONT_LAUNCH%"
echo title FSDS Frontend >> "%FRONT_LAUNCH%"
echo cd /d "%ROOT_DIR%frontend" >> "%FRONT_LAUNCH%"
echo npm start >> "%FRONT_LAUNCH%"
echo pause >> "%FRONT_LAUNCH%"

:: Launch both servers in separate windows
start "FSDS Backend API" cmd /k "%BACK_LAUNCH%"

echo  Waiting for backend to initialise...
timeout /t 5 /nobreak >nul

start "FSDS Frontend" cmd /k "%FRONT_LAUNCH%"

echo  Waiting for frontend to compile...
timeout /t 12 /nobreak >nul
start http://localhost:3000

echo.
echo  FSDS is running. Browser opened at http://localhost:3000
echo.
pause
