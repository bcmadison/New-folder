@echo off
echo Setting up AI Sports Betting Platform...

:: Create and activate Python virtual environment
if not exist "backend\.venv" (
    echo Creating Python virtual environment...
    python -m venv backend\.venv
)

:: Activate virtual environment and install backend dependencies
call backend\.venv\Scripts\activate
echo Installing backend dependencies...
pip install -r backend\requirements.txt

:: Install frontend dependencies
echo Installing frontend dependencies...
cd frontend
call npm install
cd ..

:: Start backend server
start cmd /k "cd backend && call .venv\Scripts\activate && python server.py"

:: Start frontend development server
start cmd /k "cd frontend && npm run dev"

echo.
echo Application started successfully!
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo.
echo Press any key to stop all servers...
pause > nul

:: Kill all Python and Node processes
taskkill /F /IM python.exe
taskkill /F /IM node.exe 