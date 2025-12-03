#!/usr/bin/env node

/**
 * Generate LOD (Level of Detail) versions of 3D models
 * Creates -low.glb and -medium.glb versions for progressive loading
 * 
 * Usage: node scripts/generate-lod-models.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const modelsDir = path.join(__dirname, '../public/models');
const outputDir = modelsDir; // Output to same directory

// LOD configurations
const LOD_CONFIGS = {
  low: {
    suffix: '-low',
    dracoCompressionLevel: 10, // Maximum compression
    quantizePosition: 12, // Reduce precision
    quantizeNormal: 8,
    quantizeTexcoord: 10,
    quantizeColor: 8,
    quantizeGeneric: 8,
    textureMaxSize: 512, // Very small textures
  },
  medium: {
    suffix: '-medium',
    dracoCompressionLevel: 7,
    quantizePosition: 14,
    quantizeNormal: 10,
    quantizeTexcoord: 12,
    quantizeColor: 10,
    quantizeGeneric: 10,
    textureMaxSize: 1024,
  }
};

// Get all GLB files (excluding already processed LOD versions)
const files = fs.readdirSync(modelsDir)
  .filter(file => file.endsWith('.glb') && !file.includes('-low') && !file.includes('-medium') && !file.includes('-high'));

console.log('🚀 LOD Model Generator');
console.log('='.repeat(60));
console.log(`Found ${files.length} models to process\n`);

const stats = {
  processed: 0,
  skipped: 0,
  errors: 0,
  totalOriginalSize: 0,
  totalLowSize: 0,
  totalMediumSize: 0,
};

files.forEach((file, index) => {
  const inputPath = path.join(modelsDir, file);
  const baseName = file.replace(/\.glb$/i, '');
  
  console.log(`\n[${index + 1}/${files.length}] Processing: ${file}`);
  
  try {
    const inputStats = fs.statSync(inputPath);
    const inputSize = inputStats.size;
    stats.totalOriginalSize += inputSize;
    
    console.log(`  📊 Original size: ${(inputSize / 1024).toFixed(2)} KB`);
    
    // Generate each LOD level
    Object.entries(LOD_CONFIGS).forEach(([level, config]) => {
      const outputPath = path.join(outputDir, `${baseName}${config.suffix}.glb`);
      
      // Skip if already exists
      if (fs.existsSync(outputPath)) {
        console.log(`  ⏭️  ${level.toUpperCase()} version already exists, skipping`);
        const existingSize = fs.statSync(outputPath).size;
        if (level === 'low') stats.totalLowSize += existingSize;
        if (level === 'medium') stats.totalMediumSize += existingSize;
        return;
      }
      
      console.log(`  🔄 Generating ${level.toUpperCase()} quality...`);
      
      try {
        // Build gltf-pipeline command with Draco compression
        const cmd = [
          'npx gltf-pipeline',
          `-i "${inputPath}"`,
          `-o "${outputPath}"`,
          '-d', // Enable Draco compression
          `--draco.compressionLevel ${config.dracoCompressionLevel}`,
          `--draco.quantizePosition ${config.quantizePosition}`,
          `--draco.quantizeNormal ${config.quantizeNormal}`,
          `--draco.quantizeTexcoord ${config.quantizeTexcoord}`,
          `--draco.quantizeColor ${config.quantizeColor}`,
          `--draco.quantizeGeneric ${config.quantizeGeneric}`,
        ].join(' ');
        
        execSync(cmd, { stdio: 'pipe' });
        
        const outputStats = fs.statSync(outputPath);
        const outputSize = outputStats.size;
        const reduction = ((inputSize - outputSize) / inputSize * 100).toFixed(1);
        
        if (level === 'low') stats.totalLowSize += outputSize;
        if (level === 'medium') stats.totalMediumSize += outputSize;
        
        console.log(`  ✅ ${level.toUpperCase()}: ${(outputSize / 1024).toFixed(2)} KB (${reduction}% smaller)`);
        
      } catch (error) {
        console.error(`  ❌ Failed to generate ${level.toUpperCase()}:`, error.message);
        stats.errors++;
      }
    });
    
    stats.processed++;
    
  } catch (error) {
    console.error(`  ❌ Error processing ${file}:`, error.message);
    stats.errors++;
    stats.skipped++;
  }
});

// Print summary
console.log('\n' + '='.repeat(60));
console.log('📊 GENERATION SUMMARY');
console.log('='.repeat(60));
console.log(`Total models: ${files.length}`);
console.log(`Successfully processed: ${stats.processed}`);
console.log(`Skipped: ${stats.skipped}`);
console.log(`Errors: ${stats.errors}`);
console.log('');
console.log('Size Comparison:');
console.log(`  Original:  ${(stats.totalOriginalSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`  Low:       ${(stats.totalLowSize / 1024 / 1024).toFixed(2)} MB (${((1 - stats.totalLowSize / stats.totalOriginalSize) * 100).toFixed(1)}% reduction)`);
console.log(`  Medium:    ${(stats.totalMediumSize / 1024 / 1024).toFixed(2)} MB (${((1 - stats.totalMediumSize / stats.totalOriginalSize) * 100).toFixed(1)}% reduction)`);
console.log('');
console.log('💡 Benefits:');
console.log('  • 3G users will load LOW quality first (fast initial load)');
console.log('  • 4G users will load MEDIUM quality (balanced)');
console.log('  • WiFi users will load ORIGINAL quality (best quality)');
console.log('  • Progressive loading: low → medium → high as connection allows');
console.log('');
console.log('✅ LOD generation complete!');
