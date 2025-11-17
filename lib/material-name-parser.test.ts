/**
 * Test file to demonstrate material name parsing
 * Run this to see how material names are parsed
 */

import { parseMaterialName, parseMaterialNames } from "./material-name-parser";

// Test cases from real models
const testMaterials = [
  // Basketball Jersey
  "Body_F_144430",
  "Body_B_181847",
  "FABRIC_1_11120073",
  "FABRIC_1_11352026",
  "Default_Button_6792128",
  "Default_Buttonhole_6792189",
  "Ble_4559165",

  // Soccer Jersey
  "Body_F_279881",
  "Body_B_301116",
  "Sleeves_365053",
  "Collar_Stand_441436",

  // Backpack
  "FABRIC_3_79203",
  "FABRIC_4_79209",
  "M_00005_156729",
  "Zipper_Teeth_01_79381",
  "Slider_01_156698",
  "79499",

  // Volleyball
  "Body_1486550",
  "Body_1337391",
  "Material.001",

  // Duffle Bag
  "FABRIC 2_612766",
];

console.log("🧪 Material Name Parser Test\n");
console.log("=".repeat(80));

testMaterials.forEach((materialName) => {
  const parsed = parseMaterialName(materialName);
  console.log(`\nOriginal: "${materialName}"`);
  console.log(`  Display:  "${parsed.displayName}"`);
  console.log(`  Category: ${parsed.category}`);
  console.log(`  Color:    ${parsed.defaultColor}`);
  console.log(`  Priority: ${parsed.priority}`);
});

console.log("\n" + "=".repeat(80));
console.log("\n📊 Sorted by Priority:\n");

const sorted = parseMaterialNames(testMaterials);
sorted.forEach((material, index) => {
  console.log(
    `${(index + 1).toString().padStart(2)}. [${material.priority.toString().padStart(3)}] ${material.displayName.padEnd(20)} (${material.category}) -> ${material.defaultColor}`,
  );
});
