"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";
import { errorLogger } from "@/lib/error-logger";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error with full context to Vercel
    errorLogger.log("Application error caught by error boundary", {
      level: "error",
      category: "ui",
      error,
      additionalData: {
        digest: error.digest,
        errorName: error.name,
        errorMessage: error.message,
      },
      isClientVisible: true,
      clientMessage: "An error occurred. Our team has been notified.",
    });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 animate-in fade-in duration-500">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Oops! Something went wrong
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Don't worry, we're on it
            </p>
          </div>
        </div>

        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-2 mb-2">
            <Bug className="w-4 h-4 text-gray-500 mt-0.5" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Error Details
            </p>
          </div>
          <p className="text-sm font-mono text-red-600 dark:text-red-400 ml-6">
            {error.message || "An unexpected error occurred"}
          </p>
          {error.digest && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-6">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>What you can do:</strong>
          </p>
          <ul className="text-sm text-blue-700 dark:text-blue-400 mt-2 space-y-1 ml-4 list-disc">
            <li>Try refreshing the page</li>
            <li>Go back to the home page</li>
            <li>Clear your browser cache</li>
            <li>Contact support if the problem persists</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm hover:shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="flex items-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors font-medium shadow-sm hover:shadow-md"
          >
            <Home className="w-4 h-4" />
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
