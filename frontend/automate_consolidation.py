import os
import sys
import logging
import subprocess
import time
import psutil
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('automation.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

class AutomationManager:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.locked_files = set()

    def kill_processes_using_files(self):
        """Kill processes that are locking our files."""
        self.logger.info("Checking for processes using our files...")
        for proc in psutil.process_iter(['pid', 'name', 'open_files']):
            try:
                for file in proc.open_files():
                    if any(locked_file in file.path for locked_file in self.locked_files):
                        self.logger.info(f"Killing process {proc.pid} ({proc.name()}) using {file.path}")
                        proc.kill()
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue

    def setup_python_env(self):
        """Set up Python virtual environment and install dependencies."""
        self.logger.info("Setting up Python environment...")
        try:
            subprocess.run([sys.executable, "-m", "venv", "venv"], check=True)
            if os.name == 'nt':
                activate_script = os.path.join("venv", "Scripts", "activate")
                pip_cmd = [os.path.join("venv", "Scripts", "pip")]
            else:
                activate_script = os.path.join("venv", "bin", "activate")
                pip_cmd = [os.path.join("venv", "bin", "pip")]

            subprocess.run(pip_cmd + ["install", "pyyaml", "psutil"], check=True)
        except subprocess.CalledProcessError as e:
            self.logger.error(f"Failed to set up Python environment: {e}")
            raise

    def run_consolidation(self):
        """Run the consolidation script."""
        self.logger.info("Running consolidation script...")
        try:
            if os.name == 'nt':
                python_cmd = os.path.join("venv", "Scripts", "python")
            else:
                python_cmd = os.path.join("venv", "bin", "python")
            
            subprocess.run([python_cmd, "consolidate_and_optimize.py"], check=True)
        except subprocess.CalledProcessError as e:
            self.logger.error(f"Consolidation script failed: {e}")
            raise

    def verify_consolidation(self):
        """Verify that consolidation completed successfully."""
        self.logger.info("Verifying consolidation results...")
        required_dirs = [
            "frontend/src",
            "frontend/public",
            "frontend/dist",
            "scripts",
            "data",
            "logs",
            "config"
        ]
        
        missing_dirs = []
        for dir_path in required_dirs:
            if not os.path.exists(dir_path):
                missing_dirs.append(dir_path)
                self.logger.error(f"Missing required directory: {dir_path}")
        
        if missing_dirs:
            self.logger.error("Consolidation verification failed")
            return False
        
        self.logger.info("Consolidation verification passed")
        return True

    def cleanup(self):
        """Clean up temporary files and processes."""
        self.logger.info("Cleaning up...")
        self.kill_processes_using_files()
        # Add any additional cleanup steps here

    def run(self):
        """Run the complete automation process."""
        try:
            self.logger.info("Starting automation process")
            self.setup_python_env()
            self.run_consolidation()
            if not self.verify_consolidation():
                raise Exception("Consolidation verification failed")
            self.cleanup()
            self.logger.info("Automation completed successfully")
            return True
        except Exception as e:
            self.logger.error(f"Automation failed: {e}")
            return False

if __name__ == "__main__":
    manager = AutomationManager()
    success = manager.run()
    sys.exit(0 if success else 1) 