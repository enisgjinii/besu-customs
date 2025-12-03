#!/usr/bin/env node

/**
 * Update models.json with renamed filenames
 * Run after rename-models-with-spaces.js
 */

const fs = require('fs');
const path = require('path');

const modelsJsonPath = path.join(__dirname, '../public/models.json');
const renameMapPath = path.join(__dirname, '../rename-map.json');

// Check if rename map exists
if (!fs.existsSync(renameMapPath)) {
  console.error('❌ rename-map.json not found!');
  console.error('Run: node scripts/rename-models-with-spaces.js first');
  process.exit(1);
}

// Read files
const renameMap = JSON.parse(fs.readFileSync(renameMapPath, 'utf-8'));
const modelsJson = JSON.parse(fs.readFileSync(modelsJsonPath, 'utf-8'));

console.log('🔄 Updating models.json...\n');

let updated = 0;
let notFound = 0;

// Update URLs
modelsJson.models = modelsJson.models.map(model => {
  const currentFilename = model.url.split('/').pop();
  const rename = renameMap.find(r => r.old === currentFilename);
  
  if (rename) {
    console.log(`✓ ${model.name}`);
    console.log(`  ${model.url} → /models/${rename.new}\n`);
    updated++;
    return {
      ...model,
      url: `/models/${rename.new}`
    };
  } else {
    // Check if filename already matches new format
    const hasSpaces = currentFilename.includes(' ');
    if (hasSpaces) {
      console.log(`⚠️  ${model.name} - not in rename map`);
      notFound++;
    }
  }
  
  return model;
});

// Save updated models.json
const backup = modelsJsonPath + '.backup';
fs.copyFileSync(modelsJsonPath, backup);
console.log(`📦 Backup saved to: ${backup}`);

fs.writeFileSync(modelsJsonPath, JSON.stringify(modelsJson, null, 2));

console.log('\n' + '='.repeat(60));
console.log('📊 SUMMARY');
console.log('='.repeat(60));
console.log(`Total models: ${modelsJson.models.length}`);
console.log(`Updated: ${updated}`);
console.log(`Not found: ${notFound}`);
console.log(`\n✅ models.json updated successfully!`);

if (notFound > 0) {
  console.log('\n⚠️  Some models were not found in rename map.');
  console.log('They may have already been renamed or need manual update.');
}

console.log('');
