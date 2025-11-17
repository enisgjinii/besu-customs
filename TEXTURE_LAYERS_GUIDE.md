# Texture Layers Feature Guide

## Overview
The Texture Layers feature provides a comprehensive layer management system for the texture tab, built entirely with shadcn/ui components. It allows users to create, manage, and apply multiple texture layers (text and images) to 3D models.

## Features

### Layer Types
- **Text Layers**: Create text-based decals with customizable:
  - Text content
  - Font size
  - Text color
  - Opacity
  - Blend mode

- **Image Layers**: Upload and manage image-based decals with:
  - Image file support (PNG, JPG, etc.)
  - Opacity control
  - Blend mode options

### Layer Management
Each layer can be:
- ✅ **Toggled on/off** (visibility)
- 🔒 **Locked/unlocked** (prevent editing)
- 📊 **Reordered** (move up/down in stack)
- 📋 **Duplicated** (create copies)
- 🗑️ **Deleted** (remove from list)
- 🎨 **Edited** (modify properties)

### Layer Properties
- **Opacity**: 0-100% transparency control
- **Blend Mode**: 
  - Normal
  - Multiply
  - Screen
  - Overlay
  - Add
- **Order**: Z-index position in layer stack

### UI Components Used (shadcn/ui)
- `Card` - Layer container
- `Button` - All actions
- `Input` - Text and number inputs
- `Label` - Form labels
- `Slider` - Opacity control
- `Select` - Blend mode selection
- `Badge` - Status indicators
- `ScrollArea` - Scrollable layer list
- `Separator` - Visual dividers
- `Collapsible` - Expandable layer details

## Usage

### Adding Layers
1. Navigate to the **Texture** tab in the sidebar
2. Enter an optional layer name
3. Click **Add Text** or **Add Image**
4. Configure layer properties in the expanded panel

### Editing Layers
1. Click on a layer card to select it
2. Click the expand icon (chevron) to show controls
3. Adjust properties:
   - Opacity slider
   - Blend mode dropdown
   - Text/color inputs (for text layers)
4. Changes are auto-saved to the store

### Applying Layers
- **Individual Layer**: Click "Apply" button on expanded layer
- **All Layers**: Click "Apply All Layers" at the bottom
- After applying, click on the 3D model to place the decal

### Layer Order
- Layers are displayed in reverse order (top = front)
- Use up/down arrows to reorder
- Order affects visual stacking when applied together

## State Management

### Store Integration
Layer state is managed via Zustand store (`lib/store.ts`):
```typescript
textureLayers: TextureLayer[]
addTextureLayer(layer)
updateTextureLayer(id, updates)
removeTextureLayer(id)
reorderTextureLayers(layers)
clearTextureLayers()
```

### Data Structure
```typescript
interface TextureLayer {
  id: string
  name: string
  type: "text" | "image" | "decal"
  visible: boolean
  locked: boolean
  opacity: number
  blendMode: "normal" | "multiply" | "screen" | "overlay" | "add"
  order: number
  dataUrl?: string
  text?: string
  textColor?: string
  fontSize?: number
  imageUrl?: string
  position?: { x, y, z }
  rotation?: { x, y, z }
  scale?: { x, y, z }
}
```

## Component Architecture

### TextureLayers Component
Location: `components/texture-layers.tsx`

**Sections:**
1. **Header** - Title and layer count
2. **Layer List** - Scrollable list of all layers
3. **Layer Card** - Individual layer with controls
4. **Footer** - Add new layer actions

**Key Functions:**
- `addTextLayer()` - Create text layer
- `addImageLayer(file)` - Create image layer
- `updateLayer(id, updates)` - Modify layer
- `toggleVisibility(id)` - Show/hide layer
- `toggleLock(id)` - Lock/unlock layer
- `deleteLayer(id)` - Remove layer
- `duplicateLayer(id)` - Clone layer
- `moveLayer(id, direction)` - Reorder layers
- `applyLayerToModel(layer)` - Apply single layer
- `applyAllLayers()` - Apply combined layers
- `renderCombinedPreview()` - Generate merged texture

## Integration

### Unified Sidebar
The TextureLayers component is integrated into the texture tab:
```tsx
{activeTab === "texture" && <TextureLayers />}
```

Replaces the previous `DecalEditor` component for a more robust solution.

### 3D Scene Integration
Layers generate data URLs that are passed to:
- `setLastDecalTexture()` - Store last generated texture
- User clicks on model to place via existing decal system

## Best Practices

1. **Layer Naming**: Use descriptive names for easy identification
2. **Opacity**: Start at 100% and adjust as needed
3. **Blend Modes**: Experiment to achieve desired effects
4. **Layer Order**: Keep frequently used layers accessible
5. **Lock Layers**: Lock finalized layers to prevent accidental edits
6. **Visibility**: Toggle off layers you're not currently working on

## Future Enhancements

Potential additions:
- [ ] Layer thumbnails/previews
- [ ] Layer groups/folders
- [ ] Drag-and-drop reordering
- [ ] Layer effects (shadow, glow, etc.)
- [ ] Color adjustments per layer
- [ ] Transform controls (position, rotation, scale)
- [ ] Layer masks
- [ ] Export/import layer presets
- [ ] Undo/redo for layer operations

## Troubleshooting

**Layers not appearing:**
- Check layer visibility (eye icon)
- Verify opacity > 0
- Ensure layer is applied to model

**Apply button disabled:**
- Layer must be visible to apply
- Check that layer has content (text/image)

**Can't edit layer:**
- Check if layer is locked (lock icon)
- Unlock before editing

## Technical Notes

- All components are from shadcn/ui for consistency
- State persisted in Zustand store
- Canvas API used for text rendering
- FileReader API for image uploads
- Responsive design with Tailwind CSS
- Accessible with keyboard navigation
- Dark mode compatible
