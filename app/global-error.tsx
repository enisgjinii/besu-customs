'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { errorLogger } from '@/lib/error-logger';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log critical error with full context to Vercel
    errorLogger.log('Critical global error caught', {
      level: 'critical',
      category: 'system',
      error,
      additionalData: {
        digest: error.digest,
        errorName: error.name,
        errorMessage: error.message,
        isFatal: true,
      },
      isClientVisible: true,
      clientMessage: 'A critical error occurred. Please refresh the page.',
    });
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
          <div className="max-w-xl w-full bg-white rounded-lg shadow-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Critical Error
                </h1>
                <p className="text-gray-600">
                  The application encountered a fatal error
                </p>
              </div>
            </div>

            <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm font-mono text-red-700">
                {error.message || 'An unexpected critical error occurred'}
              </p>
              {error.digest && (
                <p className="text-xs text-gray-500 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>

            <button
              onClick={reset}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
            >
              <RefreshCw className="w-5 h-5" />
              Restart Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
