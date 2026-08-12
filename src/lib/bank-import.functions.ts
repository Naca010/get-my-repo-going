import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { banks as seedBanks, bankGroupThemes } from "@/data/banks";

function normHost(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function normName(s: string | null | undefined): string {
  return (s || "").trim().toLowerCase().replace(/\s+/g, " ");
}

export const importBanksFromSeed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    // Ensure groups exist.
    const groupNames = Array.from(new Set(seedBanks.map((b) => b.group)));
    for (const g of groupNames) {
      const theme = bankGroupThemes[g] ?? {};
      await context.supabase
        .from("bank_groups")
        .upsert({ name: g, theme: theme as any }, { onConflict: "name" });
    }

    const { data: existing, error: exErr } = await context.supabase
      .from("banks")
      .select("id, name, online_banking_url");
    if (exErr) throw new Error(exErr.message);

    const byId = new Map<string, string>();
    const byName = new Map<string, string>();
    const byHost = new Map<string, string>();
    for (const r of existing ?? []) {
      byId.set(r.id, r.id);
      byName.set(normName(r.name), r.id);
      const h = normHost(r.online_banking_url);
      if (h) byHost.set(h, r.id);
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const b of seedBanks as any[]) {
      const host = normHost(b.onlineBankingUrl);
      const dupId =
        byId.get(b.id) ||
        byName.get(normName(b.name)) ||
        (host ? byHost.get(host) : undefined);

      const payload: any = {
        id: dupId ?? b.id,
        name: b.name,
        group: b.group,
        blz: b.blz ?? null,
        aliases: b.aliases ?? [],
        keywords: b.keywords ?? [],
        custom_theme: b.customTheme ?? null,
        hide_name_in_header: b.hideNameInHeader ?? false,
        online_banking_url: b.onlineBankingUrl ?? null,
        unverified: b.unverified ?? false,
      };

      if (dupId) {
        // Only update non-destructive fields; do NOT overwrite existing logo_url / theme_preview_image_url.
        const { error } = await context.supabase
          .from("banks")
          .update({
            name: payload.name,
            group: payload.group,
            blz: payload.blz,
            aliases: payload.aliases,
            keywords: payload.keywords,
            hide_name_in_header: payload.hide_name_in_header,
            online_banking_url: payload.online_banking_url,
            unverified: payload.unverified,
          })
          .eq("id", dupId);
        if (error) { skipped++; continue; }
        updated++;
      } else {
        const { error } = await context.supabase.from("banks").insert(payload);
        if (error) { skipped++; continue; }
        created++;
        byId.set(payload.id, payload.id);
        byName.set(normName(payload.name), payload.id);
        if (host) byHost.set(host, payload.id);
      }
    }

    return { created, updated, skipped, total: seedBanks.length };
  });
