import { assetStorageRoot } from "@/lib/designer/storage-service";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Serve designer PNGs written by the generate/logo routes.
 * Local dev: .designer-assets/  ·  Vercel: /tmp/designer-assets/
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ day: string; file: string }> },
) {
  const { day, file } = await context.params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^[a-zA-Z0-9_-]+\.png$/.test(file)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const absolute = path.join(assetStorageRoot(), "generated", day, file);
  const root = path.resolve(assetStorageRoot());
  if (!path.resolve(absolute).startsWith(root + path.sep)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  try {
    const info = await stat(absolute);
    if (!info.isFile()) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const bytes = await readFile(absolute);
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
}
