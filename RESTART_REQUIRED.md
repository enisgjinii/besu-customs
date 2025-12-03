# ⚠️ DEV SERVER RESTART REQUIRED

## The Issue

The dev server is running but not serving static files from the `public/` folder correctly. This happens after major code changes.

## The Solution

**You MUST restart the dev server:**

```bash
# 1. Stop the current dev server
# Press Ctrl+C in the terminal where it's running

# 2. Clear caches
npm run clear-cache

# 3. Start fresh
npm run dev
```

## Why This Happens

Next.js dev server caches file routes and module resolution. After migrating from Babylon.js to Three.js:
- Module imports changed
- Component files changed
- The server needs to rebuild its internal cache

## Verification

After restarting, test that static files work:

```bash
# Should return 200 OK
curl -I http://localhost:3000/LOGO-gg.png

# Should return 200 OK and show file size
curl -I http://localhost:3000/models/Backpack.glb
```

## Complete Restart Steps

### Step 1: Stop Server
In the terminal running `npm run dev`, press **Ctrl+C**

### Step 2: Clear Everything
```bash
npm run clear-cache
```

### Step 3: Restart
```bash
npm run dev
```

### Step 4: Clear Browser
1. Visit: http://localhost:3000/clear-cache.html
2. Click "Clear All Caches"
3. Close tab

### Step 5: Test
1. Open: http://localhost:3000
2. Select a model (e.g., "Backpack")
3. Should load successfully!

## If Still Not Working

### Nuclear Option:
```bash
# Stop server (Ctrl+C)

# Remove all caches
rm -rf .next
rm -rf node_modules/.cache
npm run clear-cache

# Restart
npm run dev
```

### Check Port:
```bash
# Make sure nothing else is on port 3000
lsof -ti:3000

# If something is there, kill it:
kill -9 $(lsof -ti:3000)

# Then restart
npm run dev
```

## Expected Output

After restart, you should see:
```
▲ Next.js 16.0.3
- Local:        http://localhost:3000
- Environments: .env

✓ Starting...
✓ Ready in 2.3s
```

Then visit http://localhost:3000 and models should load!

## Verification Command

```bash
npm run verify-setup
```

Should show:
```
✅ Dev Server: Running on port 3000
🎉 All checks passed!
```

---

**TL;DR**: Stop the dev server (Ctrl+C), run `npm run clear-cache`, then `npm run dev`
