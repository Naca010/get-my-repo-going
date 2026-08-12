// Resolve a storage URL/path into a same-origin proxied URL served by
// /api/public/asset. Buckets are private on Lovable Cloud, so
// getPublicUrl() links return 404. This proxy uses the service role
// server-side to stream bytes.

const BUCKETS = ["bank-logos", "bank-themes"] as const;
type Bucket = (typeof BUCKETS)[number];

export function assetUrl(bucket: Bucket, path: string | null | undefined): string | null {
  if (!path) return null;
  return `/api/public/asset?b=${encodeURIComponent(bucket)}&p=${encodeURIComponent(path)}`;
}

// Accept either a storage path, a Supabase public URL, or an external URL.
export function resolveAsset(
  bucket: Bucket,
  value: string | null | undefined,
  storagePath?: string | null,
): string | null {
  if (storagePath) return assetUrl(bucket, storagePath);
  if (!value) return null;
  // If it looks like a Supabase storage URL, extract the object path.
  const m = value.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+?)(?:\?|$)/);
  if (m && m[1] && m[2] && (BUCKETS as readonly string[]).includes(m[1])) {
    return assetUrl(m[1] as Bucket, m[2]);
  }
  return value; // external URL, use as-is
}
