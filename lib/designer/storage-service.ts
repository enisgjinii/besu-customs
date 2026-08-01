import { createClient } from "@supabase/supabase-js";

const pngSignature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

export function assertStorageConfiguration() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error("Asset storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  let parsed: URL;
  try { parsed = new URL(url); } catch { throw new Error("Asset storage is not configured. NEXT_PUBLIC_SUPABASE_URL must be a valid HTTPS URL."); }
  if (parsed.protocol !== "https:") throw new Error("Asset storage is not configured. NEXT_PUBLIC_SUPABASE_URL must use HTTPS.");
  return { url: parsed.toString().replace(/\/$/, ""), key, bucket: process.env.DESIGNER_ASSETS_BUCKET?.trim() || "designer-assets" };
}

export async function storeGeneratedAsset(bytes: Uint8Array, id: string) {
  if (!bytes.byteLength || bytes.byteLength > 20 * 1024 * 1024) throw new Error("Generated artwork is empty or exceeds the 20 MB upload limit.");
  if (!pngSignature.every((value, index) => bytes[index] === value)) throw new Error("Generated artwork is not a valid PNG.");
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error("Generated artwork has an invalid asset ID.");
  const { url, key, bucket } = assertStorageConfiguration();
  const client = createClient(url, key, { auth: { persistSession: false } });
  const path = `generated/${new Date().toISOString().slice(0, 10)}/${id}.png`;
  const { error } = await client.storage.from(bucket).upload(path, bytes, { contentType: "image/png", upsert: false, cacheControl: "31536000" });
  if (error) {
    if (/bucket|not found/i.test(error.message)) throw new Error(`Asset bucket "${bucket}" is missing or inaccessible. Create it with public read enabled.`);
    throw new Error(`Asset upload failed: ${error.message}`);
  }
  const { data } = client.storage.from(bucket).getPublicUrl(path);
  const expectedPrefix = `${url}/storage/v1/object/public/${encodeURIComponent(bucket)}/`;
  if (!data.publicUrl.startsWith(expectedPrefix)) throw new Error("Asset storage returned an unexpected public URL.");
  return { url: data.publicUrl, path, bucket };
}
