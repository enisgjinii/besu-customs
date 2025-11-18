# Babylon.js Playground-Style Decal System

## Overview
Enhanced the decal system to match the functionality and user experience of the Babylon.js playground example (#1BAPRM#73), with improved material rendering, placement controls, and visual feedback.

## Key Improvements

### 1. Enhanced Material Rendering ✅
**File**: `components/babylon-decals.tsx`

Improved decal materials with playground-quality rendering:
- Added `useAlphaFromDiffuseTexture` for proper transparency
- Set emissive color to full brightness (`Color3(1, 1, 1)`)
- Added emissive texture for better visibility
- Disabled back face culling for two-sided rendering
- Maintained lighting for proper depth perception
- Optimized z-offset for consistent layering

**Result**: Decals now render with crisp, clear alpha blending similar to the playground.

### 2. Pre-Placement Controls ✅
**Files**: 
- `components/decal-editor.tsx` - UI controls
- `lib/store.ts` - State management
- `components/babylon-scene.tsx` - Integration

Added intuitive controls for customizing decals before placement:

#### Rotation Control
- Range slider: 0° to 360°
- Real-time degree display
- Smooth adjustment with visual feedback
- Stored in radians for Babylon.js compatibility

#### Size Control
- Range slider: 0.1x to 2.0x
- Step increments of 0.1x
- Default: 0.5x (medium size)
- Applied to all three axes uniformly

**User Flow**: 
1. Create text or upload image
2. Adjust rotation and size with sliders
3. Click on 3D model to place with chosen settings

### 3. Post-Placement Transform Controls ✅
**File**: `components/decal-transform-controls.tsx`

Enhanced the transform controls with precision sliders:

#### Precision Rotation Slider
- Fine-tune rotation from 0° to 360°
- Step: 0.01 radians (~0.57°)
- Real-time degree display
- Smooth continuous adjustment

#### Precision Size Slider
- Fine-tune size from 0.1x to 3.0x
- Step: 0.05x
- Uniform scaling across X and Y axes
- Real-time size display

**Existing Features Retained**:
- Quick rotate buttons (±15°)
- Quick scale buttons (±10%)
- Duplicate, delete, deselect
- Keyboard shortcuts (Delete, Cmd+D, Esc)

### 4. Visual Placement Preview ✅
**File**: `components/decal-preview-indicator.tsx`

Added real-time visual feedback during placement:

#### Preview Circle
- Cyan translucent disc showing decal size
- Follows mouse cursor on model surface
- Aligns with surface normal (perpendicular to surface)
- Updates size in real-time as slider changes
- Positioned slightly above surface to prevent z-fighting

#### Rotation Indicator
- Orange line showing rotation direction
- Extends from center to edge of preview circle
- Updates angle in real-time as slider changes
- Helps visualize final orientation before placement

**Behavior**:
- Only visible when decal texture is ready for placement
- Hides when not hovering over model
- Non-interactive (doesn't interfere with clicks)
- Automatically disposed when decal is placed

## State Management

### New Store Properties
```typescript
decalPlacementAngle: number;  // Angle in radians (0 to 2π)
decalPlacementSize: number;   // Size multiplier (0.1 to 2.0)
setDecalPlacementAngle: (angle: number) => void;
setDecalPlacementSize: (size: number) => void;
```

### Default Values
- Angle: 0 radians (0°)
- Size: 0.5 (50% of default)

## User Experience Enhancements

### Before Placement
1. **Visual Feedback**: See exactly where and how decal will appear
2. **Size Preview**: Circle scales in real-time with slider
3. **Rotation Preview**: Orange line shows orientation
4. **Hover Indication**: Preview only shows when hovering valid surface

### After Placement
1. **Quick Adjustments**: Buttons for rapid changes
2. **Precise Control**: Sliders for fine-tuning
3. **Keyboard Shortcuts**: Power user efficiency
4. **Visual Selection**: Clear indication of selected decal

## Technical Details

### Material Properties
```typescript
decalMaterial.diffuseTexture.hasAlpha = true;
decalMaterial.useAlphaFromDiffuseTexture = true;
decalMaterial.zOffset = -2;
decalMaterial.specularColor = new Color3(0, 0, 0);
decalMaterial.emissiveColor = new Color3(1, 1, 1);
decalMaterial.emissiveTexture = texture;
decalMaterial.backFaceCulling = false;
decalMaterial.disableLighting = false;
```

### Preview Mesh Setup
```typescript
// Disc geometry
radius: decalPlacementSize * 0.5
tessellation: 64 (smooth circle)

// Material
emissiveColor: Cyan (0, 1, 1)
alpha: 0.3 (semi-transparent)
wireframe: false
backFaceCulling: false
```

### Surface Alignment
- Uses `pickInfo.getNormal(true)` for accurate surface normal
- Rotates preview mesh to align with normal
- Applies user rotation on top of surface alignment
- Offsets slightly above surface (0.01 units) to prevent flickering

## Comparison with Babylon Playground

| Feature | Playground | Your System | Status |
|---------|-----------|-------------|--------|
| Click to place | ✅ | ✅ | ✅ Implemented |
| Alpha blending | ✅ | ✅ | ✅ Enhanced |
| Size control | ✅ | ✅ | ✅ Pre & Post |
| Rotation control | ✅ | ✅ | ✅ Pre & Post |
| Multiple decals | ✅ | ✅ | ✅ Implemented |
| Visual preview | ✅ | ✅ | ✅ Added |
| Transform controls | ⚠️ Basic | ✅ | ✅ Enhanced |
| Text decals | ❌ | ✅ | ✅ Your addition |
| Image upload | ❌ | ✅ | ✅ Your addition |

## Files Modified

1. **components/babylon-decals.tsx**
   - Enhanced material rendering properties
   - Improved alpha blending

2. **components/decal-editor.tsx**
   - Added rotation slider (0-360°)
   - Added size slider (0.1x-2.0x)
   - Connected to store

3. **lib/store.ts**
   - Added `decalPlacementAngle` state
   - Added `decalPlacementSize` state
   - Added setter methods

4. **components/babylon-scene.tsx**
   - Applied placement settings to decal creation
   - Integrated preview indicator component

5. **components/decal-transform-controls.tsx**
   - Added precision rotation slider
   - Added precision size slider

6. **components/decal-preview-indicator.tsx** (NEW)
   - Created visual preview system
   - Real-time cursor following
   - Surface-aligned rendering

## Usage Instructions

### For Users

1. **Creating a Decal**:
   - Enter text or upload image
   - Adjust rotation slider (0-360°)
   - Adjust size slider (0.1x-2.0x)
   - Hover over model to see preview
   - Click to place

2. **Editing a Decal**:
   - Click on placed decal to select
   - Use quick buttons for rapid changes
   - Use precision sliders for fine-tuning
   - Press Delete to remove
   - Press Cmd+D to duplicate
   - Press Esc to deselect

### For Developers

```typescript
// Access placement settings
const angle = useConfiguratorStore(s => s.decalPlacementAngle);
const size = useConfiguratorStore(s => s.decalPlacementSize);

// Update settings
setDecalPlacementAngle(Math.PI / 4); // 45 degrees
setDecalPlacementSize(0.8); // 80% size
```

## Performance Considerations

- Preview indicator is lightweight (single disc + line mesh)
- Automatically disposed when not in use
- Uses efficient pointer observable pattern
- No continuous rendering (only updates on pointer move)

## Future Enhancements (Optional)

- [ ] Snap rotation to common angles (45°, 90°, etc.)
- [ ] Different preview shapes for text vs images
- [ ] Decal library/templates
- [ ] Multi-decal selection and batch editing
- [ ] Decal opacity control
- [ ] Decal color tinting

## Conclusion

Your decal system now matches and exceeds the Babylon.js playground functionality with:
- ✅ Professional material rendering
- ✅ Intuitive pre-placement controls
- ✅ Visual placement feedback
- ✅ Precise post-placement editing
- ✅ Additional features (text, image upload)

The system provides a smooth, professional user experience suitable for production applications.
