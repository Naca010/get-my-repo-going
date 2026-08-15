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
  buttonRadius: "rounded-sm",
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

function radiusFromCss(raw: string | null | undefined): string {
  // Default when the crawler couldn't detect a border-radius: most bank
  // login buttons are rectangular (BBBank, GLS, PSD are square/slightly rounded).
  if (!raw) return "rounded-sm";
  const m = raw.match(/(\d+(?:\.\d+)?)\s*(px|rem|em|%)?/);
  if (!m) {
    // Check for shorthand like "4px 4px 0 0"
    const shorthand = raw.split(/\s+/).find(p => /(\d+(?:\.\d+)?)\s*(px|rem|em|%)?/.test(p));
    if (shorthand) {
      const sm = shorthand.match(/(\d+(?:\.\d+)?)\s*(px|rem|em|%)?/);
      if (sm) return radiusFromCss(sm[0]);
    }
    return "rounded-sm";
  }
  const val = parseFloat(m[1]!);
  const unit = m[2] ?? "px";
  if (unit === "%") return val >= 40 ? "rounded-full" : "rounded-lg";
  const px = unit === "px" ? val : val * 16;
  if (px >= 999) return "rounded-full"; // pill (9999px etc.)
  if (px >= 28) return "rounded-full";
  if (px >= 14) return "rounded-xl";
  if (px >= 8) return "rounded-lg";
  if (px >= 4) return "rounded-md";
  if (px >= 2) return "rounded-sm";
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
): FlowTheme {
  const c = (custom && Object.keys(custom).length > 0 ? custom : null) ?? {};
  const g = group ?? {};

  const extPrimary =
    normHex(extracted?.primary_color) ||
    normHex(extracted?.button_bg) ||
    normHex(extracted?.header_bg) ||
    normHex(extracted?.meta_theme_color) ||
    (extracted?.palette?.map(normHex).find(Boolean) ?? null);

  const extButton = normHex(extracted?.button_bg) || extPrimary;
  const extAccent = normHex(extracted?.accent_color) || extPrimary;

  const extHeader = normHex(extracted?.header_bg);
  const headerBg = c.headerBg ?? (extHeader && !isNearWhite(extHeader) ? extHeader : null) ?? g.headerBg ?? DEFAULT.headerBg;
  const buttonBg = c.buttonBg ?? extButton ?? g.buttonBg ?? DEFAULT.buttonBg;
  const accentText = c.accentText ?? extAccent ?? g.accentText ?? buttonBg;
  const topBarColor = c.topBarColor ?? extPrimary ?? g.topBarColor ?? buttonBg;
  const buttonRadius =
    c.buttonRadius ?? g.buttonRadius ?? radiusFromCss(extracted?.button_radius);

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
