#!/usr/bin/env node

/**
 * Rename model files to remove spaces and special characters
 * This fixes issues with Next.js dev server and improves compatibility
 */

const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, '../public/models');

console.log('🔄 Renaming model files to remove spaces...\n');

// Get all GLB files
const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.glb'));

const renames = [];
let skipped = 0;

files.forEach(file => {
  // Clean filename
  const newFile = file
    .replace(/\s+/g, '-')           // spaces → hyphens
    .replace(/,/g, '')              // remove commas
    .replace(/[()]/g, '')           // remove parentheses
    .replace(/-+/g, '-')            // multiple hyphens → single
    .replace(/^-|-$/g, '')          // trim hyphens
    .toLowerCase();                 // lowercase
  
  if (file === newFile) {
    skipped++;
    return;
  }
  
  const oldPath = path.join(modelsDir, file);
  const newPath = path.join(modelsDir, newFile);
  
  // Check if target already exists
  if (fs.existsSync(newPath)) {
    console.log(`⚠️  Skipping ${file} - target already exists`);
    return;
  }
  
  try {
    fs.renameSync(oldPath, newPath);
    renames.push({ old: file, new: newFile });
    console.log(`✓ ${file}`);
    console.log(`  → ${newFile}\n`);
  } catch (error) {
    console.error(`✗ Failed to rename ${file}:`, error.message);
  }
});

console.log('\n' + '='.repeat(60));
console.log('📊 SUMMARY');
console.log('='.repeat(60));
console.log(`Total files: ${files.length}`);
console.log(`Renamed: ${renames.length}`);
console.log(`Skipped: ${skipped}`);

if (renames.length > 0) {
  // Save rename map
  const mapPath = path.join(__dirname, '../rename-map.json');
  fs.writeFileSync(mapPath, JSON.stringify(renames, null, 2));
  console.log(`\n📝 Rename map saved to: rename-map.json`);
  
  console.log('\n⚠️  IMPORTANT: Update models.json with new filenames!');
  console.log('Run: node scripts/update-models-json.js');
}

console.log('');
