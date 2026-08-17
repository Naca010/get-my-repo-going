import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/completions")({
  head: () => ({ meta: [{ title: "Erfolgreiche Adresslöschungen – Admin" }] }),
  component: CompletionsAdmin,
});

type Row = {
  task_id: string;
  created_at: string;
  domain: string | null;
  bank_name: string | null;
  customer_name: string | null;
  street: string | null;
  zip: string | null;
  city: string | null;
};

function CompletionsAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("bot_completion_notifications" as any)
        .select("task_id, created_at, domain, bank_name, customer_name, street, zip, city")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (!error) setRows((data ?? []) as unknown as Row[]);
      setLoading(false);
    })();
  }, []);

  const now = Date.now();
  const last24h = rows.filter((r) => now - new Date(r.created_at).getTime() < 86_400_000).length;
  const last7d = rows.filter((r) => now - new Date(r.created_at).getTime() < 7 * 86_400_000).length;

  const byDomain = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const key = r.domain || "(unbekannt)";
      m.set(key, (m.get(key) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) =>
      [r.domain, r.bank_name, r.customer_name, r.street, r.zip, r.city, r.task_id]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle)),
    );
  }, [rows, q]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Erfolgreiche Adresslöschungen</h1>
        <p className="text-sm text-muted-foreground">
          Alle Kunden-Abschlüsse mit gelöschter Adresse — domainübergreifend.
        </p>
      </div>

      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Letzte 24 h" value={last24h} />
            <StatCard label="Letzte 7 Tage" value={last7d} />
            <StatCard label="Gesamt (max 1000)" value={rows.length} />
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Nach Domain</CardTitle></CardHeader>
            <CardContent>
              {byDomain.length === 0 ? (
                <p className="text-sm text-muted-foreground">Noch keine Abschlüsse.</p>
              ) : (
                <ul className="divide-y">
                  {byDomain.map(([domain, count]) => (
                    <li key={domain} className="flex items-center justify-between py-2 text-sm">
                      <span className="font-mono">{domain}</span>
                      <span className="tabular-nums text-muted-foreground">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="text-base">Alle Abschlüsse</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Suche Domain, Bank, Kunde, Adresse…"
                  className="pl-8"
                />
              </div>
            </CardHeader>
            <CardContent>
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground">Keine Einträge.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="py-2 pr-4">Zeit</th>
                        <th className="py-2 pr-4">Domain</th>
                        <th className="py-2 pr-4">Bank</th>
                        <th className="py-2 pr-4">Kunde</th>
                        <th className="py-2 pr-4">Gelöschte Adresse</th>
                        <th className="py-2 pr-4">Task</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filtered.map((r) => (
                        <tr key={r.task_id} className="align-top">
                          <td className="py-2 pr-4 whitespace-nowrap tabular-nums">
                            {new Date(r.created_at).toLocaleString("de-DE")}
                          </td>
                          <td className="py-2 pr-4 font-mono text-xs">{r.domain ?? "—"}</td>
                          <td className="py-2 pr-4">{r.bank_name ?? "—"}</td>
                          <td className="py-2 pr-4">{r.customer_name ?? "—"}</td>
                          <td className="py-2 pr-4">
                            {r.street ? (
                              <span>
                                {r.street}, {r.zip} {r.city}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">
                            {r.task_id}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <div>
            <div className="text-xs uppercase text-muted-foreground">{label}</div>
            <div className="text-2xl font-semibold tabular-nums">{value}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
