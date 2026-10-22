// Path: lib/chunk-upload.ts  (NEW)
//
// Shared helpers for talking to the Laravel API with a Sanctum cookie session,
// plus the chunked uploader (3MB chunks, safely under Vercel's 4.5MB body limit).

const CHUNK_SIZE = 3 * 1024 * 1024;
const MAX_RETRIES = 3;

export class AuthError extends Error {}

export type UploadedMedia = {
  type: "image" | "video";
  path: string;
  name: string;
  previewUrl: string;
};

function getXsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// Everything goes through the Next.js proxy (app/api/proxy/[...path]/route.ts).
// Pass paths WITHOUT the /api prefix, e.g. apiFetch("/sell-trade").
const API_BASE = "/api/proxy";

/**
 * fetch() through the proxy with cookies + Sanctum CSRF header.
 * If the XSRF-TOKEN cookie is missing on a write request, it fetches the
 * CSRF cookie first.
 */
export async function apiFetch(path: string, init: RequestInit = {}) {
  const method = (init.method ?? "GET").toUpperCase();

  if (method !== "GET" && method !== "HEAD" && !getXsrfToken()) {
    await fetch(`${API_BASE}/sanctum/csrf-cookie`, {
      credentials: "include",
      headers: { Accept: "application/json" },
    }).catch(() => undefined);
  }

  const xsrf = getXsrfToken();

  return fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(xsrf ? { "X-XSRF-TOKEN": xsrf } : {}),
      ...(init.headers ?? {}),
    },
  });
}

async function post(url: string, init: RequestInit) {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await apiFetch(url, init);

      if (res.status === 401) throw new AuthError("Please log in first.");
      if (res.ok) return res.json();

      // 4xx (except 408/429) will never succeed on retry.
      if (res.status < 500 && res.status !== 408 && res.status !== 429) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || "Upload failed.");
      }

      lastError = new Error(`Server error ${res.status}`);
    } catch (e) {
      if (e instanceof AuthError) throw e;
      // Non-retryable client errors thrown above also land here.
      if (e instanceof Error && e.message === "Upload failed.") throw e;
      lastError = e;
    }

    await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
  }

  throw lastError instanceof Error ? lastError : new Error("Upload failed.");
}

export async function uploadFileChunked(
  file: File,
  onProgress: (percent: number) => void,
): Promise<UploadedMedia> {
  const isVideo = file.type.startsWith("video/");
  const folder = isVideo ? "sell-trade/videos" : "sell-trade/images";
  const identifier = crypto.randomUUID();
  const total = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));

  for (let index = 0; index < total; index++) {
    const body = new FormData();
    body.append("identifier", identifier);
    body.append("total", String(total));
    body.append("index", String(index));
    body.append(
      "chunk",
      file.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE),
      "chunk",
    );

    await post("/uploads/chunk", { method: "POST", body });
    onProgress(Math.round(((index + 1) / total) * 100));
  }

  const done = await post("/uploads/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, filename: file.name, folder, total }),
  });

  return {
    type: isVideo ? "video" : "image",
    path: done.path,
    name: file.name,
    previewUrl: URL.createObjectURL(file),
  };
}
