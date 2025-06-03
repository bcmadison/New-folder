@echo off

:: Navigate to script directory
cd /d %~dp0

:: Set up virtual environment
python -m venv .venv

:: Activate virtual environment
call .venv\Scripts\activate.bat

:: Upgrade pip
python -m pip install --upgrade pip

:: Check if requirements.txt exists
if not exist requirements.txt (
    echo ERROR: requirements.txt not found in %cd%
    pause
    exit /b 1
)

:: Install dependencies
pip install -r requirements.txt --no-cache-dir

:: Final pause to keep window open
pause
