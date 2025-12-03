import { useCallback, useState } from 'react';
import { errorLogger } from '@/lib/error-logger';

export interface ErrorState {
  error: Error | null;
  hasError: boolean;
}

export function useErrorHandler() {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    hasError: false,
  });

  const handleError = useCallback((error: Error, componentStack?: string) => {
    setErrorState({
      error,
      hasError: true,
    });
    errorLogger.log('Error handled by useErrorHandler', {
      level: 'error',
      category: 'ui',
      error,
      componentStack,
      isClientVisible: true,
      clientMessage: 'An error occurred. Please try again.',
    });
  }, []);

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      hasError: false,
    });
  }, []);

  const resetError = useCallback(() => {
    clearError();
    window.location.reload();
  }, [clearError]);

  return {
    error: errorState.error,
    hasError: errorState.hasError,
    handleError,
    clearError,
    resetError,
  };
}

// Async error handler wrapper
export function withErrorHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  onError?: (error: Error) => void
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      errorLogger.log('Error in withErrorHandler', {
        level: 'error',
        category: 'system',
        error: err,
      });
      if (onError) {
        onError(err);
      }
      throw err;
    }
  }) as T;
}
