"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { errorLogger } from "@/lib/error-logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    errorLogger.log("Error caught by error boundary", {
      level: "error",
      category: "ui",
      error,
      componentStack: errorInfo.componentStack || undefined,
      isClientVisible: true,
      clientMessage: "An error occurred. Please try again.",
    });
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
          <div className="mx-auto flex min-h-[80vh] w-full max-w-3xl items-center justify-center">
            <div className="w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-2xl shadow-slate-200/60 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-black/40">
              <div className="h-1.5 w-full bg-gradient-to-r from-red-500 to-orange-500" />
              <div className="p-6 md:p-8">
                <div className="mb-6 flex items-start gap-4">
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900/60 dark:bg-red-950/30">
                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Component Error
                    </p>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                      Something went wrong
                    </h1>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      A component failed to render correctly.
                    </p>
                  </div>
                </div>

                {this.state.error && (
                  <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                    <p className="break-words font-mono text-sm text-red-600 dark:text-red-400 mb-2">
                      {this.state.error.toString()}
                    </p>
                    {process.env.NODE_ENV === "development" &&
                      this.state.errorInfo && (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200">
                            Stack trace
                          </summary>
                          <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </details>
                      )}
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={this.handleReset}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
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

    return this.props.children;
  }
}
