import { ApiError } from "@/server/http/errors";

/**
 * Port of backend/src/main/java/com/portalrpg/storage/StorageService.java. Unlike the
 * Java backend (which also supported writing uploads to local disk when Storage wasn't
 * configured), this rewrite has NO local-disk fallback: serverless Route Handlers have
 * no writable/persistent filesystem, so Supabase Storage is the only upload path.
 */

function supabaseUrl(): string {
  return (process.env.SUPABASE_URL ?? "").replace(/\/$/, "");
}

function serviceKey(): string {
  return process.env.SUPABASE_SERVICE_KEY ?? "";
}

export function bucket(): string {
  return process.env.SUPABASE_BUCKET ?? "rag-books";
}

export function enabled(): boolean {
  return supabaseUrl().length > 0 && serviceKey().length > 0;
}

function requireEnabled(): void {
  if (!enabled()) {
    throw ApiError.serviceUnavailable("object storage not configured (set SUPABASE_URL / SUPABASE_SERVICE_KEY)");
  }
}

function base(): string {
  return `${supabaseUrl()}/storage/v1`;
}

function authHeaders(): Record<string, string> {
  return { apikey: serviceKey(), Authorization: `Bearer ${serviceKey()}` };
}

export type SignedUpload = { uploadUrl: string; path: string; bucket: string };

/** Creates a signed upload URL for an object in the private bucket (the browser PUTs directly to it). */
export async function createSignedUpload(path: string): Promise<SignedUpload> {
  requireEnabled();
  let res: Response;
  try {
    res = await fetch(`${base()}/object/upload/sign/${bucket()}/${path}`, {
      method: "POST",
      headers: authHeaders(),
    });
  } catch (e) {
    throw ApiError.badGateway(`failed to create signed upload url: ${e instanceof Error ? e.message : "network error"}`);
  }
  if (!res.ok) {
    throw ApiError.badGateway(`failed to create signed upload url: storage returned ${res.status}`);
  }
  const body = (await res.json()) as { url?: string };
  if (!body.url) {
    throw ApiError.badGateway("storage did not return an upload url");
  }
  // The url comes back relative (/object/upload/sign/...?token=...); the browser PUTs there.
  return { uploadUrl: base() + body.url, path, bucket: bucket() };
}

/** Downloads the object's bytes (service key) for extraction/indexing. */
export async function download(path: string): Promise<Uint8Array> {
  requireEnabled();
  let res: Response;
  try {
    res = await fetch(`${base()}/object/${bucket()}/${path}`, { headers: authHeaders() });
  } catch (e) {
    throw ApiError.badGateway(`failed to download object: ${e instanceof Error ? e.message : "network error"}`);
  }
  if (!res.ok) {
    throw ApiError.badGateway(`failed to download object: storage returned ${res.status}`);
  }
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.length === 0) {
    throw ApiError.badGateway(`storage returned empty object: ${path}`);
  }
  return bytes;
}

/**
 * Uploads bytes directly (service key) — used by the direct-multipart upload route so
 * it can hand off to Supabase Storage instead of writing to a local, non-persistent disk.
 */
export async function upload(path: string, bytes: Uint8Array, contentType: string): Promise<void> {
  requireEnabled();
  let res: Response;
  try {
    res = await fetch(`${base()}/object/${bucket()}/${path}`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": contentType },
      body: Buffer.from(bytes),
    });
  } catch (e) {
    throw ApiError.badGateway(`failed to upload object: ${e instanceof Error ? e.message : "network error"}`);
  }
  if (!res.ok) {
    throw ApiError.badGateway(`failed to upload object: storage returned ${res.status}`);
  }
}
