#!/usr/bin/env node

/**
 * Verification script for mobile optimization
 * Checks if all optimization components are in place
 */

const fs = require("fs");
const path = require("path");

console.log("🔍 Mobile Optimization Verification\n");
console.log("=".repeat(60));

const checks = [];

// Check 1: LOD models exist
console.log("\n📦 Checking LOD Models...");
const modelsDir = path.join(__dirname, "../public/models");
const models = fs
  .readdirSync(modelsDir)
  .filter(
    (f) => f.endsWith(".glb") && !f.includes("-low") && !f.includes("-medium"),
  );
let lowCount = 0;
let mediumCount = 0;

models.forEach((model) => {
  const baseName = model.replace(/\.glb$/i, "");
  const lowPath = path.join(modelsDir, `${baseName}-low.glb`);
  const mediumPath = path.join(modelsDir, `${baseName}-medium.glb`);

  if (fs.existsSync(lowPath)) lowCount++;
  if (fs.existsSync(mediumPath)) mediumCount++;
});

const lodCheck = lowCount > 0 && mediumCount > 0;
checks.push({
  name: "LOD Models Generated",
  status: lodCheck,
  details: `${lowCount} low, ${mediumCount} medium out of ${models.length} models`,
});

if (lodCheck) {
  console.log(
    `  ✅ Found ${lowCount} low and ${mediumCount} medium quality models`,
  );
} else {
  console.log(`  ❌ No LOD models found. Run: npm run generate-lod`);
}

// Check 2: Service Worker exists
console.log("\n🔧 Checking Service Worker...");
const swPath = path.join(__dirname, "../public/sw.js");
const swExists = fs.existsSync(swPath);
checks.push({
  name: "Service Worker File",
  status: swExists,
  details: swExists ? "sw.js exists" : "sw.js missing",
});

if (swExists) {
  console.log("  ✅ Service Worker file exists");
} else {
  console.log("  ❌ Service Worker file missing");
}

// Check 3: Optimized loader exists
console.log("\n📚 Checking Optimization Libraries...");
const loaderPath = path.join(__dirname, "../lib/model-loader-optimized.ts");
const loaderExists = fs.existsSync(loaderPath);
checks.push({
  name: "Progressive Loader",
  status: loaderExists,
  details: loaderExists ? "model-loader-optimized.ts exists" : "Loader missing",
});

if (loaderExists) {
  console.log("  ✅ Progressive loader exists");
} else {
  console.log("  ❌ Progressive loader missing");
}

// Check 4: Service Worker Manager exists
const swManagerPath = path.join(__dirname, "../lib/service-worker-manager.ts");
const swManagerExists = fs.existsSync(swManagerPath);
checks.push({
  name: "Service Worker Manager",
  status: swManagerExists,
  details: swManagerExists
    ? "service-worker-manager.ts exists"
    : "Manager missing",
});

if (swManagerExists) {
  console.log("  ✅ Service Worker manager exists");
} else {
  console.log("  ❌ Service Worker manager missing");
}

// Check 5: Connection indicator exists
const indicatorPath = path.join(
  __dirname,
  "../components/connection-indicator.tsx",
);
const indicatorExists = fs.existsSync(indicatorPath);
checks.push({
  name: "Connection Indicator",
  status: indicatorExists,
  details: indicatorExists
    ? "connection-indicator.tsx exists"
    : "Indicator missing",
});

if (indicatorExists) {
  console.log("  ✅ Connection indicator exists");
} else {
  console.log("  ❌ Connection indicator missing");
}

// Check 6: Next.js config has caching headers
console.log("\n⚙️  Checking Configuration...");
const nextConfigPath = path.join(__dirname, "../next.config.mjs");
const nextConfig = fs.readFileSync(nextConfigPath, "utf-8");
const hasCaching =
  nextConfig.includes("Cache-Control") && nextConfig.includes("immutable");
checks.push({
  name: "Caching Headers",
  status: hasCaching,
  details: hasCaching ? "Cache headers configured" : "Cache headers missing",
});

if (hasCaching) {
  console.log("  ✅ Caching headers configured");
} else {
  console.log("  ❌ Caching headers not configured");
}

// Check 7: Package.json has LOD script
const packagePath = path.join(__dirname, "../package.json");
const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf-8"));
const hasLodScript = packageJson.scripts && packageJson.scripts["generate-lod"];
checks.push({
  name: "LOD Generation Script",
  status: hasLodScript,
  details: hasLodScript ? "generate-lod script exists" : "Script missing",
});

if (hasLodScript) {
  console.log("  ✅ LOD generation script configured");
} else {
  console.log("  ❌ LOD generation script missing");
}

// Calculate file size savings
console.log("\n💾 Calculating Size Savings...");
let totalOriginal = 0;
let totalLow = 0;
let totalMedium = 0;

models.forEach((model) => {
  const baseName = model.replace(/\.glb$/i, "");
  const originalPath = path.join(modelsDir, model);
  const lowPath = path.join(modelsDir, `${baseName}-low.glb`);
  const mediumPath = path.join(modelsDir, `${baseName}-medium.glb`);

  if (fs.existsSync(originalPath)) {
    totalOriginal += fs.statSync(originalPath).size;
  }
  if (fs.existsSync(lowPath)) {
    totalLow += fs.statSync(lowPath).size;
  }
  if (fs.existsSync(mediumPath)) {
    totalMedium += fs.statSync(mediumPath).size;
  }
});

if (totalOriginal > 0) {
  const lowSavings = (
    ((totalOriginal - totalLow) / totalOriginal) *
    100
  ).toFixed(1);
  const mediumSavings = (
    ((totalOriginal - totalMedium) / totalOriginal) *
    100
  ).toFixed(1);

  console.log(`  Original:  ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
  console.log(
    `  Low:       ${(totalLow / 1024 / 1024).toFixed(2)} MB (${lowSavings}% smaller)`,
  );
  console.log(
    `  Medium:    ${(totalMedium / 1024 / 1024).toFixed(2)} MB (${mediumSavings}% smaller)`,
  );
}

// Summary
console.log("\n" + "=".repeat(60));
console.log("📊 VERIFICATION SUMMARY\n");

const passedChecks = checks.filter((c) => c.status).length;
const totalChecks = checks.length;
const allPassed = passedChecks === totalChecks;

checks.forEach((check) => {
  const icon = check.status ? "✅" : "❌";
  console.log(`${icon} ${check.name}: ${check.details}`);
});

console.log("\n" + "=".repeat(60));
console.log(`Result: ${passedChecks}/${totalChecks} checks passed\n`);

if (allPassed) {
  console.log("🎉 All optimizations are in place!");
  console.log("\n📱 Your app is ready for mobile and 3G users!");
  console.log("\nNext steps:");
  console.log("  1. Deploy: npm run build && npm start");
  console.log("  2. Test on Slow 3G in Chrome DevTools");
  console.log("  3. Monitor load times in production");
} else {
  console.log("⚠️  Some optimizations are missing.");
  console.log("\nTo fix:");

  if (!lodCheck) {
    console.log("  • Generate LOD models: npm run generate-lod");
  }
  if (!swExists || !swManagerExists) {
    console.log("  • Service Worker files are missing - check installation");
  }
  if (!loaderExists) {
    console.log("  • Progressive loader is missing - check installation");
  }
  if (!hasCaching) {
    console.log("  • Update next.config.mjs with caching headers");
  }
  if (!hasLodScript) {
    console.log('  • Add "generate-lod" script to package.json');
  }
}

console.log("");

// Exit with appropriate code
process.exit(allPassed ? 0 : 1);
