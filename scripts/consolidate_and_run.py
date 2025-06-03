#!/usr/bin/env python3
"""
Main Consolidation Script
Orchestrates the consolidation of both frontend and backend code
"""

import os
import sys
import subprocess
import logging
from pathlib import Path
from datetime import datetime

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'logs/consolidation_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)

class ConsolidationOrchestrator:
    def __init__(self):
        self.root_dir = Path.cwd()
        self.final_app_dir = self.root_dir / 'finalApp'
        self.scripts_dir = self.root_dir / 'scripts'
        self.logs_dir = self.root_dir / 'logs'

    def run(self):
        """Main orchestration process"""
        try:
            logging.info("Starting consolidation process...")
            
            # Create necessary directories
            self._create_directories()
            
            # Run frontend consolidation
            self._run_frontend_consolidation()
            
            # Run backend consolidation
            self._run_backend_consolidation()
            
            # Create run script
            self._create_run_script()
            
            logging.info("Consolidation process completed successfully!")
            
        except Exception as e:
            logging.error(f"Consolidation failed: {str(e)}")
            sys.exit(1)

    def _create_directories(self):
        """Create necessary directories"""
        directories = [
            self.final_app_dir,
            self.final_app_dir / 'frontend',
            self.final_app_dir / 'backend',
            self.logs_dir
        ]
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
            logging.info(f"Created directory: {directory}")

    def _run_frontend_consolidation(self):
        """Run frontend consolidation script"""
        logging.info("Running frontend consolidation...")
        
        frontend_script = self.scripts_dir / 'consolidate_frontend.py'
        if not frontend_script.exists():
            raise FileNotFoundError(f"Frontend consolidation script not found: {frontend_script}")
        
        result = subprocess.run(
            [sys.executable, str(frontend_script)],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            raise RuntimeError(f"Frontend consolidation failed: {result.stderr}")
        
        logging.info("Frontend consolidation completed successfully")

    def _run_backend_consolidation(self):
        """Run backend consolidation script"""
        logging.info("Running backend consolidation...")
        
        backend_script = self.scripts_dir / 'consolidate_backend.py'
        if not backend_script.exists():
            raise FileNotFoundError(f"Backend consolidation script not found: {backend_script}")
        
        result = subprocess.run(
            [sys.executable, str(backend_script)],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            raise RuntimeError(f"Backend consolidation failed: {result.stderr}")
        
        logging.info("Backend consolidation completed successfully")

    def _create_run_script(self):
        """Create the run script"""
        run_script_content = '''@echo off
echo Starting AI Sports Betting Platform...

:: Start backend server
start cmd /k "cd backend && python -m uvicorn main:app --reload --port 8000"

:: Wait for backend to start
timeout /t 5

:: Start frontend development server
start cmd /k "cd frontend && npm run dev"

echo Platform is starting up...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
'''
        
        run_script_path = self.final_app_dir / 'run.bat'
        with open(run_script_path, 'w') as f:
            f.write(run_script_content)
        
        logging.info(f"Created run script: {run_script_path}")

if __name__ == "__main__":
    orchestrator = ConsolidationOrchestrator()
    orchestrator.run() 