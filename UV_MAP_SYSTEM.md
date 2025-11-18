# UV Map Texture System

## Overview

The 3D configurator now uses a UV map-based approach for adding text and images to models. This provides precise control and avoids issues with 3D decal placement.

## How It Works

### 1. UV Map Extraction
When a 3D model is loaded, the system automatically:
- Extracts UV coordinates from all meshes
- Generates a 2D wireframe representation (2048x2048)
- Stores it in the global state

### 2. UV Map Editor
The UV Map Editor (`components/uv-map-viewer.tsx`) provides:
- **Canvas-based editing**: Add text and images directly on the UV map
- **Text controls**: Font size, color, and positioning
- **Image upload**: Add logos, graphics, or photos
- **Interactive selection**: Click elements to select and delete them
- **Live preview**: See changes in real-time on the canvas

### 3. Applying to Model
When you click "Apply to Model":
- The edited UV map canvas is converted to a PNG texture
- Applied as `globalCustomTexture` to all model materials
- Rendered on the 3D model using existing UV coordinates

## Usage

1. **Load a model**: Select any 3D model from the sidebar
2. **Open UV Editor**: Click "Texture" tab → "Open UV Editor"
3. **Add text**:
   - Enter text in the input field
   - Adjust font size with slider
   - Pick a color
   - Click "Add Text"
4. **Add images**:
   - Click the file input under "Add Image"
   - Select an image file
   - Image appears on the UV map
5. **Position elements**: Click and drag (future enhancement)
6. **Apply**: Click "Apply to Model" to see it on your 3D model

## Files Changed

### Created
- `components/uv-texture-editor.tsx` - Main UV editor wrapper
- `UV_MAP_SYSTEM.md` - This documentation

### Modified
- `components/uv-map-viewer.tsx` - Enhanced with editing capabilities
- `components/babylon-scene.tsx` - Added UV extraction on model load
- `components/unified-sidebar.tsx` - Replaced old decal UI with UV editor
- `lib/store.ts` - Removed 3D decal state, kept UV map state

### Removed
- 3D decal placement logic (click-to-place on model surface)
- Decal preview indicator
- `BabylonDecals` component rendering
- Decal transform controls

## Benefits

✅ **Precise placement**: Work directly on the UV layout  
✅ **No surface normal issues**: UV coordinates are 2D  
✅ **Better for complex designs**: Layer multiple elements easily  
✅ **Standard workflow**: Matches how textures are created in 3D software  
✅ **Easier to edit**: See the full texture layout at once

## Future Enhancements

- [ ] Drag-and-drop positioning for text/images
- [ ] Rotation controls for elements
- [ ] Layers system with blend modes
- [ ] Undo/redo functionality
- [ ] Export edited UV map as PNG
- [ ] Load existing textures as base layer
