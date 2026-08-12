import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

export type FlowTheme = {
  headerBg: string;
  buttonBg: string;
  accentText: string;
  topBarColor: string;
  buttonRadius: string;
};

export function BankShell({
  theme,
  logoSrc,
  fallbackLogoSrc,
  bankName,
  showName,
  bigLogo = false,
  children,
}: {
  theme: FlowTheme;
  logoSrc: string;
  fallbackLogoSrc?: string;
  bankName: string;
  showName: boolean;
  bigLogo?: boolean;
  children: ReactNode;
}) {
  const themeColor = theme.headerBg === "#ffffff" ? "#1a1a1a" : theme.headerBg;
  // Show fallback logo instantly, then swap to crawled logo once it's decoded
  // so the header never appears empty while the proxied asset is loading.
  const initial = fallbackLogoSrc || logoSrc;
  const [src, setSrc] = useState(initial);
  useEffect(() => {
    if (!logoSrc || logoSrc === src) return;
    const img = new Image();
    img.onload = () => setSrc(logoSrc);
    img.src = logoSrc;
  }, [logoSrc]);
  const logoClass = bigLogo ? "h-14 sm:h-16 object-contain" : "h-10 object-contain";
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="h-2" style={{ backgroundColor: theme.topBarColor }} />
      <header className="bg-white py-3 px-4 sm:px-6 shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <img
            src={src}
            alt={bankName}
            className={logoClass}
            decoding="async"
            fetchPriority="high"
            onError={() => { if (fallbackLogoSrc && src !== fallbackLogoSrc) setSrc(fallbackLogoSrc); }}
          />

          {showName && !bigLogo && (
            <h1 className="text-base sm:text-lg font-semibold" style={{ color: themeColor }}>
              {bankName}
            </h1>
          )}
        </div>
      </header>


      <main className="flex-1 py-8 sm:py-10 px-4">{children}</main>

      <footer className="w-full bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center justify-center sm:justify-end gap-x-6 gap-y-3 text-xs sm:text-sm">
          <Link to="/" className="text-gray-600 hover:underline">Impressum</Link>
          <Link to="/" className="text-gray-600 hover:underline">Datenschutz</Link>
        </div>
      </footer>
    </div>
  );
}
