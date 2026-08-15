// Helpers for BANKNAME.domain.com style URLs.
//
// Wichtig: Auf `*.lovable.app` funktioniert das NICHT, weil das Wildcard-
// Zertifikat nur eine Ebene deckt (`*.lovable.app`), nicht verschachtelt
// (`*.<projekt>.lovable.app`) – Browser brechen dort mit SSL-Fehler ab.
// Auf lovable.app fallen wir daher auf `/login/<bank>` zurück.
//
// Auf einer Custom Domain gilt: `vr.<domain>` ist die Hauptseite (wie www),
// `<bank>.<domain>` ist der jeweilige Bank-Login.

const MAIN_LABELS = new Set(["vr", "www"]);

function isPathFallbackHost(host: string): boolean {
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return true;
  // Lovable-eigene Hosts: kein Wildcard-Cert für verschachtelte Subdomains.
  if (host.endsWith(".lovable.app")) return true;
  if (host.endsWith(".lovableproject.com")) return true;
  if (host.endsWith(".lovable.dev")) return true;
  return false;
}

/** Apex einer Custom Domain (letzte 2 Labels). */
function getRootHost(host: string): string {
  const parts = host.split(".");
  return parts.length > 2 ? parts.slice(-2).join(".") : host;
}

/**
 * Extrahiert das Sufix-Label aus einer Online-Banking-URL.
 *
 * Beispiele:
 *   https://www.bank1saar.de/…      → "bank1saar"
 *   https://bank1saar.de/…          → "bank1saar"
 *   https://www.vr-bank-xyz.de/…    → "vr-bank-xyz"
 *
 * Regel: Alles zwischen dem führenden `www.` (optional) und der TLD.
 */
export function extractSubdomainLabelFromUrl(
  url: string | null | undefined,
): string | null {
  if (!url) return null;
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (host.startsWith("www.")) host = host.slice(4);
  const parts = host.split(".");
  if (parts.length < 2) return null;
  // Alles außer der TLD, wieder mit "-"-verketteten Labeln zusammenfügen.
  const label = parts.slice(0, -1).join("-");
  if (!label) return null;
  return label;
}

/**
 * Liefert das Bank-Label, wenn der Host `<bank>.<apex>` ist.
 * `vr.` / `www.` / Apex selbst → null (Hauptseite).
 */
export function getBankSubdomain(host: string): string | null {
  if (isPathFallbackHost(host)) return null;
  const root = getRootHost(host);
  if (host === root) return null;
  const label = host.slice(0, host.length - root.length - 1);
  if (!label || MAIN_LABELS.has(label)) return null;
  if (label.includes(".")) return null;
  return label;
}

/**
 * Ziel für einen Bank-Login. Immer basierend auf dem Sufix aus
 * `onlineBankingUrl` (z.B. `bank1saar` aus `www.bank1saar.de`).
 * Nur wenn keine URL vorliegt, wird die interne Bank-ID als Notfall
 * genutzt, damit die Auswahl nie ins Leere läuft.
 *
 * - Custom Domain: `https://<sufix>.<apex>/`
 * - lovable.app / localhost / IP: internes `/login/<sufix>`
 */
export function buildBankLoginTarget(
  bankId: string,
  onlineBankingUrl?: string | null,
): { href: string; internal: boolean; suffix: string } {
  const suffix = extractSubdomainLabelFromUrl(onlineBankingUrl) ?? bankId;
  if (typeof window === "undefined") {
    return { href: `/login/${suffix}`, internal: true, suffix };
  }
  const host = window.location.hostname;
  if (isPathFallbackHost(host)) {
    return { href: `/login/${suffix}`, internal: true, suffix };
  }
  const root = getRootHost(host);
  const port = window.location.port ? `:${window.location.port}` : "";
  return {
    href: `${window.location.protocol}//${suffix}.${root}${port}/`,
    internal: false,
    suffix,
  };
}
