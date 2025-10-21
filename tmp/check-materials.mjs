// Quick script to check what materials are in the basketball hoodie GLB
import { readFile } from "fs/promises";
import { join } from "path";

const glbPath =
  "/Users/enisgjini/Desktop/besu-customs/public/models/basketball shooting shirt short sleeve with hoodie.glb";

try {
  const buffer = await readFile(glbPath);
  const text = buffer.toString("utf8", 0, Math.min(buffer.length, 100000)); // First 100KB as text

  // Search for material names in the GLB (they're usually stored as strings)
  const materialNames = [];
  const namePattern = /"name"\s*:\s*"([^"]+)"/g;
  let match;

  while ((match = namePattern.exec(text)) !== null) {
    materialNames.push(match[1]);
  }

  console.log("Found potential material names:");
  console.log(JSON.stringify([...new Set(materialNames)], null, 2));

  // Also try to find strings that look like material names
  const words = text.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || [];
  const uniqueWords = [...new Set(words)].filter(
    (w) =>
      w.length > 2 &&
      (w.includes("Zipper") ||
        w.includes("Cord") ||
        w.includes("Fabric") ||
        w === "X"),
  );

  console.log("\nFound zipper/cord/fabric related strings:");
  console.log(JSON.stringify(uniqueWords.slice(0, 50), null, 2));
} catch (err) {
  console.error("Error reading GLB:", err.message);
}
