@echo off
echo ============================================
echo Setting up Auto-Export Error Logging
echo ============================================
echo.

REM Create logs directory
if not exist logs mkdir logs
if not exist logs\archives mkdir logs\archives

REM Create enhanced Python logger with auto-export
echo Creating enhanced Python logger...
(
echo import logging
echo import sys
echo import traceback
echo import json
echo import atexit
echo import signal
echo import shutil
echo from datetime import datetime
echo import os
echo from pathlib import Path
echo import threading
echo import time
echo.
echo class AutoExportLogger:
echo     def __init__(self, name="app", log_dir="logs"^):
echo         self.log_dir = Path(log_dir^)
echo         self.log_dir.mkdir(exist_ok=True^)
echo         self.session_id = datetime.now(^).strftime('%%Y%%m%%d_%%H%%M%%S'^)
echo         self.temp_dir = self.log_dir / f"temp_{self.session_id}"
echo         self.temp_dir.mkdir(exist_ok=True^)
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
echo         # File handlers in temp directory
echo         self.all_log_file = self.temp_dir / f"{name}_all.log"
echo         self.error_log_file = self.temp_dir / f"{name}_errors.log"
echo         self.api_log_file = self.temp_dir / f"api_calls.json"
echo         
echo         # All logs handler
echo         fh_all = logging.FileHandler(self.all_log_file, encoding='utf-8'^)
echo         fh_all.setLevel(logging.DEBUG^)
echo         fh_all.setFormatter(self.detailed_formatter^)
echo         
echo         # Error logs handler
echo         fh_error = logging.FileHandler(self.error_log_file, encoding='utf-8'^)
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
echo         # Register cleanup handlers
echo         atexit.register(self.export_logs^)
echo         signal.signal(signal.SIGINT, self.signal_handler^)
echo         signal.signal(signal.SIGTERM, self.signal_handler^)
echo         
echo         # Start background log flusher
echo         self.flush_thread = threading.Thread(target=self.periodic_flush, daemon=True^)
echo         self.flush_thread.start(^)
echo         
echo         self.logger.info(f"Logger initialized with session ID: {self.session_id}"^)
echo         
echo     def periodic_flush(self^):
echo         """Flush logs every 10 seconds"""
echo         while True:
echo             time.sleep(10^)
echo             for handler in self.logger.handlers:
echo                 if hasattr(handler, 'flush'^):
echo                     handler.flush(^)
echo                     
echo     def signal_handler(self, signum, frame^):
echo         """Handle termination signals"""
echo         self.logger.info(f"Received signal {signum}, exporting logs..."^)
echo         self.export_logs(^)
echo         sys.exit(0^)
echo         
echo     def handle_exception(self, exc_type, exc_value, exc_traceback^):
echo         """Catch all unhandled exceptions"""
echo         if issubclass(exc_type, KeyboardInterrupt^):
echo             self.export_logs(^)
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
echo             "session_id": self.session_id,
echo             "method": method,
echo             "url": url,
echo             "headers": headers,
echo             "body": body,
echo             "response": response
echo         }
echo         
echo         try:
echo             with open(self.api_log_file, 'a', encoding='utf-8'^) as f:
echo                 json.dump(log_data, f^)
echo                 f.write('\n'^)
echo         except Exception as e:
echo             self.logger.error(f"Failed to log API call: {e}"^)
echo             
echo     def export_logs(self^):
echo         """Export all logs to the main logs directory"""
echo         try:
echo             self.logger.info("Exporting logs..."^)
echo             
echo             # Flush all handlers
echo             for handler in self.logger.handlers:
echo                 if hasattr(handler, 'flush'^):
echo                     handler.flush(^)
echo                     
echo             # Create export directory
echo             export_dir = self.log_dir / f"session_{self.session_id}"
echo             export_dir.mkdir(exist_ok=True^)
echo             
echo             # Copy all log files
echo             for log_file in self.temp_dir.glob('*'^):
echo                 if log_file.is_file(^):
echo                     shutil.copy2(log_file, export_dir / log_file.name^)
echo                     
echo             # Create session summary
echo             summary_file = export_dir / "session_summary.txt"
echo             with open(summary_file, 'w', encoding='utf-8'^) as f:
echo                 f.write(f"Session ID: {self.session_id}\n"^)
echo                 f.write(f"Start Time: {self.session_id}\n"^)
echo                 f.write(f"End Time: {datetime.now(^).strftime('%%Y%%m%%d_%%H%%M%%S'^)}\n"^)
echo                 f.write(f"Python Version: {sys.version}\n"^)
echo                 f.write(f"Platform: {sys.platform}\n\n"^)
echo                 
echo                 # Count errors
echo                 if self.error_log_file.exists(^):
echo                     error_count = sum(1 for line in open(self.error_log_file, 'r', encoding='utf-8'^)^)
echo                     f.write(f"Total Errors: {error_count}\n"^)
echo                     
echo             # Create latest symlink (Windows compatible^)
echo             latest_file = self.log_dir / "LATEST_SESSION.txt"
echo             with open(latest_file, 'w'^) as f:
echo                 f.write(str(export_dir.absolute(^)^)^)
echo                 
echo             print(f"\nLogs exported to: {export_dir}"^)
echo             
echo         except Exception as e:
echo             print(f"Failed to export logs: {e}"^)
echo             
echo # Global logger instance
echo logger = AutoExportLogger(^)
echo.
echo # Ensure export on module unload
echo def cleanup(^):
echo     logger.export_logs(^)
echo     
echo atexit.register(cleanup^)
) > backend\core\auto_logger.py

