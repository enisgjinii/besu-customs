import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const pngSignature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

export class DesignerStorageError extends Error {
  code: string;
  status: number;

  constructor(message: string, code = "storage_error", status = 503) {
    super(message);
    this.name = "DesignerStorageError";
    this.code = code;
    this.status = status;
  }
}

export type StoredAsset = {
  url: string;
  path: string;
  bucket: string;
  local?: boolean;
};

/** Vercel, Lambda and similar runtimes deploy to a read-only directory (/var/task). */
export function isServerlessRuntime() {
  return Boolean(
    process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.NETLIFY ||
      process.env.CF_PAGES,
  );
}

/** True when the app should persist generated PNGs on local disk instead of Supabase. */
export function prefersLocalAssetStorage() {
  if (isServerlessRuntime()) return false;
  return process.env.DESIGNER_LOCAL_ASSETS === "true";
}

/** Directory for local/dev PNG assets (gitignored). Never used on serverless runtimes. */
export function localAssetRoot() {
  return path.join(process.cwd(), ".designer-assets");
}

export function assertStorageConfiguration() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/^["']|["']$/g, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim().replace(/^["']|["']$/g, "");
  if (!url || !key) {
    throw new DesignerStorageError(
      "Asset storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      "storage_not_configured",
    );
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new DesignerStorageError(
      "Asset storage is not configured. NEXT_PUBLIC_SUPABASE_URL must be a valid HTTPS URL.",
      "storage_not_configured",
    );
  }
  if (parsed.protocol !== "https:") {
    throw new DesignerStorageError(
      "Asset storage is not configured. NEXT_PUBLIC_SUPABASE_URL must use HTTPS.",
      "storage_not_configured",
    );
  }
  return {
    url: parsed.toString().replace(/\/$/, ""),
    key,
    bucket: process.env.DESIGNER_ASSETS_BUCKET?.trim().replace(/^["']|["']$/g, "") || "designer-assets",
  };
}

function allowLocalAssets() {
  if (isServerlessRuntime()) return false;
  return (
    process.env.DESIGNER_LOCAL_ASSETS === "true" ||
    process.env.NODE_ENV === "development"
  );
}

function isNetworkStorageFailure(message: string) {
  return /fetch failed|ENOTFOUND|ECONNREFUSED|ECONNRESET|ETIMEDOUT|network|getaddrinfo|nodename|DNS/i.test(
    message,
  );
}

async function storeLocalAsset(bytes: Uint8Array, id: string, publicOrigin?: string): Promise<StoredAsset> {
  if (!publicOrigin) {
    throw new DesignerStorageError(
      "Local asset storage needs the request origin. Restart the app and try again.",
      "storage_not_configured",
    );
  }
  const day = new Date().toISOString().slice(0, 10);
  const relative = path.join("generated", day, `${id}.png`);
  const absolute = path.join(localAssetRoot(), relative);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, bytes);
  const urlPath = `/api/designer/asset/${day}/${id}.png`;
  return {
    url: `${publicOrigin.replace(/\/$/, "")}${urlPath}`,
    path: relative.replaceAll("\\", "/"),
    bucket: "local",
    local: true,
  };
}

export async function storeGeneratedAsset(
  bytes: Uint8Array,
  id: string,
  options?: { publicOrigin?: string },
): Promise<StoredAsset> {
  if (!bytes.byteLength || bytes.byteLength > 20 * 1024 * 1024) {
    throw new DesignerStorageError(
      "Generated artwork is empty or exceeds the 20 MB upload limit.",
      "invalid_asset",
      502,
    );
  }
  if (!pngSignature.every((value, index) => bytes[index] === value)) {
    throw new DesignerStorageError("Generated artwork is not a valid PNG.", "invalid_asset", 502);
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    throw new DesignerStorageError("Generated artwork has an invalid asset ID.", "invalid_asset", 500);
  }

  const forceLocal = prefersLocalAssetStorage();
  if (forceLocal) {
    return storeLocalAsset(bytes, id, options?.publicOrigin);
  }

  if (isServerlessRuntime() && process.env.DESIGNER_LOCAL_ASSETS === "true") {
    console.warn(
      "DESIGNER_LOCAL_ASSETS is set but ignored on serverless — using Supabase storage instead.",
    );
  }

  try {
    const { url, key, bucket } = assertStorageConfiguration();
    const client = createClient(url, key, { auth: { persistSession: false } });
    const storagePath = `generated/${new Date().toISOString().slice(0, 10)}/${id}.png`;
    const { error } = await client.storage.from(bucket).upload(storagePath, bytes, {
      contentType: "image/png",
      upsert: false,
      cacheControl: "31536000",
    });
    if (error) {
      if (/bucket|not found/i.test(error.message)) {
        throw new DesignerStorageError(
          `Asset bucket "${bucket}" is missing or inaccessible. Create it with public read enabled.`,
          "storage_not_configured",
        );
      }
      throw new DesignerStorageError(`Asset upload failed: ${error.message}`, "storage_upload_failed");
    }
    const { data } = client.storage.from(bucket).getPublicUrl(storagePath);
    const expectedPrefix = `${url}/storage/v1/object/public/${encodeURIComponent(bucket)}/`;
    if (!data.publicUrl.startsWith(expectedPrefix)) {
      throw new DesignerStorageError("Asset storage returned an unexpected public URL.", "storage_url_invalid");
    }
    return { url: data.publicUrl, path: storagePath, bucket };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (allowLocalAssets() && (isNetworkStorageFailure(message) || error instanceof DesignerStorageError)) {
      if (
        error instanceof DesignerStorageError &&
        error.code === "storage_not_configured" &&
        !isNetworkStorageFailure(message) &&
        !/fetch failed/i.test(message)
      ) {
        // Missing env in production-like setups should still throw; in development fall through.
        if (process.env.NODE_ENV !== "development") throw error;
      }
      console.warn("Designer storage falling back to local assets", { message });
      return storeLocalAsset(bytes, id, options?.publicOrigin);
    }
    throw error;
  }
}

/** True when a URL is a same-origin local designer asset. */
export function isLocalDesignerAssetUrl(value: string, origin: string) {
  try {
    const asset = new URL(value);
    const base = new URL(origin);
    return (
      asset.origin === base.origin &&
      /^\/api\/designer\/asset\/\d{4}-\d{2}-\d{2}\/[a-zA-Z0-9_-]+\.png$/.test(asset.pathname)
    );
  } catch {
    return false;
  }
}
