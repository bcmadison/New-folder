@echo off
echo ============================================
echo Setting up Comprehensive Error Logging
echo ============================================
echo.

REM Create logs directory
if not exist logs mkdir logs

REM Create Python error logger
echo Creating Python error logger...
(
echo import logging
echo import sys
echo import traceback
echo import json
echo from datetime import datetime
echo import os
echo from pathlib import Path
echo.
echo class ComprehensiveLogger:
echo     def __init__(self, name="app", log_dir="logs"^):
echo         self.log_dir = Path(log_dir^)
echo         self.log_dir.mkdir(exist_ok=True^)
echo         
echo         # Create formatters
echo         self.detailed_formatter = logging.Formatter(
echo             '%(asctime^)s - %(name^)s - %(levelname^)s - %(filename^)s:%(lineno^)d - %(message^)s'
echo         ^)
echo         
echo         # Setup main logger
echo         self.logger = logging.getLogger(name^)
echo         self.logger.setLevel(logging.DEBUG^)
echo         
echo         # File handler for all logs
echo         all_logs = self.log_dir / f"{name}_all_{datetime.now(^).strftime('%%Y%%m%%d'^^)}.log"
echo         fh_all = logging.FileHandler(all_logs, encoding='utf-8'^)
echo         fh_all.setLevel(logging.DEBUG^)
echo         fh_all.setFormatter(self.detailed_formatter^)
echo         
echo         # File handler for errors only
echo         error_logs = self.log_dir / f"{name}_errors_{datetime.now(^).strftime('%%Y%%m%%d'^^)}.log"
echo         fh_error = logging.FileHandler(error_logs, encoding='utf-8'^)
echo         fh_error.setLevel(logging.ERROR^)
echo         fh_error.setFormatter(self.detailed_formatter^)
echo         
echo         # Console handler
echo         ch = logging.StreamHandler(^)
echo         ch.setLevel(logging.INFO^)
echo         ch.setFormatter(self.detailed_formatter^)
echo         
echo         # Add handlers
echo         self.logger.addHandler(fh_all^)
echo         self.logger.addHandler(fh_error^)
echo         self.logger.addHandler(ch^)
echo         
echo         # Setup exception hook
echo         sys.excepthook = self.handle_exception
echo         
echo     def handle_exception(self, exc_type, exc_value, exc_traceback^):
echo         """Catch all unhandled exceptions"""
echo         if issubclass(exc_type, KeyboardInterrupt^):
echo             sys.__excepthook__(exc_type, exc_value, exc_traceback^)
echo             return
echo             
echo         self.logger.critical(
echo             "Unhandled exception",
echo             exc_info=(exc_type, exc_value, exc_traceback^)
echo         ^)
echo         
echo     def log_api_request(self, method, url, headers=None, body=None, response=None^):
echo         """Log API requests and responses"""
echo         log_data = {
echo             "timestamp": datetime.now(^).isoformat(^),
echo             "method": method,
echo             "url": url,
echo             "headers": headers,
echo             "body": body,
echo             "response": response
echo         }
echo         
echo         api_log = self.log_dir / f"api_calls_{datetime.now(^).strftime('%%Y%%m%%d'^^)}.json"
echo         
echo         # Append to JSON file
echo         try:
echo             with open(api_log, 'a', encoding='utf-8'^) as f:
echo                 json.dump(log_data, f^)
echo                 f.write('\n'^)
echo         except Exception as e:
echo             self.logger.error(f"Failed to log API call: {e}"^)
echo             
echo     def create_error_report(self^):
echo         """Create a comprehensive error report for sharing"""
echo         report_file = self.log_dir / f"error_report_{datetime.now(^).strftime('%%Y%%m%%d_%%H%%M%%S'^^)}.txt"
echo         
echo         with open(report_file, 'w', encoding='utf-8'^) as f:
echo             f.write("=== COMPREHENSIVE ERROR REPORT ===\n"^)
echo             f.write(f"Generated: {datetime.now(^)}\n"^)
echo             f.write(f"Python Version: {sys.version}\n"^)
echo             f.write(f"Platform: {sys.platform}\n\n"^)
echo             
echo             # Get last 100 lines from error log
echo             error_log = self.log_dir / f"app_errors_{datetime.now(^).strftime('%%Y%%m%%d'^^)}.log"
echo             if error_log.exists(^):
echo                 f.write("=== RECENT ERRORS ===\n"^)
echo                 with open(error_log, 'r', encoding='utf-8'^) as ef:
echo                     lines = ef.readlines(^)
echo                     f.writelines(lines[-100:]^)
echo                     
echo         return report_file
echo.
echo # Global logger instance
echo logger = ComprehensiveLogger(^)
) > backend\core\logger.py

