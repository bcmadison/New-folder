@echo off
echo Starting AI Sports Betting Analytics Platform...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Python is not installed. Please install Python 3.9 or higher.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Node.js is not installed. Please install Node.js 14 or higher.
    pause
    exit /b 1
)

REM Create and activate virtual environment if it doesn't exist
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install/update dependencies
echo Installing dependencies...
pip install -r backend/requirements.txt

REM Train initial model if needed
echo Checking ML model...
if not exist "backend\advanced\models_store\calibrated_model.joblib" (
    echo Training initial ML model...
    python backend/scripts/train_initial_model.py
)

REM Start backend server
echo Starting backend server...
start /B python backend/server.py

REM Start frontend development server
echo Starting frontend development server...
cd frontend
start /B npm run dev

echo Application started successfully!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173

REM Keep the window open
pause