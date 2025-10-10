# 3D Model Configurator

A minimal React + Three.js configurator app for uploading and customizing 3D models with material editing capabilities.

## Features

- **Upload GLB/GLTF models** via drag-and-drop or file input
- **3D Viewer** with orbit controls, HDRI lighting, and grid toggle
- **Material Editor** with color pickers, roughness/metalness sliders, and wireframe mode
- **Auto-detection** of mesh materials organized into categories (Body, Panels, Piping/Trim)
- **34 Placeholder Products** for product management
- **Preset System** to save and load configurations as JSON
- **Responsive Layout** optimized for desktop and mobile

## Routes

- `/` - Main viewer with product sidebar and controls
- `/admin` - Admin panel for linking products to model URLs
- `/review` - Demo page with pre-loaded model

## Tech Stack

- React + TypeScript + Vite
- Next.js App Router
- Tailwind CSS v4
- @react-three/fiber + @react-three/drei
- Zustand for state management
- Three.js for 3D rendering

## How It Works

### Section Detection

When a model is loaded, the app automatically:

1. Traverses the scene graph to find all meshes
2. Extracts unique materials (MeshStandardMaterial)
3. Categorizes materials based on naming conventions:
   - **Body**: Contains "body" or "main"
   - **Panels**: Contains "panel", "door", or "hood"
   - **Piping/Trim**: Contains "trim", "pipe", or "edge"
   - **Other**: Everything else

### Adding Product-Model Links

1. Navigate to `/admin`
2. Click "Link Model" next to any product
3. Enter a public URL to a .glb or .gltf file
4. Click save

The model will be associated with that product and load when selected from the sidebar.

### Saving/Loading Presets

- **Export**: Click "Export" to download current configuration as JSON
- **Import**: Click "Import" and select a previously saved JSON file

Presets include all material settings (colors, roughness, metalness, wireframe).

## Development

\`\`\`bash
npm install
npm run dev
\`\`\`

## Acceptance Criteria

✅ Upload GLB files with orbit controls  
✅ Click material sections and edit color/roughness/metalness live  
✅ Switch between 34 placeholder products  
✅ Save/load presets as JSON  
✅ Responsive layout (desktop and mobile)  
✅ Demo route at `/review` with public GLB model
