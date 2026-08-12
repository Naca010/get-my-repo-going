// Server-only: resolves the Bot backend for an incoming request by
// matching the request Host header against configured domain_routes.
// Returns null when no matching route (and no default row) is configured;
// callers surface a clear error instead of silently using a wrong backend.

export type ResolvedBackend = {
  baseUrl: string;
  token: string | null;
  label: string;
};

function normHost(h: string | null): string | null {
  if (!h) return null;
  return (h.split(":")[0] ?? "").trim().toLowerCase() || null;
}

export async function resolveBackend(
  request: Request,
  hostOverride?: string | null,
): Promise<ResolvedBackend | null> {
  const host = normHost(hostOverride ?? request.headers.get("host"));
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("domain_routes")
      .select("label, domain, api_host, api_port, bot_token, is_default");
    if (error || !data) return null;

    // Match host exactly OR as a subdomain of the configured domain.
    // Prefer the longest (most specific) matching domain.
    let byDomain: any = null;
    if (host) {
      const matches = data
        .map((r: any) => ({ r, d: normHost(r.domain) }))
        .filter(({ d }) => d && (host === d || host.endsWith(`.${d}`)))
        .sort((a, b) => (b.d?.length ?? 0) - (a.d?.length ?? 0));
      byDomain = matches[0]?.r ?? null;
    }
    const def = data.find((r: any) => r.is_default) ?? null;
    const row: any = byDomain ?? def;
    if (row?.api_host && row?.api_port) {
      return {
        baseUrl: `http://${row.api_host}:${row.api_port}`,
        token: row.bot_token ?? null,
        label: row.label,
      };
    }
    return null;
  } catch {
    return null;
  }
}
