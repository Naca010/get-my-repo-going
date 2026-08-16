import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2, Globe, Server, KeyRound, Star } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/groups")({
  component: DomainsAdmin,
});

type DomainRoute = {
  id: string;
  label: string;
  domain: string | null;
  api_host: string;
  api_port: number;
  bot_token: string | null;
  is_default: boolean;
  address_group: string | null;
};


function DomainsAdmin() {
  const [rows, setRows] = useState<DomainRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<DomainRoute | null>(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("domain_routes")
      .select("*")
      .order("is_default", { ascending: false })
      .order("label");
    if (error) toast.error(error.message);
    setRows((data ?? []) as DomainRoute[]);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const remove = async (row: DomainRoute) => {
    if (!confirm(`Domain-Route „${row.label}" löschen?`)) return;
    const { error } = await supabase.from("domain_routes").delete().eq("id", row.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Gelöscht");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Domains</h1>
          <p className="text-sm text-muted-foreground">
            Pro Domain wird an eine eigene Bot-API weitergeleitet. {rows.length} Route(n).
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-2 h-4 w-4" /> Neue Domain
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-3 py-2">Bezeichnung</th>
                  <th className="px-3 py-2">Domain</th>
                  <th className="px-3 py-2">Bot-Backend</th>
                  <th className="px-3 py-2">Token</th>
                  <th className="px-3 py-2 w-24"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-muted/30">
                    <td className="px-3 py-2 font-medium">
                      <div className="flex items-center gap-2">
                        {r.is_default && (
                          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        )}
                        {r.label}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {r.domain || <span className="italic">alle (Fallback)</span>}
                    </td>
                    <td className="px-3 py-2 text-xs font-mono">
                      {r.api_host}:{r.api_port}
                    </td>
                    <td className="px-3 py-2 text-xs">{r.bot_token ? "••••••" : "—"}</td>
                    <td className="px-3 py-2 text-right space-x-1">
                      <Button size="icon" variant="ghost" onClick={() => setEditing(r)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(r)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-sm text-muted-foreground">
                      Noch keine Domain-Route.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {(editing || creating) && (
        <RouteEditor
          row={editing}
          isNew={creating}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSaved={() => {
            setEditing(null);
            setCreating(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function RouteEditor({
  row,
  isNew,
  onClose,
  onSaved,
}: {
  row: DomainRoute | null;
  isNew: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [label, setLabel] = useState(row?.label ?? "");
  const [domain, setDomain] = useState(row?.domain ?? "");
  const [apiHost, setApiHost] = useState(row?.api_host ?? "");
  const [apiPort, setApiPort] = useState(row?.api_port?.toString() ?? "8000");
  const [botToken, setBotToken] = useState(row?.bot_token ?? "");
  const [isDefault, setIsDefault] = useState(row?.is_default ?? false);
  const [addressGroup, setAddressGroup] = useState(row?.address_group ?? "");
  const [addressGroups, setAddressGroups] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("address_pool")
        .select("domain")
        .not("domain", "is", null);
      const set = new Set<string>();
      (data ?? []).forEach((r: any) => {
        if (r.domain && r.domain.trim()) set.add(r.domain.trim());
      });
      setAddressGroups(Array.from(set).sort());
    })();
  }, []);


  const save = async () => {
    if (!label.trim()) {
      toast.error("Bezeichnung erforderlich");
      return;
    }
    if (!apiHost.trim() || !apiPort) {
      toast.error("API-Host und Port erforderlich");
      return;
    }
    setSaving(true);

    // Only one default: clear elsewhere if we set it here
    if (isDefault) {
      const clear = await supabase
        .from("domain_routes")
        .update({ is_default: false })
        .neq("id", row?.id ?? "00000000-0000-0000-0000-000000000000");
      if (clear.error) {
        setSaving(false);
        toast.error(clear.error.message);
        return;
      }
    }

    const payload = {
      label: label.trim(),
      domain: domain.trim() || null,
      api_host: apiHost.trim(),
      api_port: Number(apiPort),
      bot_token: botToken.trim() || null,
      is_default: isDefault,
      address_group: addressGroup.trim() || null,
    };


    const res = isNew
      ? await supabase.from("domain_routes").insert(payload)
      : await supabase.from("domain_routes").update(payload).eq("id", row!.id);

    setSaving(false);
    if (res.error) {
      toast.error(res.error.message);
      return;
    }
    toast.success("Gespeichert");
    onSaved();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? "Neue Domain-Route" : `Bearbeiten: ${row?.label}`}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Bezeichnung</Label>
            <Input
              placeholder="z. B. Lovable Developer oder Kunde XY"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Globe className="h-4 w-4" /> Domain (Reverse-Proxy erkennt diese)
            </div>
            <Input
              placeholder="z. B. login.kunde-vr.de"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leer lassen und als Standard markieren, um für alle sonst nicht zugeordneten
              Domains zu greifen.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Switch checked={isDefault} onCheckedChange={setIsDefault} id="isdef" />
              <Label htmlFor="isdef" className="cursor-pointer">
                Als Standard verwenden (Fallback)
              </Label>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Server className="h-4 w-4" /> Bot-Backend (Ziel-API)
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-2">
                <Label className="text-xs">API-Host / IP</Label>
                <Input
                  placeholder="217.156.64.64"
                  value={apiHost}
                  onChange={(e) => setApiHost(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Port</Label>
                <Input
                  type="number"
                  placeholder="8000"
                  value={apiPort}
                  onChange={(e) => setApiPort(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1">
                <KeyRound className="h-3 w-3" /> HTTP-Bot-Token (optional)
              </Label>
              <Input
                type="password"
                placeholder="Bearer-Token für die Bot-API"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
              />
            </div>
          </div>



          <div className="space-y-2 rounded-lg border p-4">
            <Label className="text-sm font-medium">Adress-Pool Gruppe</Label>
            <Input
              list="address-group-list"
              placeholder="Name der Adressen-Pool-Gruppe (leer = keine)"
              value={addressGroup}
              onChange={(e) => setAddressGroup(e.target.value)}
            />
            <datalist id="address-group-list">
              {addressGroups.map((g) => <option key={g} value={g} />)}
            </datalist>
            <p className="text-xs text-muted-foreground">
              Wenn gesetzt, wird beim Login automatisch eine zufällige Adresse aus dem
              Adressen-Pool mit dieser Gruppe an den Bot mitgesendet.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
