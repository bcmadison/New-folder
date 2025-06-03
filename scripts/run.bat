@echo off
echo ===== Starting Application Servers =====
echo.

:: Start backend server
echo [1/2] Starting backend server...
start "Backend Server" cmd /c "cd backend && .venv\Scripts\activate.bat && python server.py"

:: Wait for backend to initialize
echo [INFO] Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

:: Start frontend server
echo [2/2] Starting frontend server...
start "Frontend Server" cmd /c "cd frontend && npm run dev"

echo.
echo ===== Servers Started =====
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Press any key to continue...
pause >nul
