# Development Server Notes

## Known Issues with Next.js Dev Server

### Issue: Models with Spaces in Filenames

**Problem:**
The Next.js development server (`npm run dev`) may have issues serving static files with spaces in their names, even when properly URL-encoded.

**Error:**
```
Unable to load from /models/Track%20and%20field%20top%20tank%20top.glb
LoadFileError: Error status: 0
```

**Why This Happens:**
- Next.js dev server uses different static file handling than production
- URL encoding may not work consistently in development
- This is a known limitation of the dev server

**Solutions:**

### Option 1: Test in Production Mode (Recommended)

The production build handles URL encoding correctly:

```bash
npm run build
npm start
```

Then test at `http://localhost:3000`

### Option 2: Rename Files (Best Long-term Solution)

Rename model files to remove spaces:

```bash
cd public/models

# Rename files with spaces
mv "Track and field top tank top.glb" "track-and-field-top-tank-top.glb"
mv "Basketball Jersey and Shorts.glb" "basketball-jersey-and-shorts.glb"
# ... etc
```

Then update `public/models.json` with new filenames.

### Option 3: Use Symbolic Links (Quick Workaround)

Create symlinks without spaces:

```bash
cd public/models

# Create symlinks
ln -s "Track and field top tank top.glb" "track-and-field-top-tank-top.glb"
ln -s "Basketball Jersey and Shorts.glb" "basketball-jersey-and-shorts.glb"
```

Update `models.json` to use the symlink names.

## Service Worker in Development

### Cache Errors

You may see these errors in development:

```
Failed to execute 'put' on 'Cache': Request method 'HEAD' is unsupported
Failed to execute 'put' on 'Cache': Cache.put() encountered a network error
```

**Why:**
- Service Workers can't cache HEAD or POST requests
- Some Next.js dev server requests use these methods
- HMR (Hot Module Replacement) uses POST requests

**Solution:**
These errors are harmless in development and won't occur in production. The Service Worker now:
- Only caches GET requests
- Ignores cache errors gracefully
- Works correctly in production

## Testing Recommendations

### For Development
1. Use production mode: `npm run build && npm start`
2. Or rename files to avoid spaces
3. Service Worker will work correctly

### For Production
1. Deploy to Vercel or your hosting platform
2. All optimizations will work as expected
3. Service Worker will cache correctly
4. URL encoding will work properly

## Quick Test Script

Test if a model loads correctly:

```bash
# Test in development
curl -I "http://localhost:3000/models/Track%20and%20field%20top%20tank%20top.glb"

# Should return 200 OK in production mode
# May return 404 in dev mode
```

## Summary

**Development Mode (`npm run dev`):**
- ⚠️ May have issues with spaces in filenames
- ⚠️ Service Worker cache errors (harmless)
- ✅ HMR and fast refresh work
- ✅ Good for UI development

**Production Mode (`npm run build && npm start`):**
- ✅ Handles spaces in filenames correctly
- ✅ Service Worker works perfectly
- ✅ All optimizations active
- ✅ Recommended for testing mobile optimizations

**Recommendation:**
- Develop UI in dev mode
- Test performance in production mode
- Deploy to production for final testing
- Consider renaming files for best compatibility
