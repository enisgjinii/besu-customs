# Error Handling System

Comprehensive error handling implementation for the 3D Product Configurator.

## Components

### 1. Error Boundary (`components/error-boundary.tsx`)
React class component that catches JavaScript errors anywhere in the child component tree.

**Features:**
- Catches rendering errors
- Logs errors with stack traces
- Provides fallback UI
- Reset functionality
- Development mode stack traces

**Usage:**
```tsx
import { ErrorBoundary } from '@/components/error-boundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### 2. Next.js Error Pages

#### `app/error.tsx`
Handles errors in route segments. Automatically wraps route segments in an error boundary.

#### `app/global-error.tsx`
Catches errors in the root layout. Handles critical application errors.

#### `app/not-found.tsx`
Custom 404 page for missing routes.

#### `app/loading.tsx`
Loading state shown during page transitions and data fetching.

### 3. Error Logger (`lib/error-logger.ts`)
Centralized error logging system.

**Features:**
- Stores error logs in memory
- Captures error context (timestamp, URL, user agent)
- Console logging in development
- Ready for integration with error tracking services (Sentry, LogRocket, etc.)

**Usage:**
```tsx
import { errorLogger } from '@/lib/error-logger';

try {
  // Your code
} catch (error) {
  errorLogger.log(error as Error);
}
```

### 4. Error Handler Hook (`hooks/use-error-handler.ts`)
React hook for managing error state in components.

**Usage:**
```tsx
import { useErrorHandler } from '@/hooks/use-error-handler';

function MyComponent() {
  const { error, hasError, handleError, clearError } = useErrorHandler();

  const fetchData = async () => {
    try {
      const data = await api.getData();
    } catch (err) {
      handleError(err as Error);
    }
  };

  if (hasError) {
    return <div>Error: {error?.message}</div>;
  }

  return <div>Content</div>;
}
```

**Async Wrapper:**
```tsx
import { withErrorHandler } from '@/hooks/use-error-handler';

const safeFetch = withErrorHandler(
  async (url: string) => {
    const response = await fetch(url);
    return response.json();
  },
  (error) => {
    console.error('Fetch failed:', error);
  }
);
```

## Error Hierarchy

1. **Component Level**: Use `useErrorHandler` hook for local error handling
2. **Route Level**: `app/error.tsx` catches errors in route segments
3. **Global Level**: `app/global-error.tsx` catches critical errors
4. **Root Level**: `ErrorBoundary` in layout wraps the entire app

## Integration with Error Tracking Services

To integrate with services like Sentry:

1. Install the service SDK:
```bash
npm install @sentry/nextjs
```

2. Update `lib/error-logger.ts`:
```typescript
import * as Sentry from '@sentry/nextjs';

private async sendToErrorService(errorLog: ErrorLog) {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(new Error(errorLog.message), {
      extra: errorLog,
    });
  }
}
```

## Best Practices

1. **Always catch async errors**: Use try-catch or `withErrorHandler`
2. **Provide context**: Include relevant information when logging errors
3. **User-friendly messages**: Show helpful error messages to users
4. **Recovery options**: Always provide a way to recover (reset, go home)
5. **Log strategically**: Don't log expected errors (validation, etc.)

## Testing Error Boundaries

Create a test component to trigger errors:

```tsx
'use client';

export function ErrorTest() {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw new Error('Test error!');
  }

  return (
    <button onClick={() => setShouldError(true)}>
      Trigger Error
    </button>
  );
}
```

## Environment-Specific Behavior

### Development
- Full stack traces visible
- Console logging enabled
- Detailed error information

### Production
- User-friendly error messages
- Errors sent to tracking service
- Minimal technical details exposed
