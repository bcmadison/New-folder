@echo off
echo Starting automation process...

REM Install psutil if not already installed
pip install psutil

REM Run the automation script
python automate_consolidation.py

REM Check the exit code
if %ERRORLEVEL% EQU 0 (
    echo Automation completed successfully!
    echo Check automation.log for details.
) else (
    echo Automation failed!
    echo Check automation.log for details.
)

pause 