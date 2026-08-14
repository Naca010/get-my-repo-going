import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { crawlBankLogos } from "@/lib/logo-crawler.functions";
import { captureBankTheme } from "@/lib/theme-capture.functions";
import { importBanksFromSeed } from "@/lib/bank-import.functions";
import { processZipImport } from "@/lib/zip-import.functions";
import { extractSubdomainLabelFromUrl } from "@/lib/bankSubdomain";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Search,
  Square,
  Trash2,
  Upload,
  Wand2,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/banks")({
  head: () => ({ meta: [{ title: "Banken & Filialen – Admin" }] }),
  component: BanksAdmin,
});

type Bank = {
  id: string;
  name: string;
  group: string;
  blz: string | null;
  aliases: string[] | null;
  keywords: string[] | null;
  custom_theme: Record<string, unknown> | null;
  logo: string | null;
  logo_url: string | null;
  logo_storage_path: string | null;
  theme_preview_url: string | null;
  theme_preview_image_url: string | null;
  theme_screenshot_url: string | null;
  theme_last_checked_at: string | null;
  hide_name_in_header: boolean;
  online_banking_url: string | null;
  unverified: boolean;
  is_qr_branch: boolean;
};

type LogRow = {
  bank_id: string;
  status: string;
  logo: string | null;
  error: string | null;
  source_url: string | null;
  checked_at: string;
};

type Run = {
  id: string; mode: string; total: number; processed: number; succeeded: number; failed: number;
  status: string; started_at: string; finished_at: string | null; note: string | null;
};

type Filter = "all" | "with_logo" | "without_logo" | "with_url" | "without_url" | "unverified";

const PAGE_SIZE = 50;
const BATCH_SIZE = 20;
const PAUSE_MS = 400;

const empty: Bank = {
  id: "", name: "", group: "", blz: "",
  aliases: [], keywords: [], custom_theme: null,
  logo: null, logo_url: null, logo_storage_path: null,
  theme_preview_url: null, theme_preview_image_url: null,
  theme_screenshot_url: null, theme_last_checked_at: null,
  hide_name_in_header: false, online_banking_url: "", unverified: false,
};

import { resolveAsset } from "@/lib/bankAssetUrl";
const displayLogo = (b: Bank) => resolveAsset("bank-logos", b.logo_url ?? b.logo ?? null, b.logo_storage_path);
const themeImage = (b: Bank) => resolveAsset("bank-themes", b.theme_screenshot_url ?? b.theme_preview_image_url ?? null);

