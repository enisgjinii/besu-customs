# Logging Quick Reference

## 🚀 Quick Start

```typescript
import { useLogger } from '@/hooks/useLogger';

const logger = useLogger({ category: 'ui', userId: user?.id });
```

## 📝 Common Patterns

### Log User Action
```typescript
await logger.trackAction('button_clicked', { buttonId: 'submit' });
```

### Log API Call
```typescript
await logger.trackApiCall('/api/data', 'POST', response.status);
```

### Log Error
```typescript
try {
  // your code
} catch (error) {
  await logger.error('Operation failed', error as Error, { context: 'details' });
}
```

### Log Critical Error (Shows to Client)
```typescript
await logger.critical('Payment failed', error as Error);
```

### Track Performance
```typescript
const start = performance.now();
// ... operation ...
await logger.trackPerformance('operation_time', performance.now() - start);
```

## 🔍 What Gets Logged Automatically

Every log includes:
- ✅ IP Address
- ✅ Country, Region, City
- ✅ Browser, OS, Device
- ✅ Screen Resolution
- ✅ Language
- ✅ Referrer
- ✅ Full URL
- ✅ User ID (if authenticated)
- ✅ Session ID
- ✅ Timestamp
- ✅ Vercel Region & Environment

## 📊 View Logs in Vercel

1. Go to Vercel Dashboard
2. Select your project
3. Click "Logs" tab
4. Search using:
   - `ip:"192.168.1.1"`
   - `country:"United States"`
   - `level:"error"`
   - `userId:"user_123"`

## 🎯 Log Levels

- `info` - General information
- `warn` - Warnings
- `error` - Errors
- `debug` - Debug info (dev only)
- `critical` - Critical errors (shown to client)

## 💡 Pro Tips

1. Always log errors - never fail silently
2. Include context data for debugging
3. Use `critical` for user-facing errors
4. Track performance for slow operations
5. Don't log sensitive data (passwords, tokens)

## 🔧 Direct Logger Usage

```typescript
import { errorLogger } from '@/lib/error-logger';

// Quick methods
await errorLogger.info('Message', { data });
await errorLogger.warn('Warning', { data });
await errorLogger.error('Error', error, { data });
await errorLogger.critical('Critical', error, { data });
await errorLogger.debug('Debug', { data });

// Full control
await errorLogger.log('Custom message', {
  level: 'error',
  category: 'api',
  error: error,
  statusCode: 500,
  method: 'POST',
  additionalData: { custom: 'data' },
  isClientVisible: true,
  clientMessage: 'User-friendly error message',
});
```

## 📦 Categories

- `api` - API calls
- `auth` - Authentication
- `database` - Database operations
- `ui` - UI interactions
- `network` - Network requests
- `performance` - Performance metrics
- `security` - Security events
- `system` - System events
