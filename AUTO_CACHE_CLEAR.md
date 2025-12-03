# Automatic Cache Clearing System

## Overview
The app now automatically clears cache when a new version is deployed, ensuring users always have the latest assets and code.

## How It Works

### Version-Based Cache Clearing
The system uses a version number to detect when the app has been updated:

```typescript
// lib/auto-cache-clear.ts
export const APP_VERSION = '1.0.0';
```

When a user visits the site:
1. System checks stored version vs current version
2. If versions don't match → Clear all cache
3. Update stored version
4. Show notification to user

### What Gets Cleared Automatically

✅ **Cache API** - All service worker caches  
✅ **LocalStorage** - All data (except version key)  
✅ **SessionStorage** - All session data  
✅ **IndexedDB** - All databases  

### User Experience

**First Visit:**
- No cache to clear
- Version stored: `1.0.0`

**After Update (version changed to 1.0.1):**
- Cache automatically cleared
- Green notification appears:
  ```
  ✅ Cache Updated
  App refreshed to latest version
  ```
- Notification disappears after 3 seconds

**Subsequent Visits:**
- Version matches
- No cache clearing needed
- Normal app load

## When Cache is Cleared

### Automatic Clearing
Cache is cleared automatically when:
- App version changes (deployment)
- User visits site after update
- Version mismatch detected

### Manual Clearing
Users can still manually clear cache:
- Click "Clear Cache" button on error screens
- Visit `/admin/system` and click "Clear Cache"
- Use browser's clear cache option

## Updating the Version

### When to Update
Update the version number when:
- Deploying new features
- Fixing critical bugs
- Updating assets (images, models, textures)
- Changing API endpoints
- Modifying data structures

### How to Update
Edit `lib/auto-cache-clear.ts`:

```typescript
// Before deployment
export const APP_VERSION = '1.0.0';

// After deployment
export const APP_VERSION = '1.0.1';
```

### Version Numbering
Use semantic versioning:
- **Major** (1.0.0 → 2.0.0): Breaking changes
- **Minor** (1.0.0 → 1.1.0): New features
- **Patch** (1.0.0 → 1.0.1): Bug fixes

## Implementation Details

### Core Function
```typescript
export async function checkAndClearCache(): Promise<boolean> {
  const storedVersion = localStorage.getItem('app_version');
  
  if (storedVersion === APP_VERSION) {
    return false; // No clearing needed
  }
  
  // Clear all caches
  await clearAllCaches();
  
  // Update version
  localStorage.setItem('app_version', APP_VERSION);
  
  return true; // Cache was cleared
}
```

### Integration Points

**1. App Initialization** (`app/error-logger-init.tsx`)
```typescript
useEffect(() => {
  checkAndClearCache().then((wasCleared) => {
    if (wasCleared) {
      // Show notification
      // Log event
    }
  });
}, []);
```

**2. Manual Clear Button** (`components/clear-cache-button.tsx`)
```typescript
const handleClearCache = async () => {
  await forceClearCache();
  window.location.reload();
};
```

## Logging

All cache clearing events are logged to Vercel:

```json
{
  "level": "info",
  "message": "Cache automatically cleared",
  "version": "1.0.1",
  "timestamp": "2024-12-03T10:30:00.000Z",
  "ip": "192.168.1.1",
  "country": "United States"
}
```

## Benefits

### For Users
- ✅ Always get latest version
- ✅ No stale cache issues
- ✅ No manual clearing needed
- ✅ Smooth updates
- ✅ Clear notification

### For Developers
- ✅ Guaranteed fresh deploys
- ✅ No cache-related bugs
- ✅ Easy version management
- ✅ Automatic process
- ✅ Logged events

## Configuration

### Disable Auto-Clear (if needed)
To disable automatic clearing, comment out in `app/error-logger-init.tsx`:

```typescript
// useEffect(() => {
//   checkAndClearCache().then((wasCleared) => {
//     // ...
//   });
// }, []);
```

### Customize Notification Duration
Change timeout in `app/error-logger-init.tsx`:

```typescript
// Default: 3 seconds
setTimeout(() => setShowNotification(false), 3000);

// Custom: 5 seconds
setTimeout(() => setShowNotification(false), 5000);
```

### Keep Specific Data
To preserve certain localStorage items:

```typescript
// In lib/auto-cache-clear.ts
const keysToKeep = [
  VERSION_KEY,
  'user_preferences',  // Add your keys here
  'theme_setting',
];
```

## Testing

### Test Auto-Clear
1. Visit site (version 1.0.0)
2. Check localStorage: `app_version = "1.0.0"`
3. Update version to 1.0.1
4. Refresh page
5. See notification
6. Check localStorage: `app_version = "1.0.1"`
7. Check cache is cleared

### Test Manual Clear
1. Click "Clear Cache" button
2. Verify all storage cleared
3. Page reloads
4. Fresh state

## Troubleshooting

### Cache Not Clearing?
- Check version number is different
- Verify localStorage is accessible
- Check browser console for errors
- Try manual clear button

### Notification Not Showing?
- Check if cache was actually cleared
- Verify notification timeout
- Check z-index conflicts
- Look for CSS issues

### Version Not Updating?
- Clear localStorage manually
- Hard refresh (Ctrl+Shift+R)
- Check if version constant changed
- Verify deployment succeeded

## Files

### Created
- ✅ `lib/auto-cache-clear.ts` - Core cache clearing logic
- ✅ `AUTO_CACHE_CLEAR.md` - This documentation

### Modified
- ✅ `app/error-logger-init.tsx` - Auto-clear on app load
- ✅ `components/clear-cache-button.tsx` - Use centralized system

## Deployment Checklist

Before each deployment:

1. ✅ Update `APP_VERSION` in `lib/auto-cache-clear.ts`
2. ✅ Test locally
3. ✅ Deploy to Vercel
4. ✅ Visit site and verify notification
5. ✅ Check Vercel logs for cache clear events
6. ✅ Verify app works correctly

## Example Workflow

### Scenario: Deploying Bug Fix

**Step 1: Update Version**
```typescript
// lib/auto-cache-clear.ts
export const APP_VERSION = '1.0.1'; // was 1.0.0
```

**Step 2: Deploy**
```bash
git add .
git commit -m "fix: critical bug fix"
git push
```

**Step 3: User Experience**
- User visits site
- Cache automatically cleared
- Notification: "Cache Updated"
- Bug fix applied
- No manual action needed

## Monitoring

### Check Logs in Vercel
Search for:
```
message:"Cache automatically cleared"
```

### View Statistics
- How many users got auto-clear
- Which versions are in use
- Any clearing errors

## Future Enhancements

Potential improvements:
- Selective cache clearing (only changed assets)
- Progressive cache updates
- Background cache clearing
- Cache size monitoring
- Automatic version bumping in CI/CD
- A/B testing different versions

## Best Practices

1. **Update version on every deploy**
2. **Use semantic versioning**
3. **Test before deploying**
4. **Monitor logs after deploy**
5. **Keep version history**
6. **Document breaking changes**

## Summary

The automatic cache clearing system ensures users always have the latest version of your app without manual intervention. Simply update the version number before deployment, and the system handles the rest.

**Key Points:**
- ✅ Automatic on version change
- ✅ User-friendly notification
- ✅ Logged to Vercel
- ✅ Manual option available
- ✅ Zero user friction