REM Create backend wrapper script
echo.
echo Creating backend wrapper with auto-export...
(
echo @echo off
echo echo Starting Backend with Auto-Export Logging...
echo.
echo cd backend
echo.
echo REM Run Python with cleanup on exit
echo python -c "import sys; sys.path.append('core'); from auto_logger import logger; logger.logger.info('Backend starting...'); exec(open('server.py').read())"
echo.
echo echo.
echo echo Backend stopped. Logs have been exported.
echo pause
) > start_backend_logged.bat

REM Create frontend logger with auto-export
echo.
echo Creating frontend auto-export logger...
(
echo // autoExportLogger.js - Frontend logger with automatic export on close
echo class AutoExportLogger {
echo   constructor() {
echo     this.sessionId = new Date().toISOString().replace(/[:.]/g, '-');
echo     this.errors = [];
echo     this.apiCalls = [];
echo     this.logs = [];
echo     this.startTime = new Date();
echo     
echo     this.setupGlobalHandlers();
echo     this.setupExportHandlers();
echo     
echo     // Log session start
echo     this.log('info', 'Frontend session started', { sessionId: this.sessionId });
echo   }
echo.
echo   setupGlobalHandlers() {
echo     // Catch unhandled errors
echo     window.addEventListener('error', (event) =^> {
echo       this.logError({
echo         type: 'javascript-error',
echo         message: event.message,
echo         filename: event.filename,
echo         lineno: event.lineno,
echo         colno: event.colno,
echo         stack: event.error?.stack,
echo         timestamp: new Date().toISOString()
echo       });
echo     });
echo.
echo     // Catch promise rejections
echo     window.addEventListener('unhandledrejection', (event) =^> {
echo       this.logError({
echo         type: 'unhandled-promise-rejection',
echo         reason: event.reason,
echo         timestamp: new Date().toISOString()
echo       });
echo     });
echo.
echo     // Intercept console methods
echo     ['log', 'info', 'warn', 'error'].forEach(method =^> {
echo       const original = console[method];
echo       console[method] = (...args) =^> {
echo         this.log(method, args.join(' '));
echo         original.apply(console, args);
echo       };
echo     });
echo.
echo     // Intercept fetch for API logging
echo     const originalFetch = window.fetch;
echo     window.fetch = async (...args) =^> {
echo       const start = Date.now();
echo       const [url, options = {}] = args;
echo       
echo       try {
echo         const response = await originalFetch(...args);
echo         const duration = Date.now() - start;
echo         
echo         this.logApiCall({
echo           url,
echo           method: options.method ^|^| 'GET',
echo           status: response.status,
echo           statusText: response.statusText,
echo           duration,
echo           timestamp: new Date().toISOString(),
echo           ok: response.ok
echo         });
echo         
echo         return response;
echo       } catch (error) {
echo         this.logError({
echo           type: 'fetch-error',
echo           url,
echo           error: error.message,
echo           timestamp: new Date().toISOString()
echo         });
echo         throw error;
echo       }
echo     };
echo   }
echo.
echo   setupExportHandlers() {
echo     // Export on page unload
echo     window.addEventListener('beforeunload', (event) =^> {
echo       this.exportLogs();
echo     });
echo.
echo     // Export on visibility change (tab close)
echo     document.addEventListener('visibilitychange', () =^> {
echo       if (document.visibilityState === 'hidden') {
echo         this.exportLogs();
echo       }
echo     });
echo.
echo     // Export periodically
echo     setInterval(() =^> {
echo       this.exportLogs(false);
echo     }, 30000); // Every 30 seconds
echo.
echo     // Add keyboard shortcut for manual export
echo     document.addEventListener('keydown', (e) =^> {
echo       if (e.ctrlKey ^&^& e.shiftKey ^&^& e.key === 'L') {
echo         this.downloadReport();
echo       }
echo     });
echo   }
echo.
echo   log(level, message, data = {}) {
echo     const logEntry = {
echo       timestamp: new Date().toISOString(),
echo       level,
echo       message,
echo       data,
echo       sessionId: this.sessionId
echo     };
echo     
echo     this.logs.push(logEntry);
echo     
echo     // Keep only last 1000 logs in memory
echo     if (this.logs.length ^> 1000) {
echo       this.logs.shift();
echo     }
echo   }
echo.
echo   logError(error) {
echo     this.errors.push(error);
echo     this.log('error', 'Error occurred', error);
echo   }
echo.
echo   logApiCall(call) {
echo     this.apiCalls.push(call);
echo     this.log('api', `${call.method} ${call.url}`, call);
echo   }
echo.
echo   exportLogs(showAlert = true) {
echo     try {
echo       const exportData = {
echo         sessionId: this.sessionId,
echo         startTime: this.startTime,
echo         endTime: new Date(),
echo         duration: Date.now() - this.startTime.getTime(),
echo         userAgent: navigator.userAgent,
echo         url: window.location.href,
echo         logs: this.logs,
echo         errors: this.errors,
echo         apiCalls: this.apiCalls,
echo         summary: {
echo           totalLogs: this.logs.length,
echo           totalErrors: this.errors.length,
echo           totalApiCalls: this.apiCalls.length
echo         }
echo       };
echo.
echo       // Save to localStorage
echo       localStorage.setItem(`session_${this.sessionId}`, JSON.stringify(exportData));
echo       
echo       // Save list of sessions
echo       const sessions = JSON.parse(localStorage.getItem('log_sessions') ^|^| '[]');
echo       if (!sessions.includes(this.sessionId)) {
echo         sessions.push(this.sessionId);
echo         // Keep only last 10 sessions
echo         if (sessions.length ^> 10) {
echo           const removed = sessions.shift();
echo           localStorage.removeItem(`session_${removed}`);
echo         }
echo         localStorage.setItem('log_sessions', JSON.stringify(sessions));
echo       }
echo.
echo       // Send to backend if available
echo       this.sendToBackend(exportData);
echo       
echo       if (showAlert) {
echo         console.log('Logs exported successfully');
echo       }
echo     } catch (error) {
echo       console.error('Failed to export logs:', error);
echo     }
echo   }
echo.
echo   async sendToBackend(data) {
echo     try {
echo       await fetch('/api/logs/export', {
echo         method: 'POST',
echo         headers: {
echo           'Content-Type': 'application/json'
echo         },
echo         body: JSON.stringify(data)
echo       });
echo     } catch (error) {
echo       // Silently fail if backend is not available
echo     }
echo   }
echo.
echo   downloadReport() {
echo     this.exportLogs();
echo     
echo     const sessions = JSON.parse(localStorage.getItem('log_sessions') ^|^| '[]');
echo     const allData = {
echo       exported: new Date().toISOString(),
echo       sessions: sessions.map(sid =^> JSON.parse(localStorage.getItem(`session_${sid}`) ^|^| '{}'))
echo     };
echo     
echo     const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
echo     const url = URL.createObjectURL(blob);
echo     const a = document.createElement('a');
echo     a.href = url;
echo     a.download = `frontend_logs_${new Date().getTime()}.json`;
echo     a.click();
echo     URL.revokeObjectURL(url);
echo   }
echo }
echo.
echo // Create global instance
echo window.autoLogger = new AutoExportLogger();
echo.
echo // Add visual indicator
echo window.addEventListener('load', () =^> {
echo   const indicator = document.createElement('div');
echo   indicator.innerHTML = `
echo     ^<div style="position:fixed;bottom:10px;right:10px;z-index:9999;background:rgba(0,0,0,0.8);color:white;padding:10px;border-radius:5px;font-size:12px;"^>
echo       ^<div^>📊 Logging Active^</div^>
echo       ^<div style="margin-top:5px;"^>
echo         ^<button onclick="window.autoLogger.downloadReport()" style="background:#4CAF50;color:white;border:none;padding:5px 10px;border-radius:3px;cursor:pointer;"^>Export Logs^</button^>
echo         ^<span style="margin-left:10px;opacity:0.7;"^>Ctrl+Shift+L^</span^>
echo       ^</div^>
echo     ^</div^>
echo   `;
echo   document.body.appendChild(indicator);
echo });
echo.
echo export default window.autoLogger;
) > frontend\src\autoExportLogger.js

