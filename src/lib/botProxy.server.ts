// Server-only helper: proxies a request to the resolved bot backend and
// returns detailed diagnostics on failure so we can tell exactly WHY the
// preview works but a configured reverse-proxy domain does not.

import { resolveBackend, type ResolvedBackend } from "@/lib/botBackend.server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Effective-Host",
  "Access-Control-Max-Age": "86400",
};

export function botProxyOptionsResponse(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

function withCors(response: Response): Response {
  for (const [name, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(name, value);
  }
  return response;
}

export type ProxyDiag = {
  incoming_host: string | null;
  incoming_origin: string | null;
  incoming_url: string;
  resolved: {
    label: string;
    baseUrl: string;
    hasToken: boolean;
  } | null;
  upstream_url?: string;
  upstream_status?: number;
  upstream_status_text?: string;
  upstream_body_snippet?: string;
  fetch_error?: { name: string; message: string; cause?: string };
  duration_ms?: number;
};

function baseDiag(request: Request): ProxyDiag {
  return {
    incoming_host: request.headers.get("host"),
    incoming_origin: request.headers.get("origin"),
    incoming_url: request.url,
    resolved: null,
  };
}

// expose forwarded host for diag
function forwardedHost(request: Request): string | null {
  const eff = request.headers.get("x-effective-host");
  if (eff) return eff.split(",")[0]?.trim() ?? null;
  const xfh = request.headers.get("x-forwarded-host");
  if (xfh) return (xfh.split(",")[0] ?? "").trim();
  const origin = request.headers.get("origin");
  if (origin) {
    try { return new URL(origin).host; } catch { /* noop */ }
  }
  const referer = request.headers.get("referer");
  if (referer) {
    try { return new URL(referer).host; } catch { /* noop */ }
  }
  return null;
}


export async function proxyToBackend(
  request: Request,
  upstreamPath: string,
  init: { method: "GET" | "POST"; body?: string | null } = { method: "GET" },
): Promise<Response> {
  const diag = baseDiag(request);
  const incomingHost = (request.headers.get("host") ?? "").toLowerCase();
  const fwdHost = forwardedHost(request);
  // When traffic is proxied via a CDN/reverse-proxy in front of our
  // *.lovable.app origin, the incoming Host is our own lovable host, so
  // prefer the forwarded/origin host to pick the right domain_routes row.
  const isLovableOrigin = /(^|\.)lovable\.(app|dev)$/i.test(incomingHost) ||
    /(^|\.)lovableproject\.com$/i.test(incomingHost);
  const effectiveHost = isLovableOrigin && fwdHost ? fwdHost : null;
  (diag as any).forwarded_host = fwdHost;
  (diag as any).effective_host = effectiveHost ?? incomingHost;
  let backend: ResolvedBackend | null = null;
  try {
    backend = await resolveBackend(request, effectiveHost);
  } catch (e: any) {
    return withCors(Response.json(
      { error: "resolve_failed", message: String(e?.message ?? e), diag },
      { status: 500 },
    ));
  }
  if (!backend) {
    return withCors(Response.json(
      {
        error: "no_route",
        message: `Keine domain_routes-Konfiguration für Host "${diag.incoming_host}" gefunden (und kein is_default). Prüfe Admin → Domain-Routing.`,
        diag,
      },
      { status: 404 },
    ));
  }
  diag.resolved = {
    label: backend.label,
    baseUrl: backend.baseUrl,
    hasToken: !!backend.token,
  };
  const upstreamUrl = `${backend.baseUrl}${upstreamPath}`;
  diag.upstream_url = upstreamUrl;

  const started = Date.now();
  try {
    const res = await fetch(upstreamUrl, {
      method: init.method,
      headers: {
        ...(init.method === "POST" ? { "Content-Type": "application/json" } : {}),
        ...(backend.token ? { Authorization: `Bearer ${backend.token}` } : {}),
      },
      ...(init.body != null ? { body: init.body } : {}),
    });
    diag.duration_ms = Date.now() - started;
    diag.upstream_status = res.status;
    diag.upstream_status_text = res.statusText;
    const text = await res.text();
    if (!res.ok) {
      return withCors(Response.json(
        {
          error: "upstream_error",
          message: `Upstream ${backend.label} antwortete mit ${res.status} ${res.statusText}`,
          upstream_body: text.slice(0, 2000),
          diag,
        },
        { status: 502 },
      ));
    }
    return withCors(new Response(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "application/json",
        "X-Proxy-Backend": backend.label,
        "X-Proxy-Upstream": upstreamUrl,
      },
    }));
  } catch (e: any) {
    diag.duration_ms = Date.now() - started;
    const causeMsg = e?.cause ? String(e.cause?.message ?? e.cause) : undefined;
    const fetchErr = {
      name: String(e?.name ?? "Error"),
      message: String(e?.message ?? e),
      ...(causeMsg ? { cause: causeMsg } : {}),
    };
    diag.fetch_error = fetchErr;
    return withCors(Response.json(
      {
        error: "upstream_unreachable",
        message: `Server konnte Upstream ${upstreamUrl} nicht erreichen: ${fetchErr.message}${causeMsg ? ` (cause: ${causeMsg})` : ""}`,
        diag,
      },
      { status: 502 },
    ));
  }
}
