import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/partners")({
  component: PartnersAdmin,
});

type Partner = {
  id: string;
  name: string;
  logo_url: string;
  link_url: string | null;
  sort_order: number;
  visible: boolean;
};

const empty: Partner = { id: "", name: "", logo_url: "", link_url: "", sort_order: 0, visible: true };

function PartnersAdmin() {
  const [rows, setRows] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("partner_logos").select("*").order("sort_order").order("name");
    if (error) toast.error(error.message);
    setRows((data ?? []) as Partner[]);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string) => {
    if (!confirm("Wirklich löschen?")) return;
    const { error } = await supabase.from("partner_logos").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Gelöscht");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Partner-Logos</h1>
          <p className="text-sm text-muted-foreground">Werden im Footer der Landing-Page angezeigt.</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-2 h-4 w-4" /> Neuer Partner
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
                  <th className="px-3 py-2 w-14">Logo</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Link</th>
                  <th className="px-3 py-2 w-20">Reihenfolge</th>
                  <th className="px-3 py-2 w-20">Sichtbar</th>
                  <th className="px-3 py-2 w-24"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="border-t hover:bg-muted/30">
                    <td className="px-3 py-2">
                      <img src={p.logo_url} alt="" className="h-8 w-8 object-contain" />
                    </td>
                    <td className="px-3 py-2 font-medium">{p.name}</td>
                    <td className="px-3 py-2 text-xs truncate max-w-xs">{p.link_url ?? "—"}</td>
                    <td className="px-3 py-2">{p.sort_order}</td>
                    <td className="px-3 py-2">{p.visible ? "Ja" : "Nein"}</td>
                    <td className="px-3 py-2 text-right space-x-1">
                      <Button size="icon" variant="ghost" onClick={() => setEditing(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(p.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Noch keine Partner-Logos angelegt.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {(editing || creating) && (
        <PartnerEditor
          partner={editing ?? empty}
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

function PartnerEditor({
  partner,
  isNew,
  onClose,
  onSaved,
}: {
  partner: Partner;
  isNew: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Partner>(partner);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof Partner>(k: K, v: Partner[K]) => setForm((f) => ({ ...f, [k]: v }));

  const upload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `partners/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("bank-logos").upload(path, file, { upsert: true });
    if (error) {
      setUploading(false);
      { toast.error(error.message); return; }
    }
    const { data: signed } = await supabase.storage.from("bank-logos").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    if (signed?.signedUrl) set("logo_url", signed.signedUrl);
    setUploading(false);
  };

  const save = async () => {
    if (!form.name.trim() || !form.logo_url.trim()) { toast.error("Name und Logo-URL erforderlich"); return; }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      logo_url: form.logo_url.trim(),
      link_url: form.link_url?.trim() || null,
      sort_order: form.sort_order,
      visible: form.visible,
    };
    const { error } = isNew
      ? await supabase.from("partner_logos").insert(payload)
      : await supabase.from("partner_logos").update(payload).eq("id", partner.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Gespeichert");
    onSaved();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isNew ? "Neuer Partner" : `Partner bearbeiten: ${partner.name}`}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-3">
              {form.logo_url ? (
                <img src={form.logo_url} alt="" className="h-12 w-12 object-contain border rounded" />
              ) : (
                <div className="h-12 w-12 border rounded bg-muted" />
              )}
              <Input value={form.logo_url} onChange={(e) => set("logo_url", e.target.value)} placeholder="URL oder hochladen" />
              <input
                type="file"
                accept="image/*"
                ref={fileRef}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) upload(f);
                }}
              />
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Link-URL (optional)</Label>
            <Input value={form.link_url ?? ""} onChange={(e) => set("link_url", e.target.value)} placeholder="https://…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Reihenfolge</Label>
              <Input type="number" value={form.sort_order} onChange={(e) => set("sort_order", parseInt(e.target.value || "0", 10))} />
            </div>
            <label className="flex items-end gap-2 text-sm pb-2">
              <Checkbox checked={form.visible} onCheckedChange={(v) => set("visible", !!v)} />
              Sichtbar
            </label>
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
