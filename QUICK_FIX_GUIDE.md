# 🔧 Quick Fix Guide - Model Loading Issues

## Problem

Models with spaces in filenames fail to load in development mode:

```
Unable to load from /models/Track%20and%20field%20top%20tank%20top.glb
```

## Root Cause

1. **Next.js dev server** doesn't handle URL-encoded spaces consistently
2. **Service Worker** was trying to cache non-GET requests (now fixed)
3. **File naming** - spaces in filenames cause compatibility issues

## Solutions (Choose One)

### Option 1: Fix Filenames (Recommended) ⭐

Rename all model files to remove spaces:

```bash
# Automatically rename all files
npm run fix-filenames
```

This will:

1. Rename all `.glb` files (spaces → hyphens)
2. Update `models.json` automatically
3. Create a backup of `models.json`

**Example:**

- `Track and field top tank top.glb` → `track-and-field-top-tank-top.glb`
- `Basketball Jersey and Shorts.glb` → `basketball-jersey-and-shorts.glb`

### Option 2: Test in Production Mode

The production build handles spaces correctly:

```bash
npm run build
npm start
```

Then test at `http://localhost:3000`

### Option 3: Manual Rename

Rename specific problematic files:

```bash
cd public/models

# Example
mv "Track and field top tank top.glb" "track-and-field-top-tank-top.glb"
```

Then update the URL in `public/models.json`:

```json
{
  "name": "Track and Field Top Tank Top",
  "url": "/models/track-and-field-top-tank-top.glb"
}
```

## What Was Fixed

### Service Worker (Already Fixed ✅)

Updated `public/sw.js` to:

- Only cache GET requests (not HEAD/POST)
- Ignore cache errors gracefully
- Handle opaque responses correctly

### URL Encoding (Already Fixed ✅)

Updated `lib/model-loader-optimized.ts` to:

- Detect if URL is already encoded
- Avoid double-encoding
- Handle spaces correctly

## Testing

### After Fixing Filenames

```bash
# 1. Fix filenames
npm run fix-filenames

# 2. Restart dev server
npm run dev

# 3. Test loading models
# All models should now load correctly
```

### Verify Files Renamed

```bash
# Check for files with spaces
ls "public/models/" | grep " "

# Should return nothing if all renamed
```

## Rollback

If something goes wrong:

```bash
# Restore models.json from backup
cp public/models.json.backup public/models.json

# Restore model files from rename-map.json
node scripts/rollback-renames.js  # (if needed)
```

## Benefits of Clean Filenames

✅ Works in both dev and production  
✅ No URL encoding issues  
✅ Better SEO  
✅ Easier debugging  
✅ Cross-platform compatible  
✅ Cleaner URLs

## Summary

**Quick Fix (1 command):**

```bash
npm run fix-filenames
```

**Or Test in Production:**

```bash
npm run build && npm start
```

**Result:**

- ✅ All models load correctly
- ✅ Service Worker works properly
- ✅ Mobile optimizations active
- ✅ No more encoding issues

## Need Help?

See detailed documentation:

- `DEV_SERVER_NOTES.md` - Dev server issues
- `FILENAME_BEST_PRACTICES.md` - Naming conventions
- `MOBILE_OPTIMIZATION_GUIDE.md` - Full optimization guide
