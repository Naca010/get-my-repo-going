export type Input = {
  banks: Array<{ id: string; url: string }>;
  runId?: string;
  scopes?: Array<"logo" | "footer" | "theme" | "pages">;
};
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

export type FooterPartner = { name: string; logo_url: string; link_url: string | null };
export type FooterSocial = { network: string; url: string; label: string };
export type FooterCta = { label: string; url: string };
export type FooterColumn = { heading: string; links: Array<{ label: string; url: string }> };

export type FooterExtract = {
  links: Record<string, { label: string; url: string }>;
  language: string | null;
  partners: FooterPartner[];
  socials: FooterSocial[];
  ctas: FooterCta[];
  columns: FooterColumn[];
  disclaimer: string | null;
};

export type FooterPage = { title: string; html: string; url: string; fetched_at: string };

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
}

// Extracts the label of the primary "user / alias / netkey" field on a login form.
// Order: <label for="id">, aria-label, placeholder, preceding <label> text.
function extractLoginFieldLabel(html: string): string | null {
  // Look for any text inside a <label> or equivalent that might identify the main login field.
  // We search for elements with IDs or names that suggest the primary user identification.
  const IDENTIFIERS = /(alias|anmeld|user|nutzer|kennung|netkey|bhm-netkey|psd-key|vr-netkey|sparda-netkey|kontonummer|kunden|person)/i;
  const BAD = /(pin|passw|kennwort|password|search|suche|captcha|token|otp|tan|abbrechen|anmelden)/i;

  const INPUT_RE = /<input\b([^>]*?)>/gi;
  const matches = [...html.matchAll(INPUT_RE)];
  
  let bestLabel: string | null = null;
  let highestScore = -1;

  for (const m of matches) {
    const attrs = m[1]!;
    const type = attrs.match(/type=["']?([^"'\s>]+)/i)?.[1]?.toLowerCase() ?? "text";
    if (["hidden", "submit", "button", "checkbox", "radio", "password"].includes(type)) continue;

    const id = attrs.match(/id=["']([^"']+)["']/i)?.[1];
    const name = attrs.match(/name=["']([^"']+)["']/i)?.[1];
    const placeholder = attrs.match(/placeholder=["']([^"']+)["']/i)?.[1];
    const aria = attrs.match(/aria-label=["']([^"']+)["']/i)?.[1];
    
    const combined = `${id} ${name} ${placeholder} ${aria}`.toLowerCase();
    if (BAD.test(combined)) continue;

    let score = 0;
    if (IDENTIFIERS.test(combined)) score += 10;
    if (attrs.includes('autocomplete="username"')) score += 20;

    let currentLabel: string | null = null;
    if (id) {
      const labelRe = new RegExp(`<label\\b[^>]*\\bfor=["']${id.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}["'][^>]*>([\\s\\S]*?)<\\/label>`, "i");
      const labelMatch = html.match(labelRe);
      if (labelMatch) currentLabel = stripTags(labelMatch[1]!);
    }
    
    if (!currentLabel) currentLabel = aria || placeholder || null;
    
    if (currentLabel) {
      const clean = currentLabel.replace(/[:*]\s*$/g, "").replace(/\s*\(?erforderlich\)?\s*$/i, "").trim();
      if (clean && clean.length > 1 && clean.length < 60) {
        if (score > highestScore) {
          highestScore = score;
          bestLabel = clean;
        }
      }
    }
  }

  // Also check if there's a standalone label before the first text input
  if (!bestLabel) {
    const textInputIdx = html.search(/<input\b[^>]*type=["']?(?:text|email|number)["']?/i);
    if (textInputIdx !== -1) {
      const preHtml = html.slice(Math.max(0, textInputIdx - 300), textInputIdx);
      const labelMatch = preHtml.match(/<label\b[^>]*>([\s\S]*?)<\/label>/gi);
      if (labelMatch) {
        const lastLabel = stripTags(labelMatch.at(-1)!);
        if (lastLabel && !BAD.test(lastLabel) && lastLabel.length < 60) {
          bestLabel = lastLabel.replace(/[:*]\s*$/g, "").trim();
        }
      }
    }
  }

  return bestLabel;
}

const SOCIAL_HOSTS: Array<{ re: RegExp; name: string }> = [
  { re: /facebook\.com|fb\.me/i, name: "facebook" },
  { re: /instagram\.com/i, name: "instagram" },
  { re: /(?:^|\.)x\.com|twitter\.com/i, name: "twitter" },
  { re: /youtube\.com|youtu\.be/i, name: "youtube" },
  { re: /linkedin\.com/i, name: "linkedin" },
  { re: /xing\.com/i, name: "xing" },
  { re: /tiktok\.com/i, name: "tiktok" },
  { re: /threads\.net/i, name: "threads" },
  { re: /whatsapp\.com|wa\.me/i, name: "whatsapp" },
  { re: /t\.me|telegram\.org/i, name: "telegram" },
  { re: /bluesky|bsky\.app/i, name: "bluesky" },
  { re: /mastodon|mstdn/i, name: "mastodon" },
];

function detectSocial(href: string): string | null {
  for (const s of SOCIAL_HOSTS) if (s.re.test(href)) return s.name;
  return null;
}

function extractFooterLinks(html: string, base: URL): FooterExtract {
  const footerMatch = html.match(/<footer\b[\s\S]*?<\/footer>/i);
  const scope = footerMatch ? footerMatch[0] : html;
  const anchorRe = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const found: Record<string, { label: string; url: string }> = {};

  const fullHtmlAnchors = [...html.matchAll(anchorRe)];
  const footerAnchors = footerMatch ? [...footerMatch[0].matchAll(anchorRe)] : fullHtmlAnchors;

  for (const [key, re] of Object.entries(FOOTER_KEYS)) {
    for (const m of footerAnchors) {
      const href = m[1]!;
      const text = m[2]!.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      if (!text) continue;
      if (re.test(text) || re.test(href)) {
        const abs = absolutize(href, base);
        if (abs) { found[key] = { label: text.slice(0, 80), url: abs }; break; }
      }
    }
    if (!found[key]) {
      for (const m of fullHtmlAnchors) {
        const href = m[1]!;
        const text = m[2]!.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
        if (!text) continue;
        if (re.test(text) || re.test(href)) {
          const abs = absolutize(href, base);
          if (abs) { found[key] = { label: text.slice(0, 80), url: abs }; break; }
        }
      }
    }
  }

  // Socials disabled per user request
  const socials: FooterSocial[] = [];

  // Partner logos: <img> inside footer wrapped in <a>
  const partners: FooterPartner[] = [];
  const seenPartner = new Set<string>();
  
  // Broaden partner search: <img> tags in footer that might be logos, even if not wrapped in <a>
  const partnerImgRe = /<img\b([^>]+)>/gi;
  let pm: RegExpExecArray | null;
  while ((pm = partnerImgRe.exec(scope))) {
    const imgAttrs = pm[1]!;
    
    // Look for indicators that this is a partner logo or brand asset
    const isPartner = imgAttrs.match(/alt=["'][^"']*(?:partner|verband|bvr|finanzgruppe|sicherungseinrichtung|zertifikat|logo)[^"']*["']/i)
      || imgAttrs.match(/src=["'][^"']*(?:logo|brand|partner|badge|cert)[^"']*["']/i);
      
    if (!isPartner) continue;
    
    const srcRaw = imgAttrs.match(SRC_RE)?.[1] ?? imgAttrs.match(DATA_SRC_RE)?.[1] ?? null;
    if (!srcRaw || /^data:/i.test(srcRaw)) continue;
    
    const logo = absolutize(srcRaw, base);
    if (!logo || seenPartner.has(logo)) continue;
    
    // Find if it's wrapped in an <a> tag by checking the surrounding context in scope
    const startIdx = pm.index;
    const preContext = scope.slice(Math.max(0, startIdx - 150), startIdx);
    const linkMatch = preContext.match(/<a\b[^>]*href=["']([^"']+)["'][^>]*>(?![^<]*<\/a>)/i);
    const linkUrl = linkMatch ? absolutize(linkMatch[1]!, base) : null;
    
    const name = (imgAttrs.match(ALT_RE)?.[1] ?? "").trim().slice(0, 80)
      || (imgAttrs.match(/title=["']([^"']+)["']/i)?.[1] ?? "").trim().slice(0, 80)
      || "Partner Logo";
      
    seenPartner.add(logo);
    partners.push({ name, logo_url: logo, link_url: linkUrl });
    if (partners.length >= 15) break;
  }

  // CTAs
  const ctas: FooterCta[] = [];
  const ctaRe = /(?:kontakt\s+aufnehmen|jetzt\s+kunde\s+werden|beratung\s+vereinbaren|termin\s+vereinbaren|feedback\s+geben|mitglied\s+werden|konto\s+eröffnen)/i;
  for (const m of footerAnchors) {
    const href = m[1]!;
    const text = m[2]!.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (!text || !ctaRe.test(text)) continue;
    const abs = absolutize(href, base);
    if (!abs) continue;
    ctas.push({ label: text.slice(0, 60), url: abs });
    if (ctas.length >= 4) break;
  }

  // Columns
  const columns: FooterColumn[] = [];
  if (footerMatch) {
    const colRe = /<(h[2-5])\b[^>]*>([\s\S]*?)<\/\1>([\s\S]*?)(?=<h[2-5]\b|<\/footer>)/gi;
    let cm: RegExpExecArray | null;
    while ((cm = colRe.exec(footerMatch[0]))) {
      const heading = cm[2]!.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      if (!heading || heading.length > 60) continue;
      if (/impressum|datenschutz|agb|sicherheit/i.test(heading)) continue;
      const links: Array<{ label: string; url: string }> = [];
      const seg = cm[3]!;
      const linkRe = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      let lm: RegExpExecArray | null;
      while ((lm = linkRe.exec(seg))) {
        const href = lm[1]!;
        const text = lm[2]!.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
        if (!text || text.length > 80) continue;
        if (detectSocial(href)) continue;
        const abs = absolutize(href, base);
        if (!abs) continue;
        links.push({ label: text, url: abs });
        if (links.length >= 8) break;
      }
      if (links.length >= 2) columns.push({ heading, links });
      if (columns.length >= 4) break;
    }
  }

  // Disclaimer
  let disclaimer: string | null = null;
  if (footerMatch) {
    const paragraphs = [...footerMatch[0].matchAll(/<(?:p|span|div)\b[^>]*>([\s\S]*?)<\/(?:p|span|div)>/gi)]
      .map((m) => m[1]!.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim())
      .filter((t) => t.length > 20 && t.length < 800 && (t.includes('©') || t.includes('Copyright') || t.includes('Sicherungseinrichtung') || t.includes('Pflichtangaben')));
    
    disclaimer = paragraphs.find(p => p.includes('©') || p.includes('Copyright')) || paragraphs[0] || null;
    
    if (!disclaimer) {
      const copy = footerMatch[0].match(/(?:©|Copyright)[^<]{5,250}/i);
      if (copy) disclaimer = copy[0].replace(/\s+/g, " ").trim();
    }
  }

  const langMatch = html.match(/<html[^>]*\blang=["']([a-zA-Z-]+)["']/i);
  return {
    links: found,
    language: langMatch?.[1] ?? null,
    partners,
    socials,
    ctas,
    columns,
    disclaimer,
  };
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

  // Absolutize all URLs including images
  let body = pick.replace(/\s(href|src|srcset|data-src)=["']([^"']+)["']/gi, (_m, attr, val) => {
    if (attr.toLowerCase() === "srcset") {
      const parts = val.split(",").map((p: string) => {
        const [url, size] = p.trim().split(/\s+/);
        if (!url) return p;
        const abs = absolutize(url, base);
        return abs ? `${abs}${size ? ` ${size}` : ""}` : p;
      });
      return ` ${attr}="${parts.join(", ")}"`;
    }
    const abs = absolutize(val, base);
    return abs ? ` ${attr}="${abs}"` : ` ${attr}="${val}"`;
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
  footer_bg: string | null;
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
  "#ffc107", "#e0a800", "#ffcc00", "#fecb00", // Yellow tones common in portal defaults
  "#17a2b8", "#138496",
  "#a8dab5", "#c3e6cb",
  "#f8f9fa", "#e9ecef", "#343a40", "#212529",
  "#003399", "#002d87", "#002266", // Atruvia / VR standard blues
  "#3333ff", "#2222ff", "#0000ff", // Common generic portal blues
]);
const isFrameworkDefault = (hex: string | null): boolean =>
  !!hex && FRAMEWORK_BLACKLIST.has(hex.toLowerCase());

function normalizeColor(v: string | null | undefined): string | null {
  if (!v) return null;
  const s = v.trim().toLowerCase();
  if (!s || s === "transparent" || s === "inherit" || s === "currentcolor" || s === "none") return null;
  // Match #hex, #hex-with-alpha, rgb(), or rgba()
  const hex = s.match(/^#([0-9a-f]{3,8})\b/i);
  if (hex) {
    let c = hex[1]!.toLowerCase();
    if (c.length === 3) c = c.split("").map((x) => x + x).join("");
    // If it's a 4th or 8th char alpha hex, check opacity
    if (c.length === 8) {
      const alpha = parseInt(c.slice(6, 8), 16) / 255;
      if (alpha < 0.1) return null; // Too transparent
      return "#" + c.slice(0, 6);
    }
    return "#" + c.slice(0, 6);
  }
  const rgb = s.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s]+([\d.]+))?\s*\)/i);
  if (rgb) {
    const r = Math.max(0, Math.min(255, parseInt(rgb[1]!, 10)));
    const g = Math.max(0, Math.min(255, parseInt(rgb[2]!, 10)));
    const b = Math.max(0, Math.min(255, parseInt(rgb[3]!, 10)));
    const alpha = rgb[4] ? parseFloat(rgb[4]) : 1;
    if (alpha < 0.1) return null; // Too transparent
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

function cssVariableMap(css: string): Map<string, string> {
  const variables = new Map<string, string>();
  const re = /(--[\w-]+)\s*:\s*([^;\}]+)[;\}]/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(css))) {
    const name = match[1];
    const value = match[2];
    if (name && value) variables.set(name.toLowerCase(), value.trim());
  }
  return variables;
}

function resolveCssValue(raw: string | null | undefined, variables: Map<string, string>, depth = 0): string | null {
  if (!raw || depth > 8) return null;
  const value = raw.trim();
  const variable = value.match(/^var\(\s*(--[\w-]+)(?:\s*,\s*([^\)]+))?\s*\)$/i);
  if (!variable) return value;
  const resolved = variables.get(variable[1]!.toLowerCase()) ?? variable[2] ?? null;
  return resolveCssValue(resolved, variables, depth + 1);
}

function resolvedVariable(variables: Map<string, string>, names: string[]): string | null {
  for (const name of names) {
    const key = name.startsWith("--") ? name.toLowerCase() : `--${name.toLowerCase()}`;
    const resolved = resolveCssValue(variables.get(key), variables);
    if (resolved) return resolved;
  }
  return null;
}

function classifyButtonRadius(raw: string | null | undefined): "rounded-full" | "rounded-none" | null {
  if (!raw || raw.includes("var(")) return null;
  const values = [...raw.matchAll(/(-?\d+(?:\.\d+)?)\s*(px|rem|em|%)?/gi)];
  if (!values.length) return null;
  const rounded = values.some((match) => {
    const value = Number.parseFloat(match[1] ?? "0");
    const unit = (match[2] ?? "px").toLowerCase();
    if (unit === "%") return value >= 20;
    const pixels = unit === "px" ? value : value * 16;
    return pixels >= 10;
  });
  return rounded ? "rounded-full" : "rounded-none";
}

function escapeCssIdentifier(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findButtonStyle(css: string, html: string): { bg: string | null; color: string | null; radius: string | null; border: string | null } {
  // Prefer primary/submit/CTA selectors first so we capture the login button
  // shape (BBBank, GLS, PSD use rectangular primary buttons) instead of some
  // generic pill-shaped ghost button elsewhere on the page.
  const exactSelectors: RegExp[] = [];
  const submitRe = /<(?:button|input)\b[^>]*type=["']?submit["']?[^>]*>/gi;
  let submitMatch: RegExpExecArray | null;
  while ((submitMatch = submitRe.exec(html))) {
    const tag = submitMatch[0];
    const id = tag.match(/\bid=["']([^"']+)["']/i)?.[1];
    const classes = tag.match(/\bclass=["']([^"']+)["']/i)?.[1]?.split(/\s+/).filter(Boolean) ?? [];
    if (id) exactSelectors.push(new RegExp(`#${escapeCssIdentifier(id)}\\b[^{}]*\\{([^}]+)\\}`, "gi"));
    for (const className of classes) {
      exactSelectors.push(new RegExp(`\\.${escapeCssIdentifier(className)}\\b[^{}]*\\{([^}]+)\\}`, "gi"));
    }
  }

  const selectors = [
    ...exactSelectors,
    // Higher specificity for login buttons - specifically for banking UIs
    /\.login-button\b[^{}]*\{([^}]+)\}/gi,
    /\.btn-login\b[^{}]*\{([^}]+)\}/gi,
    /button\[type=["']?submit["']?\][^{}]*\{([^}]+)\}/gi,
    /input\[type=["']?submit["']?\][^{}]*\{([^}]+)\}/gi,
    /button\.primary\b[^{}]*\{([^}]+)\}/gi,
    /\.btn-primary\b[^{}]*\{([^}]+)\}/gi,
    /\.button--primary\b[^{}]*\{([^}]+)\}/gi,
    /\.button-primary\b[^{}]*\{([^}]+)\}/gi,
    /\.primary-button\b[^{}]*\{([^}]+)\}/gi,
    /\.kf-button--primary\b[^{}]*\{([^}]+)\}/gi,
    /\.brain-button--primary\b[^{}]*\{([^}]+)\}/gi,
    /\.button--action\b[^{}]*\{([^}]+)\}/gi,
    /\.cta-primary\b[^{}]*\{([^}]+)\}/gi,
    /\.btn-cta\b[^{}]*\{([^}]+)\}/gi,
    /\.cta\b[^{}]*\{([^}]+)\}/gi,
    /\.btn\b[^{}]*\{([^}]+)\}/gi,
    /\.button\b[^{}]*\{([^}]+)\}/gi,
    /\bbutton\b[^{}]*\{([^}]+)\}/gi,
  ];
  for (const re of selectors) {
    let bg: string | null = null;
    let color: string | null = null;
    let radius: string | null = null;
    let border: string | null = null;
    let m: RegExpExecArray | null;
    while ((m = re.exec(css))) {
      const block = m[1]!;
      
      // Look for background-color, but also handle shorthand background and CSS variables
      const bgMatches = [...block.matchAll(/background(?:-color)?\s*:\s*([^;!]+)(?:\s*!important)?\s*;/gi)];
      const bgMatch = bgMatches.at(-1);
      if (bgMatch) {
          const rawBg = bgMatch[1]!.trim();
          // Keep variable references intact; extractTheme resolves them against
          // the complete variable map after the effective button rule is found.
          bg = rawBg.startsWith("var(") ? rawBg : normalizeColor(rawBg);
      }
      
      const colorMatches = [...block.matchAll(/(?<!-)\bcolor\s*:\s*([^;!]+)(?:\s*!important)?\s*;/gi)];
      const colorMatch = colorMatches.at(-1);
      if (colorMatch) {
          const rawColor = colorMatch[1]!.trim();
          color = rawColor.startsWith("var(") ? rawColor : normalizeColor(rawColor);
      }
      
      const radiusMatches = [...block.matchAll(/border-radius\s*:\s*([^;!]+)(?:\s*!important)?\s*;/gi)];
      const radiusMatch = radiusMatches.at(-1);
      if (radiusMatch) {
          radius = radiusMatch[1]!.trim().replace(/\s+/g, " ").slice(0, 40);
      }
      
      const borderMatches = [...block.matchAll(/border(?:-\w+)?\s*:\s*([^;!]+)(?:\s*!important)?\s*;/gi)];
      const borderMatch = borderMatches.at(-1);
      if (borderMatch) {
          border = borderMatch[1]!.trim().replace(/\s+/g, " ").slice(0, 60);
      }
    }
    // Selector order expresses confidence. Within one selector, the final CSS
    // declaration wins, matching the browser cascade for equal specificity.
    if (bg || radius) return { bg, color, radius, border };
  }
  return { bg: null, color: null, radius: null, border: null };
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
    /\.vr-header\b[^{}]*\{([^}]+)\}/gi,
    /\.header-container\b[^{}]*\{([^}]+)\}/gi,
  ];
  for (const re of selectors) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(css))) {
      const block = m[1]!;
      const bgMatch = block.match(/background(?:-color)?\s*:\s*([^;!]+)(?:\s*!important)?\s*;/i);
      if (bgMatch) {
        const c = normalizeColor(bgMatch[1]!.trim());
        // Header is often white or brand color.
        if (c && !isFrameworkDefault(c)) return c;
      }
    }
  }
  return null;
}


