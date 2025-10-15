#!/usr/bin/env node

/**
 * Simple script to extract material names from all GLB models
 * This script extracts only the material names as requested.
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

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

// Extract material names from a GLB file using strings command
async function extractMaterialNames(modelPath) {
  try {
    console.log('  Extracting from ' + modelPath + '...');
    // Use strings command to extract text from binary GLB file
    const { stdout } = await execAsync('strings "' + modelPath + '" | grep -E "(Body_|Button_|Collar_|Sleeve_|Fabric_|Metal_|Zipper_|Elastic_)"');
    
    // Split the output into lines and filter for material-like names
    const lines = stdout.split('\n').filter(line => line.trim() !== '');
    
    // Extract unique material names
    const materialNames = [...new Set(lines)];
    
    return materialNames;
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
      const outputPath = path.join(outputDir, modelName + '-material-names.txt');
      const content = 'Material Names for ' + modelName + '\n========================\n\n' + materialNames.join('\n') + '\n';
      await fs.writeFile(outputPath, content);
      
      console.log('  ✓ Found ' + materialNames.length + ' materials');
    } catch (err) {
      console.error('  ✗ Error processing ' + modelFile + ':', err.message);
    }
  }
  
  // Create a consolidated file with all unique material names
  const allMaterialsArray = Array.from(allMaterials).sort();
  const summaryPath = path.join(outputDir, 'all-material-names.txt');
  const summaryContent = 'All Material Names from 3D Models\n===============================\n\n' + allMaterialsArray.join('\n') + '\n';
  await fs.writeFile(summaryPath, summaryContent);
  
  console.log('\nExtraction completed!');
  console.log('- Processed ' + glbFiles.length + ' models');
  console.log('- Found ' + allMaterials.size + ' unique material names');
  console.log('- Output files saved to ' + outputDir);
  console.log('- Summary file: all-material-names.txt');
}

// Run the extraction
extractAllMaterialNames().catch(err => {
  console.error('Error during material name extraction:', err);
  process.exit(1);
});