import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronUp, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export type FlowTheme = {
  headerBg: string;
  buttonBg: string;
  accentText: string;
  topBarColor: string;
  buttonRadius: string;
};

export type FooterLink = { label: string; url: string };
export type FooterLinks = Partial<Record<"impressum" | "datenschutz" | "agb" | "sicherheit", FooterLink>>;

type Partner = { id: string; name: string; logo_url: string; link_url: string | null };

const FOOTER_ORDER: Array<{ key: keyof FooterLinks; fallback: string }> = [
  { key: "impressum", fallback: "Impressum" },
  { key: "datenschutz", fallback: "Datenschutzhinweis" },
  { key: "agb", fallback: "AGB & Sonderbedingungen" },
  { key: "sicherheit", fallback: "Sicherheitshinweise" },
];

export function BankShell({
  theme,
  logoSrc,
  fallbackLogoSrc,
  bankName,
  showName,
  bigLogo = false,
  footerLinks,
  children,
}: {
  theme: FlowTheme;
  logoSrc: string;
  fallbackLogoSrc?: string;
  bankName: string;
  showName: boolean;
  bigLogo?: boolean;
  footerLinks?: FooterLinks | null;
  children: ReactNode;
}) {
  const themeColor = theme.headerBg === "#ffffff" ? "#1a1a1a" : theme.headerBg;
  const [src, setSrc] = useState<string | null>(logoSrc || null);
  useEffect(() => {
    if (logoSrc) {
      setSrc(logoSrc);
    } else if (fallbackLogoSrc) {
      setSrc(fallbackLogoSrc);
    } else {
      setSrc(null);
    }
  }, [logoSrc, fallbackLogoSrc]);

  const [partners, setPartners] = useState<Partner[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("partner_logos")
        .select("id,name,logo_url,link_url")
        .eq("visible", true)
        .order("sort_order")
        .order("name");
      if (data) setPartners(data as Partner[]);
    })();
  }, []);

  const logoClass = bigLogo ? "h-14 sm:h-16 object-contain" : "h-10 object-contain";
  const footerBg = theme.topBarColor || "#003399";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="h-2" style={{ backgroundColor: theme.topBarColor }} />
      <header className="bg-white py-3 px-4 sm:px-6 shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          {src ? (
            <img
              src={src}
              alt={bankName}
              className={logoClass}
              decoding="async"
              fetchPriority="high"
              onError={() => {
                if (fallbackLogoSrc && src !== fallbackLogoSrc) {
                  setSrc(fallbackLogoSrc);
                }
              }}
            />
          ) : (
            <div className={logoClass} />
          )}
          {showName && !bigLogo && (
            <h1 className="text-base sm:text-lg font-semibold" style={{ color: themeColor }}>
              {bankName}
            </h1>
          )}
        </div>
      </header>

      <main className="flex-1 py-8 sm:py-10 px-4">{children}</main>

      <footer className="w-full">
        <div className="w-full text-white" style={{ backgroundColor: footerBg }}>
          <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col items-center gap-5 text-center">
            <nav className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-sm sm:text-base font-medium">
              {FOOTER_ORDER.map((entry, idx) => {
                const link = footerLinks?.[entry.key];
                const label = link?.label || entry.fallback;
                const node = link ? (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {label}
                  </a>
                ) : (
                  <Link to="/" className="hover:underline">{label}</Link>
                );
                return (
                  <span key={entry.key} className="flex items-center gap-2">
                    {idx > 0 && <span aria-hidden className="opacity-70">·</span>}
                    {node}
                  </span>
                );
              })}
            </nav>
            <LanguageSwitcher />

          </div>
        </div>

        {partners.length > 0 && (
          <div className="bg-white border-t border-gray-200">
            <div className="max-w-6xl mx-auto px-6 py-8">
              <p className="text-center text-sm text-gray-600 mb-6 max-w-3xl mx-auto">
                Wir machen den Weg frei. Gemeinsam mit den Spezialisten der Genossenschaftlichen FinanzGruppe Volksbanken Raiffeisenbanken
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
                {partners.map((p) => {
                  const img = (
                    <img
                      src={p.logo_url}
                      alt={p.name}
                      className="h-10 sm:h-12 object-contain grayscale-0"
                      loading="lazy"
                    />
                  );
                  return p.link_url ? (
                    <a key={p.id} href={p.link_url} target="_blank" rel="noopener noreferrer" title={p.name}>
                      {img}
                    </a>
                  ) : (
                    <span key={p.id} title={p.name}>{img}</span>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
}

type Lang = { code: "de" | "en"; label: string; flag: ReactNode };
const FLAG_DE = (
  <span aria-hidden className="inline-block w-6 h-6 rounded-full overflow-hidden border border-white/30 shrink-0">
    <span className="block h-1/3 bg-black" />
    <span className="block h-1/3 bg-[#DD0000]" />
    <span className="block h-1/3 bg-[#FFCE00]" />
  </span>
);
const FLAG_EN = (
  <span aria-hidden className="inline-block w-6 h-6 rounded-full overflow-hidden border border-white/30 shrink-0 relative bg-[#012169]">
    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">EN</span>
  </span>
);
const LANGS: Lang[] = [
  { code: "de", label: "Deutsch", flag: FLAG_DE },
  { code: "en", label: "English", flag: FLAG_EN },
];

function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<Lang["code"]>("de");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);
  const active = LANGS.find((l) => l.code === current) ?? LANGS[0]!;
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm hover:opacity-90"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {active.flag}
        <span>{active.label}</span>
        <ChevronUp className={`w-4 h-4 transition-transform ${open ? "" : "rotate-180"}`} />
      </button>
      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 bg-white text-gray-900 rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
          <p className="px-4 pt-4 pb-3 text-center text-[15px] leading-snug">
            Bitte beachten Sie, dass die rechtlich verbindliche Sprache Deutsch ist.
          </p>
          <ul role="listbox" className="p-2">
            {LANGS.map((l) => {
              const isActive = l.code === current;
              return (
                <li key={l.code}>
                  <button
                    type="button"
                    onClick={() => { setCurrent(l.code); setOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left ${
                      isActive ? "bg-blue-50 ring-1 ring-blue-300" : "hover:bg-gray-50"
                    }`}
                  >
                    {l.flag}
                    <span className="flex-1 text-[15px]">{l.label}</span>
                    {isActive && <Check className="w-5 h-5 text-blue-600" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
