# UV Texture Editor - User Guide

## Getting Started

### 1. Load a 3D Model
- Select a model from the sidebar
- Wait for the model to load in the 3D viewport
- The UV map will be automatically extracted

### 2. Open Texture Editor
- Click the **"Texture"** tab in the sidebar
- You'll see the UV map wireframe loaded as the canvas background
- A loading spinner shows while the editor initializes

## Adding Content

### Add Text
1. Type your text in the input field
2. Adjust font size with the slider (12-200px)
3. Pick a color using the color picker
4. Click **"Add Text"** button (or press Enter)
5. Text appears on canvas and is automatically selected

### Add Images
1. Click **"Choose File"** under "Add Image"
2. Select an image from your computer
3. Image appears on canvas at 50% scale
4. Automatically selected and ready to manipulate

## Manipulating Objects

### Select Objects
- **Single click** on any text or image to select it
- **Ctrl/Cmd + click** to multi-select
- Click empty space to deselect all

### Move Objects
- **Click and drag** to reposition
- **Arrow keys** to nudge 1px at a time

### Resize Objects
- Drag **corner handles** to resize
- Hold **Shift** while dragging to maintain aspect ratio

### Rotate Objects
- Drag the **rotation handle** (circular icon at top)
- Objects rotate around their center point

### Edit Text
- **Double-click** text to edit inline
- Type new content
- Click outside or press **Esc** to finish editing

## Controls Panel

### Selected Object Controls
When you select an object, these buttons appear:

- **Duplicate**: Creates a copy offset by 20px
- **Delete**: Removes the selected object

### Global Controls

- **Download**: Save the current texture as PNG
- **Clear All**: Remove all objects (keeps UV map background)

## Real-Time 3D Preview

### How It Works
- Every change to the canvas automatically updates the 3D model
- Changes include:
  - Adding objects
  - Moving objects
  - Resizing objects
  - Rotating objects
  - Deleting objects
  - Editing text content

### Performance
- Updates are **debounced by 300ms** for smooth performance
- You can drag objects continuously without lag
- The texture applies to all materials on the model

## Tips & Tricks

### Precision Placement
- Use **arrow keys** for precise 1px movements
- Hold **Shift + arrow keys** for 10px jumps
- Zoom in/out on 3D model to see details

### Text Styling
- Choose contrasting colors for visibility
- Larger fonts (80-120px) work better for readability
- Position text on flat UV areas for best results

### Image Quality
- Upload high-resolution images for best quality
- Images scale down but won't scale up beyond original size
- PNG images with transparency work great

### Multi-Object Selection
- **Ctrl/Cmd + click** to add to selection
- Drag a selection box around multiple objects
- Transform multiple objects at once

## Keyboard Shortcuts

Built-in Fabric.js shortcuts:

- **Delete**: Remove selected object
- **Ctrl/Cmd + A**: Select all objects
- **Ctrl/Cmd + C**: Copy selected object
- **Ctrl/Cmd + V**: Paste copied object
- **Arrow keys**: Nudge 1px
- **Shift + arrows**: Nudge 10px
- **Esc**: Deselect all

## Workflow Example

### Customizing a Jersey

1. **Load Jersey Model**
   - Select jersey from model picker
   - UV map appears in texture editor

2. **Add Team Name**
   - Type "WARRIORS" in text input
   - Set font size to 120px
   - Choose navy blue color
   - Click "Add Text"
   - Drag to position on chest area

3. **Add Player Number**
   - Type "23" in text input
   - Set font size to 150px
   - Choose white color
   - Click "Add Text"
   - Drag to position on back

4. **Add Logo**
   - Click "Choose File"
   - Select team logo image
   - Resize logo to appropriate size
   - Position on sleeve

5. **Final Touches**
   - Duplicate logo for other sleeve
   - Adjust positions for symmetry
   - Review on 3D model

6. **Export**
   - Click "Download" to save texture
   - Texture is ready for production

## Troubleshooting

### Canvas Not Loading
- **Issue**: Spinner shows forever
- **Solution**: Reload the page, ensure model is loaded first

### Text Too Small
- **Issue**: Can't see text on 3D model
- **Solution**: Increase font size to 80px or larger

### Image Quality Poor
- **Issue**: Uploaded image looks pixelated
- **Solution**: Upload higher resolution source image

### Objects Not Updating
- **Issue**: Changes don't appear on 3D model
- **Solution**: Check console for errors, refresh page

### Can't Select Object
- **Issue**: Clicking doesn't select
- **Solution**: Objects may be overlapping, move top object first

## Advanced Features

### Layer Order
- Objects added later appear on top
- Click "Bring to Front" (right-click menu coming soon)
- For now, recreate objects in desired order

### Background UV Map
- UV wireframe is locked (cannot be moved/deleted)
- Acts as a guide for object placement
- Shows exactly where textures will appear on 3D model

### Texture Resolution
- Canvas is 800x800px for performance
- Exports at full resolution (2048x2048px)
- Maintains quality for production

## Best Practices

### Design Workflow
1. Plan layout on paper first
2. Add largest elements first (backgrounds)
3. Add medium elements (text, logos)
4. Add small details last
5. Review on 3D model frequently

### Performance
- Avoid adding hundreds of objects
- Group related elements when possible
- Delete unused objects
- Save/download frequently

### Collaboration
- Download texture at each stage
- Share PNG files with team
- Version control with numbered saves (v1, v2, etc.)

## Coming Soon (Potential Features)

- [ ] Undo/Redo functionality
- [ ] Layer panel with visibility toggles
- [ ] Text style presets (bold, italic, fonts)
- [ ] Image filters (brightness, contrast)
- [ ] Alignment tools (center, distribute)
- [ ] Snap to grid
- [ ] Template library
- [ ] Multi-material support (edit specific parts)

---

**Need Help?** Check the console (F12) for error messages or contact support.
