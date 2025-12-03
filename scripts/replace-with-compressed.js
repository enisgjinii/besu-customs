const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, '../public/models');
const compressedDir = path.join(__dirname, '../public/models-compressed');
const backupDir = path.join(__dirname, '../public/models-backup');

// Create backup directory
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
  console.log('Created backup directory\n');
}

// Get all compressed files
const compressedFiles = fs.readdirSync(compressedDir).filter(file => file.endsWith('.glb'));

console.log(`Replacing ${compressedFiles.length} models with compressed versions...\n`);

let replacedCount = 0;

compressedFiles.forEach((file) => {
  const originalPath = path.join(modelsDir, file);
  const compressedPath = path.join(compressedDir, file);
  const backupPath = path.join(backupDir, file);
  
  try {
    // Backup original
    if (fs.existsSync(originalPath)) {
      fs.copyFileSync(originalPath, backupPath);
      console.log(`✓ Backed up: ${file}`);
    }
    
    // Replace with compressed version
    fs.copyFileSync(compressedPath, originalPath);
    console.log(`✓ Replaced: ${file}\n`);
    
    replacedCount++;
  } catch (error) {
    console.error(`✗ Error replacing ${file}:`, error.message);
  }
});

console.log('\n' + '='.repeat(60));
console.log(`Successfully replaced ${replacedCount} models`);
console.log(`Original models backed up to: ${backupDir}`);
console.log('='.repeat(60));
