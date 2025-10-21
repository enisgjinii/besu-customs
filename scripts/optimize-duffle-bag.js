#!/usr/bin/env node

/**
 * Script to optimize the Backpack.glb file for faster loading
 * This will apply Draco compression to reduce file size significantly
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const inputFile = path.join(__dirname, "../public/models/Backpack.glb");
const outputFile = path.join(
  __dirname,
  "../public/models/Backpack_optimized.glb",
);
const backupFile = path.join(
  __dirname,
  "../public/models/Backpack_original.glb",
);

console.log("🚀 Starting Backpack optimization...");
console.log(`📁 Input: ${inputFile}`);
console.log(`📁 Output: ${outputFile}`);

// Check if input file exists
if (!fs.existsSync(inputFile)) {
  console.error("❌ Error: Input file not found:", inputFile);
  process.exit(1);
}

// Get original file size
const originalSize = fs.statSync(inputFile).size;
console.log(`📊 Original size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);

try {
  // Check if gltf-pipeline is installed
  try {
    execSync("npx gltf-pipeline --version", { stdio: "ignore" });
  } catch (e) {
    console.log("📦 Installing gltf-pipeline...");
    execSync("npm install -g gltf-pipeline", { stdio: "inherit" });
  }

  console.log("⚙️  Applying Draco compression...");

  // Run gltf-pipeline with Draco compression
  execSync(`npx gltf-pipeline -i "${inputFile}" -o "${outputFile}" -d`, {
    stdio: "inherit",
  });

  // Get optimized file size
  const optimizedSize = fs.statSync(outputFile).size;
  const reduction = ((1 - optimizedSize / originalSize) * 100).toFixed(1);

  console.log(
    `📊 Optimized size: ${(optimizedSize / 1024 / 1024).toFixed(2)} MB`,
  );
  console.log(`✅ Size reduction: ${reduction}%`);

  // Create backup of original
  console.log("💾 Creating backup of original file...");
  fs.copyFileSync(inputFile, backupFile);

  // Replace original with optimized
  console.log("🔄 Replacing original with optimized version...");
  fs.copyFileSync(outputFile, inputFile);
  fs.unlinkSync(outputFile);

  console.log("✨ Optimization complete!");
  console.log(`📦 Original backed up to: ${backupFile}`);
} catch (error) {
  console.error("❌ Error during optimization:", error.message);
  process.exit(1);
}
