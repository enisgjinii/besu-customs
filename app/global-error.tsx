"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { errorLogger } from "@/lib/error-logger";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log critical error with full context to Vercel
    errorLogger.log("Critical global error caught", {
      level: "critical",
      category: "system",
      error,
      additionalData: {
        digest: error.digest,
        errorName: error.name,
        errorMessage: error.message,
        isFatal: true,
      },
      isClientVisible: true,
      clientMessage: "A critical error occurred. Please refresh the page.",
    });
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-b from-red-50 to-slate-100 p-4 md:p-8 dark:from-slate-950 dark:to-slate-900">
          <div className="mx-auto flex min-h-[80vh] w-full max-w-2xl items-center justify-center">
            <div className="w-full overflow-hidden rounded-2xl border border-red-200 bg-white shadow-2xl dark:border-red-900/60 dark:bg-slate-900">
              <div className="h-1.5 w-full bg-gradient-to-r from-red-600 to-rose-600" />
              <div className="p-6 md:p-8">
                <div className="mb-6 flex items-start gap-4">
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900/60 dark:bg-red-950/30">
                    <AlertTriangle className="h-7 w-7 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Fatal Error
                    </p>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                      The application cannot continue
                    </h1>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      Please restart the app. If this repeats, contact support.
                    </p>
                  </div>
                </div>

                <div className="mb-6 rounded-xl border border-red-200 bg-red-50/70 p-4 dark:border-red-900/60 dark:bg-red-950/20">
                  <p className="break-words font-mono text-sm text-red-700 dark:text-red-300">
                    {error.message || "An unexpected critical error occurred"}
                  </p>
                  {error.digest && (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Reference ID: {error.digest}
                    </p>
                  )}
                </div>

                <button
                  onClick={reset}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  <RefreshCw className="h-4 w-4" />
                  Restart Application
                </button>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
