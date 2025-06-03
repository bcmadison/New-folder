import sys
sys.path.append('backend/core')
from logger import logger

print("Testing error logging...")

# Test different log levels
logger.logger.debug("This is a debug message")
logger.logger.info("This is an info message")
logger.logger.warning("This is a warning message")
logger.logger.error("This is an error message")

# Test exception logging
try:
    1 / 0
except Exception as e:
    logger.logger.error("Division by zero error", exc_info=True)

# Test API logging
logger.log_api_request(
    "GET",
    "http://example.com/api/test",
    headers={"Authorization": "Bearer xxx"},
    response={"status": 200, "data": "test"}
)

# Generate error report
report = logger.create_error_report()
print(f"\nError report created: {report}")
print("\nCheck the logs directory for log files!")
