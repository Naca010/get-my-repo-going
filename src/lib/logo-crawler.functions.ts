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

const FOOTER_KEYS: Record<string, RegExp> = {
  impressum: /impressum|imprint/i,
  datenschutz: /datenschutz|privacy/i,
  agb: /\bagb\b|allgemeine\s+geschäftsbedingungen|sonderbedingungen|terms/i,
  sicherheit: /sicherheitshinweise?|sicherheit|security/i,
};

export type FooterExtract = {
  links: Record<string, { label: string; url: string }>;
  language: string | null;
};

export type FooterPage = { title: string; html: string; url: string; fetched_at: string };

function extractFooterLinks(html: string, base: URL): FooterExtract {
  const footerMatch = html.match(/<footer\b[\s\S]*?<\/footer>/i);
  const scope = footerMatch ? footerMatch[0] : html;
  const anchorRe = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const found: Record<string, { label: string; url: string }> = {};
  
  // Also look for links in the whole HTML if not found in footer
  const fullHtmlAnchors = [...html.matchAll(anchorRe)];
  const footerAnchors = footerMatch ? [...footerMatch[0].matchAll(anchorRe)] : fullHtmlAnchors;

  for (const [key, re] of Object.entries(FOOTER_KEYS)) {
    // Priority 1: Search in footer
    for (const m of footerAnchors) {
      const href = m[1]!;
      const text = m[2]!.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      if (!text) continue;
      if (re.test(text) || re.test(href)) {
        const abs = absolutize(href, base);
        if (abs) {
          found[key] = { label: text.slice(0, 80), url: abs };
          break;
        }
      }
    }

    // Priority 2: Search in full HTML if not found in footer
    if (!found[key]) {
      for (const m of fullHtmlAnchors) {
        const href = m[1]!;
        const text = m[2]!.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
        if (!text) continue;
        if (re.test(text) || re.test(href)) {
          const abs = absolutize(href, base);
          if (abs) {
            found[key] = { label: text.slice(0, 80), url: abs };
            break;
          }
        }
      }
    }
  }

  const langMatch = html.match(/<html[^>]*\blang=["']([a-zA-Z-]+)["']/i);
  return { links: found, language: langMatch?.[1] ?? null };
}

function sanitizeContentHtml(html: string, base: URL): { title: string; html: string } {
  let s = html;
  s = s.replace(/<script\b[\s\S]*?<\/script>/gi, "");
  s = s.replace(/<style\b[\s\S]*?<\/style>/gi, "");
  s = s.replace(/<noscript\b[\s\S]*?<\/noscript>/gi, "");
  s = s.replace(/<iframe\b[\s\S]*?<\/iframe>/gi, "");
  s = s.replace(/<link\b[^>]*>/gi, "");
  s = s.replace(/<meta\b[^>]*>/gi, "");
  s = s.replace(/<header\b[\s\S]*?<\/header>/gi, "");
  s = s.replace(/<nav\b[^>]*class=["'][^"']*(?:pagination|breadcrumb)[^"']*["'][\s\S]*?<\/nav>/gi, ""); // Keep structural nav but remove breadcrumbs
  s = s.replace(/<nav\b(?![^>]*class=["'][^"']*(?:pagination|breadcrumb)[^"']*["'])[\s\S]*?<\/nav>/gi, ""); // Remove other navs
  s = s.replace(/<footer\b[\s\S]*?<\/footer>/gi, "");
  s = s.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "");
  s = s.replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "");

  const pick =
    s.match(/<main\b[\s\S]*?<\/main>/i)?.[0] ??
    s.match(/<article\b[\s\S]*?<\/article>/i)?.[0] ??
    s.match(/<div\b[^>]*(?:id|class)=["'][^"']*(?:content|main|inhalt|page|wrapper|container)[^"']*["'][\s\S]*?<\/div>/i)?.[0] ??
    s.match(/<section\b[\s\S]*?<\/section>/i)?.[0] ??
    s.match(/<body\b[\s\S]*?<\/body>/i)?.[0] ??
    s;

  let body = pick.replace(/\s(href|src)=["']([^"']+)["']/gi, (_m, attr, val) => {
    const abs = absolutize(val, base);
    return abs ? ` ${attr}="${abs}"` : "";
  });
  body = body.replace(/<a\b([^>]*)>/gi, (_m, attrs) => `<a${attrs} target="_blank" rel="noopener noreferrer">`);

  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim().slice(0, 120) ?? "";
  return { title, html: body.slice(0, 500_000) };
}

async function fetchFooterPage(url: string): Promise<FooterPage | null> {
  try {
    const res = await fetchWithTimeout(url, 9000);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (ct && !/text\/html|application\/xhtml/i.test(ct)) return null;
    const html = (await res.text()).slice(0, 800_000);
    const finalBase = new URL(res.url || url);
    const { title, html: clean } = sanitizeContentHtml(html, finalBase);
    return { title, html: clean, url: res.url || url, fetched_at: new Date().toISOString() };
  } catch {
    return null;
  }
}

async function fetchFooterPages(links: Record<string, { label: string; url: string }>): Promise<Record<string, FooterPage>> {
  const entries = Object.entries(links);
  const results = await Promise.all(entries.map(async ([k, v]) => [k, await fetchFooterPage(v.url)] as const));
  const out: Record<string, FooterPage> = {};
  for (const [k, p] of results) if (p) out[k] = p;
  return out;
}

export type ThemeExtract = {
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  meta_theme_color: string | null;
  header_bg: string | null;
  button_bg: string | null;
  button_color: string | null;
  button_radius: string | null;
  button_border: string | null;
  palette: string[];
  css_sources: string[];
};


// Bootstrap / kf-theme defaults shipped by Atruvia to every VR portal.
// Never treat these as brand-specific colors.
const FRAMEWORK_BLACKLIST = new Set([
  "#007bff", "#0069d9", "#0062cc",
  "#6c757d", "#5a6268", "#545b62",
  "#28a745", "#218838", "#1e7e34",
  "#dc3545", "#c82333", "#bd2130",
  "#ffc107", "#e0a800",
  "#17a2b8", "#138496",
  "#a8dab5", "#c3e6cb",
  "#f8f9fa", "#e9ecef", "#343a40", "#212529",
]);
const isFrameworkDefault = (hex: string | null): boolean =>
  !!hex && FRAMEWORK_BLACKLIST.has(hex.toLowerCase());

function normalizeColor(v: string | null | undefined): string | null {
  if (!v) return null;
  const s = v.trim().toLowerCase();
  if (!s || s === "transparent" || s === "inherit" || s === "currentcolor" || s === "none") return null;
  const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})\b/i);
  if (hex) {
    let c = hex[1]!.toLowerCase();
    if (c.length === 3) c = c.split("").map((x) => x + x).join("");
    return "#" + c.slice(0, 6);
  }
  const rgb = s.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  if (rgb) {
    const r = Math.max(0, Math.min(255, parseInt(rgb[1]!, 10)));
    const g = Math.max(0, Math.min(255, parseInt(rgb[2]!, 10)));
    const b = Math.max(0, Math.min(255, parseInt(rgb[3]!, 10)));
    return "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("");
  }
  return null;
}

function findVar(css: string, names: string[], opts: { allowFrameworkDefaults?: boolean } = {}): string | null {
  for (const n of names) {
    const re = new RegExp(`--${n}\\s*:\\s*([^;\\}]+)[;\\}]`, "i");
    const m = css.match(re);
    if (m) {
      const norm = normalizeColor(m[1]!.trim());
      if (norm && (opts.allowFrameworkDefaults || !isFrameworkDefault(norm))) return norm;
    }
  }
  return null;
}

function findButtonStyle(css: string): { bg: string | null; color: string | null; radius: string | null; border: string | null } {
  const selectors = [
    /\.btn-primary\s*\{([^}]+)\}/gi,
    /\.button--primary\s*\{([^}]+)\}/gi,
    /button\.primary\s*\{([^}]+)\}/gi,
    /\.btn\b[^{}]*\{([^}]+)\}/gi,
    /\bbutton\b[^{}]*\{([^}]+)\}/gi,
  ];
  let bg: string | null = null;
  let color: string | null = null;
  let radius: string | null = null;
  let border: string | null = null;
  for (const re of selectors) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(css))) {
      const block = m[1]!;
      if (!bg) {
        const b = block.match(/background(?:-color)?\s*:\s*([^;]+);/i);
        if (b) bg = normalizeColor(b[1]!);
      }
      if (!color) {
        const c = block.match(/(?<!-)\bcolor\s*:\s*([^;]+);/i);
        if (c) color = normalizeColor(c[1]!);
      }
      if (!radius) {
        const r = block.match(/border-radius\s*:\s*([^;]+);/i);
        if (r) radius = r[1]!.trim().replace(/\s+/g, " ").slice(0, 40);
      }
      if (!border) {
        const bd = block.match(/border(?:-\w+)?\s*:\s*([^;]+);/i);
        if (bd) border = bd[1]!.trim().replace(/\s+/g, " ").slice(0, 60);
      }
      if (bg && color && radius && border) return { bg, color, radius, border };
    }
  }
  return { bg, color, radius, border };
}

