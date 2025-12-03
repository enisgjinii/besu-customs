#!/usr/bin/env node

/**
 * Generate models.json from actual files in public/models/
 */

const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, '../public/models');
const modelsJsonPath = path.join(__dirname, '../public/models.json');

console.log('📝 Generating models.json from actual files...\n');

// Get all GLB files
const files = fs.readdirSync(modelsDir)
  .filter(f => f.endsWith('.glb'))
  .filter(f => !f.includes('original') && !f.includes('processed')) // Exclude backup files
  .sort();

console.log(`Found ${files.length} model files\n`);

// Generate models array
const models = files.map(file => {
  // Create display name from filename
  const displayName = file
    .replace(/\.glb$/i, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize words
  
  return {
    name: displayName,
    url: `/models/${file}`
  };
});

// Backup existing models.json
if (fs.existsSync(modelsJsonPath)) {
  const backupPath = modelsJsonPath + '.backup';
  fs.copyFileSync(modelsJsonPath, backupPath);
  console.log(`📦 Backup created: ${backupPath}\n`);
}

// Write new models.json
fs.writeFileSync(modelsJsonPath, JSON.stringify(models, null, 2));

console.log('✅ models.json generated successfully!\n');
console.log('📋 Generated entries:');
models.forEach((model, i) => {
  console.log(`${i + 1}. ${model.name}`);
  console.log(`   ${model.url}`);
});

console.log(`\n✅ Total: ${models.length} models`);
console.log('');
