import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/stats")({
  component: StatsAdmin,
});

type Row = { created_at: string; path: string; bank_id: string | null; referrer: string | null };

function StatsAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("visit_events")
        .select("created_at, path, bank_id, referrer")
        .like("user_agent", "HUMAN|%")
        .order("created_at", { ascending: false })
        .limit(500);
      if (!error) setRows((data ?? []) as Row[]);
      setLoading(false);
    })();
  }, []);

  const now = Date.now();
  const last24h = rows.filter((r) => now - new Date(r.created_at).getTime() < 86_400_000).length;
  const last7d = rows.filter((r) => now - new Date(r.created_at).getTime() < 7 * 86_400_000).length;

  const byBank = new Map<string, number>();
  const byPath = new Map<string, number>();
  for (const r of rows) {
    if (r.bank_id) byBank.set(r.bank_id, (byBank.get(r.bank_id) ?? 0) + 1);
    byPath.set(r.path, (byPath.get(r.path) ?? 0) + 1);
  }
  const topBanks = [...byBank.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const topPaths = [...byPath.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Statistik</h1>
        <p className="text-sm text-muted-foreground">Letzte 500 Besuche.</p>
      </div>
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Besuche (letzte 24 h)" value={last24h} />
            <StatCard label="Besuche (letzte 7 Tage)" value={last7d} />
            <StatCard label="Gesamt (max 500)" value={rows.length} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Top Banken</CardTitle></CardHeader>
              <CardContent>
                {topBanks.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Keine Daten</div>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {topBanks.map(([id, n]) => (
                      <li key={id} className="flex justify-between">
                        <span className="truncate">{id}</span>
                        <span className="tabular-nums text-muted-foreground">{n}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Top Pfade</CardTitle></CardHeader>
              <CardContent>
                {topPaths.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Keine Daten</div>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {topPaths.map(([p, n]) => (
                      <li key={p} className="flex justify-between">
                        <span className="truncate">{p}</span>
                        <span className="tabular-nums text-muted-foreground">{n}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">Aktuelle Besuche</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="px-3 py-2">Zeit</th>
                      <th className="px-3 py-2">Pfad</th>
                      <th className="px-3 py-2">Bank</th>
                      <th className="px-3 py-2">Referrer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 100).map((r, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">{new Date(r.created_at).toLocaleString("de-DE")}</td>
                        <td className="px-3 py-2 font-mono text-xs">{r.path}</td>
                        <td className="px-3 py-2">{r.bank_id ?? "—"}</td>
                        <td className="px-3 py-2 text-xs truncate max-w-xs">{r.referrer ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent><div className="text-2xl font-semibold">{value.toLocaleString("de-DE")}</div></CardContent>
    </Card>
  );
}
