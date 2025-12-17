# 📝 Model Filename Best Practices

## Issue with Current Filenames

Some model files have spaces in their names, which can cause loading issues:

- `basketball shooting shirt, short sleeve without a hoodie.glb` ❌

## Recommended Solution

### Option 1: Rename Files (Recommended)

Replace spaces with hyphens or underscores:

```bash
# Example renaming script
cd public/models

# Replace spaces with hyphens
for file in *.glb; do
  newfile=$(echo "$file" | tr ' ' '-' | tr ',' '')
  if [ "$file" != "$newfile" ]; then
    mv "$file" "$newfile"
    echo "Renamed: $file → $newfile"
  fi
done
```

**Before:**

```
basketball shooting shirt, short sleeve without a hoodie.glb
```

**After:**

```
basketball-shooting-shirt-short-sleeve-without-hoodie.glb
```

### Option 2: Update models.json

If you rename files, update `public/models.json`:

```json
{
  "models": [
    {
      "name": "Basketball Shooting Shirt (Short Sleeve)",
      "url": "/models/basketball-shooting-shirt-short-sleeve-without-hoodie.glb"
    }
  ]
}
```

## Current Workaround

The code now properly encodes URLs with spaces, so existing files will work. However, renaming is still recommended for:

- Better SEO
- Easier debugging
- Cleaner URLs
- Avoiding encoding issues

## Bulk Rename Script

Create `scripts/rename-models.js`:

```javascript
const fs = require("fs");
const path = require("path");

const modelsDir = path.join(__dirname, "../public/models");
const files = fs.readdirSync(modelsDir).filter((f) => f.endsWith(".glb"));

console.log("🔄 Renaming model files...\n");

const renames = [];

files.forEach((file) => {
  // Clean filename: remove spaces, commas, special chars
  const newFile = file
    .replace(/\s+/g, "-") // spaces → hyphens
    .replace(/,/g, "") // remove commas
    .replace(/[()]/g, "") // remove parentheses
    .replace(/-+/g, "-") // multiple hyphens → single
    .replace(/^-|-$/g, "") // trim hyphens
    .toLowerCase(); // lowercase

  if (file !== newFile) {
    const oldPath = path.join(modelsDir, file);
    const newPath = path.join(modelsDir, newFile);

    fs.renameSync(oldPath, newPath);
    renames.push({ old: file, new: newFile });
    console.log(`✓ ${file}`);
    console.log(`  → ${newFile}\n`);
  }
});

console.log(`\n✅ Renamed ${renames.length} files`);
console.log("\n⚠️  Remember to update models.json with new filenames!");

// Save rename map
fs.writeFileSync(
  path.join(__dirname, "../rename-map.json"),
  JSON.stringify(renames, null, 2),
);
console.log("📝 Rename map saved to rename-map.json");
```

Run with:

```bash
node scripts/rename-models.js
```

## Update models.json Script

Create `scripts/update-models-json.js`:

```javascript
const fs = require("fs");
const path = require("path");

const modelsDir = path.join(__dirname, "../public/models");
const modelsJsonPath = path.join(__dirname, "../public/models.json");
const renameMapPath = path.join(__dirname, "../rename-map.json");

// Read rename map
const renameMap = JSON.parse(fs.readFileSync(renameMapPath, "utf-8"));

// Read models.json
const modelsJson = JSON.parse(fs.readFileSync(modelsJsonPath, "utf-8"));

// Update URLs
modelsJson.models = modelsJson.models.map((model) => {
  const oldFilename = model.url.split("/").pop();
  const rename = renameMap.find((r) => r.old === oldFilename);

  if (rename) {
    console.log(`Updating: ${model.name}`);
    console.log(`  ${model.url} → /models/${rename.new}`);
    return {
      ...model,
      url: `/models/${rename.new}`,
    };
  }

  return model;
});

// Save updated models.json
fs.writeFileSync(modelsJsonPath, JSON.stringify(modelsJson, null, 2));
console.log("\n✅ models.json updated");
```

Run with:

```bash
node scripts/update-models-json.js
```

## Complete Workflow

```bash
# 1. Rename all model files
node scripts/rename-models.js

# 2. Update models.json with new filenames
node scripts/update-models-json.js

# 3. Regenerate LOD models with new names
npm run generate-lod

# 4. Test
npm run dev
```

## Naming Convention

**Good filenames:**

- `basketball-jersey.glb` ✅
- `hoodie-long-sleeve.glb` ✅
- `backpack-large.glb` ✅

**Bad filenames:**

- `basketball jersey.glb` ❌ (spaces)
- `hoodie, long sleeve.glb` ❌ (comma + spaces)
- `Backpack (Large).glb` ❌ (parentheses + spaces)

## Benefits of Clean Filenames

1. **No encoding issues** - Works everywhere without special handling
2. **Better URLs** - `/models/backpack.glb` vs `/models/backpack%20(large).glb`
3. **Easier debugging** - Clear in logs and network tab
4. **SEO friendly** - Search engines prefer clean URLs
5. **Cross-platform** - Works on all operating systems
6. **Easier scripting** - No need to escape spaces in bash

## Current Status

✅ **Code handles spaces** - URLs are properly encoded  
⚠️ **Recommendation** - Still rename files for best practices  
📝 **Action needed** - Run rename scripts if you want clean filenames

## Questions?

The current implementation works with spaces, but renaming is recommended for production. Choose based on your needs:

- **Quick fix**: Current code works as-is ✅
- **Best practice**: Rename files for cleaner URLs 🎯
