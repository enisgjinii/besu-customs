import { NextRequest, NextResponse } from "next/server";
import { storeGeneratedAsset } from "@/lib/designer/storage-service";

export const maxDuration = 60;

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

function toError(code: string, message: string, status = 400) {
  return Object.assign(new Error(message), { code, status });
}

/**
 * Upload a customer logo for deterministic overlay (not AI-generated text).
 * Returns a public asset URL — never embed giant base64 in Shopify props.
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw toError("invalid_upload", "Choose a logo image file.");
    if (!ALLOWED_TYPES.has(file.type)) {
      throw toError("invalid_upload", "Logo must be PNG, JPEG, or WebP.");
    }
    if (file.size <= 0 || file.size > MAX_BYTES) {
      throw toError("invalid_upload", "Logo must be under 5 MB.");
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    // Convert JPEG/WebP to PNG via canvas is not available on edge — store as PNG only when PNG.
    // For non-PNG, re-wrap with a light validation and store with original type through a PNG path
    // by requiring PNG for production storage consistency.
    if (file.type !== "image/png") {
      // Accept JPEG/WebP for UX but reject for storage pipeline that expects PNG signature.
      // Client should convert; for now allow JPEG by wrapping error clearly.
      if (file.type === "image/jpeg" || file.type === "image/webp") {
        throw toError(
          "invalid_upload",
          "Please upload a PNG logo for now (JPEG/WebP need conversion).",
        );
      }
    }

    const id = crypto.randomUUID();
    const stored = await storeGeneratedAsset(bytes, id, { publicOrigin: req.nextUrl.origin });
    return NextResponse.json({ id, assetUrl: stored.url, path: stored.path, localAsset: Boolean(stored.local) });
  } catch (error) {
    const typed = error as Error & { code?: string; status?: number };
    const status = typed.status || 500;
    if (status >= 500) {
      console.error("Designer logo upload failed", {
        code: typed.code || "upload_failed",
        message: typed.message,
      });
    }
    return NextResponse.json(
      { error: typed.message || "Logo upload failed.", code: typed.code || "upload_failed" },
      { status },
    );
  }
}
