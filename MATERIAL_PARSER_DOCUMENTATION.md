# Intelligent Material Name Parser

## Overview
Automatically parses cryptic material names from 3D models and converts them into user-friendly names with appropriate default colors.

---

## Features

### 1. **Intelligent Name Recognition**
Recognizes 11 different material patterns from real 3D models:

#### Body Parts
- `Body_F_*` → "Body Front" (Blue #3b82f6)
- `Body_B_*` → "Body Back" (Red #ef4444)
- `Body_L_*` → "Body Left" (Green #10b981)
- `Body_R_*` → "Body Right" (Orange #f59e0b)
- `Body_123` → "Body Part 123" (Color by index)

#### Fabric Sections
- `FABRIC_1_*` → "Fabric 1" (Blue #3b82f6)
- `FABRIC_2_*` → "Fabric 2" (Red #ef4444)
- `FABRIC_3_*` → "Fabric 3" (Green #10b981)
- `FABRIC_4_*` → "Fabric 4" (Orange #f59e0b)

#### Clothing Parts
- `Sleeves_*` → "Sleeves" (Purple #8b5cf6)
- `Collar_*` → "Collar" (Pink #ec4899)

#### Hardware
- `Zipper_Teeth_*` → "Zipper Teeth" (Light gray #94a3b8)
- `Slider_*` → "Zipper Slider" (Dark gray #64748b)
- `Button_*` → "Button" (Dark #334155)
- `Buttonhole_*` → "Buttonhole" (Very dark #1e293b)
- `M_00005_*` → "Hardware" (Stone #78716c)

#### Trim & Edges
- `Ble_*` → "Binding/Edge" (Teal #14b8a6)

#### Generic Materials
- `Material.001` → "Material 1" (Blue #3b82f6)
- `79499` → "Part 79499" (Light stone #a8a29e)

---

## How It Works

### 1. **Name Parsing**
```typescript
const parsed = parseMaterialName("Body_F_144430");
// Result:
{
  originalName: "Body_F_144430",
  displayName: "Body Front",
  category: "Body",
  partType: "body",
  defaultColor: "#3b82f6",
  priority: 11
}
```

### 2. **Priority System**
Materials are automatically sorted by importance:
- **10-19**: Body parts (most important)
- **20-29**: Fabric sections
- **30-39**: Sleeves
- **40-49**: Collar
- **50-59**: Trim/Binding
- **60-69**: Generic materials
- **90-99**: Hardware (buttons, zippers)
- **100+**: Other/Unknown

### 3. **Color Assignment**
- **Existing colors**: If the 3D model has a meaningful color, it's preserved
- **Default colors**: If the model has generic gray/white, intelligent defaults are applied
- **Color cycling**: Numbered parts (Fabric 1, 2, 3...) get distinct colors from a palette

---

## Integration

### In `babylon-material-utils.ts`
The parser is automatically used during material extraction:

```typescript
export function extractSectionsFromModel(rootMesh, modelUrl) {
  // ... mesh iteration ...
  
  // Parse material name intelligently
  const parsed = parseMaterialName(materialName);
  
  const section = {
    id: materialName,
    name: parsed.displayName,        // User-friendly name
    originalName: materialName,       // Keep for matching
    category: parsed.category,        // Organized category
    color: parsed.defaultColor,       // Smart default color
    // ...
  };
}
```

### Material Matching
The improved matching algorithm finds materials using:
1. Direct material name
2. Direct mesh name
3. Original name matching
4. Combined sections
5. **Partial/substring matching** (case-insensitive)

This ensures colors apply correctly even with complex naming.

---

## Examples from Real Models

### Basketball Jersey
```
Body_F_144430      → Body Front     (Blue)
Body_B_181847      → Body Back      (Red)
FABRIC_1_11120073  → Fabric 1       (Blue)
Default_Button_*   → Button         (Dark gray)
Ble_4559165        → Binding/Edge   (Teal)
```

### Soccer Jersey
```
Body_F_279881      → Body Front     (Blue)
Body_B_301116      → Body Back      (Red)
Sleeves_365053     → Sleeves        (Purple)
Collar_Stand_*     → Collar         (Pink)
```

### Backpack
```
FABRIC_3_79203     → Fabric 3       (Green)
FABRIC_4_79209     → Fabric 4       (Orange)
Zipper_Teeth_*     → Zipper Teeth   (Light gray)
Slider_01_*        → Zipper Slider  (Dark gray)
M_00005_*          → Hardware       (Stone)
```

---

## Benefits

### For Users
✅ **Clear names**: "Body Front" instead of "Body_F_144430"
✅ **Organized**: Materials grouped by category
✅ **Colorful**: Each part gets a distinct, appropriate color
✅ **Sorted**: Important parts (body) appear first

### For Developers
✅ **Automatic**: No manual configuration needed
✅ **Extensible**: Easy to add new patterns
✅ **Robust**: Handles unknown materials gracefully
✅ **Tested**: Works with real production models

---

## Color Palette

The parser uses a carefully selected 12-color palette:
1. Blue (#3b82f6)
2. Red (#ef4444)
3. Green (#10b981)
4. Orange (#f59e0b)
5. Purple (#8b5cf6)
6. Pink (#ec4899)
7. Teal (#14b8a6)
8. Deep Orange (#f97316)
9. Cyan (#06b6d4)
10. Lime (#84cc16)
11. Violet (#a855f7)
12. Rose (#f43f5e)

Colors cycle for numbered parts (Fabric 1-12, Body 1-12, etc.)

---

## Testing

Run the test file to see parsing in action:
```bash
npx tsx lib/material-name-parser.test.ts
```

This shows how all material names are parsed, categorized, colored, and sorted.

---

## Future Enhancements

Potential additions:
- Pattern learning from user corrections
- Model-specific naming conventions
- Multi-language support
- Custom color schemes per category
- AI-powered name suggestions
