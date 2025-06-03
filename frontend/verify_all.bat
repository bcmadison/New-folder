@echo off
setlocal enabledelayedexpansion

echo === AI Sports Betting Platform - Automated Setup and Verification ===
echo.

:: Set up logging
set "LOG_DIR=logs"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
set "LOG_FILE=%LOG_DIR%\setup_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.log"
set "LOG_FILE=%LOG_FILE: =0%"

:: Function to log messages
call :log "Starting automated setup and verification..."

:: Check Python installation
call :log "Checking Python installation..."
python --version > nul 2>&1
if errorlevel 1 (
    call :log "ERROR: Python is not installed or not in PATH"
    echo Python is not installed or not in PATH. Please install Python 3.8 or higher.
    pause
    exit /b 1
)
call :log "Python is installed"

:: Check Node.js installation
call :log "Checking Node.js installation..."
node --version > nul 2>&1
if errorlevel 1 (
    call :log "ERROR: Node.js is not installed or not in PATH"
    echo Node.js is not installed or not in PATH. Please install Node.js 16 or higher.
    pause
    exit /b 1
)
call :log "Node.js is installed"

:: Create and activate virtual environment
call :log "Setting up Python virtual environment..."
if not exist "venv" (
    python -m venv venv
    if errorlevel 1 (
        call :log "ERROR: Failed to create virtual environment"
        echo Failed to create virtual environment
        pause
        exit /b 1
    )
)
call :log "Virtual environment created"

:: Activate virtual environment and install dependencies
call :log "Installing Python dependencies..."
call venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 (
    call :log "ERROR: Failed to install Python dependencies"
    echo Failed to install Python dependencies
    pause
    exit /b 1
)
call :log "Python dependencies installed"

:: Install frontend dependencies
call :log "Installing frontend dependencies..."
cd frontend
call npm install
if errorlevel 1 (
    call :log "ERROR: Failed to install frontend dependencies"
    echo Failed to install frontend dependencies
    cd ..
    pause
    exit /b 1
)
call :log "Frontend dependencies installed"
cd ..

:: Verify ML system
call :log "Verifying ML system..."
python verify_ml.py
if errorlevel 1 (
    call :log "ERROR: ML system verification failed"
    echo ML system verification failed
    pause
    exit /b 1
)
call :log "ML system verified"

:: Start backend server
call :log "Starting backend server..."
start "Backend Server" cmd /c "venv\Scripts\python backend\server.py > %LOG_DIR%\backend_output.log 2>&1"
timeout /t 10 /nobreak > nul
call :log "Backend server started"

:: Start frontend development server
call :log "Starting frontend development server..."
cd frontend
start "Frontend Server" cmd /c "npm run dev > ..\%LOG_DIR%\frontend_output.log 2>&1"
cd ..
timeout /t 10 /nobreak > nul
call :log "Frontend server started"

:: Check if servers are running
call :log "Checking server status..."
curl -s http://localhost:8000/health > nul
if errorlevel 1 (
    call :log "ERROR: Backend server is not responding"
    echo Backend server is not responding. Check %LOG_DIR%\backend_output.log for details.
    pause
    exit /b 1
)
call :log "Backend server is running"

curl -s http://localhost:5173 > nul
if errorlevel 1 (
    call :log "ERROR: Frontend server is not responding"
    echo Frontend server is not responding. Check %LOG_DIR%\frontend_output.log for details.
    pause
    exit /b 1
)
call :log "Frontend server is running"

:: Final success message
echo.
echo === Setup Complete ===
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Logs are available in the %LOG_DIR% directory
echo.
call :log "Setup completed successfully"
pause
exit /b 0

:log
echo %date% %time% - %~1 >> "%LOG_FILE%"
echo %~1
goto :eof 