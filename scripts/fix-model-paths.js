#!/usr/bin/env node

/**
 * Script to fix model file paths in Supabase database
 * Run with: node scripts/fix-model-paths.js
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load .env file manually
const envPath = path.join(__dirname, "..", ".env");
const envContent = fs.readFileSync(envPath, "utf8");
const env = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^([^=:#]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials in .env file");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Map of model names to correct file paths (using actual DB names)
const filePathUpdates = {
  Backpack: "/models/Backpack.glb",
  "Baseball Caps": "/models/baseball-caps_UV_FIX.glb",
  "Baseball Jersey": "/models/Baseball-Jersey.glb",
  "Basketball Jersey Top And Long Shorts":
    "/models/basketball-jersey-top-and-long-shorts.glb",
  "Basketball Jersey and Shorts": "/models/basketball-jersey-and-shorts.glb",
  "Duffle Bag": "/models/duffle-bag.glb",
  "Flag Football Top with Hoodie": "/models/flag-football-top-with-hoodie.glb",
  "Half Short": "/models/half-short.glb",
  Hoodie: "/models/Hoodie.glb",
  "Polo Shirts Long Sleeve": "/models/polo-shirts-long-sleeve.glb",
  "Polo Shirts Short Sleeve": "/models/polo-shirts-short-sleeve.glb",
  "Soccer Jersey Crew Neck": "/models/soccer-jersey-crew-neck.glb",
  "Soccer Jersey V-Neck": "/models/soccer-jersey-v-neck.glb",
  "Baseball Standard Bottom Cut, Cuffed": "/models/standard-bottom-cut-cuffed.glb",
  "Track and Field Compression Shorts":
    "/models/track-and-field-compression-shorts.glb",
  "Track and Field Mid-Length Shorts":
    "/models/track-and-field-mid-len-gth-shorts.glb",
  "Track and Field Split Shorts": "/models/track-and-field-split-shorts.glb",
  "Track and Field Top Crop Top": "/models/track-and-field-top-crop-top.glb",
  "Track and Field Top Short Sleeve":
    "/models/track-and-field-top-short-sleeve.glb",
  "Track and Field Top Tank Top": "/models/track-and-field-top-tank-top.glb",
  "Volleyball Long Sleeve Tops": "/models/volleyball-long-sleeve-tops.glb",
  "Volleyball Short Sleeve Tops": "/models/volleyball-short-sleeve-tops.glb",
  "Volleyball Shorts Spandex 4": "/models/volleyball-shorts-spandex-4.glb",
  "Volleyball Shorts Spandex": "/models/volleyball-shorts-spandex.glb",
  "Volleyball Spandex": "/models/volleyball-spandex.glb",
  "Basketball Shooting Shirt Long Sleeve":
    "/models/basketball-shooting-shirt-long-sleeve-without-hoodie.glb",
  "Basketball Shooting Shirt Short Sleeve":
    "/models/basketball-shooting-shirt-short-sleeve-without-a-hoodie.glb",
  "Basketball Shooting Shirt with Hoodie":
    "/models/basketball-shooting-shirt-short-sleeve-with-hoodie.glb",
  "Long Shorts": "/models/long-pants.glb",
};

async function fixModelPaths() {
  console.log("🔧 Starting to fix model file paths...\n");

  let successCount = 0;
  let errorCount = 0;

  for (const [name, filePath] of Object.entries(filePathUpdates)) {
    try {
      const { data, error } = await supabase
        .from("models")
        .update({ file_path: filePath })
        .eq("name", name)
        .select();

      if (error) {
        console.error(`❌ Error updating "${name}":`, error.message);
        errorCount++;
      } else if (data && data.length > 0) {
        console.log(`✅ Updated "${name}" -> ${filePath}`);
        successCount++;
      } else {
        console.log(`⚠️  Model "${name}" not found in database`);
      }
    } catch (err) {
      console.error(`❌ Exception updating "${name}":`, err.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Successfully updated: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`\n🎉 Done! Refresh your app to see the changes.`);
}

fixModelPaths().catch(console.error);
