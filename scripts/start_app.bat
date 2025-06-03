@echo off
echo ===== AI Sports Betting Analytics Platform - Startup Script =====
echo.

:: Check for Python installation
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.8 or higher from https://www.python.org/downloads/
    pause
    exit /b 1
)

:: Check for Node.js installation
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check for Visual C++ Build Tools
where vswhere.exe >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Visual C++ Build Tools not found
    echo Please install Visual C++ Build Tools from:
    echo https://visualstudio.microsoft.com/visual-cpp-build-tools/
    echo.
    echo After installation, please restart your computer and run this script again.
    pause
    exit /b 1
)

:: Create and activate Python virtual environment if it doesn't exist
if not exist "backend\.venv" (
    echo [INFO] Creating Python virtual environment...
    python -m venv backend\.venv
)

:: Activate virtual environment and install backend dependencies
echo [INFO] Activating virtual environment and installing backend dependencies...
call backend\.venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r backend\requirements.txt

:: Install frontend dependencies
echo [INFO] Installing frontend dependencies...
cd frontend
call npm install
cd ..

:: Set environment variables
set PORT=8000
set API_BASE_URL=http://localhost:8000

:: Start backend server in a new window
echo [INFO] Starting backend server...
start "Backend Server" cmd /c "cd backend && .venv\Scripts\activate.bat && python server.py"

:: Wait for backend to start
echo [INFO] Waiting for backend server to start...
timeout /t 5 /nobreak >nul

:: Start frontend server in a new window
echo [INFO] Starting frontend server...
cd frontend
start "Frontend Server" cmd /c "npm run dev"
cd ..

echo.
echo ===== Application Startup Complete =====
echo Backend running at: http://localhost:8000
echo Frontend running at: http://localhost:5173
echo.
echo Press any key to exit this window...
pause >nul
