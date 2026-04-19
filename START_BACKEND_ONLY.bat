@echo off
title FSDS Backend API
color 0B
echo.
echo  ============================================================
echo    FSDS Backend API - http://127.0.0.1:5000
echo  ============================================================
echo.

set ROOT_DIR=%~dp0

cd /d "%ROOT_DIR%backend"

echo  Verifying Python dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Dependency install failed. See errors above.
    pause
    exit /b 1
)

echo.
echo  Starting FSDS Backend API on http://127.0.0.1:5000 ...
echo.
python run.py
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Backend stopped unexpectedly. See error above.
)
pause
