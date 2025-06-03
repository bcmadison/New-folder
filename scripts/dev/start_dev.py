#!/usr/bin/env python3
"""Development startup script for modernized AI Sports Betting Platform"""
import subprocess
import sys
import time
import os
from pathlib import Path
import logging
from datetime import datetime
import threading
import shutil

# --- Terminal Logger Setup ---
class TerminalLogger:
    def __init__(self, log_dir="logs", prefix="terminal_session", archive_dir="logs/archives", max_logs=10):
        self.log_dir = Path(log_dir)
        self.archive_dir = Path(archive_dir)
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self.archive_dir.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.log_file = self.log_dir / f"{prefix}_{timestamp}.log"
        self.logger = logging.getLogger(f"terminal_logger_{timestamp}")
        self.logger.setLevel(logging.INFO)
        handler = logging.FileHandler(self.log_file, encoding="utf-8")
        handler.setFormatter(logging.Formatter("%(asctime)s %(message)s"))
        self.logger.addHandler(handler)
        self.logger.propagate = False
        self.max_logs = max_logs
        self._rotate_logs()

    def log(self, message):
        self.logger.info(message)

    def _rotate_logs(self):
        logs = sorted(self.log_dir.glob("terminal_session_*.log"), key=lambda f: f.stat().st_mtime, reverse=True)
        for old_log in logs[self.max_logs:]:
            archive_path = self.archive_dir / old_log.name
            shutil.move(str(old_log), str(archive_path))

# --- Real-time output logging for subprocesses ---
def stream_and_log(proc, logger, label):
    for line in iter(proc.stdout.readline, ''):
        if not line:
            break
        print(line, end="")
        logger.log(f"{label} {line.strip()}")

# --- Start Development Environment ---
def start_dev():
    root = Path(__file__).parent.parent.parent
    term_logger = TerminalLogger()
    term_logger.log("=== Development environment starting ===")
    # Start backend (FastAPI)
    backend_cmd = [sys.executable, "-m", "uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]
    term_logger.log(f"Running backend: {' '.join(backend_cmd)}")
    backend_proc = subprocess.Popen(backend_cmd, cwd=root / "backend", stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
    backend_thread = threading.Thread(target=stream_and_log, args=(backend_proc, term_logger, "BACKEND"), daemon=True)
    backend_thread.start()
    # Wait for backend to start
    time.sleep(3)
    # Start frontend (Vite)
    frontend_cmd = ["npm", "run", "dev"]
    term_logger.log(f"Running frontend: {' '.join(frontend_cmd)}")
    frontend_proc = subprocess.Popen(frontend_cmd, cwd=root / "frontend", shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
    frontend_thread = threading.Thread(target=stream_and_log, args=(frontend_proc, term_logger, "FRONTEND"), daemon=True)
    frontend_thread.start()
    print("✅ Development environment started!")
    print("📍 Frontend: http://localhost:3000")
    print("📍 Backend: http://localhost:8000")
    print("📍 API Docs: http://localhost:8000/docs")
    try:
        frontend_thread.join()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down...")
        backend_proc.terminate()
        frontend_proc.terminate()
        term_logger.log("=== Development environment stopped ===")

if __name__ == "__main__":
    start_dev()
