@echo off
echo ========================================
echo AI Sports Betting Platform Setup
echo ========================================
echo.

REM Create requirements.txt
echo Creating backend/requirements.txt...
(
echo fastapi==0.104.1
echo uvicorn[standard]==0.24.0
echo aiohttp==3.9.0
echo numpy
echo scikit-learn
echo joblib
echo python-dotenv==1.0.0
echo websockets==12.0
echo beautifulsoup4==4.12.2
echo redis==5.0.1
echo pandas
echo shap
echo python-multipart==0.0.6
echo httpx==0.25.2
) > backend\requirements.txt

REM Create .env file
echo Creating .env file...
(
echo # API Keys
echo ODDS_API_KEY=8684be37505fc5ce63b0337d472af0ee
echo SPORTRADAR_API_KEY=zi7atwynSXOAyizHo1L3fR5Yv8mfBX12LccJbCHb
echo.
echo # App Settings
echo DEBUG=False
echo PORT=8000
echo HOST=0.0.0.0
) > .env

REM Create README.md
echo Creating README.md...
(
echo # AI Sports Betting Platform
echo.
echo ## Quick Start
echo Run start_app.bat to launch the application
echo.
echo ## Features
echo - PrizePicks Optimizer
echo - Real-time odds aggregation
echo - AI predictions
echo - Live scores
echo - Multi-sport support
) > README.md

REM Create the start_app.bat file
echo Creating start_app.bat...
(
echo @echo off
echo echo Starting AI Sports Betting Platform...
echo echo.
echo echo Starting Backend...
echo start cmd /k "cd backend && python server.py"
echo timeout /t 5 /nobreak ^> nul
echo echo Starting Frontend...
echo start cmd /k "cd frontend && npm start"
echo echo.
echo echo Platform is starting up!
echo echo Backend: http://localhost:8000
echo echo Frontend: http://localhost:3000
echo pause
) > start_app.bat

REM Install Python dependencies
echo.
echo Installing Python dependencies...
cd backend
pip install -r requirements.txt
cd ..

REM Check if frontend package.json exists
if not exist frontend\package.json (
    echo Creating frontend package.json...
    cd frontend
    npm init -y
    npm install react react-dom axios lucide-react recharts framer-motion
    npm install -D @vitejs/plugin-react vite tailwindcss postcss autoprefixer
    cd ..
) else (
    echo Installing frontend dependencies...
    cd frontend
    npm install
    cd ..
)

echo.
echo ========================================
echo SETUP COMPLETE!
echo ========================================
echo.
echo To run your app, double-click: start_app.bat
echo.
pause