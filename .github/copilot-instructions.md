# besu-customs AI Coding Guidelines

## Project Overview
3D model configurator for customizing sports apparel (jerseys, bags, etc.) with real-time material editing. Built with Next.js 16, Babylon.js for 3D rendering, and Supabase for data/auth.

**Critical Context**: Migrated from Three.js to Babylon.js (Phase 1 complete). See `BABYLON_MIGRATION.md` for differences.

## Architecture

### State Management (Zustand)
- **Single source**: `lib/store.ts` (~637 lines) - All app state lives here
- **Key stores**: 
  - `useConfiguratorStore`: 3D model state, sections, materials, camera
  - `lib/onboarding-store.ts`: User onboarding flows (~834 lines)
- **Pattern**: Direct store access, no prop drilling. Always import from `@/lib/store`

### 3D Rendering (Babylon.js)
- **Main component**: `components/babylon-scene.tsx` (~1723 lines)
- **Engine config**: `preserveDrawingBuffer: false`, `antialias: false` (performance optimized)
- **Critical setting**: `reactStrictMode: false` in `next.config.mjs` - required for Babylon.js
- **WebGL context loss**: Fixed via texture size limits (max 2048x2048), proper disposal. See `WEBGL_CONTEXT_FIX.md`
- **Material system**: `lib/babylon-material-utils.ts` handles color/texture/gradient application
- **UV editing**: `components/uv-texture-editor.tsx` + `lib/babylon-uv-utils.ts` - 2D canvas-based texture editing

### Material Detection & Parsing
- **Parser**: `lib/material-name-parser.ts` - Extracts meaning from material names (e.g., "Body_F_301116" → "Body Front")
- **Auto-categorization**: Body parts → Blue, Panels → Orange, Trim → Gray (priority 10-100)
- **Section extraction**: `extractSectionsFromModel()` in `babylon-material-utils.ts` - Automatically categorizes meshes on load

### Data Layer
- **Supabase**: Auth + models storage (`lib/supabase.ts`)
- **Services**: `lib/models-service.ts` (CRUD), `lib/users-service.ts`, `lib/models-sync-service.ts`
- **Schema**: See `supabase_schema.sql` - profiles table with RLS enabled
- **Google Auth**: Configured via `client_google.json` (OAuth 2.0)

### Routes
- `/` - Main configurator (`app/page.tsx`)
- `/admin` - Admin panel for models (`app/admin/models/page.tsx`)
- `/review` - Demo page with pre-loaded model
- `/materials` - Material browsing (uses TanStack Query)

## Critical Conventions

### 3D Model Loading
```tsx
// ALWAYS dynamic import to prevent SSR issues
const Scene = dynamic(() => import("@/components/babylon-scene"), { ssr: false });
```

### Material Updates
```typescript
// Update via store, Babylon scene reacts automatically
updateSection(sectionId, { color: "#ff0000" });
// Scene watches sections array and applies changes in useEffect
```

### Texture Application
- **Global textures**: Use `setGlobalCustomTexture(dataUrl)` - applies to all materials
- **Fabric.js integration**: UV editor uses Fabric.js canvas, exports as PNG dataUrl
- **Flip handling**: `flipY: false` when creating Babylon textures from canvas (see `TEXTURE_FIX_SUMMARY.md`)

### Path Aliases
Use `@/*` for all imports (maps to project root via `tsconfig.json`)

## Development Workflow

### Scripts
```bash
npm run dev                    # Start dev server (localhost:3000)
npm run build                  # Production build
npm run extract-materials      # Extract material names from GLB/GLTF files → materials-output/
npm run optimize-backpack      # Model optimization script
```

### Material Extraction
- **Script**: `scripts/extract-materials.js` - Parses GLB/GLTF/OBJ files
- **Searches**: `public/models/`, `Models (Phase 1)/`, `Models (Phase 2)/`
- **Output**: `materials-output/*.txt` files with material names

### Testing Material Changes
```javascript
// Browser console debugging:
window.__sections = useConfiguratorStore.getState().sections;
console.log(window.__sections);
// Force update:
store.updateSection(sectionId, { color: "#ff0000" });
```

## Known Issues & Gotchas

### WebGL Context Loss
- **Cause**: Multiple GPU-intensive components, large textures
- **Prevention**: Max 2048x2048 textures, dispose old textures, antialias: false
- **Recovery**: `doNotHandleContextLost: false` in engine config (see `CONTEXT_LOSS_ROOT_CAUSE.md`)

### Babylon.js vs Three.js
- **Camera**: `ArcRotateCamera` not `PerspectiveCamera`
- **Vectors**: Use `Vector3` constructor, not Euler for rotations
- **Materials**: `StandardMaterial` not `MeshStandardMaterial`
- **Render loop**: `engine.runRenderLoop()` not `useFrame` hook

### Deployment (Vercel)
- **Config**: `vercel.json` excludes `public/models/**` from functions
- **Image optimization**: Disabled (`unoptimized: true`) for GLB assets
- **Caching**: Models cached for 1 year (`max-age=31536000`)

### Authentication
- **Google OAuth**: Requires `client_google.json` config
- **Context**: `lib/auth-context.tsx` - Wrap app in `<AuthProvider>`
- **Protected routes**: Check `user` state, redirect to `/login` if null

## File Organization Patterns

### Components
- `babylon-*` prefix: Babylon.js-specific components
- `uv-*` prefix: UV map/texture editing
- `ui/*`: Shadcn/ui components (Radix primitives + Tailwind)

### Documentation
- `*_MIGRATION.md`: Migration guides (Three.js → Babylon.js)
- `*_FIX.md`: Bug fix documentation with root cause analysis
- `*_GUIDE.md`: User/developer guides
- Keep docs updated when changing related systems

## Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=<your_supabase_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>
```

## AI Image Generation
- **Service**: `lib/ai-service.ts` (singleton pattern)
- **Providers**: OpenRouter, DALL-E, Flux (via Runware SDK)
- **Component**: `components/ai-image-generator.tsx`

## When Modifying...

### Store State
1. Update interface in `lib/store.ts`
2. Add getter/setter methods
3. Update persisted fields if needed (check `persist()` config)

### 3D Scene
1. Check if change affects WebGL context (texture sizes!)
2. Test model loading with multiple models
3. Verify material updates work across all categories

### Materials System
1. Update parser in `material-name-parser.ts` if adding new patterns
2. Test with `npm run extract-materials` on actual models
3. Check `babylon-material-utils.ts` for application logic

### UV Editor
1. Canvas size must match texture resolution (4096x4096)
2. Always flip Y-axis when exporting to Babylon
3. Dispose previous textures to prevent memory leaks

## Quick Reference

**Force material update**: `store.updateSection(id, { color: "#hex" })`  
**Reset scene**: Delete `currentModelUrl` from localStorage  
**Debug sections**: Console → `useConfiguratorStore.getState().sections`  
**Check UV map**: Console → `useConfiguratorStore.getState().completeUVMap`
