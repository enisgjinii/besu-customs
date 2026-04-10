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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-3xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-2xl shadow-slate-200/60 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-black/40 animate-in fade-in duration-300">
          <div className="h-1.5 w-full bg-gradient-to-r from-red-500 to-orange-500" />

          <div className="p-6 md:p-8">
            <div className="mb-6 flex items-start gap-4">
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900/60 dark:bg-red-950/30">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Application Error
                </p>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  Something went wrong
                </h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  The page hit an unexpected issue. You can retry or return home.
                </p>
              </div>
            </div>

            <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <Bug className="h-3.5 w-3.5" />
                Error details
              </div>
              <p className="break-words font-mono text-sm text-red-600 dark:text-red-400">
                {error.message || "An unexpected error occurred"}
              </p>
              {error.digest && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Reference ID: {error.digest}
                </p>
              )}
            </div>

            <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                Suggested next steps
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-blue-800 dark:text-blue-400">
                <li>Retry this action</li>
                <li>Go back to the home page</li>
                <li>Refresh the browser tab</li>
                <li>Contact support if the issue persists</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={reset}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                <Home className="h-4 w-4" />
                Go Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
