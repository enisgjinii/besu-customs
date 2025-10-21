#!/usr/bin/env node

/**
 * Script to import models from models.json into Supabase database
 * Run with: node scripts/import-models.js
 */

const fs = require("fs");
const path = require("path");

// This would be replaced with actual Supabase client in production
console.log("🚀 Starting models import...");

try {
  // Read models.json
  const modelsJsonPath = path.join(__dirname, "../public/models.json");
  const modelsData = JSON.parse(fs.readFileSync(modelsJsonPath, "utf-8"));

  console.log(`📁 Found ${modelsData.length} models in models.json`);

  // Generate SQL insert statements
  const insertStatements = modelsData.map((model, index) => {
    const name = model.name.replace(".glb", "");
    const category = categorizeModel(model.name);
    const tags = generateTags(model.name);
    const productId = generateProductId(model.name);

    return `('${name}', 'Customizable ${name.toLowerCase()}', '${model.url}', '/thumbnails/${productId}.jpg', '${category}', true, ${index < 3 ? "true" : "false"}, NULL, 'glb', ARRAY[${tags.map((t) => `'${t}'`).join(", ")}])`;
  });

  const fullSQL = `
-- Import models from models.json
INSERT INTO models (name, description, file_path, thumbnail_url, category, is_active, is_featured, file_size, file_type, tags) VALUES
${insertStatements.join(",\n")};
`;

  // Write SQL file
  const outputPath = path.join(
    __dirname,
    "../supabase/migrations/002_import_existing_models.sql",
  );
  fs.writeFileSync(outputPath, fullSQL);

  console.log(`✅ Generated SQL migration: ${outputPath}`);
  console.log(
    "📝 Run this SQL in your Supabase dashboard to import the models",
  );

  // Also generate a summary
  const summary = modelsData.map((model) => ({
    name: model.name.replace(".glb", ""),
    category: categorizeModel(model.name),
    url: model.url,
    productId: generateProductId(model.name),
  }));

  fs.writeFileSync(
    path.join(__dirname, "../models-import-summary.json"),
    JSON.stringify(summary, null, 2),
  );

  console.log("📊 Generated import summary: models-import-summary.json");
} catch (error) {
  console.error("❌ Error importing models:", error);
  process.exit(1);
}

function categorizeModel(name) {
  const lowerName = name.toLowerCase();

  if (lowerName.includes("jersey") || lowerName.includes("basketball"))
    return "Jerseys";
  if (lowerName.includes("short") && !lowerName.includes("sleeve"))
    return "Shorts";
  if (lowerName.includes("bag") || lowerName.includes("backpack"))
    return "Bags";
  if (lowerName.includes("hoodie")) return "Hoodies";
  if (lowerName.includes("polo")) return "Polos";
  if (lowerName.includes("soccer")) return "Soccer";
  if (lowerName.includes("track")) return "Track & Field";
  if (lowerName.includes("volleyball")) return "Volleyball";
  if (lowerName.includes("cap")) return "Caps";
  if (lowerName.includes("baseball")) return "Baseball";

  return "Other";
}

function generateTags(name) {
  const lowerName = name.toLowerCase();
  const tags = [];

  if (lowerName.includes("jersey")) tags.push("jersey");
  if (lowerName.includes("short")) tags.push("shorts");
  if (lowerName.includes("long")) tags.push("long-sleeve");
  if (lowerName.includes("sleeve")) tags.push("sleeve");
  if (lowerName.includes("hoodie")) tags.push("hoodie");
  if (lowerName.includes("polo")) tags.push("polo");
  if (lowerName.includes("soccer")) tags.push("soccer");
  if (lowerName.includes("basketball")) tags.push("basketball");
  if (lowerName.includes("volleyball")) tags.push("volleyball");
  if (lowerName.includes("track")) tags.push("track");
  if (lowerName.includes("baseball")) tags.push("baseball");
  if (lowerName.includes("bag")) tags.push("bag");
  if (lowerName.includes("cap")) tags.push("cap");

  tags.push("custom", "sports", "apparel");

  return [...new Set(tags)];
}

function generateProductId(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
