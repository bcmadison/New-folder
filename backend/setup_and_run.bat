@echo off
echo Setting up Python virtual environment and installing dependencies...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Python is not installed or not in PATH. Please install Python 3.8 or higher.
    exit /b 1
)

REM Create virtual environment if it doesn't exist
if not exist .venv (
    echo Creating virtual environment...
    python -m venv .venv
)

REM Activate virtual environment and install dependencies
call .venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt

REM Set environment variables
set PORT=8000
set API_BASE_URL=http://localhost:5173

REM Start the server
echo Starting backend server...
python server.py

REM Keep the window open if there's an error
if errorlevel 1 (
    echo Server failed to start. Press any key to exit...
    pause
) 