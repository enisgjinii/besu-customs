"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "./ui/button";

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
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ error, errorInfo });
    
    // Log to analytics/error tracking service if available
    if (typeof window !== "undefined") {
      // Could send to error tracking service here
      console.error("Component Stack:", errorInfo.componentStack);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    
    // Clear any cached state that might be causing issues
    if (typeof window !== "undefined") {
      try {
        // Clear localStorage items that might be corrupted
        const keysToPreserve = ["theme"];
        const allKeys = Object.keys(localStorage);
        allKeys.forEach((key) => {
          if (!keysToPreserve.includes(key) && key.includes("configurator")) {
            localStorage.removeItem(key);
          }
        });
      } catch (e) {
        console.error("Failed to clear localStorage:", e);
      }
    }
    
    // Force reload the page
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isWebGLError = this.state.error?.message?.toLowerCase().includes("webgl") ||
        this.state.error?.message?.toLowerCase().includes("context") ||
        this.state.error?.message?.toLowerCase().includes("gpu");

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full bg-card border border-border rounded-lg shadow-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
            </div>
            
            <h1 className="text-xl font-bold text-foreground mb-2">
              {isWebGLError ? "3D Rendering Error" : "Something went wrong"}
            </h1>
            
            <p className="text-muted-foreground mb-4">
              {isWebGLError 
                ? "Your device had trouble rendering the 3D model. This can happen on devices with limited graphics capabilities."
                : "The application encountered an unexpected error. Please try refreshing the page."}
            </p>

            {/* Show error details in development */}
            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="mb-4 p-3 bg-muted rounded text-left text-xs overflow-auto max-h-32">
                <p className="font-mono text-destructive">{this.state.error.message}</p>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleReset}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
              
              <Button
                variant="outline"
                onClick={this.handleGoHome}
                className="flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Go Home
              </Button>
            </div>

            {isWebGLError && (
              <p className="mt-4 text-xs text-muted-foreground">
                Tip: Try closing other apps or browser tabs to free up memory.
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for easier use with hooks
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
