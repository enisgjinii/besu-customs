import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const pngSignature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const BLOB_API = "https://blob.vercel-storage.com";

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

/** True when the app should persist generated PNGs on local disk instead of Vercel Blob. */
export function prefersLocalAssetStorage() {
  if (isServerlessRuntime()) return false;
  return process.env.DESIGNER_LOCAL_ASSETS === "true";
}

function hasBlobToken() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

/** Directory for local/dev PNG assets (gitignored). Never used on serverless runtimes. */
export function localAssetRoot() {
  return path.join(process.cwd(), ".designer-assets");
}

function allowLocalAssets() {
  if (isServerlessRuntime()) return false;
  return process.env.DESIGNER_LOCAL_ASSETS === "true" || process.env.NODE_ENV === "development";
}

function storagePathFor(id: string) {
  const day = new Date().toISOString().slice(0, 10);
  return { day, relative: `generated/${day}/${id}.png`, key: `designer/generated/${day}/${id}.png` };
}

async function storeLocalAsset(bytes: Uint8Array, id: string, publicOrigin?: string): Promise<StoredAsset> {
  if (!publicOrigin) {
    throw new DesignerStorageError(
      "Local asset storage needs the request origin. Restart the app and try again.",
      "storage_not_configured",
    );
  }
  const { day, relative } = storagePathFor(id);
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

async function storeBlobAsset(bytes: Uint8Array, id: string): Promise<StoredAsset> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    throw new DesignerStorageError(
      "Asset storage is not configured. Link a Vercel Blob store to this project or set BLOB_READ_WRITE_TOKEN.",
      "storage_not_configured",
    );
  }
  const { relative, key } = storagePathFor(id);
  const response = await fetch(`${BLOB_API}/${key}`, {
    method: "PUT",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "image/png",
      "x-api-version": "7",
      "x-add-random-suffix": "0",
      "x-allow-overwrite": "1",
    },
    body: Buffer.from(bytes),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new DesignerStorageError(
      `Asset upload failed: ${detail || response.statusText}`.slice(0, 240),
      "storage_upload_failed",
    );
  }
  const payload = (await response.json()) as { url?: string };
  if (!payload.url?.startsWith("https://")) {
    throw new DesignerStorageError("Asset storage returned an unexpected public URL.", "storage_url_invalid");
  }
  return { url: payload.url, path: relative, bucket: "vercel-blob" };
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

/** True when a URL is a public Vercel Blob designer asset. */
export function isBlobDesignerAssetUrl(value: string) {
  try {
    const asset = new URL(value);
    return (
      asset.protocol === "https:" &&
      (asset.hostname.endsWith(".public.blob.vercel-storage.com") ||
        asset.hostname === "public.blob.vercel-storage.com")
    );
  } catch {
    return false;
  }
}

/** URLs the generate route may fetch for refinement / recolour edits. */
export function isAllowedDesignerAssetUrl(value: string, origin?: string) {
  if (origin && isLocalDesignerAssetUrl(value, origin)) return true;
  return isBlobDesignerAssetUrl(value);
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

  if (prefersLocalAssetStorage()) {
    return storeLocalAsset(bytes, id, options?.publicOrigin);
  }

  try {
    if (hasBlobToken() || isServerlessRuntime()) {
      return await storeBlobAsset(bytes, id);
    }
    return storeLocalAsset(bytes, id, options?.publicOrigin);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (allowLocalAssets() && options?.publicOrigin) {
      console.warn("Designer storage falling back to local assets", { message });
      return storeLocalAsset(bytes, id, options.publicOrigin);
    }
    throw error instanceof DesignerStorageError
      ? error
      : new DesignerStorageError(message || "Asset upload failed.", "storage_upload_failed");
  }
}
