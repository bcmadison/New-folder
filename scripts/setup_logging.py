import os
import sys
import logging
import logging.handlers
from pathlib import Path
from typing import Optional

class LoggingSetup:
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.logs_dir = self.project_root / 'logs'
        self.log_file = self.logs_dir / 'app.log'
        self.error_log = self.logs_dir / 'error.log'
        self.debug_log = self.logs_dir / 'debug.log'

    def setup_logging(self) -> bool:
        """Set up logging configuration"""
        try:
            # Create logs directory if it doesn't exist
            self.logs_dir.mkdir(parents=True, exist_ok=True)

            # Configure root logger
            root_logger = logging.getLogger()
            root_logger.setLevel(logging.DEBUG)

            # Remove existing handlers
            for handler in root_logger.handlers[:]:
                root_logger.removeHandler(handler)

            # Add file handlers
            self._add_file_handler(root_logger, self.log_file, logging.INFO)
            self._add_file_handler(root_logger, self.error_log, logging.ERROR)
            self._add_file_handler(root_logger, self.debug_log, logging.DEBUG)

            # Add console handler
            console_handler = logging.StreamHandler()
            console_handler.setLevel(logging.INFO)
            console_formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            console_handler.setFormatter(console_formatter)
            root_logger.addHandler(console_handler)

            # Configure specific loggers
            self._configure_module_loggers()

            return True
        except Exception as e:
            print(f"Failed to set up logging: {str(e)}")
            return False

    def _add_file_handler(
        self,
        logger: logging.Logger,
        log_file: Path,
        level: int,
        max_bytes: int = 10485760,  # 10MB
        backup_count: int = 5
    ) -> None:
        """Add a rotating file handler to the logger"""
        handler = logging.handlers.RotatingFileHandler(
            log_file,
            maxBytes=max_bytes,
            backupCount=backup_count
        )
        handler.setLevel(level)
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    def _configure_module_loggers(self) -> None:
        """Configure logging for specific modules"""
        # Backend logging
        backend_logger = logging.getLogger('backend')
        backend_logger.setLevel(logging.DEBUG)

        # Frontend logging
        frontend_logger = logging.getLogger('frontend')
        frontend_logger.setLevel(logging.DEBUG)

        # ML service logging
        ml_logger = logging.getLogger('ml_service')
        ml_logger.setLevel(logging.DEBUG)

        # API logging
        api_logger = logging.getLogger('api')
        api_logger.setLevel(logging.DEBUG)

    def test_logging(self) -> bool:
        """Test logging configuration"""
        try:
            logger = logging.getLogger(__name__)
            
            # Test different log levels
            logger.debug("This is a debug message")
            logger.info("This is an info message")
            logger.warning("This is a warning message")
            logger.error("This is an error message")
            
            # Test module-specific logging
            backend_logger = logging.getLogger('backend')
            backend_logger.info("This is a backend message")
            
            frontend_logger = logging.getLogger('frontend')
            frontend_logger.info("This is a frontend message")
            
            return True
        except Exception as e:
            print(f"Failed to test logging: {str(e)}")
            return False

def main():
    setup = LoggingSetup()
    
    # Set up logging
    if not setup.setup_logging():
        print("Failed to set up logging")
        sys.exit(1)
    
    # Test logging
    if not setup.test_logging():
        print("Failed to test logging")
        sys.exit(1)
    
    print("Logging setup completed successfully!")
    sys.exit(0)

if __name__ == '__main__':
    main() 