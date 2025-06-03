import logging
import sys
import atexit
import signal
from types import FrameType
from typing import Any, Optional, Type
from datetime import datetime
from pathlib import Path

class AutoExportLogger:
    def __init__(self, name: str = "app", log_dir: str = "logs") -> None:
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(exist_ok=True)
        self.session_id = datetime.now().strftime('%Y%m%d_%H%M%S')
        log_file = self.log_dir / f"session_{self.session_id}.log"

        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.DEBUG)

        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

        fh = logging.FileHandler(log_file, encoding="utf-8")
        fh.setLevel(logging.DEBUG)
        fh.setFormatter(formatter)

        ch = logging.StreamHandler()
        ch.setLevel(logging.INFO)
        ch.setFormatter(formatter)

        self.logger.addHandler(fh)
        self.logger.addHandler(ch)

        # Register global exception and signal handlers
        sys.excepthook = self.handle_exception
        signal.signal(signal.SIGTERM, self.signal_handler)
        signal.signal(signal.SIGINT, self.signal_handler)

        atexit.register(self.export_logs)
        self.logger.info(f"Logger started - Session: {self.session_id}")

    def export_logs(self) -> None:
        self.logger.info("Exporting logs...")
        print(f"\nLogs saved to: logs/session_{self.session_id}.log")

    def handle_exception(self, exc_type: Type[BaseException], exc_value: BaseException, exc_traceback: Optional[Any]) -> None:
        if issubclass(exc_type, KeyboardInterrupt):
            self.export_logs()
            sys.__excepthook__(exc_type, exc_value, exc_traceback)
            return
        self.logger.critical("Unhandled exception", exc_info=(exc_type, exc_value, exc_traceback))
        self.export_logs()

    def signal_handler(self, signum: int, frame: Optional[FrameType]) -> None:
        self.logger.info(f"Received signal {signum}, exporting logs...")
        self.export_logs()
        sys.exit(0)

# Global logger
logger = AutoExportLogger()
