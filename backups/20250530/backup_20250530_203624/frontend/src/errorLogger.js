// errorLogger.js - Comprehensive frontend error logging
class ErrorLogger {
  constructor() {
    this.errors = [];
    this.apiCalls = [];
    this.setupGlobalHandlers();
  }

  setupGlobalHandlers() {
    // Catch unhandled errors
    window.addEventListener('error', (event) => {
      this.logError({
        type: 'javascript-error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString()
      });
    });

    // Catch promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        type: 'unhandled-promise-rejection',
        reason: event.reason,
        promise: event.promise,
        timestamp: new Date().toISOString()
      });
    });

    // Intercept console.error
    const originalError = console.error;
    console.error = (...args) => {
      this.logError({
        type: 'console-error',
        message: args.join(' '),
        timestamp: new Date().toISOString()
      });
      originalError.apply(console, args);
    };

    // Intercept fetch for API logging
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const start = Date.now();
      const [url, options = {}] = args;
      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - start;
        this.logApiCall({
          url,
          method: options.method || 'GET',
          status: response.status,
          statusText: response.statusText,
          duration,
          timestamp: new Date().toISOString(),
          ok: response.ok
        });
        if (!response.ok) {
          this.logError({
            type: 'api-error',
            url,
            status: response.status,
            statusText: response.statusText,
            timestamp: new Date().toISOString()
          });
        }
        return response;
      } catch (error) {
        this.logError({
          type: 'fetch-error',
          url,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        throw error;
      }
    };
  }

  logError(error) {
    this.errors.push(error);
    // Store in localStorage
    try {
      const stored = JSON.parse(localStorage.getItem('app_errors') || '[]');
      stored.push(error);
      // Keep only last 100 errors
      if (stored.length > 100) stored.shift();
      localStorage.setItem('app_errors', JSON.stringify(stored));
    } catch (e) {
      console.warn('Failed to store error:', e);
    }
  }

  logApiCall(call) {
    this.apiCalls.push(call);
    // Store in localStorage
    try {
      const stored = JSON.parse(localStorage.getItem('app_api_calls') || '[]');
      stored.push(call);
      // Keep only last 50 API calls
      if (stored.length > 50) stored.shift();
      localStorage.setItem('app_api_calls', JSON.stringify(stored));
    } catch (e) {
      console.warn('Failed to store API call:', e);
    }
  }

  generateReport() {
    const report = {
      generated: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errors: this.errors,
      apiCalls: this.apiCalls,
      localStorage: {
        errors: JSON.parse(localStorage.getItem('app_errors') || '[]'),
        apiCalls: JSON.parse(localStorage.getItem('app_api_calls') || '[]')
      }
    };
    return report;
  }

  downloadReport() {
    const report = this.generateReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error_report_${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  clearLogs() {
    this.errors = [];
    this.apiCalls = [];
    localStorage.removeItem('app_errors');
    localStorage.removeItem('app_api_calls');
  }
}

// Create global instance
window.errorLogger = new ErrorLogger();

// Add error report button to page
window.addEventListener('load', () => {
  const button = document.createElement('button');
  button.textContent = 'Download Error Report';
  button.style.cssText = 'position:fixed;bottom:10px;right:10px;z-index:9999;padding:10px;background:#ff4444;color:white;border:none;border-radius:5px;cursor:pointer;';
  button.onclick = () => window.errorLogger.downloadReport();
  document.body.appendChild(button);
});

export default window.errorLogger;
