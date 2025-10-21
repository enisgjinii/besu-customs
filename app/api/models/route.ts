import fs from "fs";
import path from "path";

// Use a static manifest to avoid bundling large .glb files into the serverless
// function. The manifest lives in `public/models.json` and is generated/updated
// by the repo maintainers when model files change.
export async function GET() {
  try {
    const manifestPath = path.join(process.cwd(), "public", "models.json");

    if (!fs.existsSync(manifestPath)) {
      // Fall back to scanning the directory if the manifest is missing
      const modelsDir = path.join(process.cwd(), "public", "models");
      let files: string[] = [];
      if (fs.existsSync(modelsDir)) {
        files = fs
          .readdirSync(modelsDir)
          .filter((f) => f.toLowerCase().endsWith(".glb"));
      }
      const result = files.map((f) => ({ name: f, url: `/models/${encodeURIComponent(f)}` }));
      return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    const raw = fs.readFileSync(manifestPath, "utf8");
    const parsed = JSON.parse(raw);

    return new Response(JSON.stringify(parsed), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Failed to list models:", err);
    return new Response(JSON.stringify([]), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
