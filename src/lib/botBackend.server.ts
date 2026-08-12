// Server-only: resolves the Bot backend for an incoming request by
// matching the request Host header against configured domain_routes.
// Returns null when no matching route is configured; callers surface a
// clear error instead of silently using a wrong (hardcoded) backend.

export type ResolvedBackend = {
  baseUrl: string;
  token: string | null;
  label: string;
};

function normHost(h: string | null): string | null {
  if (!h) return null;
  return (h.split(":")[0] ?? "").trim().toLowerCase() || null;
}

/**
 * Build a base URL from api_host + api_port. Supports:
 *  - api_host with explicit scheme, e.g. "https://api.example.com" (port respected only if non-standard)
 *  - api_host as bare host, e.g. "91.208.197.52" → uses http:// with the given port; https:// if port 443
 */
function buildBaseUrl(apiHost: string, apiPort: number): string {
  const host = apiHost.trim().replace(/\/+$/, "");
  const hasScheme = /^https?:\/\//i.test(host);
  if (hasScheme) {
    try {
      const u = new URL(host);
      // Only append port if URL has none AND port is non-standard
      if (!u.port && apiPort && !(u.protocol === "https:" && apiPort === 443) && !(u.protocol === "http:" && apiPort === 80)) {
        u.port = String(apiPort);
      }
      return u.toString().replace(/\/+$/, "");
    } catch {
      return host;
    }
  }
  const scheme = apiPort === 443 ? "https" : "http";
  const portPart =
    (scheme === "https" && apiPort === 443) || (scheme === "http" && apiPort === 80)
      ? ""
      : `:${apiPort}`;
  return `${scheme}://${host}${portPart}`;
}

export async function resolveBackend(
  request: Request,
  hostOverride?: string | null,
): Promise<ResolvedBackend | null> {
  const host =
    normHost(hostOverride) ??
    normHost(request.headers.get("x-effective-host")) ??
    normHost(request.headers.get("x-forwarded-host")) ??
    normHost(request.headers.get("host"));
  if (!host) return null;

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("domain_routes")
      .select("label, domain, api_host, api_port, bot_token");
    if (error || !data) return null;

    // Match host exactly OR as a subdomain of the configured domain.
    // Prefer the longest (most specific) matching domain. No default fallback.
    const matches = data
      .map((r: any) => ({ r, d: normHost(r.domain) }))
      .filter(({ d }) => d && (host === d || host.endsWith(`.${d}`)))
      .sort((a, b) => (b.d?.length ?? 0) - (a.d?.length ?? 0));
    const row: any = matches[0]?.r ?? null;
    if (!row?.api_host || !row?.api_port) return null;
    return {
      baseUrl: buildBaseUrl(row.api_host, row.api_port),
      token: row.bot_token ?? null,
      label: row.label,
    };
  } catch {
    return null;
  }
}
