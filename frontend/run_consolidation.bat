@echo off
echo Starting project consolidation process...

:: Create and activate virtual environment
python -m venv venv
call venv\Scripts\activate

:: Install required packages
pip install pyyaml

:: Run the consolidation script
python consolidate_and_optimize.py

:: Deactivate virtual environment
deactivate

echo Consolidation process completed.
echo Check consolidation.log for details.
pause 