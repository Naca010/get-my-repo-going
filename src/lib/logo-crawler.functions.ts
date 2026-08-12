import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Input = { banks: Array<{ id: string; url: string }>; runId?: string };
type ResultItem = { id: string; logo: string | null; error?: string };

async function storeLogoInBucket(
  supabase: any,
  bankId: string,
  sourceUrl: string,
): Promise<{ publicUrl: string; path: string } | null> {
  try {
    const res = await fetch(sourceUrl, {
      redirect: "follow",
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; LovableLogoBot/1.0)",
        accept: "image/*,*/*;q=0.8",
      },
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "image/png";
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength === 0 || buf.byteLength > 5_000_000) return null;
    const extFromCT = contentType.includes("svg")
      ? "svg"
      : contentType.includes("webp")
      ? "webp"
      : contentType.includes("jpeg") || contentType.includes("jpg")
      ? "jpg"
      : contentType.includes("gif")
      ? "gif"
      : contentType.includes("x-icon") || contentType.includes("vnd.microsoft.icon")
      ? "ico"
      : "png";
    const urlExt = (sourceUrl.split("?")[0]?.split(".").pop() || "").toLowerCase();
    const ext = ["svg", "png", "jpg", "jpeg", "webp", "gif", "ico"].includes(urlExt)
      ? urlExt.replace("jpeg", "jpg")
      : extFromCT;
    const path = `${bankId}.${ext}`;
    const { error } = await supabase.storage.from("bank-logos").upload(path, buf, {
      contentType,
      upsert: true,
    });
    if (error) return null;
    const { data } = supabase.storage.from("bank-logos").getPublicUrl(path);
    return { publicUrl: data.publicUrl, path };
  } catch {
    return null;
  }
}

const IMG_TAG_RE = /<img\b[^>]*>/gi;
const ATTR = (name: string) => new RegExp(`${name}=["']([^"']+)["']`, "i");
const SRC_RE = ATTR("src");
const SRCSET_RE = ATTR("srcset");
const DATA_SRC_RE = ATTR("data-src");
const ALT_RE = ATTR("alt");
const CLASS_RE = ATTR("class");
const ID_RE = ATTR("id");
const WIDTH_RE = ATTR("width");
const HEIGHT_RE = ATTR("height");

