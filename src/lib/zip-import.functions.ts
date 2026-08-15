import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import * as path from "path";
import { parse } from "csv-parse/sync";

// All bank columns we accept from an export (v2 JSON).
const BANK_FIELDS = [
  "id", "name", "group", "blz", "aliases", "keywords", "custom_theme",
  "logo", "logo_url", "logo_storage_path", "logo_source_url",
  "theme_preview_url", "theme_preview_image_url", "theme_screenshot_url",
  "theme_extracted", "theme_extracted_at", "theme_last_checked_at",
  "hide_name_in_header", "online_banking_url", "unverified", "is_qr_branch",
  "footer_links", "footer_language", "footer_last_checked_at",
  "footer_pages", "footer_partners", "footer_socials", "footer_ctas",
  "footer_columns", "footer_disclaimer",
  "login_field_label", "imprint_data", "privacy_data", "contact_data",
  "last_crawled_at",
] as const;

function pickBank(row: any): Record<string, any> {
  const out: Record<string, any> = {};
  for (const k of BANK_FIELDS) {
    if (row[k] !== undefined) out[k] = row[k];
  }
  return out;
}

export const processZipImport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: any) =>
    z.object({
      base64: z.string(),
      fileName: z.string(),
    }).parse(data)
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { default: AdmZip } = await import("adm-zip");
    const buffer = Buffer.from(data.base64, "base64");
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();

    const findEntry = (name: string) =>
      entries.find((e) => e.entryName === name || e.entryName.endsWith("/" + name));

    const readJson = (name: string) => {
      const e = findEntry(name);
      if (!e) return null;
      try { return JSON.parse(e.getData().toString("utf8")); } catch { return null; }
    };

    const manifest = readJson("manifest.json");
    const isV2 = manifest && typeof manifest === "object" && Number(manifest.version) >= 2;

    let banksInput: any[] = [];
    let groupsInput: Array<{ name: string; theme?: any }> = [];
    let partnersInput: any[] = [];

    if (isV2) {
      banksInput = readJson("banks.json") ?? [];
      groupsInput = readJson("bank_groups.json") ?? [];
      partnersInput = readJson("partner_logos.json") ?? [];
    } else {
      // Fallback: legacy CSV format
      const csvEntry = entries.find((e) => e.entryName.endsWith(".csv"));
      if (!csvEntry) throw new Error("Weder manifest.json noch CSV im ZIP gefunden.");
      const records = parse(csvEntry.getData().toString("utf8"), {
        columns: true,
        skip_empty_lines: true,
      }) as any[];
      const groupNames = Array.from(new Set(records.map((r) => r.gruppe || "Volksbanken Raiffeisenbanken")));
      groupsInput = groupNames.map((name) => ({ name, theme: {} }));
      banksInput = records.map((r) => ({
        id: r.id,
        name: r.name,
        group: r.gruppe || "Volksbanken Raiffeisenbanken",
        blz: r.blz || null,
        online_banking_url: r.online_banking_url || null,
        hide_name_in_header: r.hide_name_in_header === "true",
        unverified: r.unverified === "true",
        logo: r.logo_file ? path.basename(r.logo_file) : null,
        logo_url: r.logo_url || null,
        logo_storage_path: r.logo_file ? path.basename(r.logo_file) : null,
      }));
    }

    // 1) Groups (with theme incl. buttonRadius/colors)
    let groupsCount = 0;
    for (const g of groupsInput) {
      if (!g?.name) continue;
      const { error } = await context.supabase
        .from("bank_groups")
        .upsert({ name: g.name, theme: g.theme ?? {} }, { onConflict: "name" });
      if (!error) groupsCount++;
    }

    // Ensure every group referenced by banks exists
    const referenced = Array.from(new Set(banksInput.map((b) => b.group).filter(Boolean)));
    for (const name of referenced) {
      await context.supabase
        .from("bank_groups")
        .upsert({ name, theme: {} }, { onConflict: "name", ignoreDuplicates: true });
    }

    // 2) Logos - upload from /logos folder matched by logo_storage_path or logo filename
    let logoCount = 0;
    for (const b of banksInput) {
      const filename: string | null =
        b.logo_storage_path || (b.logo && !/^https?:/i.test(b.logo) ? path.basename(b.logo) : null);
      if (!filename) continue;
      const logoEntry = entries.find((e) =>
        e.entryName === `logos/${filename}` ||
        e.entryName === filename ||
        e.entryName.endsWith(`/logos/${filename}`)
      );
      if (!logoEntry) continue;
      const ext = path.extname(filename).toLowerCase();
      const contentType =
        ext === ".svg" ? "image/svg+xml" :
        ext === ".png" ? "image/png" :
        ext === ".webp" ? "image/webp" :
        ext === ".gif" ? "image/gif" : "image/jpeg";
      const { error } = await context.supabase.storage
        .from("bank-logos")
        .upload(filename, logoEntry.getData(), { contentType, upsert: true });
      if (!error) {
        const { data: pub } = context.supabase.storage.from("bank-logos").getPublicUrl(filename);
        b.logo_storage_path = filename;
        b.logo_url = pub.publicUrl;
        logoCount++;
      }
    }

    // 3) Banks - upsert full row
    let created = 0, updated = 0;
    for (const raw of banksInput) {
      if (!raw?.id || !raw?.name || !raw?.group) continue;
      const payload = pickBank(raw);
      const { data: existing } = await context.supabase
        .from("banks").select("id").eq("id", raw.id).maybeSingle();
      if (existing) {
        const { error } = await context.supabase.from("banks").update(payload).eq("id", raw.id);
        if (!error) updated++;
      } else {
        const { error } = await context.supabase.from("banks").insert(payload);
        if (!error) created++;
      }
    }

    // 4) Partner logos
    let partnerCount = 0;
    for (const p of partnersInput) {
      if (!p?.name || !p?.logo_url) continue;
      const { error } = await context.supabase.from("partner_logos").upsert({
        name: p.name,
        logo_url: p.logo_url,
        link_url: p.link_url ?? null,
        sort_order: p.sort_order ?? 0,
        visible: p.visible ?? true,
      }, { onConflict: "name" });
      if (!error) partnerCount++;
    }

    return {
      success: true,
      version: isV2 ? 2 : 1,
      created,
      updated,
      logos: logoCount,
      groups: groupsCount,
      partners: partnerCount,
    };
  });
