#!/usr/bin/env node

/**
 * Complete fix for model filenames
 * Renames files and updates models.json in one go
 */

const fs = require("fs");
const path = require("path");

const modelsDir = path.join(__dirname, "../public/models");
const modelsJsonPath = path.join(__dirname, "../public/models.json");

console.log("🔧 Fixing Model Filenames\n");
console.log("=".repeat(60));

// Read current models.json
let modelsJson = JSON.parse(fs.readFileSync(modelsJsonPath, "utf-8"));

// Backup
const backupPath = modelsJsonPath + ".backup";
fs.copyFileSync(modelsJsonPath, backupPath);
console.log(`📦 Backup created: ${backupPath}\n`);

// Get all GLB files
const files = fs.readdirSync(modelsDir).filter((f) => f.endsWith(".glb"));

const renames = [];
let renamed = 0;
let skipped = 0;
let errors = 0;

console.log("📝 Processing files...\n");

files.forEach((file) => {
  // Clean filename
  const newFile = file
    .replace(/\s+/g, "-") // spaces → hyphens
    .replace(/,/g, "") // remove commas
    .replace(/[()]/g, "") // remove parentheses
    .replace(/-+/g, "-") // multiple hyphens → single
    .replace(/^-|-$/g, ""); // trim hyphens

  if (file === newFile) {
    skipped++;
    return;
  }

  const oldPath = path.join(modelsDir, file);
  const newPath = path.join(modelsDir, newFile);

  // Check if target already exists
  if (fs.existsSync(newPath) && file !== newFile) {
    console.log(`⚠️  ${file}`);
    console.log(`   Target exists: ${newFile}\n`);
    skipped++;
    return;
  }

  try {
    // Rename file
    fs.renameSync(oldPath, newPath);
    renames.push({ old: file, new: newFile });
    renamed++;
    console.log(`✓ ${file}`);
    console.log(`  → ${newFile}\n`);
  } catch (error) {
    console.error(`✗ ${file}`);
    console.error(`  Error: ${error.message}\n`);
    errors++;
  }
});

// Update models.json
console.log("=".repeat(60));
console.log("📝 Updating models.json...\n");

let updated = 0;

modelsJson = modelsJson.map((model) => {
  const currentFilename = model.url.split("/").pop();
  const rename = renames.find((r) => r.old === currentFilename);

  if (rename) {
    console.log(`✓ ${model.name}`);
    console.log(`  ${model.url} → /models/${rename.new}\n`);
    updated++;
    return {
      name: rename.new,
      url: `/models/${rename.new}`,
    };
  }

  return model;
});

// Save updated models.json
fs.writeFileSync(modelsJsonPath, JSON.stringify(modelsJson, null, 2));

console.log("=".repeat(60));
console.log("📊 SUMMARY");
console.log("=".repeat(60));
console.log(`Total files: ${files.length}`);
console.log(`Renamed: ${renamed}`);
console.log(`Skipped: ${skipped}`);
console.log(`Errors: ${errors}`);
console.log(`models.json updated: ${updated} entries`);
console.log("");

if (renamed > 0) {
  console.log("✅ Filenames fixed successfully!");
  console.log("");
  console.log("📝 Next steps:");
  console.log("1. Restart your dev server");
  console.log("2. Clear browser cache");
  console.log("3. Test loading models");
} else {
  console.log("ℹ️  No files needed renaming");
}

console.log("");