REM Update server.py to use logger
echo.
echo Updating server.py with error logging...
(
echo import sys
echo sys.path.append('core'^)
echo from logger import logger
echo.
echo # Add to existing imports in server.py
echo logger.logger.info("Starting AI Sports Betting Platform..."^)
echo.
echo # Wrap all routes with try-except
echo from functools import wraps
echo.
echo def log_errors(func^):
echo     @wraps(func^)
echo     async def wrapper(*args, **kwargs^):
echo         try:
echo             logger.logger.info(f"Calling {func.__name__}"^)
echo             result = await func(*args, **kwargs^)
echo             return result
echo         except Exception as e:
echo             logger.logger.error(f"Error in {func.__name__}: {str(e^)}", exc_info=True^)
echo             raise
echo     return wrapper
) > backend\add_to_server.txt

REM Create frontend error logger
echo.
echo Creating frontend error logger...
(
echo // errorLogger.js - Comprehensive frontend error logging
echo class ErrorLogger {
echo   constructor(^) {
echo     this.errors = [];
echo     this.apiCalls = [];
echo     this.setupGlobalHandlers(^);
echo   }
echo.
echo   setupGlobalHandlers(^) {
echo     // Catch unhandled errors
echo     window.addEventListener('error', (event^) =^> {
echo       this.logError({
echo         type: 'javascript-error',
echo         message: event.message,
echo         filename: event.filename,
echo         lineno: event.lineno,
echo         colno: event.colno,
echo         stack: event.error?.stack,
echo         timestamp: new Date(^).toISOString(^)
echo       }^);
echo     }^);
echo.
echo     // Catch promise rejections
echo     window.addEventListener('unhandledrejection', (event^) =^> {
echo       this.logError({
echo         type: 'unhandled-promise-rejection',
echo         reason: event.reason,
echo         promise: event.promise,
echo         timestamp: new Date(^).toISOString(^)
echo       }^);
echo     }^);
echo.
echo     // Intercept console.error
echo     const originalError = console.error;
echo     console.error = (...args^) =^> {
echo       this.logError({
echo         type: 'console-error',
echo         message: args.join(' '^),
echo         timestamp: new Date(^).toISOString(^)
echo       }^);
echo       originalError.apply(console, args^);
echo     };
echo.
echo     // Intercept fetch for API logging
echo     const originalFetch = window.fetch;
echo     window.fetch = async (...args^) =^> {
echo       const start = Date.now(^);
echo       const [url, options = {}] = args;
echo       
echo       try {
echo         const response = await originalFetch(...args^);
echo         const duration = Date.now(^) - start;
echo         
echo         this.logApiCall({
echo           url,
echo           method: options.method ^|^| 'GET',
echo           status: response.status,
echo           statusText: response.statusText,
echo           duration,
echo           timestamp: new Date(^).toISOString(^),
echo           ok: response.ok
echo         }^);
echo         
echo         if (!response.ok^) {
echo           this.logError({
echo             type: 'api-error',
echo             url,
echo             status: response.status,
echo             statusText: response.statusText,
echo             timestamp: new Date(^).toISOString(^)
echo           }^);
echo         }
echo         
echo         return response;
echo       } catch (error^) {
echo         this.logError({
echo           type: 'fetch-error',
echo           url,
echo           error: error.message,
echo           timestamp: new Date(^).toISOString(^)
echo         }^);
echo         throw error;
echo       }
echo     };
echo   }
echo.
echo   logError(error^) {
echo     this.errors.push(error^);
echo     
echo     // Store in localStorage
echo     try {
echo       const stored = JSON.parse(localStorage.getItem('app_errors'^) ^|^| '[]'^);
echo       stored.push(error^);
echo       // Keep only last 100 errors
echo       if (stored.length ^> 100^) stored.shift(^);
echo       localStorage.setItem('app_errors', JSON.stringify(stored^)^);
echo     } catch (e^) {
echo       console.warn('Failed to store error:', e^);
echo     }
echo   }
echo.
echo   logApiCall(call^) {
echo     this.apiCalls.push(call^);
echo     
echo     // Store in localStorage
echo     try {
echo       const stored = JSON.parse(localStorage.getItem('app_api_calls'^) ^|^| '[]'^);
echo       stored.push(call^);
echo       // Keep only last 50 API calls
echo       if (stored.length ^> 50^) stored.shift(^);
echo       localStorage.setItem('app_api_calls', JSON.stringify(stored^)^);
echo     } catch (e^) {
echo       console.warn('Failed to store API call:', e^);
echo     }
echo   }
echo.
echo   generateReport(^) {
echo     const report = {
echo       generated: new Date(^).toISOString(^),
echo       userAgent: navigator.userAgent,
echo       url: window.location.href,
echo       errors: this.errors,
echo       apiCalls: this.apiCalls,
echo       localStorage: {
echo         errors: JSON.parse(localStorage.getItem('app_errors'^) ^|^| '[]'^),
echo         apiCalls: JSON.parse(localStorage.getItem('app_api_calls'^) ^|^| '[]'^)
echo       }
echo     };
echo     
echo     return report;
echo   }
echo.
echo   downloadReport(^) {
echo     const report = this.generateReport(^);
echo     const blob = new Blob([JSON.stringify(report, null, 2^)], { type: 'application/json' }^);
echo     const url = URL.createObjectURL(blob^);
echo     const a = document.createElement('a'^);
echo     a.href = url;
echo     a.download = `error_report_${new Date(^).getTime(^)}.json`;
echo     a.click(^);
echo     URL.revokeObjectURL(url^);
echo   }
echo.
echo   clearLogs(^) {
echo     this.errors = [];
echo     this.apiCalls = [];
echo     localStorage.removeItem('app_errors'^);
echo     localStorage.removeItem('app_api_calls'^);
echo   }
echo }
echo.
echo // Create global instance
echo window.errorLogger = new ErrorLogger(^);
echo.
echo // Add error report button to page
echo window.addEventListener('load', (^) =^> {
echo   const button = document.createElement('button'^);
echo   button.textContent = 'Download Error Report';
echo   button.style.cssText = 'position:fixed;bottom:10px;right:10px;z-index:9999;padding:10px;background:#ff4444;color:white;border:none;border-radius:5px;cursor:pointer;';
echo   button.onclick = (^) =^> window.errorLogger.downloadReport(^);
echo   document.body.appendChild(button^);
echo }^);
echo.
echo export default window.errorLogger;
) > frontend\src\errorLogger.js