function findFooterBg(css: string): string | null {
  const selectors = [
    /(?:^|[\s,}])footer\s*\{([^}]+)\}/gi,
    /\.footer\b[^{}]*\{([^}]+)\}/gi,
    /\.site-footer\b[^{}]*\{([^}]+)\}/gi,
    /\.footer-container\b[^{}]*\{([^}]+)\}/gi,
    /\.footer-meta\b[^{}]*\{([^}]+)\}/gi,
    /\.footer-content\b[^{}]*\{([^}]+)\}/gi,
    /\.footer-main\b[^{}]*\{([^}]+)\}/gi,
  ];
  for (const re of selectors) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(css))) {
      const block = m[1]!;
      const bgMatch = block.match(/background(?:-color)?\s*:\s*([^;!]+)(?:\s*!important)?\s*;/i);
      if (bgMatch) {
        const c = normalizeColor(bgMatch[1]!.trim());
        if (c && !isFrameworkDefault(c)) return c;
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
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (max < 30) continue;
    if (min > 235) continue;
    if (max - min < 10) continue; // grayscale
    const hex = "#" + c;
    if (isFrameworkDefault(hex)) continue; // skip Bootstrap/kf-theme defaults
    counts.set(hex, (counts.get(hex) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([h]) => h);
}

async function collectCss(html: string, base: URL): Promise<{ css: string; sources: string[] }> {
  const sources: string[] = [];
  let css = "";
  
  // 1. Inline styles
  const inlineRe = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  let m: RegExpExecArray | null;
  while ((m = inlineRe.exec(html))) css += "\n" + m[1]!;
  
  // 2. Stylesheets from <link>
  const linkRe = /<link\b[^>]*rel=["']?stylesheet["']?[^>]*>/gi;
  const hrefs: string[] = [];
  while ((m = linkRe.exec(html))) {
    const h = m[0].match(HREF_RE)?.[1];
    if (!h) continue;
    const abs = absolutize(h, base);
    if (abs) hrefs.push(abs);
  }
  
  // 3. Stylesheets from @import (common in nested portals)
  const importRe = /@import\s+(?:url\(['"]?([^'"]+)['"]?\)|['"]([^'"]+)['"])\s*;/gi;
  let im: RegExpExecArray | null;
  while ((im = importRe.exec(css))) {
    const h = im[1] || im[2];
    if (!h) continue;
    const abs = absolutize(h, base);
    if (abs && !hrefs.includes(abs)) hrefs.push(abs);
  }

  // Keep stylesheet order stable. Appending inside concurrent requests made a
  // framework bundle occasionally override the bank-specific theme file.
  const picked = hrefs.slice(0, 6);
  const fetched = await Promise.all(picked.map(async (u) => {
    try {
      const r = await fetchWithTimeout(u, 7000);
      if (!r.ok) return null;
      const t = (await r.text()).slice(0, 800_000);
      return { url: u, css: t };
    } catch { return null; }
  }));
  for (const item of fetched) {
    if (!item) continue;
    css += "\n" + item.css;
    sources.push(item.url);
  }
  return { css, sources };
}

async function extractTheme(html: string, base: URL): Promise<ThemeExtract> {
  const meta = html.match(/<meta\b[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["']/i)?.[1]
    ?? html.match(/<meta\b[^>]*content=["']([^"']+)["'][^>]*name=["']theme-color["']/i)?.[1]
    ?? null;
  const metaColor = normalizeColor(meta);
  const metaBrand = isFrameworkDefault(metaColor) ? null : metaColor;
  const { css, sources } = await collectCss(html, base);
  const variables = cssVariableMap(css);

  // Brand-specific CSS variables first. Ignore generic `--primary` etc. which
  // Bootstrap sets to its framework default in every VR portal.
  const primaryBrand = findVar(css, [
    "vr-color-primary", "vr-primary", "vr-brand", "vr-brand-primary",
    "brand-primary", "brand", "color-brand", "color-brand-primary",
    "farbe-primary", "farbe-marke", "marken-farbe",
    "bank-primary", "bank-color-primary",
    "theme-primary", "theme-color-primary",
    "c-brand", "c-brand-primary",
    "options-color-brand", "options-color-primary",
  ]);
  // Only accept generic --primary if it's *not* a framework default.
  const primaryGeneric = findVar(css, ["color-primary", "primary", "colorPrimary", "primary-color", "c-primary"]);
  const primary = primaryBrand ?? primaryGeneric;

  const secondary = findVar(css, [
    "vr-color-secondary", "vr-secondary", "brand-secondary", "color-brand-secondary",
    "color-secondary", "secondary", "secondary-color", "c-secondary",
    "options-color-secondary",
  ]);
  const accent = findVar(css, [
    "vr-color-accent", "vr-accent", "brand-accent", "color-brand-accent",
    "color-accent", "accent", "accent-color", "c-accent",
    "options-color-accent",
  ]);
  const btn = findButtonStyle(css, html);

  // Atruvia portals expose the effective login-button styling through these
  // tokens. They are more reliable than generic `.btn` rules and may resolve
  // through several nested var(...) references.
  const tokenButtonBg = normalizeColor(resolvedVariable(variables, [
    "button-primary-background",
    "mat-button-filled-container-color",
  ]));
  const tokenButtonColor = normalizeColor(resolvedVariable(variables, [
    "button-primary-text",
    "mat-button-filled-label-text-color",
    "color-primary-contrast",
  ]));
  const tokenButtonRadius = resolvedVariable(variables, [
    "options-button-radius",
    "options-widget-border-radius",
  ]);
  const isAtruviaPortal = sources.some((source) => /kf-theme|services_cloud\/portal/i.test(source));

  const resolvedRuleBg = normalizeColor(resolveCssValue(btn.bg, variables));
  const resolvedRuleColor = normalizeColor(resolveCssValue(btn.color, variables));
  const resolvedRuleRadius = resolveCssValue(btn.radius, variables);

  const rawPalette = topHexColors(css);
  const palette = rawPalette.filter((c) => !isFrameworkDefault(c));
  
  const headerBgRaw = findHeaderBg(css);
  const headerBg = isFrameworkDefault(headerBgRaw) ? null : headerBgRaw;
  const footerBgRaw = findFooterBg(css);
  const footerBg = isFrameworkDefault(footerBgRaw) ? null : footerBgRaw;

  // Priority: brand vars > meta theme-color > header bg > palette[0].
  const primaryFinal = primary ?? metaBrand ?? headerBg ?? palette[0] ?? null;

  return {
    primary_color: primaryFinal,
    secondary_color: secondary ?? palette[1] ?? null,
    accent_color: accent ?? palette[2] ?? null,
    meta_theme_color: metaColor,
    header_bg: headerBg,
    footer_bg: footerBg,
    button_bg: (tokenButtonBg && !isFrameworkDefault(tokenButtonBg)) ? tokenButtonBg : (isFrameworkDefault(resolvedRuleBg) ? null : resolvedRuleBg),
    button_color: tokenButtonColor ?? resolvedRuleColor,
    // Store the semantic result, not an ambiguous framework radius. Branch
    // tokens such as --options-button-radius are authoritative; generic
    // Material values are only a last fallback.
    // Atruvia's portal bundle contains a generic Material 4px shape. It is not
    // the bank's effective button radius. Leave the value empty on that page so
    // the subsequent bank homepage theme can provide --options-button-radius.
    button_radius: tokenButtonRadius || (isAtruviaPortal ? null : resolvedRuleRadius),
    button_border: btn.border,
    palette,
    css_sources: sources,
  };
}


async function tryPageForHeaderLogo(url: string): Promise<{ logo: string | null; sourceUrl: string; footer: FooterExtract; theme: ThemeExtract | null; loginFieldLabel: string | null } | null> {
  try {
    const res = await fetchWithTimeout(url, 9000);
    if (!res.ok) return null;
    const html = (await res.text()).slice(0, 800_000);
    const responseBase = new URL(res.url || url);
    const documentBaseHref = html.match(/<base\b[^>]*href=["']([^"']+)["']/i)?.[1];
    const finalBase = documentBaseHref ? new URL(documentBaseHref, responseBase) : responseBase;
    const footer = extractFooterLinks(html, finalBase);
    const theme = await extractTheme(html, finalBase);
    const loginFieldLabel = extractLoginFieldLabel(html);
    const embedded = pickJsonEmbeddedLogo(html, finalBase);
    if (embedded) return { logo: embedded, sourceUrl: res.url || url, footer, theme, loginFieldLabel };
    const header = pickHeaderLogo(html, finalBase);
    if (header) return { logo: header, sourceUrl: res.url || url, footer, theme, loginFieldLabel };
    return { logo: null, sourceUrl: res.url || url, footer, theme, loginFieldLabel };
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

async function findLogoForUrl(rawUrl: string): Promise<{ logo: string | null; sourceUrl: string; footer: FooterExtract; theme: ThemeExtract | null; loginFieldLabel: string | null }> {
  let target = rawUrl.trim();
  if (!/^https?:\/\//i.test(target)) target = `https://${target}`;
  const base = new URL(target);
  const emptyFooter: FooterExtract = {
    links: {}, language: null, partners: [], socials: [], ctas: [], columns: [], disclaimer: null,
  };
  let bestFooter: FooterExtract = emptyFooter;
  let bestTheme: ThemeExtract | null = null;
  let bestLoginLabel: string | null = null;
  const mergeFooter = (f?: FooterExtract | null) => {
    if (!f) return;
    bestFooter = {
      links: { ...f.links, ...bestFooter.links },
      language: bestFooter.language ?? f.language,
      partners: bestFooter.partners.length ? bestFooter.partners : f.partners,
      socials: bestFooter.socials.length ? bestFooter.socials : f.socials,
      ctas: bestFooter.ctas.length ? bestFooter.ctas : f.ctas,
      columns: bestFooter.columns.length ? bestFooter.columns : f.columns,
      disclaimer: bestFooter.disclaimer ?? f.disclaimer,
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
      footer_bg: bestTheme.footer_bg ?? t.footer_bg,

      button_bg: bestTheme.button_bg ?? t.button_bg,
      button_color: bestTheme.button_color ?? t.button_color,
      button_radius: bestTheme.button_radius ?? t.button_radius,
      button_border: bestTheme.button_border ?? t.button_border,
      palette: bestTheme.palette.length ? bestTheme.palette : t.palette,
      css_sources: [...bestTheme.css_sources, ...t.css_sources].slice(0, 8),
    };
  };
  const mergeLoginLabel = (l?: string | null) => {
    if (l && !bestLoginLabel) bestLoginLabel = l;
  };

  // 1) Portal / login page
  const portal = await tryPageForHeaderLogo(target);
  if (portal) {
    mergeFooter(portal.footer);
    mergeTheme(portal.theme);
    mergeLoginLabel(portal.loginFieldLabel);
    if (portal.logo && portal.loginFieldLabel) return { logo: portal.logo, sourceUrl: portal.sourceUrl, footer: bestFooter, theme: bestTheme, loginFieldLabel: bestLoginLabel };
    if (portal.logo) return { logo: portal.logo, sourceUrl: portal.sourceUrl, footer: bestFooter, theme: bestTheme, loginFieldLabel: bestLoginLabel };
  }

  // 2) Bank homepage
  const home = await tryPageForHeaderLogo(base.origin + "/");
  if (home) {
    mergeFooter(home.footer);
    mergeTheme(home.theme);
    mergeLoginLabel(home.loginFieldLabel);
    if (home.logo && home.loginFieldLabel) return { logo: home.logo, sourceUrl: home.sourceUrl, footer: bestFooter, theme: bestTheme, loginFieldLabel: bestLoginLabel };
    if (home.logo) return { logo: home.logo, sourceUrl: home.sourceUrl, footer: bestFooter, theme: bestTheme, loginFieldLabel: bestLoginLabel };
  }

  // 3) JS-rendered fallback via Microlink
  const mlHome = await tryMicrolinkLogo(base.origin + "/");
  if (mlHome) return { logo: mlHome, sourceUrl: base.origin + "/", footer: bestFooter, theme: bestTheme, loginFieldLabel: bestLoginLabel };
  const mlPortal = await tryMicrolinkLogo(target);
  if (mlPortal) return { logo: mlPortal, sourceUrl: target, footer: bestFooter, theme: bestTheme, loginFieldLabel: bestLoginLabel };

  // 4) Fallback: og:image / apple-touch-icon / favicon
  try {
    const res = await fetchWithTimeout(base.origin + "/", 8000);
    if (res.ok) {
      const html = (await res.text()).slice(0, 300_000);
      const picked = pickBestIcon(html, new URL(res.url || base.origin));
      if (picked) return { logo: picked, sourceUrl: res.url || base.origin, footer: bestFooter, theme: bestTheme, loginFieldLabel: bestLoginLabel };
    }
  } catch { /* ignore */ }
  try {
    const fav = `${base.origin}/favicon.ico`;
    const r = await fetchWithTimeout(fav, 5000);
    if (r.ok) return { logo: fav, sourceUrl: fav, footer: bestFooter, theme: bestTheme, loginFieldLabel: bestLoginLabel };
  } catch { /* ignore */ }
  return { logo: null, sourceUrl: target, footer: bestFooter, theme: bestTheme, loginFieldLabel: bestLoginLabel };
}


export async function crawlBankLogosServer(data: Input, context: any) {
    const { data: isAdmin, error: rpcErr } = await context.supabase.rpc("has_role", {
      _user_id: context.userId, _role: "admin",
    });
    if (rpcErr || !isAdmin) throw new Error("Forbidden");

    const results: ResultItem[] = [];
    const scopes = data.scopes ?? ["logo", "footer", "theme", "pages"];

    await Promise.all(
      data.banks.map(async (b) => {
        try {
          const { logo, sourceUrl, footer, theme, loginFieldLabel } = await findLogoForUrl(b.url);
          
          let storedUrl: string | null = null;
          let storedPath: string | null = null;
          
          if (logo && scopes.includes("logo")) {
            const stored = await storeLogoInBucket(context.supabase, b.id, logo);
            if (stored) {
              storedUrl = stored.publicUrl;
              storedPath = stored.path;
            }
          }

          const patch: Record<string, unknown> = {
            last_crawled_at: new Date().toISOString(),
          };

          if (scopes.includes("footer")) {
            patch["footer_links"] = footer.links;
            patch["footer_language"] = footer.language;
            patch["footer_last_checked_at"] = new Date().toISOString();
            patch["footer_partners"] = footer.partners;
            patch["footer_socials"] = footer.socials;
            patch["footer_ctas"] = footer.ctas;
            patch["footer_columns"] = footer.columns;
            patch["footer_disclaimer"] = footer.disclaimer;
            
            if (scopes.includes("pages")) {
              const footerPages = await fetchFooterPages(footer.links);
              patch["footer_pages"] = footerPages;
            }
          }

          if (theme && scopes.includes("theme")) {
            patch["theme_extracted"] = theme;
            patch["theme_extracted_at"] = new Date().toISOString();
          }

          if (logo && scopes.includes("logo")) {
            patch["logo"] = logo;
            patch["logo_source_url"] = sourceUrl;
            if (storedUrl) patch["logo_url"] = storedUrl;
            if (storedPath) patch["logo_storage_path"] = storedPath;
          }

          if (loginFieldLabel) {
            patch["login_field_label"] = loginFieldLabel;
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
}
