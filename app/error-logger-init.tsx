'use client';

import { useEffect, useState } from 'react';
import { errorLogger } from '@/lib/error-logger';
import { checkAndClearCache, getAppVersion } from '@/lib/auto-cache-clear';

export function ErrorLoggerInit() {
  const [cacheCleared, setCacheCleared] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Check and clear cache if needed
    checkAndClearCache().then((wasCleared) => {
      setCacheCleared(wasCleared);
      if (wasCleared) {
        setShowNotification(true);
        // Hide notification after 3 seconds
        setTimeout(() => setShowNotification(false), 3000);
        
        // Log cache clear event
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

  // Show notification when cache is cleared
  if (showNotification && cacheCleared) {
    return (
      <div className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-top-5 fade-in duration-300">
        <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg border border-green-400/20 flex items-center gap-3">
          <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
          <div>
            <p className="font-medium">Cache Updated</p>
            <p className="text-sm text-green-100">App refreshed to latest version</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