const ICON_SEL_RE =
  /<link\b[^>]*rel=["']?(?:apple-touch-icon(?:-precomposed)?|shortcut icon|icon|mask-icon|fluid-icon)["']?[^>]*>/gi;
const HREF_RE = /href=["']([^"']+)["']/i;
const SIZE_RE = /sizes=["']([^"']+)["']/i;
const RELVAL_RE = /rel=["']?([^"'\s>]+)["']?/i;
const OG_RE =
  /<meta\b[^>]*property=["']og:image(?::secure_url)?["'][^>]*content=["']([^"']+)["']/i;
const OG_RE2 =
  /<meta\b[^>]*content=["']([^"']+)["'][^>]*property=["']og:image(?::secure_url)?["']/i;

function absolutize(href: string, base: URL): string | null {
  try { return new URL(href, base).toString(); } catch { return null; }
}

function firstSrcsetUrl(v: string): string | null {
  const first = v.split(",")[0]?.trim().split(/\s+/)[0];
  return first || null;
}

function pickHeaderLogo(html: string, base: URL): string | null {
  // Prefer <img> inside <header>…</header> if present
  const headerMatch = html.match(/<header\b[\s\S]*?<\/header>/i);
  const scopes: Array<{ html: string; boost: number }> = [];
  if (headerMatch) scopes.push({ html: headerMatch[0], boost: 200 });
  scopes.push({ html, boost: 0 });

  const candidates: Array<{ url: string; score: number }> = [];
  for (const scope of scopes) {
    const tags = scope.html.match(IMG_TAG_RE) ?? [];
    for (const tag of tags) {
      let src =
        tag.match(SRC_RE)?.[1] ??
        tag.match(DATA_SRC_RE)?.[1] ??
        (tag.match(SRCSET_RE)?.[1] ? firstSrcsetUrl(tag.match(SRCSET_RE)![1]!) : null);
      if (!src) continue;
      if (/^data:/i.test(src)) continue;
      const abs = absolutize(src, base);
      if (!abs) continue;

      const alt = (tag.match(ALT_RE)?.[1] ?? "").toLowerCase();
      const cls = (tag.match(CLASS_RE)?.[1] ?? "").toLowerCase();
      const id = (tag.match(ID_RE)?.[1] ?? "").toLowerCase();
      const w = parseInt(tag.match(WIDTH_RE)?.[1] ?? "0", 10) || 0;
      const h = parseInt(tag.match(HEIGHT_RE)?.[1] ?? "0", 10) || 0;
      const lowerSrc = abs.toLowerCase();

      let score = scope.boost;
      const hay = `${alt} ${cls} ${id} ${lowerSrc}`;
      if (/\blogo\b/.test(hay)) score += 100;
      if (/brand|marke|wortmarke/.test(hay)) score += 40;
      if (/sprite|social|badge|banner|hero|teaser|icon-|iconset|avatar|user|arrow|search|menu|burger/.test(hay)) score -= 120;
      if (/\.svg(?:$|\?)/i.test(lowerSrc)) score += 60;
      else if (/\.(png|webp)(?:$|\?)/i.test(lowerSrc)) score += 25;
      else if (/\.(jpe?g|gif|ico)(?:$|\?)/i.test(lowerSrc)) score -= 10;
      if (w && w < 40) score -= 40;
      if (h && h < 20) score -= 40;
      if (w && w > 80 && w < 400) score += 20;

      candidates.push({ url: abs, score });
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  const top = candidates[0];
  return top && top.score > 0 ? top.url : null;
}

function pickBestIcon(html: string, base: URL): string | null {
  const candidates: Array<{ url: string; score: number }> = [];
  const matches = html.match(ICON_SEL_RE) ?? [];
  for (const tag of matches) {
    const hrefM = tag.match(HREF_RE);
    if (!hrefM || !hrefM[1]) continue;
    const abs = absolutize(hrefM[1], base);
    if (!abs) continue;
    const rel = (tag.match(RELVAL_RE)?.[1] ?? "").toLowerCase();
    const sizesRaw = tag.match(SIZE_RE)?.[1] ?? "";
    let sizeScore = 0;
    const sizeMatch = sizesRaw.match(/(\d+)x(\d+)/i);
    if (sizeMatch && sizeMatch[1]) sizeScore = parseInt(sizeMatch[1], 10);
    else if (/svg/i.test(abs)) sizeScore = 512;
    let relScore = 10;
    if (rel.includes("apple-touch-icon")) relScore = 100;
    else if (rel === "icon") relScore = 60;
    else if (rel === "mask-icon") relScore = 40;
    else if (rel === "shortcut") relScore = 30;
    candidates.push({ url: abs, score: relScore + sizeScore });
  }
  const og = html.match(OG_RE)?.[1] ?? html.match(OG_RE2)?.[1];
  if (og) {
    const abs = absolutize(og, base);
    if (abs) candidates.push({ url: abs, score: 55 });
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.url ?? null;
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; LovableLogoBot/1.0; +https://lovable.dev)",
        accept: "text/html,application/xhtml+xml",
        "accept-language": "de,en;q=0.8",
      },
    });
  } finally { clearTimeout(t); }
}

function pickJsonEmbeddedLogo(html: string, base: URL): string | null {
  // Atruvia / VR-BankingPortal renders the real header logo client-side but
  // ships the URL inside inline JSON blobs. Look at the well-known keys first.
  const keys = [
    "bankLogo",
    "urlFarbeAbsolute",
    "urlFarbe",
    "logoUrl",
    "headerLogo",
    "logoImage",
  ];
  for (const k of keys) {
    const re = new RegExp(`"${k}"\\s*:\\s*"([^"]+?\\.(?:svg|png|webp|jpe?g)(?:\\?[^"]*)?)"`, "i");
    const m = html.match(re);
    if (m && m[1]) {
      const abs = absolutize(m[1].replace(/\\\//g, "/"), base);
      if (abs) return abs;
    }
    // Atruvia scene7 URLs often have no file extension (e.g. .../Logo450x50-1)
    const reBare = new RegExp(`"${k}"\\s*:\\s*"(https?:[^"]+?/is/(?:image|content)/[^"]+?)"`, "i");
    const m2 = html.match(reBare);
    if (m2 && m2[1]) {
      const abs = absolutize(m2[1].replace(/\\\//g, "/"), base);
      if (abs) return abs;
    }
  }
  return null;
}

async function tryPageForHeaderLogo(url: string): Promise<{ logo: string | null; sourceUrl: string } | null> {
  try {
    const res = await fetchWithTimeout(url, 9000);
    if (!res.ok) return null;
    const html = (await res.text()).slice(0, 800_000);
    const finalBase = new URL(res.url || url);
    const embedded = pickJsonEmbeddedLogo(html, finalBase);
    if (embedded) return { logo: embedded, sourceUrl: res.url || url };
    const header = pickHeaderLogo(html, finalBase);
    if (header) return { logo: header, sourceUrl: res.url || url };
    return null;
  } catch { return null; }
}

async function tryMicrolinkLogo(url: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      url,
      meta: "true",
      "viewport.width": "1440",
      "viewport.height": "1000",
      waitUntil: "networkidle0",
      timeout: "25000",
      device: "macbook-pro-13",
    });
    const res = await fetch(`https://api.microlink.io/?${params.toString()}`, {
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { status?: string; data?: { logo?: { url?: string }; image?: { url?: string } } };
    if (j.status !== "success") return null;
    return j.data?.logo?.url || j.data?.image?.url || null;
  } catch { return null; }
}

async function findLogoForUrl(rawUrl: string): Promise<{ logo: string | null; sourceUrl: string }> {
  let target = rawUrl.trim();
  if (!/^https?:\/\//i.test(target)) target = `https://${target}`;
  const base = new URL(target);

  // 1) Portal / login page (as user requested, e.g. services_cloud/portal → services_auth/auth-frontend)
  const portal = await tryPageForHeaderLogo(target);
  if (portal) return portal;

  // 2) Bank homepage — most reliable source for the actual header logo
  const home = await tryPageForHeaderLogo(base.origin + "/");
  if (home) return home;

  // 3) JS-rendered fallback via Microlink (headless browser DOM analysis)
  const mlHome = await tryMicrolinkLogo(base.origin + "/");
  if (mlHome) return { logo: mlHome, sourceUrl: base.origin + "/" };
  const mlPortal = await tryMicrolinkLogo(target);
  if (mlPortal) return { logo: mlPortal, sourceUrl: target };

  // 4) Fallback: og:image / apple-touch-icon / favicon of the homepage
  try {
    const res = await fetchWithTimeout(base.origin + "/", 8000);
    if (res.ok) {
      const html = (await res.text()).slice(0, 300_000);
      const picked = pickBestIcon(html, new URL(res.url || base.origin));
      if (picked) return { logo: picked, sourceUrl: res.url || base.origin };
    }
  } catch { /* ignore */ }
  try {
    const fav = `${base.origin}/favicon.ico`;
    const r = await fetchWithTimeout(fav, 5000);
    if (r.ok) return { logo: fav, sourceUrl: fav };
  } catch { /* ignore */ }
  return { logo: null, sourceUrl: target };
}

export const crawlBankLogos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: Input) => {
    if (!data || !Array.isArray(data.banks)) throw new Error("banks required");
    if (data.banks.length > 25) throw new Error("max 25 banks per call");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: rpcErr } = await context.supabase.rpc("has_role", {
      _user_id: context.userId, _role: "admin",
    });
    if (rpcErr || !isAdmin) throw new Error("Forbidden");

    const results: ResultItem[] = [];
    await Promise.all(
      data.banks.map(async (b) => {
        try {
          const { logo, sourceUrl } = await findLogoForUrl(b.url);
          let storedUrl: string | null = null;
          let storedPath: string | null = null;
          if (logo) {
            const stored = await storeLogoInBucket(context.supabase, b.id, logo);
            if (stored) {
              storedUrl = stored.publicUrl;
              storedPath = stored.path;
            }
            const patch = {
              logo,
              ...(storedUrl ? { logo_url: storedUrl } : {}),
              ...(storedPath ? { logo_storage_path: storedPath } : {}),
            };
            const { error } = await context.supabase.from("banks").update(patch as any).eq("id", b.id);
            if (error) {
              await context.supabase.from("logo_crawl_log").upsert({
                bank_id: b.id, status: "db_error", logo: null, error: error.message,
                source_url: sourceUrl, checked_at: new Date().toISOString(),
              });
              results.push({ id: b.id, logo: null, error: error.message });
              return;
            }
          }
          await context.supabase.from("logo_crawl_log").upsert({
            bank_id: b.id,
            status: logo ? (storedUrl ? "ok" : "stored_failed") : "not_found",
            logo: storedUrl ?? logo,
            error: null,
            source_url: sourceUrl,
            checked_at: new Date().toISOString(),
          });
          results.push({ id: b.id, logo: storedUrl ?? logo });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          await context.supabase.from("logo_crawl_log").upsert({
            bank_id: b.id, status: "error", logo: null, error: msg,
            source_url: b.url, checked_at: new Date().toISOString(),
          });
          results.push({ id: b.id, logo: null, error: msg });
        }
      }),
    );

    if (data.runId) {
      const okCount = results.filter((r) => r.logo).length;
      const failCount = results.length - okCount;
      const { data: run } = await context.supabase
        .from("crawl_runs").select("processed, succeeded, failed").eq("id", data.runId).maybeSingle();
      if (run) {
        await context.supabase.from("crawl_runs").update({
          processed: (run.processed ?? 0) + results.length,
          succeeded: (run.succeeded ?? 0) + okCount,
          failed: (run.failed ?? 0) + failCount,
        }).eq("id", data.runId);
      }
    }

    return { results };
  });
