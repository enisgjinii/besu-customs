# Vercel Toolbar Guide

## Overview

The Vercel Toolbar is now enabled in your app, giving you access to debugging tools directly on your production site.

## What You Get

### 🔍 Features Available

- **Real-time Logs** - View logs directly on your site
- **Console Output** - See console logs in production
- **Network Requests** - Monitor API calls
- **Performance Metrics** - Track page performance
- **Environment Info** - See deployment details
- **Quick Actions** - Clear cache, reload, etc.

## How to Access

### In Production

1. Deploy your app to Vercel
2. Visit your production URL
3. Add `?vercelToolbar=1` to the URL
4. The toolbar will appear at the bottom of the page

Example: `https://yourapp.vercel.app?vercelToolbar=1`

### In Preview Deployments

- Toolbar is automatically available
- Just add `?vercelToolbar=1` to any preview URL

### In Development

- Toolbar is automatically injected
- Access at `http://localhost:3000`

## Using the Toolbar

### View Logs

1. Click the "Logs" tab in the toolbar
2. See all logs with IP, location, browser info
3. Filter by level (error, warn, info)
4. Search by keywords

### Monitor Performance

1. Click the "Performance" tab
2. See page load times
3. Track API response times
4. Identify slow operations

### Debug Issues

1. Click the "Console" tab
2. See all console.log, console.error output
3. View network requests
4. Check environment variables

## Configuration

The toolbar is automatically configured in your `app/layout.tsx`:

```typescript
import { VercelToolbar } from "@vercel/toolbar/next";

// Toolbar is injected in development mode
{shouldInjectToolbar && <VercelToolbar />}
```

No additional configuration needed!

## Security

- Only accessible to team members logged into Vercel
- Requires authentication in production
- No data exposed to regular users
- Safe to enable in production

## Pro Tips

1. **Bookmark with toolbar** - Save `yourapp.com?vercelToolbar=1`
2. **Share with team** - Send toolbar URL to teammates
3. **Debug in production** - See real user issues
4. **Monitor performance** - Track real-world metrics
5. **Quick testing** - Test features without deploying

## Troubleshooting

**Toolbar not appearing?**

- Add `?vercelToolbar=1` to URL
- Make sure you're logged into Vercel
- Check you're a team member on the project

**Can't see logs?**

- Deploy to Vercel first
- Check Vercel dashboard permissions
- Verify logs are being sent (check middleware)

## Learn More

- [Vercel Toolbar Docs](https://vercel.com/docs/vercel-toolbar)
- [In Production Guide](https://vercel.com/docs/vercel-toolbar/in-production-and-localhost/add-to-production)
