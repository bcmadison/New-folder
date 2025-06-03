@echo off
setlocal enabledelayedexpansion

:: Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Python is not installed. Please install Python 3.8 or higher.
    exit /b 1
)

:: Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Node.js is not installed. Please install Node.js 16 or higher.
    exit /b 1
)

:: Create and activate virtual environment
echo Creating virtual environment...
python -m venv venv
call venv\Scripts\activate.bat

:: Install Python dependencies
echo Installing Python dependencies...
pip install -r requirements.txt

:: Install frontend dependencies
echo Installing frontend dependencies...
cd src\frontend
npm install
cd ..\..

:: Set up environment variables
echo Setting up environment variables...
if not exist .env (
    copy .env.example .env
    echo Please edit .env with your configuration
)

:: Set up logging
echo Setting up logging...
mkdir logs 2>nul
python scripts\setup_logging.py

:: Set up ML models
echo Setting up ML models...
python scripts\setup_ml.py

:: Set up database
echo Setting up database...
python scripts\setup_db.py

echo Setup completed successfully!
echo Please edit .env with your configuration before starting the application. 