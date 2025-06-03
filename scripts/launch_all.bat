@echo off

REM --- RUN ESPN SCRAPE AND ODDS UPDATER AT STARTUP ---
echo Updating ESPN player stats and odds...
start /wait cmd /c "cd backend && call .venv\Scripts\activate && python live\espn_scrape.py && python live\update_predictions.py"

REM --- START BACKEND ---
echo Starting backend server...
start cmd /k "cd backend && call .venv\Scripts\activate && python -m uvicorn server:app --reload"

REM --- START FRONTEND ---
echo Starting frontend dev server...
start cmd /k "cd frontend && npm run dev"

REM --- OPTIONAL: START ELECTRON DESKTOP APP ---
REM Uncomment the next line to launch as a desktop app after frontend is ready
REM start cmd /k "cd frontend && npx electron electron.js"

pause
