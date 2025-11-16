# 🔧 UV Texture Debugging Guide

## Quick Test Steps

### 1. Start Dev Server

```bash
npm run dev
```

### 2. Open Browser Console

Press `F12` or `Cmd+Option+I` to open Developer Tools

### 3. Test the UV Texture Flow

1. **Load a Model**
   - Select "Volleyball Short Sleeve Tops" or "Basketball Jersey"
2. **Select a Material**
   - Go to "Materials" tab
   - Click on any material (e.g., "Front Panel", "Sleeve", etc.)
   - You should see it highlighted
3. **Go to Texture Tab**
   - Click "Texture" tab
   - Watch the console for: `"Applying texture to model..."`

4. **Add Text**
   - Click "Text" button
   - Edit the text
   - Move it around
   - **Watch console for:**
     ```
     Applying texture to model...
     Texture generated, updating section: [material-uuid]
     ✅ Applying custom texture to material [uuid] for section [name]
     ✅ Custom texture loaded successfully for [name]
     ```

5. **Check 3D Model**
   - The text should appear on the 3D model
   - It might take 300ms (debounce delay)

## Console Messages to Watch For

### ✅ Good Messages:

- `"Applying texture to model..."`
- `"Texture generated, updating section: [id]"`
- `"✅ Applying custom texture to material [uuid]"`
- `"✅ Custom texture loaded successfully"`

### ❌ Problem Messages:

- `"applyToModelRealtime: skipping - no canvas or section"`
  - **Fix**: Make sure you selected a material first
- `"❌ Failed to load custom texture"`
  - **Fix**: Check if texture data URL is valid
- No messages at all
  - **Fix**: Check if events are being fired

## Common Issues & Fixes

### Issue 1: "No section selected" message

**Problem**: You didn't select a material before going to Texture tab
**Solution**:

1. Go to Materials tab
2. Click on a material
3. Then go back to Texture tab

### Issue 2: Texture updates but doesn't show on model

**Problem**: Material might not be mapped correctly
**Solution**:

1. Check console for: `"✅ Custom texture loaded successfully"`
2. If you see `"❌ Failed to load"`, the data URL might be corrupted
3. Try clicking "Apply High-Res to Model" button manually

### Issue 3: No console messages

**Problem**: Events not firing
**Solution**:

1. Refresh the page
2. Make sure you're on the Texture tab
3. Try adding/moving text
4. Check if Fabric.js canvas initialized

### Issue 4: Texture is blank/white

**Problem**: Canvas might not have content or UV map
**Solution**:

1. Check if UV map loaded (you should see wireframe)
2. Try toggling the Eye icon to show UV wireframe
3. Add text and make sure it's visible in the canvas

## Debugging Commands

Open browser console and try:

```javascript
// Check if UV editor state is correct
useConfiguratorStore.getState().selectedSectionId;
// Should show a UUID if material is selected

// Check all sections
useConfiguratorStore.getState().sections;
// Should show array of materials

// Check UV maps
useConfiguratorStore.getState().uvMaps;
// Should show Map of UV data URLs

// Force apply texture
document.querySelector('[data-tab="texture"]')?.click();
```

## Test Checklist

- [ ] Model loads successfully
- [ ] Can select material from Materials tab
- [ ] Texture tab shows canvas (not "Coming Soon")
- [ ] UV wireframe visible in canvas
- [ ] Can add text
- [ ] Can move text
- [ ] Console shows "Applying texture..." messages
- [ ] Console shows "✅ Custom texture loaded"
- [ ] Text appears on 3D model (within 300ms)
- [ ] Can add images
- [ ] Images also appear on model

## Expected Timeline

1. **Add text** (0ms)
2. **Fabric.js fires event** (~10ms)
3. **Debounce waits** (300ms)
4. **Generate texture** (~50ms)
5. **Update state** (~10ms)
6. **Load texture in Three.js** (~100ms)
7. **Render on model** (~50ms)

**Total: ~520ms from text edit to visible on model**

## If Nothing Works

1. **Clear browser cache**: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. **Restart dev server**: Stop with Ctrl+C, then `npm run dev`
3. **Check build**: Run `npm run build` to ensure no compile errors
4. **Try different material**: Some materials might not have UV maps
5. **Try simpler model**: Start with Basketball Jersey

## Success Criteria

You know it's working when:

1. ✅ You add text in the UV editor canvas
2. ✅ Console shows "Applying texture..." and "✅ Custom texture loaded"
3. ✅ Within 1 second, the text appears on the 3D model
4. ✅ Moving text updates the model in real-time
5. ✅ Can add multiple text/images

## Still Not Working?

If texture updates don't appear after following all steps:

1. **Take screenshot of:**
   - Browser console showing all messages
   - The UV editor canvas with your text
   - The 3D model

2. **Check:**
   - What model you're using
   - What material you selected
   - What the console messages say

3. **Try:**
   - Different browser (Chrome recommended)
   - Simpler content (just "TEST" text)
   - Manual "Apply High-Res" button

## Quick Debug Script

Paste this in browser console:

```javascript
const store = useConfiguratorStore.getState();
console.log("Debug Info:", {
  selectedSectionId: store.selectedSectionId,
  totalSections: store.sections.length,
  hasUVMaps: store.uvMaps.size,
  sectionNames: store.sections.map((s) => s.name),
});
```

This will show if sections are loaded and if you have a section selected.
