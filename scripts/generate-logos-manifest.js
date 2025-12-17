const fs = require("fs");
const path = require("path");

const LOGOS_DIR = path.join(process.cwd(), "public/school_logos_advanced");
const OUTPUT_FILE = path.join(process.cwd(), "public/school-logos.json");

try {
  if (!fs.existsSync(LOGOS_DIR)) {
    console.error(`Directory not found: ${LOGOS_DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(LOGOS_DIR)
    .filter((file) => /\.(png|jpg|jpeg|svg)$/i.test(file))
    .map((file) => ({
      name: file.replace(/_/g, " ").replace(/\.(png|jpg|jpeg|svg)$/i, ""),
      path: `/school_logos_advanced/${file}`,
    }));

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(files, null, 2));
  console.log(
    `Generated logo manifest with ${files.length} entries at ${OUTPUT_FILE}`,
  );
} catch (error) {
  console.error("Error generating manifest:", error);
  process.exit(1);
}