REM Create error collection script
echo.
echo Creating error collection script...
(
echo @echo off
echo echo ============================================
echo echo Collecting Error Logs
echo echo ============================================
echo echo.
echo.
echo REM Create error report directory
echo set REPORT_DIR=error_reports_%%date:~-4,4%%%%date:~-10,2%%%%date:~-7,2%%_%%time:~0,2%%%%time:~3,2%%%%time:~6,2%%
echo set REPORT_DIR=%%REPORT_DIR: =0%%
echo mkdir %%REPORT_DIR%%
echo.
echo REM Copy all log files
echo echo Collecting backend logs...
echo if exist logs\*.log copy logs\*.log %%REPORT_DIR%%\
echo if exist logs\*.json copy logs\*.json %%REPORT_DIR%%\
echo.
echo echo Collecting frontend logs...
echo if exist frontend\*.log copy frontend\*.log %%REPORT_DIR%%\
echo.
echo REM Create system info
echo echo Creating system info...
echo (
echo echo System Information Report
echo echo ========================
echo echo.
echo echo Date: %%date%% %%time%%
echo echo.
echo echo Python Version:
echo python --version
echo echo.
echo echo Node Version:
echo node --version
echo echo.
echo echo NPM Version:
echo npm --version
echo echo.
echo echo Current Directory:
echo cd
echo echo.
echo echo Directory Contents:
echo dir /s /b
echo ^) ^> %%REPORT_DIR%%\system_info.txt
echo.
echo REM Create summary
echo echo Creating summary...
echo (
echo echo Error Report Summary
echo echo ===================
echo echo.
echo echo This folder contains:
echo echo - All backend Python logs
echo echo - All frontend JavaScript logs  
echo echo - API call logs
echo echo - System information
echo echo.
echo echo To share with support:
echo echo 1. Zip this entire folder
echo echo 2. Upload to file sharing service
echo echo 3. Share the link
echo echo.
echo echo Latest errors are at the bottom of each log file.
echo ^) ^> %%REPORT_DIR%%\README.txt
echo.
echo echo ============================================
echo echo Error logs collected in: %%REPORT_DIR%%
echo echo ============================================
echo echo.
echo echo You can now zip and share the %%REPORT_DIR%% folder
echo echo.
echo pause
) > collect_errors.bat

REM Create test error generator
echo.
echo Creating error test script...
(
echo import sys
echo sys.path.append('backend/core'^)
echo from logger import logger
echo.
echo print("Testing error logging..."^)
echo.
echo # Test different log levels
echo logger.logger.debug("This is a debug message"^)
echo logger.logger.info("This is an info message"^)
echo logger.logger.warning("This is a warning message"^)
echo logger.logger.error("This is an error message"^)
echo.
echo # Test exception logging
echo try:
echo     1 / 0
echo except Exception as e:
echo     logger.logger.error("Division by zero error", exc_info=True^)
echo.
echo # Test API logging
echo logger.log_api_request(
echo     "GET",
echo     "http://example.com/api/test",
echo     headers={"Authorization": "Bearer xxx"},
echo     response={"status": 200, "data": "test"}
echo ^)
echo.
echo # Generate error report
echo report = logger.create_error_report(^)
echo print(f"\nError report created: {report}"^)
echo print("\nCheck the logs directory for log files!"^)
) > test_error_logging.py

echo.
echo ============================================
echo Error Logging Setup Complete!
echo ============================================
echo.
echo HOW TO USE:
echo.
echo 1. Test the error logging:
echo    python test_error_logging.py
echo.
echo 2. When errors occur, collect them:
echo    double-click collect_errors.bat
echo.
echo 3. The frontend will show a red button to download errors
echo.
echo 4. All errors are saved in the 'logs' directory
echo.
pause