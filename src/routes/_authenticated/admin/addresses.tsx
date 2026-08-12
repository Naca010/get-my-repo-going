import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Upload, Copy, Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/addresses")({
  head: () => ({ meta: [{ title: "Adressen-Pool – Admin" }] }),
  component: AddressesAdmin,
});

type Address = {
  id: string;
  domain: string;
  street: string;
  zip: string;
  city: string;
  note: string | null;
  used_at: string | null;
  created_at: string;
};

type DomainRoute = { id: string; label: string; domain: string | null };

const NO_DOMAIN_VALUE = "__none__";
const NEW_DOMAIN_VALUE = "__new__";

function AddressesAdmin() {
  const [rows, setRows] = useState<Address[]>([]);
  const [domains, setDomains] = useState<DomainRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const [addr, dom] = await Promise.all([
      supabase.from("address_pool").select("*").order("created_at", { ascending: false }),
      supabase.from("domain_routes").select("id,label,domain").order("label"),
    ]);
    if (addr.error) toast.error(addr.error.message);
    if (dom.error) toast.error(dom.error.message);
    setRows((addr.data ?? []) as Address[]);
    setDomains((dom.data ?? []) as DomainRoute[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const domainOptions = useMemo(() => {
    const set = new Set<string>();
    domains.forEach((d) => { if (d.label) set.add(d.label); });
    rows.forEach((r) => { if (r.domain) set.add(r.domain); });
    return Array.from(set).sort();
  }, [domains, rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filter === NO_DOMAIN_VALUE) {
        if (r.domain && r.domain.trim() !== "") return false;
      } else if (filter !== "all" && r.domain !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !r.street.toLowerCase().includes(q) &&
          !r.zip.includes(q) &&
          !r.city.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [rows, filter, search]);

  const remove = async (id: string) => {
    if (!confirm("Adresse löschen?")) return;
    const { error } = await supabase.from("address_pool").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Gelöscht");
    load();
  };

  const removeAll = async () => {
    if (filter === "all") { toast.error("Bitte zuerst eine Domain auswählen"); return; }
    const targetLabel = filter === NO_DOMAIN_VALUE ? "ohne Domain" : filter;
    if (!confirm(`Alle Adressen für „${targetLabel}" löschen?`)) return;
    const query = filter === NO_DOMAIN_VALUE
      ? supabase.from("address_pool").delete().or("domain.eq.,domain.is.null")
      : supabase.from("address_pool").delete().eq("domain", filter);
    const { error } = await query;
    if (error) { toast.error(error.message); return; }
    toast.success("Gelöscht");
    load();
  };

  const exportBulk = () => {
    const lines = filtered.map((r) => `${r.street};${r.zip};${r.city}`);
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const suffix = filter === NO_DOMAIN_VALUE ? "ohne-domain" : filter;
    a.download = `addresses-${suffix}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyBulk = async () => {
    const lines = filtered.map((r) => `${r.street};${r.zip};${r.city}`);
    await navigator.clipboard.writeText(lines.join("\n"));
    toast.success(`${lines.length} Adressen kopiert`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Adressen-Pool</h1>
          <p className="text-sm text-muted-foreground">
            Adressen verwalten – Domain erstmal optional. Bulk-Format: <code>str.;plz;ort</code>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Einzeln</Button>
          <Button onClick={() => setBulkOpen(true)}><Upload className="mr-2 h-4 w-4" /> Bulk-Import</Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="w-56">
              <Label>Domain</Label>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value={NO_DOMAIN_VALUE}>Ohne Domain</SelectItem>
                  {domainOptions.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-64">
              <Label>Suche</Label>
              <Input placeholder="Straße, PLZ oder Ort" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Button variant="outline" onClick={copyBulk} disabled={!filtered.length}>
              <Copy className="mr-2 h-4 w-4" /> Bulk kopieren
            </Button>
            <Button variant="outline" onClick={exportBulk} disabled={!filtered.length}>
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            {filter !== "all" && (
              <Button variant="destructive" onClick={removeAll}>
                <Trash2 className="mr-2 h-4 w-4" /> Alle löschen
              </Button>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            {loading ? "Lädt…" : `${filtered.length} von ${rows.length} Adressen`}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Adressen</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Keine Adressen</div>
          ) : (
            <div className="divide-y">
              {filtered.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">
                      {r.street}, {r.zip} {r.city}
                    </div>
                    <div className="text-xs text-muted-foreground flex gap-2 items-center mt-0.5">
                      <Badge variant="outline" className="text-xs">
                        {r.domain && r.domain.trim() !== "" ? r.domain : "Ohne Domain"}
                      </Badge>
                      {r.used_at && <span>benutzt {new Date(r.used_at).toLocaleString("de-DE")}</span>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove(r.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <BulkImportDialog
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        domains={domainOptions}
        onDone={load}
      />
      <AddDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        domains={domainOptions}
        onDone={load}
      />
    </div>
  );
}

function parseLine(line: string): { street: string; zip: string; city: string } | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  // Preferred: str;plz;ort
  if (trimmed.includes(";")) {
    const parts = trimmed.split(";").map((s) => s.trim());
    const [s, z, c] = parts;
    if (parts.length >= 3 && s && z && c) {
      return { street: s, zip: z, city: c };
    }
  }
  // Fallback: "Str. 8, 12345 Berlin"
  const m = trimmed.match(/^(.+?),\s*(\d{4,5})\s+(.+)$/);
  if (m && m[1] && m[2] && m[3]) return { street: m[1].trim(), zip: m[2], city: m[3].trim() };
  return null;
}

function useDomainSelect(domains: string[]) {
  const [domain, setDomain] = useState("");
  const [customDomain, setCustomDomain] = useState("");

  useEffect(() => {
    setDomain(domains[0] ? domains[0] : NO_DOMAIN_VALUE);
    setCustomDomain("");
  }, [domains.join(",")]);

  const effectiveDomain = useMemo(() => {
    if (domain === NO_DOMAIN_VALUE) return "";
    if (domain === NEW_DOMAIN_VALUE) return customDomain.trim();
    return domain.trim();
  }, [domain, customDomain]);

  const DomainSelect = ({ label = "Domain" }: { label?: string }) => (
    <div>
      <Label>{label}</Label>
      <Select value={domain} onValueChange={setDomain}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_DOMAIN_VALUE}>Ohne Domain</SelectItem>
          {domains.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          <SelectItem value={NEW_DOMAIN_VALUE}>+ Neue Domain…</SelectItem>
        </SelectContent>
      </Select>
      {domain === NEW_DOMAIN_VALUE && (
        <Input
          className="mt-2"
          placeholder="Domain-Label"
          value={customDomain}
          onChange={(e) => setCustomDomain(e.target.value)}
        />
      )}
    </div>
  );

  return { domain, setDomain, customDomain, setCustomDomain, effectiveDomain, DomainSelect };
}

function BulkImportDialog({
  open, onClose, domains, onDone,
}: { open: boolean; onClose: () => void; domains: string[]; onDone: () => void }) {
  const { effectiveDomain, DomainSelect } = useDomainSelect(domains);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) setText(""); }, [open]);

  const submit = async () => {
    const lines = text.split(/\r?\n/);
    const parsed: { domain: string; street: string; zip: string; city: string }[] = [];
    const errors: string[] = [];
    lines.forEach((l, i) => {
      if (!l.trim()) return;
      const p = parseLine(l);
      if (!p) errors.push(`Zeile ${i + 1}: „${l}"`);
      else parsed.push({ domain: effectiveDomain, ...p });
    });
    if (!parsed.length) { toast.error("Keine gültigen Zeilen"); return; }
    setSaving(true);
    const { error } = await supabase
      .from("address_pool")
      .upsert(parsed, { onConflict: "domain,street,zip,city", ignoreDuplicates: true });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${parsed.length} Adressen importiert${errors.length ? ` (${errors.length} übersprungen)` : ""}`);
    if (errors.length) console.warn("Übersprungen:", errors);
    onDone();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Bulk-Import</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <DomainSelect />
          <div>
            <Label>Adressen (eine pro Zeile, Format <code>str.;plz;ort</code>)</Label>
            <Textarea
              rows={12}
              className="font-mono text-sm"
              placeholder={"Bahnhofstr. 8;12345;Berlin\nHauptstr. 1;54321;München"}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Abbrechen</Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Importieren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddDialog({
  open, onClose, domains, onDone,
}: { open: boolean; onClose: () => void; domains: string[]; onDone: () => void }) {
  const { effectiveDomain, DomainSelect } = useDomainSelect(domains);
  const [street, setStreet] = useState("");
  const [zip, setZip] = useState("");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setStreet(""); setZip(""); setCity(""); }
  }, [open]);

  const submit = async () => {
    if (!street.trim() || !zip.trim() || !city.trim()) {
      toast.error("Straße, PLZ und Ort ausfüllen"); return;
    }
    setSaving(true);
    const { error } = await supabase.from("address_pool").insert({
      domain: effectiveDomain, street: street.trim(), zip: zip.trim(), city: city.trim(),
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Hinzugefügt");
    onDone(); onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Adresse hinzufügen</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <DomainSelect />
          <div>
            <Label>Straße & Nr.</Label>
            <Input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Bahnhofstr. 8" />
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-2">
            <div>
              <Label>PLZ</Label>
              <Input value={zip} onChange={(e) => setZip(e.target.value)} placeholder="12345" />
            </div>
            <div>
              <Label>Ort</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Berlin" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Abbrechen</Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
