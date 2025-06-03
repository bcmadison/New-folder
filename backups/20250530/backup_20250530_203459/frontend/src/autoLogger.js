// Simple auto-export logger
class AutoLogger {
  constructor() {
    this.logs = [];
    this.sessionId = new Date().toISOString().replace(/[:.]/g, '-');

    window.addEventListener('error', (e) => {
      this.log('ERROR', e.message, e);
    });

    window.addEventListener('beforeunload', () => {
      this.save();
    });

    console.log('Auto-logger initialized');
  }

  log(level, message, data = {}) {
    const entry = {
      time: new Date().toISOString(),
      level,
      message,
      data
    };
    this.logs.push(entry);
  }

  save() {
    localStorage.setItem(`logs_${this.sessionId}`, JSON.stringify(this.logs));
    console.log('Logs saved to localStorage');
  }
}

window.autoLogger = new AutoLogger();
