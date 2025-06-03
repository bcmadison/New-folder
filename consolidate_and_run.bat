@echo off
setlocal enabledelayedexpansion

echo 🚀 Starting AI Sports Betting Platform Consolidation and Setup
echo =====================================================

:: Create logs directory if it doesn't exist
if not exist "logs" mkdir logs
set "LOG_FILE=logs\consolidation_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.log"
set "LOG_FILE=!LOG_FILE: =0!"

:: Function to log messages
call :log "Starting consolidation process..."

:: Step 1: Create finalApp structure
call :log "Creating finalApp structure..."
if not exist "finalApp" mkdir finalApp
cd finalApp

:: Create backend structure
mkdir backend\app\api\v1\endpoints
mkdir backend\app\core
mkdir backend\app\models
mkdir backend\app\services
mkdir backend\app\schemas
mkdir backend\tests\unit
mkdir backend\tests\integration

:: Create frontend structure
mkdir frontend\src\components\lineup
mkdir frontend\src\components\predictions
mkdir frontend\src\components\analytics
mkdir frontend\src\components\common
mkdir frontend\src\hooks
mkdir frontend\src\services
mkdir frontend\src\store\slices
mkdir frontend\src\utils
mkdir frontend\tests

cd ..

:: Step 2: Consolidate backend
call :log "Consolidating backend..."
python scripts\consolidate_backend.py

:: Step 3: Consolidate frontend
call :log "Consolidating frontend..."
python scripts\consolidate_frontend.py

:: Step 4: Set up Python environment
call :log "Setting up Python environment..."
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
pip install -r requirements-dev.txt

:: Step 5: Set up Node.js environment
call :log "Setting up Node.js environment..."
cd frontend
call npm install
cd ..

:: Step 6: Verify setup
call :log "Verifying setup..."
python scripts\verify_setup.py

:: Step 7: Create run script
call :log "Creating run script..."
echo @echo off > run_app.bat
echo setlocal enabledelayedexpansion >> run_app.bat
echo. >> run_app.bat
echo :: Start backend >> run_app.bat
echo start "Backend Server" cmd /c "cd backend ^&^& ..\venv\Scripts\python server.py" >> run_app.bat
echo. >> run_app.bat
echo :: Start frontend >> run_app.bat
echo start "Frontend Server" cmd /c "cd frontend ^&^& npm run dev" >> run_app.bat
echo. >> run_app.bat
echo echo 🚀 Application started! >> run_app.bat
echo echo Backend: http://localhost:8000 >> run_app.bat
echo echo Frontend: http://localhost:5173 >> run_app.bat

:: Step 8: Create cleanup script
call :log "Creating cleanup script..."
echo @echo off > cleanup.bat
echo setlocal enabledelayedexpansion >> cleanup.bat
echo. >> cleanup.bat
echo :: Kill any running servers >> cleanup.bat
echo taskkill /F /IM python.exe /FI "WINDOWTITLE eq Backend Server" 2^>NUL >> cleanup.bat
echo taskkill /F /IM node.exe /FI "WINDOWTITLE eq Frontend Server" 2^>NUL >> cleanup.bat
echo. >> cleanup.bat
echo :: Clean up temporary files >> cleanup.bat
echo if exist "__pycache__" rd /s /q "__pycache__" >> cleanup.bat
echo if exist "*.pyc" del /f /q "*.pyc" >> cleanup.bat
echo if exist "logs" rd /s /q "logs" >> cleanup.bat
echo. >> cleanup.bat
echo echo 🧹 Cleanup complete! >> cleanup.bat

call :log "Consolidation complete!"
echo.
echo ✅ Consolidation and setup complete!
echo.
echo To run the application:
echo 1. Run run_app.bat
echo 2. Access the application at:
echo    - Backend: http://localhost:8000
echo    - Frontend: http://localhost:5173
echo.
echo To clean up:
echo - Run cleanup.bat
echo.
echo Log file: %LOG_FILE%

exit /b 0

:log
echo %date% %time% - %~1 >> "%LOG_FILE%"
echo %~1
exit /b 0 