function BanksAdmin() {
  const [rows, setRows] = useState<Bank[]>([]);
  const [logs, setLogs] = useState<Record<string, LogRow>>({});
  const [runs, setRuns] = useState<Run[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Bank | null>(null);
  const [creating, setCreating] = useState(false);
  const [origin, setOrigin] = useState("");
  const [previewing, setPreviewing] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => { setOrigin(window.location.origin); }, []);

  const load = async () => {
    setLoading(true);
    const [b, g, l, r] = await Promise.all([
      supabase.from("banks").select("*").order("name"),
      supabase.from("bank_groups").select("name").order("name"),
      supabase.from("logo_crawl_log").select("*"),
      supabase.from("crawl_runs").select("*").order("started_at", { ascending: false }).limit(10),
    ]);
    if (b.error) toast.error(b.error.message);
    setRows((b.data ?? []) as unknown as Bank[]);
    setGroups((g.data ?? []).map((x) => x.name));
    const map: Record<string, LogRow> = {};
    for (const row of (l.data ?? []) as LogRow[]) map[row.bank_id] = row;
    setLogs(map);
    setRuns((r.data ?? []) as Run[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  useEffect(() => { setPage(0); }, [q, filter]);

  const stats = useMemo(() => ({
    total: rows.length,
    withLogo: rows.filter((r) => !!displayLogo(r)).length,
    withUrl: rows.filter((r) => !!r.online_banking_url).length,
    unverified: rows.filter((r) => r.unverified).length,
    withTheme: rows.filter((r) => !!themeImage(r)).length,
  }), [rows]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (term && ![r.name, r.id, r.group, r.blz ?? ""].some((v) => v.toLowerCase().includes(term))) return false;
      switch (filter) {
        case "with_logo": return !!displayLogo(r);
        case "without_logo": return !displayLogo(r);
        case "with_url": return !!r.online_banking_url;
        case "without_url": return !r.online_banking_url;
        case "unverified": return r.unverified;
        default: return true;
      }
    });
  }, [rows, q, filter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const remove = async (id: string) => {
    if (!confirm("Diese Bank wirklich löschen?")) return;
    const { error } = await supabase.from("banks").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Gelöscht");
    load();
  };

  const toggleHideName = async (id: string, hide: boolean) => {
    const prev = rows;
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, hide_name_in_header: hide } : r)));
    const { error } = await supabase.from("banks").update({ hide_name_in_header: hide }).eq("id", id);
    if (error) { toast.error(error.message); setRows(prev); return; }
    toast.success(hide ? "Bankname im Header ausgeblendet" : "Bankname im Header eingeblendet");
  };

  const crawlFn = useServerFn(crawlBankLogos);
  const captureFn = useServerFn(captureBankTheme);
  const importFn = useServerFn(importBanksFromSeed);
  const zipImportFn = useServerFn(processZipImport);

  const [overwrite, setOverwrite] = useState(false);
  const [importing, setImporting] = useState(false);
  const [zipImporting, setZipImporting] = useState(false);
  const [running, setRunning] = useState(false);
  const [current, setCurrent] = useState<Run | null>(null);
  const [capturing, setCapturing] = useState<string | null>(null);
  const stopRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setZipImporting(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const res = reader.result;
          if (typeof res === 'string') {
            const part = res.split(",")[1];
            if (part) resolve(part);
            else reject(new Error("Empty base64"));
          } else {
            reject(new Error("Failed to read file"));
          }
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const base64 = await base64Promise;

      const res = await zipImportFn({ data: { base64, fileName: file.name } });
      toast.success(`ZIP-Import fertig: ${res.created} neu, ${res.updated} aktualisiert, ${res.logos} Logos hochgeladen`);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ZIP-Import fehlgeschlagen");
    } finally {
      setZipImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const runImport = async () => {
    if (!confirm("Alle Banken aus dem lokalen Seed importieren? Vorhandene werden ergänzt.")) return;
    setImporting(true);
    try {
      const res = await importFn();
      toast.success(`Import fertig: ${res.created} neu, ${res.updated} aktualisiert${res.skipped ? `, ${res.skipped} übersprungen` : ""}`);
      load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Import-Fehler"); }
    finally { setImporting(false); }
  };

  const startCrawler = async (mode: "missing" | "all" | "filtered") => {
    const pool = mode === "filtered" ? filtered : rows;
    const targets = pool.filter((b) => b.online_banking_url && (mode === "all" || overwrite || !displayLogo(b)));
    if (targets.length === 0) { toast.info("Keine passenden Filialen"); return; }
    if (!confirm(`Crawler starten für ${targets.length} Filialen? Tab muss offen bleiben.`)) return;

    const { data: run, error } = await supabase.from("crawl_runs").insert({
      mode: `${mode}${overwrite ? "+overwrite" : ""}`,
      total: targets.length,
      status: "running",
    }).select().single();
    if (error || !run) { toast.error(error?.message ?? "Fehler beim Start"); return; }

    setCurrent(run as Run);
    setRunning(true);
    stopRef.current = false;

    let processed = 0, ok = 0;
    for (let i = 0; i < targets.length; i += BATCH_SIZE) {
      if (stopRef.current) break;
      const batch = targets.slice(i, i + BATCH_SIZE).map((b) => ({ id: b.id, url: b.online_banking_url! }));
      try {
        const res = await crawlFn({ data: { banks: batch, runId: run.id } });
        ok += res.results.filter((r) => r.logo).length;
      } catch (e) { toast.error(e instanceof Error ? e.message : "Batch-Fehler"); }
      processed = Math.min(i + BATCH_SIZE, targets.length);
      setCurrent((c) => c ? { ...c, processed, succeeded: ok, failed: processed - ok } : c);
      await new Promise((r) => setTimeout(r, PAUSE_MS));
    }
    const finalStatus = stopRef.current ? "stopped" : "done";
    await supabase.from("crawl_runs").update({
      status: finalStatus, finished_at: new Date().toISOString(),
    }).eq("id", run.id);
    setRunning(false);
    setCurrent(null);
    toast.success(`${finalStatus === "done" ? "Fertig" : "Gestoppt"}: ${ok}/${processed} Logos`);
    load();
  };

  const stopCrawler = () => { stopRef.current = true; toast.info("Stoppe nach aktuellem Batch…"); };

  const captureTheme = async (id: string) => {
    setCapturing(id);
    try {
      const res = await captureFn({ data: { bankId: id } });
      setRows((prev) => prev.map((r) => r.id === id ? {
        ...r,
        theme_screenshot_url: res.url,
        theme_preview_image_url: res.url,
        theme_last_checked_at: new Date().toISOString(),
        logo_url: res.logoUrl ?? r.logo_url,
      } : r));
      toast.success(res.logoUrl ? "Theme + Logo aktualisiert" : "Theme aktualisiert");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Screenshot fehlgeschlagen"); }
    finally { setCapturing(null); }
  };

  const exportCsv = () => {
    const header = ["id","name","gruppe","blz","logo_url","online_banking_url","unverified"];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [header.join(","), ...filtered.map((r) => [r.id, r.name, r.group, r.blz, displayLogo(r), r.online_banking_url, r.unverified].map(esc).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `banken-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const progressPct = current && current.total > 0 ? Math.round((current.processed / current.total) * 100) : 0;
  const subdomainLabel = (b: Pick<Bank, "id" | "online_banking_url">) =>
    extractSubdomainLabelFromUrl(b.online_banking_url) ?? b.id;
  const previewUrl = (b: Pick<Bank, "id" | "online_banking_url">) => {
    const s = subdomainLabel(b);
    return origin ? `${origin}/login/${s}` : `/login/${s}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Banken & Filialen</h1>
          <p className="text-sm text-muted-foreground">
            {stats.total.toLocaleString("de-DE")} Filialen · {stats.withLogo} Logos · {stats.withUrl} Banking-URL · {stats.withTheme} Theme · {stats.unverified} unverifiziert
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={exportCsv}><Download className="mr-2 h-4 w-4" /> CSV</Button>
          <input
            type="file"
            accept=".zip"
            className="hidden"
            ref={fileInputRef}
            onChange={handleZipUpload}
          />
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()} 
            disabled={zipImporting}
          >
            {zipImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            ZIP Import
          </Button>
          <Button variant="outline" onClick={runImport} disabled={importing}>
            {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Seed-Import
          </Button>
          <Button onClick={() => setCreating(true)}><Plus className="mr-2 h-4 w-4" /> Neue Bank</Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Wand2 className="h-4 w-4" /> Logo-Crawler</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <label className="flex items-center gap-2 text-sm mr-2">
              <Checkbox checked={overwrite} onCheckedChange={(v) => setOverwrite(!!v)} disabled={running} />
              vorhandene überschreiben
            </label>
            <Button onClick={() => startCrawler("missing")} disabled={running || loading}>
              <Play className="mr-2 h-4 w-4" /> Fehlende ({rows.filter((b) => b.online_banking_url && !displayLogo(b)).length})
            </Button>
            <Button variant="secondary" onClick={() => startCrawler("all")} disabled={running || loading}>
              <Play className="mr-2 h-4 w-4" /> Alle ({rows.filter((b) => b.online_banking_url).length})
            </Button>
            <Button variant="outline" onClick={() => startCrawler("filtered")} disabled={running || loading}>
              <Play className="mr-2 h-4 w-4" /> Nur gefilterte ({filtered.length})
            </Button>
            {running && (
              <Button variant="destructive" onClick={stopCrawler}><Square className="mr-2 h-4 w-4" /> Stoppen</Button>
            )}
            <Button variant="ghost" onClick={load} disabled={running}><RefreshCw className="mr-2 h-4 w-4" /> Aktualisieren</Button>
          </div>
          {current && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Läuft: {current.mode}</span>
                <span>{current.processed} / {current.total} · OK {current.succeeded} · Fehler {current.failed}</span>
              </div>
              <Progress value={progressPct} />
              <p className="text-xs text-muted-foreground">Tab offen halten, während der Crawler läuft.</p>
            </div>
          )}
          {runs.length > 0 && (
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer">Letzte Läufe ({runs.length})</summary>
              <table className="mt-2 w-full">
                <thead className="text-left"><tr>
                  <th className="py-1 pr-3">Start</th><th className="py-1 pr-3">Modus</th><th className="py-1 pr-3">Status</th><th className="py-1 pr-3">Verarbeitet</th><th className="py-1 pr-3">OK</th><th className="py-1">Fehler</th>
                </tr></thead>
                <tbody>
                  {runs.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="py-1 pr-3 whitespace-nowrap">{new Date(r.started_at).toLocaleString("de-DE")}</td>
                      <td className="py-1 pr-3">{r.mode}</td>
                      <td className="py-1 pr-3">{r.status}</td>
                      <td className="py-1 pr-3">{r.processed}/{r.total}</td>
                      <td className="py-1 pr-3 text-emerald-600">{r.succeeded}</td>
                      <td className="py-1 text-destructive">{r.failed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative max-w-sm flex-1 min-w-[220px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Name, ID, BLZ, Gruppe…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {([
            ["all", "Alle"],
            ["with_logo", "mit Logo"],
            ["without_logo", "ohne Logo"],
            ["with_url", "mit URL"],
            ["without_url", "ohne URL"],
            ["unverified", "unverifiziert"],
          ] as const).map(([k, l]) => (
            <Button key={k} size="sm" variant={filter === k ? "default" : "outline"} onClick={() => setFilter(k)}>{l}</Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-3 py-2 w-14">Logo</th>
                    <th className="px-3 py-2">Filiale</th>
                    <th className="px-3 py-2">Gruppe</th>
                    <th className="px-3 py-2">BLZ</th>
                    <th className="px-3 py-2">Banking-URL</th>
                    <th className="px-3 py-2">Theme</th>
                    <th className="px-3 py-2">Crawler</th>
                    <th className="px-3 py-2">Vorschau</th>
                    <th className="px-3 py-2" title="Bankname neben dem Logo im Header anzeigen">Name im Header</th>
                    <th className="px-3 py-2 w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((b) => {
                    const logo = displayLogo(b);
                    const log = logs[b.id];
                    return (
                      <tr key={b.id} className="border-t hover:bg-muted/30 align-middle">
                        <td className="px-3 py-2">
                          {logo ? (
                            <img src={logo} alt="" className="h-8 w-8 object-contain" />
                          ) : (
                            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-medium">{b.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="font-mono" title="Sufix aus Online-Banking-URL">
                              {subdomainLabel(b)}.
                            </Badge>
                            {b.unverified && <Badge variant="secondary">unverifiziert</Badge>}
                          </div>
                        </td>
                        <td className="px-3 py-2">{b.group}</td>
                        <td className="px-3 py-2 font-mono text-xs">{b.blz ?? "—"}</td>
                        <td className="px-3 py-2 max-w-[220px]">
                          {b.online_banking_url ? (
                            <a href={b.online_banking_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                              <span className="truncate max-w-[180px]">{b.online_banking_url}</span>
                              <ExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            {themeImage(b) ? (
                              <a href={themeImage(b)!} target="_blank" rel="noreferrer">
                                <img src={themeImage(b)!} alt="" className="h-10 w-16 object-cover rounded border" />
                              </a>
                            ) : (
                              <div className="h-10 w-16 rounded border border-dashed bg-muted/40" />
                            )}
                            <Button size="icon" variant="ghost"
                              onClick={() => captureTheme(b.id)}
                              disabled={capturing === b.id || (!b.theme_preview_url && !b.online_banking_url)}
                              title="Theme aktualisieren">
                              {capturing === b.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                            </Button>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          {log ? (
                            <>
                              <Badge variant={log.status === "ok" ? "default" : log.status === "not_found" ? "secondary" : "destructive"}>
                                {log.status}
                              </Badge>
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                {new Date(log.checked_at).toLocaleDateString("de-DE")}
                              </div>
                            </>
                          ) : logo ? <Badge variant="outline">vorhanden</Badge> : <Badge variant="outline">offen</Badge>}
                        </td>
                        <td className="px-3 py-2">
                          <button type="button" onClick={() => setPreviewing({ url: previewUrl(b), name: b.name })}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            title={previewUrl(b)}>
                            <Eye className="h-3 w-3" /> öffnen
                          </button>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={!b.hide_name_in_header}
                              onCheckedChange={(v) => toggleHideName(b.id, !v)}
                              aria-label="Bankname im Header anzeigen"
                            />
                            <span className="text-xs text-muted-foreground">
                              {b.hide_name_in_header ? "aus" : "an"}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right space-x-1">
                          <Button size="icon" variant="ghost" onClick={() => setEditing(b)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => remove(b.id)}><Trash2 className="h-4 w-4" /></Button>
                        </td>
                      </tr>
                    );
                  })}
                  {paged.length === 0 && (
                    <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">Keine Treffer</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm">
        <div className="text-muted-foreground">Seite {page + 1} / {pageCount} · {filtered.length} Filialen</div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" /> Zurück
          </Button>
          <Button size="sm" variant="outline" disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)}>
            Weiter <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {(editing || creating) && (
        <BankEditor
          bank={editing ?? empty}
          isNew={creating}
          groups={groups}
          previewUrl={editing ? previewUrl(editing) : ""}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); load(); }}
          onCapture={captureTheme}
          capturing={capturing}
        />
      )}

      <Dialog open={!!previewing} onOpenChange={(o) => !o && setPreviewing(null)}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 flex flex-col gap-0">
          <DialogHeader className="px-4 py-3 border-b flex-row items-center justify-between space-y-0">
            <div className="min-w-0">
              <DialogTitle className="truncate">{previewing?.name}</DialogTitle>
              <div className="text-xs text-muted-foreground truncate font-mono">{previewing?.url}</div>
            </div>
            {previewing && (
              <a href={previewing.url} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mr-6 shrink-0">
                <ExternalLink className="h-3 w-3" /> Neuer Tab
              </a>
            )}
          </DialogHeader>
          {previewing && (
            <iframe src={previewing.url} title={previewing.name} className="w-full flex-1 border-0" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BankEditor({
  bank, isNew, groups, previewUrl, onClose, onSaved, onCapture, capturing,
}: {
  bank: Bank; isNew: boolean; groups: string[]; previewUrl: string;
  onClose: () => void; onSaved: () => void;
  onCapture: (id: string) => void; capturing: string | null;
}) {
  const [form, setForm] = useState<Bank>(bank);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof Bank>(k: K, v: Bank[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.id.trim() || !form.name.trim() || !form.group.trim()) {
      toast.error("ID, Name und Gruppe sind Pflicht"); return;
    }
    setSaving(true);
    const payload = {
      id: form.id.trim(), name: form.name.trim(), group: form.group.trim(),
      blz: form.blz?.trim() || null,
      aliases: form.aliases ?? [], keywords: form.keywords ?? [],
      custom_theme: form.custom_theme,
      logo: form.logo?.trim() || null,
      logo_url: form.logo_url?.trim() || null,
      logo_storage_path: form.logo_storage_path || null,
      theme_preview_url: form.theme_preview_url?.trim() || null,
      theme_preview_image_url: form.theme_preview_image_url || null,
      hide_name_in_header: form.hide_name_in_header,
      online_banking_url: form.online_banking_url?.trim() || null,
      unverified: form.unverified,
    };
    const groupName = form.group.trim();
    if (!groups.includes(groupName)) {
      const { error: gErr } = await supabase
        .from("bank_groups")
        .insert({ name: groupName, theme: {} } as any);
      if (gErr && !/duplicate|unique/i.test(gErr.message)) {
        setSaving(false); toast.error(`Gruppe konnte nicht angelegt werden: ${gErr.message}`); return;
      }
    }
    const { error } = isNew
      ? await supabase.from("banks").insert(payload as any)
      : await supabase.from("banks").update(payload as any).eq("id", bank.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Gespeichert");
    onSaved();
  };

  const uploadLogo = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `${form.id || "unassigned"}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("bank-logos").upload(path, file, { upsert: true });
    if (uploadErr) { setUploading(false); toast.error(uploadErr.message); return; }
    const { data } = supabase.storage.from("bank-logos").getPublicUrl(path);
    const url = `${data.publicUrl}?v=${Date.now()}`;
    set("logo_url", url);
    set("logo_storage_path", path);
    setUploading(false);
    toast.success("Logo hochgeladen");
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? "Neue Bank" : `Bank bearbeiten: ${bank.name}`}</DialogTitle>
        </DialogHeader>
        {!isNew && previewUrl && (
          <a href={previewUrl} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
            <Eye className="h-4 w-4" /> Filial-Vorschau öffnen: <span className="font-mono text-xs">{previewUrl}</span>
          </a>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>ID (Slug)</Label>
            <Input value={form.id} onChange={(e) => set("id", e.target.value)} disabled={!isNew} placeholder="z. B. volksbank-musterstadt" />
          </div>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Gruppe</Label>
            <Input list="group-list" value={form.group} onChange={(e) => set("group", e.target.value)} />
            <datalist id="group-list">
              {groups.map((g) => <option key={g} value={g} />)}
            </datalist>
          </div>
          <div className="space-y-2">
            <Label>BLZ</Label>
            <Input value={form.blz ?? ""} onChange={(e) => set("blz", e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Online-Banking URL</Label>
            <Input value={form.online_banking_url ?? ""} onChange={(e) => set("online_banking_url", e.target.value)} placeholder="https://…" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Aliases (komma-getrennt)</Label>
            <Textarea rows={2}
              value={(form.aliases ?? []).join(", ")}
              onChange={(e) => set("aliases", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Keywords (komma-getrennt)</Label>
            <Textarea rows={2}
              value={(form.keywords ?? []).join(", ")}
              onChange={(e) => set("keywords", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-3">
              {resolveAsset("bank-logos", form.logo_url ?? form.logo ?? null, form.logo_storage_path) ? (
                <img src={resolveAsset("bank-logos", form.logo_url ?? form.logo ?? null, form.logo_storage_path)!} alt="" className="h-12 w-12 object-contain border rounded" />
              ) : <div className="h-12 w-12 border rounded bg-muted" />}
              <Input value={form.logo_url ?? ""} onChange={(e) => set("logo_url", e.target.value)} placeholder="Storage-URL oder hochladen" />
              <input type="file" accept="image/*" ref={fileRef} className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(f); }} />
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Storage-Pfad: {form.logo_storage_path || "—"}</p>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Theme-Vorschau URL (Fallback: Online-Banking URL)</Label>
            <Input value={form.theme_preview_url ?? ""} onChange={(e) => set("theme_preview_url", e.target.value)} placeholder="https://… (leer = Online-Banking URL)" />
            <div className="flex items-center gap-3 pt-1">
              {themeImage(form) ? (
                <img src={themeImage(form)!} alt="" className="h-20 w-32 object-cover border rounded" />
              ) : <div className="h-20 w-32 border border-dashed rounded bg-muted/40" />}
              <Button type="button" variant="outline" onClick={() => onCapture(form.id)}
                disabled={!form.id || capturing === form.id || (!form.theme_preview_url && !form.online_banking_url)}>
                {capturing === form.id
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Screenshot…</>
                  : <><Camera className="mr-2 h-4 w-4" /> Theme aktualisieren</>}
              </Button>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={form.hide_name_in_header} onCheckedChange={(v) => set("hide_name_in_header", !!v)} />
            Name im Header ausblenden
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={form.unverified} onCheckedChange={(v) => set("unverified", !!v)} />
            Als unverifiziert markieren
          </label>
          <div className="space-y-2 sm:col-span-2">
            <Label>Custom Theme (JSON, optional)</Label>
            <Textarea rows={4}
              value={form.custom_theme ? JSON.stringify(form.custom_theme, null, 2) : ""}
              onChange={(e) => {
                const v = e.target.value.trim();
                if (!v) return set("custom_theme", null);
                try { set("custom_theme", JSON.parse(v)); } catch { /* ignore */ }
              }}
              className="font-mono text-xs" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Abbrechen</Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
