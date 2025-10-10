import fs from "fs"
import path from "path"

export async function GET() {
  try {
    const modelsDir = path.join(process.cwd(), "public", "models")

    let files: string[] = []

    if (fs.existsSync(modelsDir)) {
      files = fs.readdirSync(modelsDir).filter((f) => f.toLowerCase().endsWith(".glb"))
    }

    const result = files.map((f) => ({ name: f, url: `/models/${encodeURIComponent(f)}` }))

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error("Failed to list models:", err)
    return new Response(JSON.stringify([]), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
