@echo off
echo === AI Sports Betting Analytics Platform - Finalization Script ===
echo.

:: Check for Python and Node.js
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.8 or higher from https://www.python.org/downloads/
    pause
    exit /b 1
)

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Create and activate Python virtual environment
echo Creating Python virtual environment...
if not exist "backend\.venv" (
    python -m venv backend\.venv
)
call backend\.venv\Scripts\activate.bat

:: Install backend dependencies
echo Installing backend dependencies...
pip install -r backend\requirements.txt

:: Install frontend dependencies
echo Installing frontend dependencies...
cd frontend
call npm install
cd ..

:: Set environment variables
set FLASK_APP=backend\app.py
set FLASK_ENV=development
set PYTHONPATH=%PYTHONPATH%;%CD%\backend

:: Start backend server
echo Starting backend server...
start "Backend Server" cmd /c "call backend\.venv\Scripts\activate.bat && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

:: Wait for backend to initialize
echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

:: Start frontend server
echo Starting frontend server...
cd frontend
start "Frontend Server" cmd /c "npm run dev"
cd ..

:: Run verification scripts
echo Running verification scripts...
python verify_ui.py
python verify_backend.py
python verify_real_data.py
python verify_design.py

:: Generate final report
echo Generating final report...
python generate_report.py

:: Open the application
echo Opening application...
start http://localhost:3000

echo.
echo === Finalization Complete ===
echo The application should now be running at http://localhost:3000
echo Backend API is available at http://localhost:8000
echo.
echo Press any key to exit...
pause >nul 