REM Create backend endpoint for receiving frontend logs
echo.
echo Creating backend log receiver endpoint...
(
echo # Add this to your api_routes.py or server.py
echo.
echo @app.post("/api/logs/export")
echo async def receive_frontend_logs(log_data: dict):
echo     """Receive and store frontend logs"""
echo     try:
echo         from core.auto_logger import logger
echo         
echo         # Log that we received frontend logs
echo         logger.logger.info(f"Received frontend logs for session: {log_data.get('sessionId')}")
echo         
echo         # Save to file
echo         frontend_log_dir = Path("logs/frontend")
echo         frontend_log_dir.mkdir(parents=True, exist_ok=True)
echo         
echo         session_file = frontend_log_dir / f"frontend_{log_data.get('sessionId', 'unknown')}.json"
echo         with open(session_file, 'w', encoding='utf-8') as f:
echo             json.dump(log_data, f, indent=2)
echo             
echo         return {"status": "success", "message": "Logs saved"}
echo     except Exception as e:
echo         logger.logger.error(f"Failed to save frontend logs: {e}")
echo         return {"status": "error", "message": str(e)}
) > backend\add_log_endpoint.txt

REM Create master start script with logging
echo.
echo Creating master start script with auto-export...
(
echo @echo off
echo echo ============================================
echo echo Starting AI Sports Betting Platform
echo echo WITH AUTOMATIC LOG EXPORT
echo echo ============================================
echo echo.
echo echo Logs will be automatically saved when you close the app
echo echo.
echo.
echo REM Start backend with logging
echo echo Starting Backend with logging...
echo start "AI Betting Backend" cmd /c "start_backend_logged.bat"
echo.
echo timeout /t 3 /nobreak ^> nul
echo.
echo REM Start frontend with logging
echo echo Starting Frontend with logging...
echo cd frontend
echo.
echo REM Add auto logger to index.html if not present
echo findstr /C:"autoExportLogger.js" index.html ^>nul
echo if errorlevel 1 (
echo     echo Adding auto logger to frontend...
echo     powershell -Command "(Get-Content index.html) -replace '</body>', '  ^<script type=\"module\" src=\"/src/autoExportLogger.js\"^>^</script^>`n  ^</body^>' | Set-Content index.html"
echo )
echo.
echo start "AI Betting Frontend" cmd /c "npm run dev ^&^& echo. ^&^& echo Frontend stopped. Logs saved to localStorage. ^&^& pause"
echo.
echo cd ..
echo.
echo echo.
echo echo ============================================
echo echo Platform is starting with auto-logging!
echo echo.
echo echo Frontend: http://localhost:3000
echo echo Backend: http://localhost:8000
echo echo.
echo echo Logs are automatically saved when you:
echo echo - Close the browser tab
echo echo - Close the terminal windows
echo echo - Press Ctrl+C
echo echo - Press Ctrl+Shift+L in the browser
echo echo ============================================
echo echo.
echo timeout /t 30
) > start_with_autolog.bat

