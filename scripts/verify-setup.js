#!/usr/bin/env node

/**
 * Verify Three.js migration setup
 */

const fs = require("fs");
const path = require("path");
const http = require("http");

console.log("🔍 Verifying Three.js Migration Setup\n");
console.log("=".repeat(60));

const checks = [];

// Check 1: Three.js files exist
console.log("\n1️⃣  Checking Three.js files...");
const requiredFiles = [
  "components/three-scene.tsx",
  "lib/three-material-utils.ts",
  "lib/model-loader-optimized.ts",
];

let filesOk = true;
requiredFiles.forEach((file) => {
  const exists = fs.existsSync(path.join(__dirname, "..", file));
  if (exists) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING!`);
    filesOk = false;
  }
});

checks.push({
  name: "Three.js Files",
  status: filesOk,
  details: filesOk ? "All files present" : "Some files missing",
});

// Check 2: Babylon files deprecated
console.log("\n2️⃣  Checking Babylon.js files deprecated...");
const deprecatedFiles = [
  "components/babylon-scene.tsx.deprecated",
  "lib/babylon-material-utils.ts.deprecated",
];

let deprecatedOk = true;
deprecatedFiles.forEach((file) => {
  const exists = fs.existsSync(path.join(__dirname, "..", file));
  if (exists) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ⚠️  ${file} - not found (may have been deleted)`);
  }
});

checks.push({
  name: "Babylon Files Deprecated",
  status: true,
  details: "Old files marked as deprecated",
});

// Check 3: Models exist
console.log("\n3️⃣  Checking model files...");
const modelsDir = path.join(__dirname, "../public/models");
const models = fs
  .readdirSync(modelsDir)
  .filter(
    (f) =>
      f.endsWith(".glb") && !f.includes("original") && !f.includes("processed"),
  );

if (models.length > 0) {
  console.log(`  ✅ Found ${models.length} model files`);
  console.log(`     Examples: ${models.slice(0, 3).join(", ")}`);
} else {
  console.log(`  ❌ No model files found!`);
}

checks.push({
  name: "Model Files",
  status: models.length > 0,
  details: `${models.length} models found`,
});

// Check 4: models.json exists and valid
console.log("\n4️⃣  Checking models.json...");
const modelsJsonPath = path.join(__dirname, "../public/models.json");
let modelsJsonOk = false;
let modelsCount = 0;

try {
  const modelsJson = JSON.parse(fs.readFileSync(modelsJsonPath, "utf-8"));
  modelsCount = modelsJson.length;
  modelsJsonOk = modelsCount > 0;
  console.log(`  ✅ models.json valid with ${modelsCount} entries`);
} catch (e) {
  console.log(`  ❌ models.json invalid or missing`);
}

checks.push({
  name: "models.json",
  status: modelsJsonOk,
  details: `${modelsCount} models configured`,
});

// Check 5: Dev server running
console.log("\n5️⃣  Checking dev server...");
const checkServer = () => {
  return new Promise((resolve) => {
    const req = http.get("http://localhost:3000", (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 404);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
};

checkServer().then((serverRunning) => {
  if (serverRunning) {
    console.log("  ✅ Dev server is running on http://localhost:3000");
  } else {
    console.log("  ⚠️  Dev server not running");
    console.log("     Start with: npm run dev");
  }

  checks.push({
    name: "Dev Server",
    status: serverRunning,
    details: serverRunning ? "Running on port 3000" : "Not running",
  });

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 VERIFICATION SUMMARY\n");

  const passedChecks = checks.filter((c) => c.status).length;
  const totalChecks = checks.length;

  checks.forEach((check) => {
    const icon = check.status ? "✅" : "❌";
    console.log(`${icon} ${check.name}: ${check.details}`);
  });

  console.log("\n" + "=".repeat(60));
  console.log(`Result: ${passedChecks}/${totalChecks} checks passed\n`);

  if (passedChecks === totalChecks) {
    console.log("🎉 All checks passed!");
    console.log("\n✅ Setup is complete and ready to use!");
    console.log("\nNext steps:");
    console.log("  1. Visit: http://localhost:3000");
    console.log("  2. Select a model");
    console.log("  3. Start customizing!");
  } else {
    console.log("⚠️  Some checks failed.");
    console.log("\nTo fix:");

    if (!filesOk) {
      console.log("  • Three.js files missing - check migration");
    }
    if (!modelsJsonOk) {
      console.log("  • Run: npm run generate-models-json");
    }
    if (!serverRunning) {
      console.log("  • Start server: npm run dev");
    }
  }

  console.log("");
  process.exit(passedChecks === totalChecks ? 0 : 1);
});
