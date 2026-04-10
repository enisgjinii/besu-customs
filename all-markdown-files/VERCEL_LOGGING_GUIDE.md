# Vercel Comprehensive Logging Guide

## Overview

This application now has enhanced logging that captures **everything** and displays it in Vercel's dashboard.

## What Gets Logged

### 🌐 Location & IP Information

- **IP Address**: Client's real IP address
- **Country**: User's country
- **Region/State**: Geographic region
- **City**: User's city
- **Timezone**: User's timezone
- **Coordinates**: Latitude and longitude

### 💻 Client Information

- **Browser**: Chrome, Firefox, Safari, etc.
- **Operating System**: Windows, Mac, Linux, iOS, Android
- **Device Type**: Desktop, Mobile, Tablet
- **Screen Resolution**: Display dimensions
- **Language**: Browser language preference
- **User Agent**: Full user agent string
- **Referrer**: Where the user came from

### 🔍 Request Details

- **URL**: Full page URL
- **HTTP Method**: GET, POST, PUT, DELETE, etc.
- **Status Code**: HTTP response codes
- **Timestamp**: Exact time of event

### 👤 User Tracking

- **User ID**: Authenticated user identifier
- **Session ID**: Unique session identifier
- **Anonymous tracking**: For non-authenticated users

### ⚠️ Error Details

- **Error Message**: Human-readable error description
- **Stack Trace**: Full error stack for debugging
- **Component Stack**: React component hierarchy
- **Error Level**: info, warn, error, debug, critical

### 📊 Additional Context

- **Category**: api, auth, database, ui, network, performance, security, system
- **Custom Data**: Any additional data you want to track
- **Client Visibility**: Whether error should be shown to user

## How to Use

### In React Components

```typescript
import { useLogger } from '@/hooks/useLogger';

function MyComponent() {
  const logger = useLogger({ category: 'ui', userId: user?.id });

  const handleClick = async () => {
    // Track user action
    await logger.trackAction('button_clicked', { buttonId: 'submit' });

    try {
      const response = await fetch('/api/data');

      // Track API call
      await logger.trackApiCall('/api/data', 'GET', response.status);

    } catch (error) {
      // Log error with full context
      await logger.error('Failed to fetch data', error as Error, {
        endpoint: '/api/data',
        retryCount: 3,
      });
    }
  };

  return <button onClick={handleClick}>Submit</button>;
}
```

### In API Routes

```typescript
import { errorLogger } from "@/lib/error-logger";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Log API request
    await errorLogger.log("API request received", {
      level: "info",
      category: "api",
      method: "POST",
      additionalData: { dataSize: JSON.stringify(data).length },
    });

    // Your logic here...

    return NextResponse.json({ success: true });
  } catch (error) {
    // Log critical error
    await errorLogger.log("API error occurred", {
      level: "critical",
      category: "api",
      error: error as Error,
      isClientVisible: true,
      clientMessage: "Server error. Please try again.",
    });

    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
```

### Quick Logging Methods

```typescript
import { errorLogger } from "@/lib/error-logger";

// Info logging
await errorLogger.info("User logged in", { userId: "123" });

// Warning
await errorLogger.warn("Slow API response", { duration: 5000 });

// Error
await errorLogger.error("Database connection failed", error);

// Critical (shows to client)
await errorLogger.critical("Payment processing failed", error);

// Debug (only in development)
await errorLogger.debug("State updated", { newState });
```

## Viewing Logs in Vercel

### 1. Real-time Logs

- Go to your Vercel project dashboard
- Click on "Logs" tab
- See real-time logs as they happen

### 2. Search & Filter

Search for specific logs using these fields:

- `ip`: Find logs by IP address
- `country`: Filter by country
- `city`: Filter by city
- `userId`: See all logs for a specific user
- `level`: Filter by error, warn, info, etc.
- `category`: Filter by api, auth, ui, etc.
- `sessionId`: Track a specific user session

### 3. Example Searches in Vercel

```
ip:"192.168.1.1"
country:"United States"
level:"error"
category:"api"
userId:"user_123"
isClientVisible:true
```

## Log Levels

- **info**: General information (user actions, API calls)
- **warn**: Warning conditions (slow responses, deprecated features)
- **error**: Error conditions (failed requests, exceptions)
- **debug**: Debug information (only in development)
- **critical**: Critical errors (payment failures, data loss) - shown to client

## Client Visibility

When `isClientVisible: true`, the error is:

1. Logged to Vercel with full details
2. Shown to the user with a friendly message
3. Marked as high priority

Example:

```typescript
await errorLogger.log("Payment failed", {
  level: "critical",
  category: "api",
  error: paymentError,
  isClientVisible: true,
  clientMessage:
    "Payment processing failed. Please try again or contact support.",
});
```

## Performance Tracking

```typescript
const logger = useLogger();

// Track page load time
const startTime = performance.now();
// ... load page ...
const loadTime = performance.now() - startTime;

await logger.trackPerformance("page_load", loadTime, {
  page: "/dashboard",
});
```

## Environment Variables

The logging system automatically detects:

- `VERCEL_ENV`: production, preview, or development
- `VERCEL_REGION`: Deployment region (e.g., iad1, sfo1)
- `VERCEL_URL`: Deployment URL

## Best Practices

1. **Always log errors**: Never silently fail
2. **Include context**: Add relevant data to help debugging
3. **Use appropriate levels**: Don't log everything as error
4. **Track user actions**: Understand user behavior
5. **Monitor performance**: Track slow operations
6. **Protect PII**: Don't log sensitive data (passwords, credit cards)

## Troubleshooting

### Logs not appearing in Vercel?

- Check that you're in production/preview environment
- Verify the API routes are being called
- Check Vercel dashboard for deployment errors

### Missing geolocation data?

- Geolocation requires Vercel Pro/Enterprise plan
- Falls back to ipapi.co (1000 requests/day free)
- Some VPNs/proxies may block geolocation

### Why is client not seeing errors?

- Check `isClientVisible` is set to `true`
- Verify error boundary is implemented
- Check browser console for client-side errors

## Example Log Output in Vercel

```json
{
  "vercel": true,
  "environment": "production",
  "region": "iad1",
  "level": "error",
  "category": "api",
  "message": "Failed to process payment",
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
  "url": "https://yourapp.com/checkout",
  "method": "POST",
  "statusCode": 500,
  "userId": "user_123",
  "sessionId": "1234567890-abc123",
  "isClientVisible": true,
  "clientMessage": "Payment failed. Please try again.",
  "timestamp": "2024-12-03T10:30:00.000Z"
}
```