REM Create log viewer utility
echo.
echo Creating log viewer utility...
(
echo @echo off
echo echo ============================================
echo echo Log Viewer - AI Sports Betting Platform
echo echo ============================================
echo echo.
echo echo Available log sessions:
echo echo.
echo dir /b /od logs\session_* 2^>nul
echo echo.
echo echo Latest logs are in:
echo if exist logs\LATEST_SESSION.txt (
echo     set /p LATEST=^<logs\LATEST_SESSION.txt
echo     echo %%LATEST%%
echo     echo.
echo     echo Contents:
echo     dir /b "%%LATEST%%"
echo ) else (
echo     echo No sessions found yet.
echo )
echo echo.
echo pause
) > view_logs.bat

echo.
echo ============================================
echo Auto-Export Logging Setup Complete!
echo ============================================
echo.
echo WHAT WAS CREATED:
echo.
echo 1. start_with_autolog.bat - Starts app with automatic logging
echo 2. view_logs.bat - View collected logs
echo 3. Auto-export on:
echo    - Terminal close (Ctrl+C)
echo    - Browser tab close
echo    - App crashes
echo    - Every 30 seconds (backup)
echo.
echo TO USE:
echo 1. Run: start_with_autolog.bat
echo 2. Use your app normally
echo 3. Logs auto-save when you close it
echo 4. Run: view_logs.bat to see logs
echo.
pause