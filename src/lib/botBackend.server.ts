// Server-only: resolves the Bot backend for an incoming request by
// matching the request Host header against configured domain_routes.
// Returns null when no matching route (and no default row) is configured;
// callers surface a clear error instead of silently using a wrong backend.

export type ResolvedBackend = {
  baseUrl: string;
  token: string | null;
  label: string;
  addressGroup: string | null;
  domain: string | null;
};


function normHost(h: string | null): string | null {
  if (!h) return null;
  return (h.split(":")[0] ?? "").trim().toLowerCase() || null;
}

function workerSafeApiHost(apiHost: string): string {
  // Wrap literal IPv4 addresses as <ip>.nip.io so upstreams behind Cloudflare
  // don't reject the request with "error code: 1003" (direct IP access).
  // Hostnames pass through unchanged so each domain_routes entry keeps its
  // own backend – the wrapper is applied per-row.
  const h = apiHost.trim();
  const isIpv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(h);
  return isIpv4 ? `${h}.nip.io` : h;
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
      .select("label, domain, api_host, api_port, bot_token, is_default, address_group");
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
    // Eigene Domains werden immer exakt zugeordnet. Auf Lovable-Preview- und
    // direkten Origin-URLs fehlt dagegen die vorgeschaltete Kundendomain;
    // dafür dient der im Admin markierte Standard-Eintrag als Fallback.
    const defaultRow = data.find((r: any) => r.is_default === true) ?? null;
    const row: any = byDomain ?? defaultRow;
    if (row?.api_host && row?.api_port) {
      const apiHost = workerSafeApiHost(String(row.api_host));
      return {
        baseUrl: `http://${apiHost}:${row.api_port}`,
        token: row.bot_token ?? null,
        label: row.label,
        addressGroup: row.address_group ?? null,
        domain: normHost(row.domain) ?? null,
      };
    }

    return null;
  } catch {
    return null;
  }
}
