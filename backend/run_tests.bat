@echo off

REM Install test dependencies
pip install -r requirements-test.txt

REM Run tests with coverage
pytest 