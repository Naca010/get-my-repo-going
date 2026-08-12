// Resolves the Bot API base URL dynamically from admin settings
// (public.domain_routes) based on the current window hostname.
// The lookup is performed server-side via /api/public/api-base which
// uses resolveBackend (host/suffix match against domain_routes).

let cached: { host: string; baseUrl: string } | null = null;
let inflight: Promise<string> | null = null;

export class NoApiRouteError extends Error {
  constructor(host: string) {
    super(`Keine API-Konfiguration für diese Domain gefunden (${host})`);
    this.name = "NoApiRouteError";
  }
}

export async function loadApiBaseUrl(): Promise<string> {
  if (typeof window === "undefined") {
    throw new NoApiRouteError("ssr");
  }
  const host = window.location.hostname.toLowerCase();
  if (cached && cached.host === host) return cached.baseUrl;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch(`/api/public/api-base?host=${encodeURIComponent(host)}`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new NoApiRouteError(host);
      const data = (await res.json()) as { baseUrl?: string };
      if (!data?.baseUrl) throw new NoApiRouteError(host);
      cached = { host, baseUrl: data.baseUrl };
      return data.baseUrl;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/** Synchronous accessor — returns the cached value or null if not resolved yet. */
export function getApiBaseUrl(): string | null {
  return cached?.baseUrl ?? null;
}

// Kick off resolution on module load so most call sites see the cached value.
if (typeof window !== "undefined") {
  void loadApiBaseUrl().catch(() => {
    /* surfaced by explicit callers */
  });
}
