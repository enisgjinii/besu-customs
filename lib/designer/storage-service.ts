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
  inline?: boolean;
};

const inlinePngPrefix = "data:image/png;base64,";

export function isInlineDesignerAssetUrl(value: string) {
  return value.startsWith(inlinePngPrefix);
}

export function decodeInlineDesignerAsset(value: string): Uint8Array {
  if (!isInlineDesignerAssetUrl(value)) {
    throw new DesignerStorageError("The inline artwork reference is not a PNG data URL.", "invalid_asset", 400);
  }
  const bytes = Uint8Array.from(Buffer.from(value.slice(inlinePngPrefix.length), "base64"));
  if (!bytes.byteLength || bytes.byteLength > 20 * 1024 * 1024) {
    throw new DesignerStorageError("Inline artwork is empty or exceeds the 20 MB limit.", "invalid_asset", 400);
  }
  if (!pngSignature.every((signature, index) => bytes[index] === signature)) {
    throw new DesignerStorageError("Inline artwork is not a valid PNG.", "invalid_asset", 400);
  }
  return bytes;
}

/** Vercel/Lambda runtimes only allow writes under /tmp. */
export function isServerlessRuntime() {
  return Boolean(
    process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.NETLIFY ||
      process.env.CF_PAGES,
  );
}

/** Root directory for persisted designer PNG bytes. */
export function assetStorageRoot() {
  if (isServerlessRuntime()) {
    return path.join("/tmp", "designer-assets");
  }
  return path.join(process.cwd(), ".designer-assets");
}

/** @deprecated Use assetStorageRoot — kept for the asset GET route import. */
export function localAssetRoot() {
  return assetStorageRoot();
}

function storagePathFor(id: string) {
  const day = new Date().toISOString().slice(0, 10);
  return { day, relative: `generated/${day}/${id}.png` };
}

/** True when a URL is a same-origin designer asset served by this app. */
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

/** URLs the generate route may use for refinement / recolour edits. */
export function isAllowedDesignerAssetUrl(value: string, origin?: string) {
  if (isInlineDesignerAssetUrl(value)) return true;
  return Boolean(origin && isLocalDesignerAssetUrl(value, origin));
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
  if (!options?.publicOrigin) {
    throw new DesignerStorageError(
      "Asset storage needs the request origin. Restart the app and try again.",
      "storage_not_configured",
    );
  }

  const { day, relative } = storagePathFor(id);
  const normalizedPath = relative.replaceAll("\\", "/");

  // Serverless disks are per-instance and ephemeral — inline PNGs keep renders visible in the browser.
  if (isServerlessRuntime()) {
    return {
      url: `${inlinePngPrefix}${Buffer.from(bytes).toString("base64")}`,
      path: normalizedPath,
      bucket: "inline",
      inline: true,
    };
  }

  const absolute = path.join(assetStorageRoot(), relative);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, bytes);

  const urlPath = `/api/designer/asset/${day}/${id}.png`;
  return {
    url: `${options.publicOrigin.replace(/\/$/, "")}${urlPath}`,
    path: normalizedPath,
    bucket: "local",
    local: true,
  };
}
