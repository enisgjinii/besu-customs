export interface ErrorLog {
  message: string;
  stack?: string;
  timestamp: string;
  userAgent: string;
  url: string;
  componentStack?: string;
}

class ErrorLogger {
  private logs: ErrorLog[] = [];
  private maxLogs = 50;

  log(error: Error, componentStack?: string) {
    const errorLog: ErrorLog = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server',
      componentStack,
    };

    this.logs.unshift(errorLog);
    
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorLog);
    }

    // In production, you could send this to an error tracking service
    // Example: Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorService(errorLog);
    }
  }

  private async sendToErrorService(errorLog: ErrorLog) {
    try {
      // Implement your error tracking service here
      // Example: await fetch('/api/log-error', { method: 'POST', body: JSON.stringify(errorLog) });
    } catch (err) {
      console.error('Failed to send error to tracking service:', err);
    }
  }

  getLogs(): ErrorLog[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }
}

export const errorLogger = new ErrorLogger();
