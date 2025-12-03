# 🚀 Final Setup Instructions

## ⚠️ IMPORTANT: Dev Server Must Be Restarted!

The migration is complete, but you **MUST restart the dev server** for changes to take effect.

## 📋 Complete Setup Steps

### Step 1: Stop Current Dev Server

Press `Ctrl+C` in your terminal to stop the current dev server.

### Step 2: Clear All Caches

```bash
# Clear Next.js and build caches
npm run clear-cache
```

### Step 3: Clear Browser Cache

**Option A: Use the cache clearer page**
1. Start dev server: `npm run dev`
2. Visit: http://localhost:3000/clear-cache.html
3. Click "Clear All Caches"
4. Close the tab

**Option B: Manual clearing**
1. Open DevTools (F12)
2. Application → Storage → Clear site data
3. Application → Service Workers → Unregister all
4. Application → Cache Storage → Delete all

### Step 4: Restart Dev Server

```bash
npm run dev
```

### Step 5: Test

1. Open: http://localhost:3000
2. Select a model from the dropdown
3. Model should load with Three.js!

## 🔍 Troubleshooting

### Issue: "Could not load /models/Backpack.glb: Failed to fetch"

**Cause**: Dev server not restarted after migration

**Solution**:
```bash
# Stop server (Ctrl+C)
npm run clear-cache
npm run dev
```

### Issue: Models still not loading

**Check 1: Verify files exist**
```bash
ls public/models/*.glb | head -5
```

**Check 2: Test static file serving**
```bash
# Start dev server first, then:
curl -I http://localhost:3000/LOGO-gg.png
# Should return 200 OK
```

**Check 3: Clear browser cache**
- Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
- Or use the cache clearer: http://localhost:3000/clear-cache.html

### Issue: Build errors

```bash
# Clean everything and rebuild
rm -rf .next node_modules/.cache
npm run dev
```

### Issue: TypeScript errors

```bash
# Check for errors
npm run build

# If errors, check diagnostics
# All files should have no errors
```

## ✅ Verification Checklist

After restarting, verify:

- [ ] Dev server starts without errors
- [ ] Can access http://localhost:3000
- [ ] Can select a model from dropdown
- [ ] Model loads and displays
- [ ] Can rotate/zoom the model
- [ ] Can change colors
- [ ] Can upload textures
- [ ] No console errors (F12)

## 🎯 Expected Behavior

**Loading a model should:**
1. Show "Detecting Connection..." (brief)
2. Show "Loading Preview..." with progress bar
3. Display the 3D model
4. Allow interaction (rotate, zoom, pan)

**Performance:**
- First load: 1-5 seconds (depending on connection)
- Cached load: <100ms (instant)
- Smooth 60 FPS rotation

## 📊 Success Indicators

✅ **Console logs should show:**
```
📦 Loading high quality model: /models/backpack.glb
✅ Model loaded successfully
📋 Using extracted sections: X
🗺️ UV map extracted successfully
```

✅ **Network tab should show:**
- Model file loaded (200 OK)
- File size: ~3-4 MB for original quality
- Or ~600 KB for low quality on slow connections

✅ **Performance:**
- Smooth rotation
- No lag or stuttering
- Memory usage: 80-120 MB

## 🔄 If Still Having Issues

### Nuclear Option: Complete Reset

```bash
# 1. Stop dev server (Ctrl+C)

# 2. Clear everything
npm run clear-cache
rm -rf .next
rm -rf node_modules/.cache

# 3. Restart
npm run dev

# 4. Clear browser
# Visit: http://localhost:3000/clear-cache.html
# Click "Clear All Caches"

# 5. Hard refresh
# Ctrl+Shift+R or Cmd+Shift+R
```

### Check Next.js Version

```bash
npm list next
# Should be: next@16.0.3 or higher
```

### Check Three.js Installation

```bash
npm list three @react-three/fiber @react-three/drei
# Should show all three packages installed
```

## 📝 Common Mistakes

❌ **Forgot to restart dev server**
- Solution: Stop (Ctrl+C) and restart (`npm run dev`)

❌ **Didn't clear browser cache**
- Solution: Visit http://localhost:3000/clear-cache.html

❌ **Old service worker still active**
- Solution: DevTools → Application → Service Workers → Unregister

❌ **Using old Babylon.js imports**
- Solution: All files now use Three.js (check completed)

## 🎉 Success!

Once you see the model loading and can interact with it, the migration is complete!

**You should see:**
- ✅ Faster loading times
- ✅ Smoother performance
- ✅ Smaller bundle size
- ✅ All features working

---

**Need Help?**
1. Check console for errors (F12)
2. Check Network tab for failed requests
3. Verify dev server is running
4. Try the nuclear option above

**Still stuck?**
- Check `START_HERE.md` for overview
- Check `THREEJS_MIGRATION_GUIDE.md` for details
- Verify all files are saved and server restarted
