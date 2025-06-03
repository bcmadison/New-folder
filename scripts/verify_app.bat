@echo off
echo ===== AI Sports Betting Analytics Platform - Verification Script =====
echo.

:: Check backend health
echo [INFO] Checking backend health...
curl -s http://localhost:8000/api/health >nul
if errorlevel 1 (
    echo [ERROR] Backend is not responding
    echo Please ensure the backend server is running
    pause
    exit /b 1
)
echo [SUCCESS] Backend is healthy

:: Check frontend availability
echo [INFO] Checking frontend availability...
curl -s http://localhost:5173 >nul
if errorlevel 1 (
    echo [ERROR] Frontend is not responding
    echo Please ensure the frontend server is running
    pause
    exit /b 1
)
echo [SUCCESS] Frontend is accessible

:: Check PrizePicks API integration
echo [INFO] Checking PrizePicks API integration...
curl -s http://localhost:8000/api/prizepicks/projections >nul
if errorlevel 1 (
    echo [WARNING] PrizePicks API integration may not be working
    echo This could be due to API rate limits or connectivity issues
) else (
    echo [SUCCESS] PrizePicks API integration is working
)

:: Check prediction endpoint
echo [INFO] Checking prediction endpoint...
curl -s http://localhost:8000/api/predict >nul
if errorlevel 1 (
    echo [WARNING] Prediction endpoint may not be fully functional
    echo This could be due to missing model files
) else (
    echo [SUCCESS] Prediction endpoint is accessible
)

:: Check WebSocket connection
echo [INFO] Checking WebSocket connection...
curl -s http://localhost:8000/ws >nul
if errorlevel 1 (
    echo [WARNING] WebSocket connection may not be available
) else (
    echo [SUCCESS] WebSocket connection is available
)

:: Check database connection
echo [INFO] Checking database connection...
curl -s http://localhost:8000/api/db/status >nul
if errorlevel 1 (
    echo [WARNING] Database connection may not be established
) else (
    echo [SUCCESS] Database connection is working
)

echo.
echo ===== Verification Complete =====
echo.
echo If you see any warnings above, please check the respective components
echo If you see any errors, the application may not be fully functional
echo.
echo Press any key to exit...
pause >nul 