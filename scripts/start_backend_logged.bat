@echo off
echo Starting Backend with Auto-Export Logging...

cd backend

REM Run Python with cleanup on exit
python -c "import sys; sys.path.append('core'); from auto_logger import logger; logger.logger.info('Backend starting...'); exec(open('server.py').read())"

echo.
echo Backend stopped. Logs have been exported.
pause
