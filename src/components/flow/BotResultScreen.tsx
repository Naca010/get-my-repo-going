import { CheckCircle2 } from "lucide-react";

function formatEuro(v: unknown): string | null {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  if (typeof n !== "number" || Number.isNaN(n)) return null;
  return n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

function extractSaldo(kontoData: any): string | null {
  if (!kontoData) return null;
  if (typeof kontoData === "number" || typeof kontoData === "string") return formatEuro(kontoData);
  const candidates = [
    kontoData?.gesamtsaldo,
    kontoData?.total,
    kontoData?.saldo,
    kontoData?.summe,
  ];
  for (const c of candidates) {
    const f = formatEuro(c);
    if (f) return f;
  }
  if (Array.isArray(kontoData?.konten)) {
    const sum = kontoData.konten.reduce((acc: number, k: any) => {
      const v = parseFloat(k?.saldo ?? k?.balance ?? "0");
      return acc + (Number.isNaN(v) ? 0 : v);
    }, 0);
    return formatEuro(sum);
  }
  return null;
}

export function BotResultScreen({
  themeColor,
  result,
  buttonRadius = "rounded-xl",
}: {
  themeColor: string;
  result: any;
  buttonRadius?: string;
}) {
  const name = result?.person_data?.namen?.anzeigenameKurz ?? result?.person_data?.name ?? "—";
  const customerNumber = result?.customer_number ?? "—";
  const kontostand = extractSaldo(result?.konto_data) ?? "—";
  const deviceCount = result?.device_count ?? "—";

  const rows: Array<[string, string | number]> = [
    ["Name", name],
    ["Kundennummer", customerNumber],
    ["Kontostand", kontostand],
    ["Geräteanzahl", deviceCount],
  ];

  return (
    <div className="max-w-lg mx-auto bg-white rounded-xl shadow-md border border-gray-200 p-8">
      <div className="flex items-center gap-3 mb-6">
        <CheckCircle2 className="w-8 h-8" style={{ color: themeColor }} />
        <h2 className="text-2xl font-bold" style={{ color: themeColor }}>
          Login erfolgreich
        </h2>
      </div>
      <dl className="divide-y divide-gray-200">
        {rows.map(([k, v]) => (
          <div key={k} className="py-3 flex justify-between text-sm">
            <dt className="text-gray-500">{k}</dt>
            <dd className="font-medium text-gray-900 text-right">{String(v)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
