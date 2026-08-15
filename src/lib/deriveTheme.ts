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
  footer_bg?: string | null;
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
  if (raw === "rounded-full" || raw === "rounded-none") return raw;
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
  if (px >= 20) return "rounded-full";
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

  // Never substitute a header, meta, or palette color for the submit button.
  // If the crawler did not identify the actual button rule, the curated group
  // button color is safer than an unrelated color sampled elsewhere.
  const extButton = normHex(ext?.button_bg);
  const extAccent = normHex(ext?.accent_color) || extPrimary;

  const extHeader = normHex(ext?.header_bg);
  const extFooter = normHex(ext?.footer_bg);
  
  // Specific override for GLS Bank which has a very distinct green theme
  const isGLS = groupName === "GLS Bank" || ext?.primary_color === "#00d75c";
  
  // Marcard: burgundy red branding (must be checked before Warburg since name includes "Stein")
  const isMarcard = groupName === "Spezifische Banken" && (
    ext?.palette?.some(c => normHex(c) === "#660033") ||
    normHex(ext?.primary_color) === "#660033"
  );
  // Warburg specific branding (Slate Blue/Gray)
  const isWarburg = !isMarcard && groupName === "Spezifische Banken" && (
    ext?.palette?.some(c => normHex(c) === "#6d7e8b") ||
    normHex(ext?.primary_color) === "#6d7e8b"
  );
  const warburgColor = "#6d7e8b";
  const marcardColor = "#660033";


  const glsHeader = "#00d75c";
  const glsButton = "#00d75c";
  const glsFooter = "#00d75c";
  const glsAccent = "#00d75c";
  const glsTopBar = "#00d75c";

  // Renault Bank direkt branding
  const isRenault = groupName === "Spezifische Banken" && (
    ext?.palette?.some(c => normHex(c) === "#edee00") ||
    normHex(ext?.primary_color) === "#edee00" ||
    normHex(ext?.button_bg) === "#edee00"
  );
  const renaultButton = "#edee00";
  const renaultHeader = "#000000"; // Black header per screenshot



  
  // Header logic: Branches often have specific header colors.
  // We prefer the extracted header background if it's NOT white and NOT framework blue.
  const isExtHeaderGenericBlue = extHeader === "#003399" || extHeader === "#3333ff" || extHeader === "#002d87" || extHeader === "#002266";
  const headerBg = c.headerBg ?? (isGLS ? glsHeader : null) ?? (isWarburg ? warburgColor : null) ?? (isMarcard ? marcardColor : null) ?? (isRenault ? renaultHeader : null) ?? (extHeader && !isNearWhite(extHeader) && !isExtHeaderGenericBlue ? extHeader : null) ?? g.headerBg ?? DEFAULT.headerBg;
  
  // Footer logic: If extracted footer color is a generic framework blue or a framework yellow, ignore it.
  const isGenericBlue = extFooter === "#003399" || extFooter === "#3333ff" || extFooter === "#002d87" || extFooter === "#002266";
  const isFrameworkYellow = extFooter === "#ffcc00" || extFooter === "#fecb00" || extFooter === "#ffc107" || extFooter === "#e0a800";
  const footerBgFinal = c.footerBg ?? (isGLS ? glsFooter : null) ?? (isWarburg ? warburgColor : null) ?? (isMarcard ? marcardColor : null) ?? (isRenault ? renaultHeader : null) ?? (extFooter && !isGenericBlue && !isFrameworkYellow ? extFooter : null) ?? g.footerBg ?? null;
  
  const buttonBg = c.buttonBg ?? (isGLS ? glsButton : null) ?? (isMarcard ? marcardColor : null) ?? (isWarburg ? warburgColor : null) ?? (isRenault ? renaultButton : null) ?? extButton ?? g.buttonBg ?? DEFAULT.buttonBg;
  const accentText = c.accentText ?? (isGLS ? glsAccent : null) ?? (isMarcard ? marcardColor : null) ?? (isWarburg ? warburgColor : null) ?? (isRenault ? renaultButton : null) ?? extAccent ?? buttonBg;
  const topBarColor = c.topBarColor ?? (isGLS ? glsTopBar : null) ?? (isMarcard ? marcardColor : null) ?? (isWarburg ? warburgColor : null) ?? (isRenault ? renaultHeader : null) ?? extPrimary ?? g.topBarColor ?? buttonBg;


  const explicitRadius = radiusFromCss(ext?.button_radius);
  // Older crawl rows stored the unresolved generic Atruvia token. Until those
  // branches are re-crawled, use the portal's pill-button behavior when the
  // detected button/brand color is clearly branch-specific.
  // Older crawl rows stored the unresolved generic Atruvia token. Until those
  // branches are re-crawled, use the portal's pill-button behavior when the
  // detected button/brand color is clearly branch-specific (non-generic).
  const legacyAtruviaRadius =
    ext?.button_radius?.includes("--options-widget-border-radius") ||
    ext?.button_radius?.includes("--options-button-radius")
      ? "rounded-full"
      : null;
  const buttonRadius =
    c.buttonRadius ??
    (isWarburg || isRenault ? "rounded-none" : null) ??
    explicitRadius ??
    legacyAtruviaRadius ??
    g.buttonRadius ??
    DEFAULT.buttonRadius;


  return {
    headerBg,
    buttonBg,
    accentText,
    topBarColor,
    buttonRadius,
    ...(footerBgFinal ? { footerBg: footerBgFinal } : {}),
  } as FlowTheme;
}

export const DEFAULT_FLOW_THEME = DEFAULT;