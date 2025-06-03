@echo off
setlocal enabledelayedexpansion

:: Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Python is not installed. Please install Python 3.8 or higher.
    exit /b 1
)

:: Activate virtual environment
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
) else (
    echo Virtual environment not found. Please run setup.bat first.
    exit /b 1
)

:: Run verification tests
echo Running verification tests...

:: Verify backend
echo Verifying backend...
python scripts\verify_backend.py
if errorlevel 1 (
    echo Backend verification failed.
    exit /b 1
)

:: Verify frontend
echo Verifying frontend...
cd src\frontend
npm test
if errorlevel 1 (
    echo Frontend verification failed.
    exit /b 1
)
cd ..\..

:: Verify ML system
echo Verifying ML system...
python scripts\verify_ml.py
if errorlevel 1 (
    echo ML system verification failed.
    exit /b 1
)

:: Verify data processing
echo Verifying data processing...
python scripts\verify_data.py
if errorlevel 1 (
    echo Data processing verification failed.
    exit /b 1
)

echo All verifications completed successfully! 