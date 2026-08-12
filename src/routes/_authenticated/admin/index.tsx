import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Layers, Images, BarChart3, DownloadCloud } from "lucide-react";
import { syncFromSnapshot } from "@/lib/snapshot-seed.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Overview,
});

function Overview() {
  const [counts, setCounts] = useState({ banks: 0, groups: 0, partners: 0, visits: 0 });
  useEffect(() => {
    (async () => {
      const [banks, groups, partners, visits] = await Promise.all([
        supabase.from("banks").select("id", { count: "exact", head: true }),
        supabase.from("bank_groups").select("name", { count: "exact", head: true }),
        supabase.from("partner_logos").select("id", { count: "exact", head: true }),
        supabase.from("visit_events").select("id", { count: "exact", head: true }).like("user_agent", "HUMAN|%"),
      ]);
      setCounts({
        banks: banks.count ?? 0,
        groups: groups.count ?? 0,
        partners: partners.count ?? 0,
        visits: visits.count ?? 0,
      });
    })();
  }, []);

  const items = [
    { to: "/admin/banks", label: "Banken", value: counts.banks, icon: Building2 },
    { to: "/admin/groups", label: "Gruppen", value: counts.groups, icon: Layers },
    { to: "/admin/partners", label: "Partner-Logos", value: counts.partners, icon: Images },
    { to: "/admin/stats", label: "Besuche gesamt", value: counts.visits, icon: BarChart3 },
  ] as const;

  const runSync = useServerFn(syncFromSnapshot);
  const [syncing, setSyncing] = useState(false);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await runSync();
      toast.success(
        `Snapshot wiederhergestellt: ${res.banks} Banken, ${res.groups} Gruppen, ${res.addresses} Adressen, ${res.routes} Routen.`,
      );
      const [banks, groups, partners, visits] = await Promise.all([
        supabase.from("banks").select("id", { count: "exact", head: true }),
        supabase.from("bank_groups").select("name", { count: "exact", head: true }),
        supabase.from("partner_logos").select("id", { count: "exact", head: true }),
        supabase.from("visit_events").select("id", { count: "exact", head: true }).like("user_agent", "HUMAN|%"),
      ]);
      setCounts({
        banks: banks.count ?? 0,
        groups: groups.count ?? 0,
        partners: partners.count ?? 0,
        visits: visits.count ?? 0,
      });
    } catch (e: any) {
      toast.error(e?.message ?? "Fehler beim Wiederherstellen");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Übersicht</h1>
          <p className="text-sm text-muted-foreground">Verwalte Banken, Gruppen, Partner-Logos und sieh dir die Besuchsstatistik an.</p>
        </div>
        <Button onClick={handleSync} disabled={syncing} variant="outline">
          <DownloadCloud className="h-4 w-4 mr-2" />
          {syncing ? "Wird wiederhergestellt…" : "Snapshot wiederherstellen"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground -mt-4">
        Spielt Banken, Logos, Links, Adress-Pool und Domain-Routen aus dem im Code hinterlegten Snapshot in die Datenbank ein. Nach Remix oder Workspace-Übergabe einmal ausführen.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it) => (
          <Link key={it.to} to={it.to}>
            <Card className="hover:shadow-md transition">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{it.label}</CardTitle>
                <it.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{it.value.toLocaleString("de-DE")}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
