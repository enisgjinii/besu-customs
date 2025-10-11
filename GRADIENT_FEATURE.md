# Gradient Color Feature

## Overview
Added gradient color support to the 3D configurator, allowing users to apply linear and radial gradients to material sections instead of solid colors.

## Features

### Gradient Types
- **Linear Gradient**: Directional gradient with adjustable angle (0-360°)
- **Radial Gradient**: Circular gradient from center outward

### Gradient Controls
- **Enable/Disable**: Toggle gradient mode for each material section
- **Type Selection**: Choose between linear or radial gradient
- **Angle Control**: Adjust direction for linear gradients (0-360°)
- **Multiple Colors**: Support for 2-4 gradient colors
- **Add/Remove Colors**: Dynamically add or remove color stops
- **Live Preview**: Visual preview of the gradient before applying

### UI Location
The gradient controls are located in the **Materials** tab of the Controls Panel:
1. Select a material section
2. Enable the "Gradient" checkbox
3. Configure gradient type, colors, and angle
4. See live preview and apply to 3D model

### Technical Implementation

#### Store Updates (`lib/store.ts`)
Added `gradient` property to `MaterialSection` interface:
```typescript
gradient?: {
  enabled: boolean;
  type: "linear" | "radial";
  colors: string[];
  angle?: number; // for linear gradients (0-360)
  stops?: number[]; // color stop positions (0-1)
}
```

#### Material Editor (`components/material-editor.tsx`)
- Added gradient toggle checkbox
- Gradient type selector (linear/radial)
- Angle slider for linear gradients
- Color pickers for each gradient color
- Add/Remove color buttons
- Live gradient preview

#### Model Utils (`lib/model-utils.ts`)
- `createGradientTexture()`: Generates canvas-based gradient texture
- Updated `applyMaterialUpdates()`: Applies gradient textures to 3D materials
- Converts gradient to THREE.CanvasTexture for rendering

### Usage Notes
- Gradients are disabled when custom textures are applied
- Base color is disabled when gradient is enabled
- Gradient textures are generated at 512x512 resolution
- Gradients work with all material properties (roughness, metalness, wireframe)

### Future Enhancements
- Custom color stop positions
- Gradient presets
- Export/import gradient configurations
- More gradient types (conic, diamond)
