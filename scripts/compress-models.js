const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const modelsDir = path.join(__dirname, '../public/models');
const outputDir = path.join(__dirname, '../public/models-compressed');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Get all GLB files
const files = fs.readdirSync(modelsDir).filter(file => file.endsWith('.glb'));

console.log(`Found ${files.length} GLB files to compress\n`);

let successCount = 0;
let errorCount = 0;
const compressionStats = [];

files.forEach((file, index) => {
  const inputPath = path.join(modelsDir, file);
  const outputPath = path.join(outputDir, file);
  
  console.log(`[${index + 1}/${files.length}] Compressing: ${file}`);
  
  try {
    const inputStats = fs.statSync(inputPath);
    const inputSize = inputStats.size;
    
    // Run gltf-pipeline with Draco compression
    execSync(
      `npx gltf-pipeline -i "${inputPath}" -o "${outputPath}" -d`,
      { stdio: 'pipe' }
    );
    
    const outputStats = fs.statSync(outputPath);
    const outputSize = outputStats.size;
    const reduction = ((inputSize - outputSize) / inputSize * 100).toFixed(2);
    
    compressionStats.push({
      file,
      originalSize: (inputSize / 1024).toFixed(2) + ' KB',
      compressedSize: (outputSize / 1024).toFixed(2) + ' KB',
      reduction: reduction + '%'
    });
    
    console.log(`  ✓ Original: ${(inputSize / 1024).toFixed(2)} KB`);
    console.log(`  ✓ Compressed: ${(outputSize / 1024).toFixed(2)} KB`);
    console.log(`  ✓ Reduction: ${reduction}%\n`);
    
    successCount++;
  } catch (error) {
    console.error(`  ✗ Error compressing ${file}:`, error.message);
    errorCount++;
  }
});

// Print summary
console.log('\n' + '='.repeat(60));
console.log('COMPRESSION SUMMARY');
console.log('='.repeat(60));
console.log(`Total files: ${files.length}`);
console.log(`Successfully compressed: ${successCount}`);
console.log(`Errors: ${errorCount}`);
console.log('\nDetailed Stats:');
console.table(compressionStats);

// Save stats to JSON
fs.writeFileSync(
  path.join(outputDir, 'compression-stats.json'),
  JSON.stringify(compressionStats, null, 2)
);

console.log(`\nCompressed models saved to: ${outputDir}`);
console.log('Stats saved to: compression-stats.json');
