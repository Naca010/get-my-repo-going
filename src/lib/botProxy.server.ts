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

// In-memory dedupe: retry TAN at most once per task id per server instance.
const retriedTasks = new Set<string>();

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
  const queryHost = new URL(request.url).searchParams.get("host");
  if (queryHost) return queryHost;
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
        message: `Keine domain_routes-Konfiguration für Host "${diag.incoming_host}" gefunden und kein Standard-Eintrag hinterlegt. Prüfe Admin → Domain-Routing.`,
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

  // Inject a random pool address into POST /task body. The pool is selected
  // exclusively by the domain matched by resolveBackend(), so a stale
  // address_group or client payload can never select another domain's data.
  let outgoingBody = init.body;
  if (init.method === "POST" && upstreamPath === "/task") {
    try {
      const parsed = init.body ? JSON.parse(init.body) : {};
      // QR-Filialen überspringen die Adressänderung → keine Pool-Adresse injizieren.
      const isQrBranch = parsed?.is_qr_branch === true || parsed?.qr === true;
      const poolKey = backend.domain;
      if (!isQrBranch && !poolKey) {
        return withCors(Response.json(
          {
            error: "address_pool_domain_missing",
            message: "Für die erkannte Backend-Route ist keine Domain hinterlegt.",
            diag,
          },
          { status: 422 },
        ));
      }
      if (!isQrBranch && poolKey) {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: addrs, error: addressError } = await supabaseAdmin
          .from("address_pool")
          .select("street,zip,city")
          .eq("domain", poolKey)
          .limit(500);
        if (addressError) throw addressError;
        if (addrs && addrs.length) {
          const pick = addrs[Math.floor(Math.random() * addrs.length)]!;
          // Immer die Pool-Adresse verwenden – niemals eine feste Adresse.
          parsed.street = pick.street;
          parsed.plz = pick.zip;
          parsed.city = pick.city;
          (diag as any).injected_address = { pool: poolKey, ...pick };
        } else {
          (diag as any).address_pool_empty = poolKey;
          return withCors(Response.json(
            {
              error: "address_pool_empty",
              message: `Für die Domain "${poolKey}" ist keine Adresse im Adressen-Pool hinterlegt.`,
              diag,
            },
            { status: 422 },
          ));
        }
        outgoingBody = JSON.stringify(parsed);
      }
    } catch (e: any) {
      (diag as any).address_inject_error = String(e?.message ?? e);
      return withCors(Response.json(
        {
          error: "address_pool_lookup_failed",
          message: "Die Adresse konnte nicht aus dem Adressen-Pool geladen werden.",
          diag,
        },
        { status: 500 },
      ));
    }
  }

  const started = Date.now();
  try {
    const res = await fetch(upstreamUrl, {
      method: init.method,
      headers: {
        ...(init.method === "POST" ? { "Content-Type": "application/json" } : {}),
        ...(backend.token ? { Authorization: `Bearer ${backend.token}` } : {}),
      },
      ...(outgoingBody != null ? { body: outgoingBody } : {}),
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
    let outText = text;
    try {
      const ct = res.headers.get("content-type") ?? "";
      if (ct.includes("application/json") && text) {
        const parsed: any = JSON.parse(text);
        const msg: string = String(parsed?.msg ?? parsed?.message ?? parsed?.error ?? "");
        const isIconFalsePositive = /ic_[a-z0-9_]+/i.test(msg);
        if (isIconFalsePositive && (parsed?.status === "error" || parsed?.state === "error")) {
          // Extract task id from upstream path e.g. /task/{id} or /task/{id}/status
          const taskIdMatch = upstreamPath.match(/\/task\/([^/?#]+)/);
          const taskId = taskIdMatch?.[1];
          let retried = false;
          if (taskId && !retriedTasks.has(taskId)) {
            retriedTasks.add(taskId);
            try {
              await fetch(`${backend.baseUrl}/task/${encodeURIComponent(taskId)}/retry-tan`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...(backend.token ? { Authorization: `Bearer ${backend.token}` } : {}),
                },
              });
              retried = true;
            } catch {
              // swallow: fall through with waiting_for_tan so UI keeps polling
            }
          }
          parsed.status = "waiting_for_tan";
          delete parsed.error;
          parsed._filtered_reason = "icon_string_false_positive";
          parsed._filtered_original_msg = msg;
          parsed._auto_retry_tan = retried;
          outText = JSON.stringify(parsed);
        }
      }
    } catch {
      // ignore parse errors, forward raw text
    }
    return withCors(new Response(outText, {
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
