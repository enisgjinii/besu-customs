# 🚀 Comprehensive Vercel Logging System

## Overview

Your application now has **enterprise-grade logging** that captures everything and displays it in Vercel's dashboard.

## ✨ What Gets Logged

Every log includes:

### 🌐 Location & Network
- **IP Address** - Real client IP
- **Country, Region, City** - Geographic location
- **Timezone** - User's timezone
- **Coordinates** - Latitude/longitude

### 💻 Client Information
- **Browser** - Chrome, Firefox, Safari, etc.
- **Operating System** - Windows, Mac, Linux, iOS, Android
- **Device Type** - Desktop, Mobile, Tablet
- **Screen Resolution** - Display size
- **Language** - Browser language
- **Referrer** - Traffic source

### 🔍 Request Details
- **URL** - Full page URL
- **HTTP Method** - GET, POST, etc.
- **Status Code** - Response codes
- **Response Time** - Performance metrics

### 👤 User Tracking
- **User ID** - For authenticated users
- **Session ID** - Unique session tracking
- **Anonymous tracking** - For guests

### ⚠️ Error Details
- **Error Message** - Human-readable
- **Stack Trace** - Full debugging info
- **Component Stack** - React hierarchy
- **Error Level** - Severity classification

## 🎯 Quick Start

### 1. In React Components

```typescript
import { useLogger } from '@/hooks/useLogger';

function MyComponent() {
  const logger = useLogger({ category: 'ui' });

  const handleAction = async () => {
    // Track user action
    await logger.trackAction('button_clicked');

    try {
      // Your code
    } catch (error) {
      // Log error with full context
      await logger.error('Action failed', error as Error);
    }
  };
}
```

### 2. In API Routes

```typescript
import { errorLogger } from '@/lib/error-logger';

export async function POST(request: NextRequest) {
  try {
    // Your API logic
    await errorLogger.info('API called', { endpoint: '/api/data' });
  } catch (error) {
    await errorLogger.error('API failed', error as Error);
  }
}
```

### 3. Quick Methods

```typescript
// Info
await logger.info('User logged in');

// Warning
await logger.warn('Slow response detected');

// Error
await logger.error('Request failed', error);

// Critical (shows to user)
await logger.critical('Payment failed', error);

// Performance
await logger.trackPerformance('page_load', 1234);
```

## 📊 View Logs in Vercel

1. Go to **Vercel Dashboard**
2. Select your **project**
3. Click **"Logs"** tab
4. Search using filters:

```
ip:"192.168.1.1"
country:"United States"
level:"error"
userId:"user_123"
category:"api"
```

## 📁 Files Overview

### Core Files
- `lib/error-logger.ts` - Main logger with full context
- `hooks/useLogger.ts` - React hook for components
- `middleware.ts` - Automatic request logging

### API Routes
- `app/api/logs/route.ts` - Log collection endpoint
- `app/api/logs/geo/route.ts` - Geolocation service

### Error Handling
- `app/error.tsx` - Error boundary with logging
- `app/global-error.tsx` - Global error handler

### Components
- `components/logs-viewer.tsx` - View logs in your app
- `components/example-with-logging.tsx` - Usage example

### Documentation
- `VERCEL_LOGGING_GUIDE.md` - Complete guide
- `LOGGING_QUICK_REFERENCE.md` - Quick reference
- `VERCEL_LOGGING_SETUP_COMPLETE.md` - Setup summary

## 🎨 Log Levels

| Level | Use Case | Shown to User |
|-------|----------|---------------|
| `info` | General information | No |
| `warn` | Warnings | No |
| `error` | Errors | No |
| `debug` | Debug info (dev only) | No |
| `critical` | Critical errors | Yes |

## 🔧 Automatic Logging

These are logged automatically:

✅ **All HTTP requests** (via middleware)
- Method, URL, IP, location, browser

✅ **All errors** (via error boundaries)
- Full stack trace, context, user info

✅ **All API calls** (when using logger)
- Endpoint, status, response time

## 🌐 Geolocation

- Uses Vercel's built-in geolocation (Pro/Enterprise)
- Falls back to ipapi.co (1000 requests/day free)
- Includes country, region, city, timezone, coordinates

## 📦 Example Log Output

```json
{
  "vercel": true,
  "environment": "production",
  "region": "iad1",
  "level": "error",
  "category": "api",
  "message": "API request failed",
  "ip": "192.168.1.1",
  "country": "United States",
  "region": "Virginia",
  "city": "Ashburn",
  "timezone": "America/New_York",
  "coordinates": "39.0438,-77.4874",
  "browser": "Chrome/120.0",
  "os": "Mac OS X",
  "device": "Desktop",
  "screenResolution": "1920x1080",
  "language": "en-US",
  "url": "https://yourapp.com/api/data",
  "method": "POST",
  "statusCode": 500,
  "userId": "user_123",
  "sessionId": "abc123",
  "timestamp": "2024-12-03T10:30:00.000Z"
}
```

## 🎯 Common Use Cases

### Track User Actions
```typescript
await logger.trackAction('checkout_started', {
  cartValue: 99.99,
  itemCount: 3,
});
```

### Track API Calls
```typescript
const response = await fetch('/api/data');
await logger.trackApiCall('/api/data', 'GET', response.status);
```

### Track Performance
```typescript
const start = performance.now();
// ... operation ...
await logger.trackPerformance('operation', performance.now() - start);
```

### Log Errors with Context
```typescript
try {
  await processPayment();
} catch (error) {
  await logger.error('Payment failed', error as Error, {
    amount: 99.99,
    paymentMethod: 'card',
    retryCount: 3,
  });
}
```

### Critical Errors (User-Facing)
```typescript
await logger.critical('Payment processing failed', error, {
  orderId: '12345',
  amount: 99.99,
});
// User sees: "Payment processing failed. Our team has been notified."
```

## 🔒 Privacy & Security

- ✅ No passwords or tokens logged
- ✅ IP addresses for debugging only
- ✅ User IDs only for authenticated users
- ✅ All logs in Vercel's secure infrastructure
- ✅ Automatic log rotation (30 days)

## 💡 Pro Tips

1. **Always log errors** - Never fail silently
2. **Include context** - Add relevant data
3. **Use appropriate levels** - Don't overuse error
4. **Track performance** - Monitor slow operations
5. **Set up alerts** - Configure Vercel alerts for critical errors

## 🐛 Troubleshooting

**Logs not appearing?**
- Deploy to Vercel (works best in production)
- Check Vercel dashboard, not local console
- Verify API routes are being called

**Missing geolocation?**
- Requires Vercel Pro/Enterprise for built-in geo
- Falls back to ipapi.co (free tier)
- VPNs may block geolocation

**Client not seeing errors?**
- Set `isClientVisible: true`
- Check error boundaries
- Verify browser console

## 📞 Need Help?

Check these files:
- `VERCEL_LOGGING_GUIDE.md` - Full documentation
- `LOGGING_QUICK_REFERENCE.md` - Quick reference
- `components/example-with-logging.tsx` - Usage example
- `scripts/test-logging.ts` - Test script

---

**🎉 Everything is now logged to Vercel!**

Deploy your app and check the Vercel dashboard to see all logs with IP, location, browser info, and full error details.
