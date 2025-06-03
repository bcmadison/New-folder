@echo off
echo ===== Setting up Development Environment =====
echo.

:: Check Python installation
echo [1/6] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed. Please install Python 3.8 or higher.
    exit /b 1
)

:: Check Node.js installation
echo [2/6] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js 16 or higher.
    exit /b 1
)

:: Check npm installation
echo [3/6] Checking npm installation...
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed. Please install npm.
    exit /b 1
)

:: Create and activate Python virtual environment
echo [4/6] Setting up Python virtual environment...
if not exist "backend\.venv" (
    python -m venv backend\.venv
)
call backend\.venv\Scripts\activate.bat
pip install --upgrade pip
pip install -r backend\requirements.txt

:: Install frontend dependencies
echo [5/6] Installing frontend dependencies...
cd frontend
call npm install
cd ..

:: Initialize database
echo [6/6] Initializing database...
cd backend
python init_db.py
cd ..

echo.
echo ===== Environment Setup Complete =====
echo.
echo Press any key to continue...
pause >nul 