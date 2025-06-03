@echo off

echo Starting project optimization...

REM Create and activate virtual environment if it doesn't exist
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Run optimization script (this will generate requirements files)
echo Running optimization script...
python optimize_project.py

REM Install backend requirements
if exist backend\requirements.txt (
    echo Installing backend requirements...
    pip install -r backend\requirements.txt
) else (
    echo WARNING: backend\requirements.txt not found!
)

REM Deactivate virtual environment
call venv\Scripts\deactivate.bat

echo Optimization process complete!
echo.
echo Next steps:
echo 1. Install frontend dependencies: cd frontend && npm install
echo 2. Start backend: cd backend && python server.py
echo 3. Start frontend: cd frontend && npm run dev
pause 