'use client';

import { useEffect } from 'react';
import { errorLogger } from '@/lib/error-logger';
import { checkAndClearCache, getAppVersion } from '@/lib/auto-cache-clear';

export function ErrorLoggerInit() {
  useEffect(() => {
    // Check and clear cache if needed (silent - no notification)
    checkAndClearCache().then((wasCleared) => {
      if (wasCleared) {
        errorLogger.info('Cache automatically cleared', {
          version: getAppVersion(),
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Log page load
    errorLogger.info('App loaded', {
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      appVersion: getAppVersion(),
    });

    // Catch all unhandled errors
    const handleError = (event: ErrorEvent) => {
      errorLogger.critical('Unhandled error', event.error, {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    // Catch all unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      errorLogger.critical('Unhandled promise rejection',
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          reason: String(event.reason),
        }
      );
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return null;
}
