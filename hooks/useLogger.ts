import { useCallback } from "react";
import { errorLogger, LogLevel, LogCategory } from "@/lib/error-logger";

interface UseLoggerOptions {
  category?: LogCategory;
  userId?: string;
}

export function useLogger(options: UseLoggerOptions = {}) {
  const { category = "ui", userId } = options;

  const log = useCallback(
    async (
      message: string,
      level: LogLevel = "info",
      additionalData?: Record<string, any>,
    ) => {
      return errorLogger.log(message, {
        level,
        category,
        userId,
        additionalData,
      });
    },
    [category, userId],
  );

  const info = useCallback(
    (message: string, data?: Record<string, any>) => {
      return log(message, "info", data);
    },
    [log],
  );

  const warn = useCallback(
    (message: string, data?: Record<string, any>) => {
      return log(message, "warn", data);
    },
    [log],
  );

  const error = useCallback(
    (message: string, error?: Error, data?: Record<string, any>) => {
      return errorLogger.log(message, {
        level: "error",
        category,
        userId,
        error,
        additionalData: data,
      });
    },
    [category, userId],
  );

  const critical = useCallback(
    (message: string, error?: Error, data?: Record<string, any>) => {
      return errorLogger.log(message, {
        level: "critical",
        category,
        userId,
        error,
        additionalData: data,
        isClientVisible: true,
        clientMessage: "A critical error occurred. Our team has been notified.",
      });
    },
    [category, userId],
  );

  const debug = useCallback(
    (message: string, data?: Record<string, any>) => {
      if (process.env.NODE_ENV === "development") {
        return log(message, "debug", data);
      }
    },
    [log],
  );

  // Track user actions
  const trackAction = useCallback(
    (action: string, data?: Record<string, any>) => {
      return errorLogger.log(`User action: ${action}`, {
        level: "info",
        category: "ui",
        userId,
        additionalData: { action, ...data },
      });
    },
    [userId],
  );

  // Track API calls
  const trackApiCall = useCallback(
    async (
      endpoint: string,
      method: string,
      statusCode: number,
      data?: Record<string, any>,
    ) => {
      const level: LogLevel =
        statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";

      return errorLogger.log(`API ${method} ${endpoint}`, {
        level,
        category: "api",
        userId,
        method,
        statusCode,
        additionalData: data,
        isClientVisible: statusCode >= 500,
        clientMessage:
          statusCode >= 500
            ? "Server error occurred. Please try again."
            : undefined,
      });
    },
    [userId],
  );

  // Track performance
  const trackPerformance = useCallback(
    (metric: string, value: number, data?: Record<string, any>) => {
      return errorLogger.log(`Performance: ${metric}`, {
        level: "info",
        category: "performance",
        userId,
        additionalData: { metric, value, ...data },
      });
    },
    [userId],
  );

  return {
    log,
    info,
    warn,
    error,
    critical,
    debug,
    trackAction,
    trackApiCall,
    trackPerformance,
  };
}
