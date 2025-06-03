@echo off
setlocal enabledelayedexpansion

echo ===== Backend Server Setup and Start =====
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH.
    echo Please install Python 3.8 or higher from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation.
    pause
    exit /b 1
)

REM Get Python version
for /f "tokens=2" %%I in ('python --version 2^>^&1') do set PYTHON_VERSION=%%I
echo [INFO] Found Python version: !PYTHON_VERSION!

REM Create and activate virtual environment
if not exist .venv (
    echo [INFO] Creating Python virtual environment...
    python -m venv .venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment
        pause
        exit /b 1
    )
)

REM Activate virtual environment
echo [INFO] Activating virtual environment...
call .venv\Scripts\activate.bat
if errorlevel 1 (
    echo [ERROR] Failed to activate virtual environment
    pause
    exit /b 1
)

REM Upgrade pip
echo [INFO] Upgrading pip...
python -m pip install --upgrade pip
if errorlevel 1 (
    echo [ERROR] Failed to upgrade pip
    pause
    exit /b 1
)

REM Install dependencies
echo [INFO] Installing dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    echo [INFO] Checking Python path...
    where python
    echo [INFO] Checking pip path...
    where pip
    pause
    exit /b 1
)

REM Set environment variables
set PORT=8000
set API_BASE_URL=http://localhost:5173
set PYTHONPATH=%CD%;%PYTHONPATH%

REM Start the server
echo.
echo [INFO] Starting backend server...
echo [INFO] Server will be available at http://localhost:%PORT%
echo [INFO] Press Ctrl+C to stop the server
echo.

REM Run with error output
python server.py 2>&1
if errorlevel 1 (
    echo.
    echo [ERROR] Server failed to start. Error details above.
    echo [INFO] Checking Python path: %PYTHONPATH%
    echo [INFO] Current directory: %CD%
    pause
    exit /b 1
)

REM If we get here, the server has stopped
echo.
echo [INFO] Server stopped. Press any key to exit...
pause >nul 