import type { FlowTheme } from "@/components/flow/BankShell";
import type { BankTheme } from "@/data/banks";

export type ThemeExtracted = {
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
  meta_theme_color?: string | null;
  header_bg?: string | null;
  button_bg?: string | null;
  button_color?: string | null;
  button_radius?: string | null;
  button_border?: string | null;
  palette?: string[] | null;
};

const DEFAULT: FlowTheme = {
  headerBg: "#ffffff",
  buttonBg: "#003399",
  accentText: "#003399",
  topBarColor: "#003399",
  buttonRadius: "rounded-none",
};

function normHex(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim().toLowerCase();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/.test(s)) return s;
  return null;
}

function isNearWhite(hex: string | null): boolean {
  if (!hex) return false;
  const h = hex.length === 4 ? "#" + hex.slice(1).split("").map((c) => c + c).join("") : hex;
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return r > 235 && g > 235 && b > 235;
}

function radiusFromCss(raw: string | null | undefined): string | null {
  if (!raw) return null;
  // Unresolved CSS variable — caller falls back to group default.
  if (raw.includes("var(")) return null;
  const m = raw.match(/(\d+(?:\.\d+)?)\s*(px|rem|em|%)?/);
  if (!m) return null;
  const val = parseFloat(m[1]!);
  const unit = m[2] ?? "px";
  // Binary decision: real bank portals are either square (kantig) or pill
  // (rund). No in-between. Small radii (2–6px) are framework defaults and
  // must render as square to match PSD/GLS/BBBank/KD-Bank.
  if (unit === "%") return val >= 20 ? "rounded-full" : "rounded-none";
  const px = unit === "px" ? val : val * 16;
  if (px >= 10) return "rounded-full";
  return "rounded-none";
}

/**
 * Merge sources with priority: custom > extracted > group > default.
 * `extracted` is the raw JSON from banks.theme_extracted.
 */
export function deriveFlowTheme(
  custom: Partial<BankTheme> | null | undefined,
  extracted: ThemeExtracted | null | undefined,
  group: Partial<BankTheme> | null | undefined,
  groupName?: string | null,
): FlowTheme {
  const c = (custom && Object.keys(custom).length > 0 ? custom : null) ?? {};
  const g = group ?? {};

  // A branch's actual login portal is authoritative. Group values remain the
  // fallback only when the crawler could not obtain a concrete value.
  const ext = extracted;

  const extPrimary =
    normHex(ext?.primary_color) ||
    normHex(ext?.button_bg) ||
    normHex(ext?.header_bg) ||
    normHex(ext?.meta_theme_color) ||
    (ext?.palette?.map(normHex).find(Boolean) ?? null);

  const extButton = normHex(ext?.button_bg) || extPrimary;
  const extAccent = normHex(ext?.accent_color) || extPrimary;

  const extHeader = normHex(ext?.header_bg);
  const headerBg = c.headerBg ?? (extHeader && !isNearWhite(extHeader) ? extHeader : null) ?? g.headerBg ?? DEFAULT.headerBg;
  const buttonBg = c.buttonBg ?? extButton ?? g.buttonBg ?? DEFAULT.buttonBg;
  const accentText = c.accentText ?? extAccent ?? g.accentText ?? buttonBg;
  const topBarColor = c.topBarColor ?? extPrimary ?? g.topBarColor ?? buttonBg;
  const explicitRadius = radiusFromCss(ext?.button_radius);
  // Older crawl rows stored the unresolved generic Atruvia token. Until those
  // branches are re-crawled, use the portal's pill-button behavior when the
  // detected button/brand color is clearly branch-specific.
  const legacyAtruviaRadius = ext?.button_radius?.includes("--options-widget-border-radius") && extButton
    ? "rounded-full"
    : null;
  const buttonRadius = c.buttonRadius ?? explicitRadius ?? legacyAtruviaRadius ?? g.buttonRadius ?? DEFAULT.buttonRadius;

  return {
    headerBg,
    buttonBg,
    accentText,
    topBarColor,
    buttonRadius,
    ...(c.footerBg ? { footerBg: c.footerBg } : g.footerBg ? { footerBg: g.footerBg } : {}),
  } as FlowTheme;
}

export const DEFAULT_FLOW_THEME = DEFAULT;
