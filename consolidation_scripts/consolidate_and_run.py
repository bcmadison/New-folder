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
        self.root_dir = Path.cwd().parent  # Go up one level to the main project directory
        self.final_app_dir = self.root_dir / 'finalApp'
        self.scripts_dir = Path.cwd()
        self.logs_dir = self.root_dir / 'logs'

    def run(self):
        """Main consolidation process"""
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
            
            logging.info("Consolidation process complete!")
            
        except Exception as e:
            logging.error(f"Error during consolidation: {str(e)}")
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
        frontend_script = self.scripts_dir / 'consolidate_frontend.py'
        if not frontend_script.exists():
            raise FileNotFoundError(f"Frontend consolidation script not found: {frontend_script}")
        
        logging.info("Running frontend consolidation...")
        result = subprocess.run([sys.executable, str(frontend_script)], capture_output=True, text=True)
        
        if result.returncode != 0:
            logging.error(f"Frontend consolidation failed: {result.stderr}")
            raise RuntimeError("Frontend consolidation failed")
        
        logging.info("Frontend consolidation completed successfully")

    def _run_backend_consolidation(self):
        """Run backend consolidation script"""
        backend_script = self.scripts_dir / 'consolidate_backend.py'
        if not backend_script.exists():
            raise FileNotFoundError(f"Backend consolidation script not found: {backend_script}")
        
        logging.info("Running backend consolidation...")
        result = subprocess.run([sys.executable, str(backend_script)], capture_output=True, text=True)
        
        if result.returncode != 0:
            logging.error(f"Backend consolidation failed: {result.stderr}")
            raise RuntimeError("Backend consolidation failed")
        
        logging.info("Backend consolidation completed successfully")

    def _create_run_script(self):
        """Create run script for the application"""
        run_script_content = '''@echo off
echo Starting AI Sports Betting Platform...

:: Start backend server
start cmd /k "cd backend && python -m uvicorn main:app --reload --port 8000"

:: Start frontend development server
start cmd /k "cd frontend && npm run dev"

echo Application started successfully!
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
'''
        
        run_script_path = self.final_app_dir / 'run.bat'
        with open(run_script_path, 'w') as f:
            f.write(run_script_content)
        logging.info(f"Created run script: {run_script_path}")

if __name__ == "__main__":
    orchestrator = ConsolidationOrchestrator()
    orchestrator.run() 