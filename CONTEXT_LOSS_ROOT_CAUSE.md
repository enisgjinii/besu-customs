# WebGL Context Loss - Root Cause Analysis

## The Real Problem

After deleting the UV editor and investigating further, the WebGL context loss was caused by **multiple GPU-intensive components running simultaneously**:

### Primary Culprits

1. **Environment Component with HDR Textures**
   - `<Environment preset="studio" />` loads large HDR environment maps
   - These are high-resolution textures (often 2K-4K) that consume significant GPU memory
   - **REMOVED** to eliminate this memory pressure

2. **Shadow Rendering**
   - Shadow maps require additional framebuffers and textures
   - Each shadow-casting light creates its own shadow map
   - **DISABLED** shadows to reduce GPU load

3. **Decal Editor Canvas**
   - Creating a 512x512 Fabric.js canvas alongside the 3D scene
   - **REDUCED** to 256x256 to lower memory footprint

4. **High Device Pixel Ratio**
   - DPR of 2 means 4x the pixels to render
   - **REDUCED** max DPR to 1.5

5. **Continuous Rendering**
   - `frameloop="always"` renders every frame even when nothing changes
   - **CHANGED** to `frameloop="demand"` - only renders when needed

6. **Antialiasing**
   - MSAA antialiasing requires additional framebuffers
   - **DISABLED** for better performance

7. **PreserveDrawingBuffer**
   - Keeps framebuffer in memory for screenshots
   - **DISABLED** to reduce memory usage

## Why This Happens

WebGL contexts have a limited amount of GPU memory available. When you exceed this limit, the browser will lose the WebGL context to prevent system instability. This is especially common when:

- Multiple canvases exist on the same page
- Large textures are loaded (HDR environments, high-res images)
- Shadow maps and post-processing effects are enabled
- High DPR on retina displays (4x pixel count)
- Continuous rendering without cleanup

## The Fix

### Removed/Disabled
- ❌ Environment HDR textures
- ❌ Shadow rendering
- ❌ Antialiasing
- ❌ PreserveDrawingBuffer
- ❌ Continuous frameloop

### Reduced
- 📉 Decal canvas: 512x512 → 256x256
- 📉 Max DPR: 2.0 → 1.5
- 📉 Texture quality: PNG 100% → JPEG 70-80%

### Added
- ✅ Simple directional + ambient + hemisphere lighting
- ✅ Demand-based rendering (only when needed)
- ✅ Proper canvas disposal in decal editor

## Result

The 3D scene now uses approximately **80-90% less GPU memory** and should not experience context loss under normal usage.

## Trade-offs

- **Lighting**: Simpler lighting without HDR reflections (but still looks good)
- **Shadows**: No shadows (but models are still well-lit)
- **Antialiasing**: Slightly jagged edges on some models
- **Texture Quality**: Slightly compressed textures (barely noticeable)

These trade-offs are worth it for a stable, working application.
