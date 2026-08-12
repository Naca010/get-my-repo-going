import type { FlowTheme } from "./BankShell";

export function DeletionConfirmedStep({
  theme,
  onContinue,
  onShowPersonalData,
}: {
  theme: FlowTheme;
  deletedAddress?: { strasse: string; plzOrt: string };
  onContinue: () => void;
  onShowPersonalData?: () => void;
}) {
  const btnRadius = theme.buttonRadius ?? "rounded-md";
  return (
    <main className="flex-1 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-green-50 rounded-2xl p-8 sm:p-10 mb-6">
          <div className="w-14 h-14 mx-auto mb-5 rounded-full border-[3px] border-green-600 flex items-center justify-center">
            <svg
              className="w-7 h-7 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Löschen erfolgreich</h2>
          <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
            Die Kontaktadresse wurde erfolgreich gelöscht. Sie können die verbleibenden Kontaktmöglichkeiten jederzeit einsehen und verwalten oder einen neuen Kontakt hinzufügen.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onShowPersonalData && (
            <button
              type="button"
              onClick={onShowPersonalData}
              className={`px-8 py-3 ${btnRadius} border font-medium text-sm transition-colors hover:bg-gray-50`}
              style={{ borderColor: theme.buttonBg, color: theme.buttonBg }}
            >
              Persönliche Daten anzeigen
            </button>
          )}
          <button
            type="button"
            onClick={onContinue}
            className={`px-8 py-3 ${btnRadius} text-white font-medium text-sm transition-opacity hover:opacity-90`}
            style={{ backgroundColor: theme.buttonBg }}
          >
            Weiter
          </button>
        </div>
      </div>
    </main>
  );
}
