const fs = require("fs");
const path = require("path");

const modelsDir = path.join(__dirname, "../public/models");
const compressedDir = path.join(__dirname, "../public/models-compressed-temp");

// Check if compressed directory exists
if (!fs.existsSync(compressedDir)) {
  console.error("Error: Compressed models directory not found!");
  console.error('Please run "npm run compress-models" first.');
  process.exit(1);
}

// Get all compressed files
const compressedFiles = fs
  .readdirSync(compressedDir)
  .filter((file) => file.endsWith(".glb"));

console.log(
  `Replacing ${compressedFiles.length} models with compressed versions...\n`,
);

let replacedCount = 0;

compressedFiles.forEach((file) => {
  const originalPath = path.join(modelsDir, file);
  const compressedPath = path.join(compressedDir, file);

  try {
    // Replace with compressed version
    fs.copyFileSync(compressedPath, originalPath);
    console.log(`✓ Replaced: ${file}`);

    replacedCount++;
  } catch (error) {
    console.error(`✗ Error replacing ${file}:`, error.message);
  }
});

console.log("\n" + "=".repeat(60));
console.log(`Successfully replaced ${replacedCount} models in public/models/`);
console.log("Original backups are in: public/models-backup-temp/");
console.log("\nYou can now:");
console.log("1. Test the app to ensure compressed models work");
console.log("2. Delete backup folder: rm -rf public/models-backup-temp");
console.log("3. Delete compressed temp: rm -rf public/models-compressed-temp");
console.log("=".repeat(60));
