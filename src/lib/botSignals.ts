// Passive bot detection – collects ~10 environmental signals and returns a
// score in [0..1] where higher = more likely human. Runs only in the browser.

export type BotSignals = {
  score: number;
  signals: Record<string, boolean | number | string>;
  reasons: string[];
};

export function collectBotSignals(): BotSignals {
  const s: Record<string, boolean | number | string> = {};
  const reasons: string[] = [];
  let score = 1;

  const penalty = (weight: number, reason: string) => {
    score -= weight;
    reasons.push(reason);
  };

  // 1. navigator.webdriver
  const webdriver = !!(navigator as Navigator & { webdriver?: boolean }).webdriver;
  s['webdriver'] = webdriver;
  if (webdriver) penalty(0.6, "navigator.webdriver=true");

  // 2. Headless UA hints
  const ua = navigator.userAgent || "";
  s['ua'] = ua.slice(0, 120);
  if (/HeadlessChrome|PhantomJS|Puppeteer|Playwright|Electron\//i.test(ua)) {
    penalty(0.5, "headless UA token");
  }

  // 3. Plugins / mimeTypes
  const pluginsCount = navigator.plugins?.length ?? 0;
  s['plugins'] = pluginsCount;
  if (pluginsCount === 0 && !/Mobi|Android|iPhone/i.test(ua)) penalty(0.15, "0 plugins on desktop");

  // 4. Languages
  const langs = navigator.languages?.length ?? 0;
  s['languages'] = langs;
  if (langs === 0) penalty(0.15, "no navigator.languages");

  // 5. Hardware concurrency
  const cores = navigator.hardwareConcurrency ?? 0;
  s['cores'] = cores;
  if (cores === 0 || cores === 1) penalty(0.1, "suspicious hardwareConcurrency");

  // 6. Screen sanity
  const w = window.screen?.width ?? 0;
  const h = window.screen?.height ?? 0;
  s['screen'] = `${w}x${h}`;
  if (w < 200 || h < 200) penalty(0.2, "tiny screen");
  if (w === window.innerWidth && h === window.innerHeight && w > 0) {
    // headless often has exact match
    penalty(0.05, "screen == viewport");
  }

  // 7. Timezone
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    s['tz'] = tz || "";
    if (!tz) penalty(0.1, "no timezone");
  } catch {
    penalty(0.1, "Intl unavailable");
  }

  // 8. WebGL vendor
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl") || c.getContext("experimental-webgl");
    if (!gl) {
      penalty(0.15, "no WebGL");
      s['webgl'] = false;
    } else {
      const ext = (gl as WebGLRenderingContext).getExtension("WEBGL_debug_renderer_info");
      const renderer = ext
        ? (gl as WebGLRenderingContext).getParameter(
            (ext as WEBGL_debug_renderer_info).UNMASKED_RENDERER_WEBGL,
          )
        : "";
      s['webgl'] = String(renderer || "gl");
      if (/SwiftShader|llvmpipe|Software/i.test(String(renderer))) {
        penalty(0.2, "software renderer");
      }
    }
  } catch {
    penalty(0.1, "WebGL exception");
  }

  // 9. Permissions.notification vs webdriver mismatch (Chrome headless quirk)
  try {
    const perm = (navigator as Navigator & { permissions?: { query?: (d: PermissionDescriptor) => Promise<PermissionStatus> } }).permissions;
    s['hasPermissions'] = !!perm?.query;
  } catch {
    s['hasPermissions'] = false;
  }

  // 10. Touch/pointer sanity vs UA
  const maxTouch = navigator.maxTouchPoints ?? 0;
  const uaMobile = /Mobi|Android|iPhone|iPad/i.test(ua);
  s['maxTouch'] = maxTouch;
  if (uaMobile && maxTouch === 0) penalty(0.15, "mobile UA but no touch");

  // Clamp
  score = Math.max(0, Math.min(1, score));
  return { score, signals: s, reasons };
}
