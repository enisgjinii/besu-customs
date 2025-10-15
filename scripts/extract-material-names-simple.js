#!/usr/bin/env node

/**
 * Simple script to extract material names from all GLB models
 * This script extracts only the material names as requested.
 */

const fs = require('fs').promises;
const path = require('path');

// Get the project root directory
const projectRoot = path.resolve(__dirname, '..');
const modelsDir = path.join(projectRoot, 'public', 'models');
const outputDir = path.join(projectRoot, 'materials-output');

// Ensure output directory exists
async function ensureOutputDir() {
  try {
    await fs.access(outputDir);
  } catch (err) {
    await fs.mkdir(outputDir, { recursive: true });
  }
}

// Extract material names from a GLB file
async function extractMaterialNames(modelPath) {
  try {
    console.log('  Reading file: ' + modelPath);
    // Read the file as a buffer
    const buffer = await fs.readFile(modelPath);
    
    // Convert to string (this will include binary data as well, but we'll filter it)
    const text = buffer.toString('utf8');
    
    // Use regex to find material names
    // Looking for patterns like "name":"MaterialName" in the JSON part of the GLB
    const materialNameRegex = /"name"\s*:\s*"([^"]*?(?:Body_|Button_|Collar_|Sleeve_|Fabric_|Metal_|Zipper_|Elastic_)[^"]*?)"/gi;
    const matches = [];
    let match;
    
    while ((match = materialNameRegex.exec(text)) !== null) {
      matches.push(match[1]);
    }
    
    // Also look for any pattern that looks like a material name
    const generalMaterialRegex = /"name"\s*:\s*"([^"]*[Mm]aterial[^"]*?)"/gi;
    while ((match = generalMaterialRegex.exec(text)) !== null) {
      matches.push(match[1]);
    }
    
    console.log('  Found ' + matches.length + ' potential matches');
    
    // Remove duplicates and return
    const uniqueMatches = [...new Set(matches)];
    console.log('  Found ' + uniqueMatches.length + ' unique materials');
    return uniqueMatches;
  } catch (err) {
    console.error('Error extracting materials from ' + modelPath + ':', err.message);
    return [];
  }
}

// Main extraction function
async function extractAllMaterialNames() {
  console.log('Extracting material names from all 3D models...');
  
  // Ensure output directory exists
  await ensureOutputDir();
  
  // Read all models from the models directory
  const modelFiles = await fs.readdir(modelsDir);
  const glbFiles = modelFiles.filter(file => file.endsWith('.glb'));
  
  console.log('Found ' + glbFiles.length + ' GLB models to process');
  
  let allMaterials = new Set();
  
  // Process each model
  for (const modelFile of glbFiles) {
    try {
      const modelPath = path.join(modelsDir, modelFile);
      const modelName = path.basename(modelFile, '.glb');
      
      console.log('Processing ' + modelName + '...');
      
      // Extract material names
      const materialNames = await extractMaterialNames(modelPath);
      
      // Add to the set of all materials
      materialNames.forEach(name => allMaterials.add(name));
      
      // Create a simple text file with just the material names for this model
      const outputPath = path.join(outputDir, modelName + '-material-names-simple.txt');
      const content = 'Material Names for ' + modelName + '\n========================\n\n' + materialNames.join('\n') + '\n';
      await fs.writeFile(outputPath, content);
      
      console.log('  ✓ Saved ' + materialNames.length + ' materials to ' + outputPath);
    } catch (err) {
      console.error('  ✗ Error processing ' + modelFile + ':', err.message);
    }
  }
  
  // Create a consolidated file with all unique material names
  const allMaterialsArray = Array.from(allMaterials).sort();
  const summaryPath = path.join(outputDir, 'all-material-names-simple.txt');
  const summaryContent = 'All Material Names from 3D Models\n===============================\n\n' + allMaterialsArray.join('\n') + '\n';
  await fs.writeFile(summaryPath, summaryContent);
  
  console.log('\nExtraction completed!');
  console.log('- Processed ' + glbFiles.length + ' models');
  console.log('- Found ' + allMaterials.size + ' unique material names');
  console.log('- Output files saved to ' + outputDir);
  console.log('- Summary file: all-material-names-simple.txt');
}

// Run the extraction
extractAllMaterialNames().catch(err => {
  console.error('Error during material name extraction:', err);
  process.exit(1);
});