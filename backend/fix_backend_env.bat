@echo off
setlocal enabledelayedexpansion

echo ===== Fixing Backend Python Environment =====
cd /d %~dp0

REM Activate virtual environment
call .venv\Scripts\activate.bat
if errorlevel 1 (
    echo [ERROR] Failed to activate virtual environment
    pause
    exit /b 1
)

REM Force reinstall pydantic and pydantic-core
echo [INFO] Reinstalling pydantic and pydantic-core...
pip install --force-reinstall --upgrade pydantic pydantic-core
if errorlevel 1 (
    echo [ERROR] Failed to reinstall pydantic or pydantic-core
    pause
    exit /b 1
)

REM Start backend server
echo [INFO] Starting backend server...
python server.py

REM Keep window open if server fails
if errorlevel 1 (
    echo [ERROR] Backend server failed to start. See error messages above.
    pause
    exit /b 1
) 