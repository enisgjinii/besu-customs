import { createClient } from "@supabase/supabase-js";

export async function storeGeneratedAsset(bytes: Uint8Array, id: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Asset storage is not configured.");
  const bucket = process.env.DESIGNER_ASSETS_BUCKET || "designer-assets";
  const client = createClient(url, key, { auth: { persistSession: false } });
  const path = `generated/${new Date().toISOString().slice(0, 10)}/${id}.png`;
  const { error } = await client.storage.from(bucket).upload(path, bytes, { contentType: "image/png", upsert: false, cacheControl: "31536000" });
  if (error) throw new Error(`Asset upload failed: ${error.message}`);
  const { data } = client.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl, path, bucket };
}