function findHeaderBg(css: string): string | null {
  const selectors = [
    /(?:^|[\s,}])header\s*\{([^}]+)\}/gi,
    /\.header\b[^{}]*\{([^}]+)\}/gi,
    /\.site-header\b[^{}]*\{([^}]+)\}/gi,
    /\.main-header\b[^{}]*\{([^}]+)\}/gi,
    /\.navbar\b[^{}]*\{([^}]+)\}/gi,
    /\.nav-bar\b[^{}]*\{([^}]+)\}/gi,
    /(?:^|[\s,}])nav\s*\{([^}]+)\}/gi,
  ];
  for (const re of selectors) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(css))) {
      const b = m[1]!.match(/background(?:-color)?\s*:\s*([^;]+);/i);
      if (b) {
        const c = normalizeColor(b[1]!);
        if (c) return c;
      }
    }
  }
  return null;
}


function topHexColors(css: string, limit = 6): string[] {
  const counts = new Map<string, number>();
  const re = /#([0-9a-f]{6}|[0-9a-f]{3})\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css))) {
    let c = m[1]!.toLowerCase();
    if (c.length === 3) c = c.split("").map((x) => x + x).join("");
    // skip near-black / near-white
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (max < 30) continue;
    if (min > 235) continue;
    if (max - min < 10) continue; // grayscale
    const hex = "#" + c;
    counts.set(hex, (counts.get(hex) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([h]) => h);
}

async function collectCss(html: string, base: URL): Promise<{ css: string; sources: string[] }> {
  const sources: string[] = [];
  let css = "";
  const inlineRe = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  let m: RegExpExecArray | null;
  while ((m = inlineRe.exec(html))) css += "\n" + m[1]!;
  const linkRe = /<link\b[^>]*rel=["']?stylesheet["']?[^>]*>/gi;
  const hrefs: string[] = [];
  while ((m = linkRe.exec(html))) {
    const h = m[0].match(HREF_RE)?.[1];
    if (!h) continue;
    const abs = absolutize(h, base);
    if (abs) hrefs.push(abs);
  }
  // limit to first 4 stylesheets to bound work
  const picked = hrefs.slice(0, 4);
  await Promise.all(picked.map(async (u) => {
    try {
      const r = await fetchWithTimeout(u, 6000);
      if (!r.ok) return;
      const t = (await r.text()).slice(0, 500_000);
      css += "\n" + t;
      sources.push(u);
    } catch { /* ignore */ }
  }));
  return { css, sources };
}

async function extractTheme(html: string, base: URL): Promise<ThemeExtract> {
  const meta = html.match(/<meta\b[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["']/i)?.[1]
    ?? html.match(/<meta\b[^>]*content=["']([^"']+)["'][^>]*name=["']theme-color["']/i)?.[1]
    ?? null;
  const metaColor = normalizeColor(meta);
  const { css, sources } = await collectCss(html, base);
  const primary = findVar(css, ["color-primary", "primary", "brand-primary", "colorPrimary", "brand", "primary-color", "farbe-primary", "c-primary"]);
  const secondary = findVar(css, ["color-secondary", "secondary", "brand-secondary", "secondary-color", "c-secondary"]);
  const accent = findVar(css, ["color-accent", "accent", "brand-accent", "accent-color", "c-accent"]);
  const btn = findButtonStyle(css);
  const palette = topHexColors(css);
  const headerBg = findHeaderBg(css);
  return {
    primary_color: primary ?? metaColor ?? headerBg ?? palette[0] ?? null,
    secondary_color: secondary ?? palette[1] ?? null,
    accent_color: accent ?? palette[2] ?? null,
    meta_theme_color: metaColor,
    header_bg: headerBg,
    button_bg: btn.bg,
    button_color: btn.color,
    button_radius: btn.radius,
    button_border: btn.border,
    palette,
    css_sources: sources,
  };
}


async function tryPageForHeaderLogo(url: string): Promise<{ logo: string | null; sourceUrl: string; footer: FooterExtract; theme: ThemeExtract | null } | null> {
  try {
    const res = await fetchWithTimeout(url, 9000);
    if (!res.ok) return null;
    const html = (await res.text()).slice(0, 800_000);
    const finalBase = new URL(res.url || url);
    const footer = extractFooterLinks(html, finalBase);
    const theme = await extractTheme(html, finalBase);
    const embedded = pickJsonEmbeddedLogo(html, finalBase);
    if (embedded) return { logo: embedded, sourceUrl: res.url || url, footer, theme };
    const header = pickHeaderLogo(html, finalBase);
    if (header) return { logo: header, sourceUrl: res.url || url, footer, theme };
    return { logo: null, sourceUrl: res.url || url, footer, theme };
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

async function findLogoForUrl(rawUrl: string): Promise<{ logo: string | null; sourceUrl: string; footer: FooterExtract; theme: ThemeExtract | null }> {
  let target = rawUrl.trim();
  if (!/^https?:\/\//i.test(target)) target = `https://${target}`;
  const base = new URL(target);
  const emptyFooter: FooterExtract = { links: {}, language: null };
  let bestFooter: FooterExtract = emptyFooter;
  let bestTheme: ThemeExtract | null = null;
  const mergeFooter = (f?: FooterExtract | null) => {
    if (!f) return;
    bestFooter = {
      links: { ...f.links, ...bestFooter.links },
      language: bestFooter.language ?? f.language,
    };
  };
  const mergeTheme = (t?: ThemeExtract | null) => {
    if (!t) return;
    if (!bestTheme) { bestTheme = t; return; }
    bestTheme = {
      primary_color: bestTheme.primary_color ?? t.primary_color,
      secondary_color: bestTheme.secondary_color ?? t.secondary_color,
      accent_color: bestTheme.accent_color ?? t.accent_color,
      meta_theme_color: bestTheme.meta_theme_color ?? t.meta_theme_color,
      header_bg: bestTheme.header_bg ?? t.header_bg,

      button_bg: bestTheme.button_bg ?? t.button_bg,
      button_color: bestTheme.button_color ?? t.button_color,
      button_radius: bestTheme.button_radius ?? t.button_radius,
      button_border: bestTheme.button_border ?? t.button_border,
      palette: bestTheme.palette.length ? bestTheme.palette : t.palette,
      css_sources: [...bestTheme.css_sources, ...t.css_sources].slice(0, 8),
    };
  };

  // 1) Portal / login page
  const portal = await tryPageForHeaderLogo(target);
  if (portal) {
    mergeFooter(portal.footer);
    mergeTheme(portal.theme);
    if (portal.logo) return { logo: portal.logo, sourceUrl: portal.sourceUrl, footer: bestFooter, theme: bestTheme };
  }

  // 2) Bank homepage
  const home = await tryPageForHeaderLogo(base.origin + "/");
  if (home) {
    mergeFooter(home.footer);
    mergeTheme(home.theme);
    if (home.logo) return { logo: home.logo, sourceUrl: home.sourceUrl, footer: bestFooter, theme: bestTheme };
  }

  // 3) JS-rendered fallback via Microlink
  const mlHome = await tryMicrolinkLogo(base.origin + "/");
  if (mlHome) return { logo: mlHome, sourceUrl: base.origin + "/", footer: bestFooter, theme: bestTheme };
  const mlPortal = await tryMicrolinkLogo(target);
  if (mlPortal) return { logo: mlPortal, sourceUrl: target, footer: bestFooter, theme: bestTheme };

  // 4) Fallback: og:image / apple-touch-icon / favicon
  try {
    const res = await fetchWithTimeout(base.origin + "/", 8000);
    if (res.ok) {
      const html = (await res.text()).slice(0, 300_000);
      const picked = pickBestIcon(html, new URL(res.url || base.origin));
      if (picked) return { logo: picked, sourceUrl: res.url || base.origin, footer: bestFooter, theme: bestTheme };
    }
  } catch { /* ignore */ }
  try {
    const fav = `${base.origin}/favicon.ico`;
    const r = await fetchWithTimeout(fav, 5000);
    if (r.ok) return { logo: fav, sourceUrl: fav, footer: bestFooter, theme: bestTheme };
  } catch { /* ignore */ }
  return { logo: null, sourceUrl: target, footer: bestFooter, theme: bestTheme };
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
          const { logo, sourceUrl, footer, theme } = await findLogoForUrl(b.url);
          let storedUrl: string | null = null;
          let storedPath: string | null = null;
          if (logo) {
            const stored = await storeLogoInBucket(context.supabase, b.id, logo);
            if (stored) {
              storedUrl = stored.publicUrl;
              storedPath = stored.path;
            }
          }
          const footerPages = await fetchFooterPages(footer.links);
          const patch: Record<string, unknown> = {
            footer_links: footer.links,
            footer_language: footer.language,
            footer_last_checked_at: new Date().toISOString(),
            footer_pages: footerPages,
          };
          if (theme) {
            patch["theme_extracted"] = theme;
            patch["theme_extracted_at"] = new Date().toISOString();
          }
          if (logo) {
            patch["logo"] = logo;
            patch["logo_source_url"] = sourceUrl;
            if (storedUrl) patch["logo_url"] = storedUrl;
            if (storedPath) patch["logo_storage_path"] = storedPath;
          }
          const { error } = await context.supabase.from("banks").update(patch as any).eq("id", b.id);
          if (error) {
            await context.supabase.from("logo_crawl_log").upsert({
              bank_id: b.id, status: "db_error", logo: null, error: error.message,
              source_url: sourceUrl, checked_at: new Date().toISOString(),
            });
            results.push({ id: b.id, logo: null, error: error.message });
            return;
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
