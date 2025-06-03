@echo off
setlocal enabledelayedexpansion

echo ===== Fixing NumPy Installation =====
cd /d %~dp0

REM Activate virtual environment
call .venv\Scripts\activate.bat
if errorlevel 1 (
    echo [ERROR] Failed to activate virtual environment
    pause
    exit /b 1
)

REM Uninstall numpy completely
echo [INFO] Uninstalling numpy...
pip uninstall -y numpy
if errorlevel 1 (
    echo [ERROR] Failed to uninstall numpy
    pause
    exit /b 1
)

REM Clean pip cache
echo [INFO] Cleaning pip cache...
pip cache purge

REM Reinstall numpy
echo [INFO] Reinstalling numpy...
pip install numpy
if errorlevel 1 (
    echo [ERROR] Failed to reinstall numpy
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