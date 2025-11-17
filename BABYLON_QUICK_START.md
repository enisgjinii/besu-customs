# Babylon.js Quick Start Guide

## What Changed

Your 3D configurator now runs on **Babylon.js** instead of Three.js, eliminating WebGL context loss issues.

## New Features

### 1. Automatic Model Centering ✨
Models automatically center perfectly in the viewport, no matter their size or origin point.

### 2. Entrance Animation 🎬
Every model loads with a smooth zoom + fade animation (1 second duration).

### 3. Material System 🎨
Full material editing support:
- Solid colors
- Custom textures (upload images)
- Gradients (linear & radial)
- Trim designs (stripes, checkerboard, dots)
- Real-time updates

## How to Use

### Load a Model
```typescript
const setCurrentModelUrl = useConfiguratorStore((s) => s.setCurrentModelUrl);
setCurrentModelUrl("/models/your-model.glb");
```

The model will:
1. Load automatically
2. Center in viewport
3. Play entrance animation
4. Extract material sections
5. Be ready for editing

### Change Material Color
```typescript
const updateSection = useConfiguratorStore((s) => s.updateSection);
updateSection(sectionId, { color: "#ff0000" });
```

### Apply Custom Texture
```typescript
updateSection(sectionId, { customTexture: base64DataUrl });
```

### Create Gradient
```typescript
updateSection(sectionId, {
  gradient: {
    enabled: true,
    type: "linear",
    angle: 45,
    colors: ["#ff0000", "#0000ff"],
  }
});
```

## Performance

### Before (Three.js)
- ❌ WebGL context loss every few minutes
- ❌ Memory leaks with textures
- ❌ Manual cleanup required
- ❌ Complex material updates

### After (Babylon.js)
- ✅ No context loss
- ✅ Automatic memory management
- ✅ Built-in cleanup
- ✅ Simple material updates
- ✅ Better performance

## File Structure

```
components/
  babylon-scene.tsx          # Main 3D scene (replaces scene.tsx)
  
lib/
  babylon-material-utils.ts  # Material system utilities
  store.ts                   # Updated for Babylon types
  
backup/
  threejs-components/        # Original Three.js files (backup)
```

## Troubleshooting

### Model doesn't center
- Check console for bounding box logs
- Verify model has proper geometry
- Try reloading the model

### Materials don't update
- Check console for "Applying materials" logs
- Verify sections are extracted
- Check section IDs match

### Entrance animation doesn't play
- Animation plays automatically on load
- Check if model loaded successfully
- Look for animation logs in console

## API Compatibility

All existing APIs work the same:
- `/api/materials` - Fetch precomputed sections
- `/api/models` - List available models
- Store hooks - Same interface

## Next Steps

Phase 3 will add:
- Decal placement system
- Background images/videos
- Screenshot/export functionality
- More animation types

## Support

Check these files for details:
- `BABYLON_MIGRATION.md` - Full migration details
- `PHASE_2_COMPLETE.md` - Phase 2 implementation
- `CONTEXT_LOSS_ROOT_CAUSE.md` - Why we migrated

## Quick Commands

```bash
# Install dependencies (already done)
npm install @babylonjs/core @babylonjs/loaders @babylonjs/materials

# Run dev server
npm run dev

# Build for production
npm run build
```

## Key Differences

| Concept | Three.js | Babylon.js |
|---------|----------|------------|
| Scene | Manual setup | Engine + Scene |
| Camera | PerspectiveCamera | ArcRotateCamera |
| Rotation | Euler | Vector3 |
| Materials | MeshStandardMaterial | StandardMaterial |
| Textures | Texture | Texture/DynamicTexture |
| Loading | useGLTF hook | SceneLoader.ImportMesh |

## Success Indicators

✅ Models load without errors
✅ Entrance animation plays smoothly
✅ Materials update in real-time
✅ No WebGL context loss
✅ Smooth 60fps rendering
✅ Memory usage stays stable

Your configurator is now more stable, performant, and maintainable! 🎉
