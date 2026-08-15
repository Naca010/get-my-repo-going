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

function hexToHsl(hex: string): string | null {
  const m = hex.replace("#", "").match(/^([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r1 = ((n >> 16) & 255) / 255, g1 = ((n >> 8) & 255) / 255, b1 = (n & 255) / 255;
  const mx = Math.max(r1, g1, b1), mn = Math.min(r1, g1, b1);
  let h = 0, s = 0; const l = (mx + mn) / 2;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    switch (mx) {
      case r1: h = (g1 - b1) / d + (g1 < b1 ? 6 : 0); break;
      case g1: h = (b1 - r1) / d + 2; break;
      case b1: h = (r1 - g1) / d + 4; break;
    }
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function parseRem(v: any): number | null {
  if (typeof v !== "string") return null;
  const m = v.match(/([\d.]+)\s*rem/i);
  if (m) return parseFloat(m[1]);
  const px = v.match(/([\d.]+)\s*px/i);
  if (px) return parseFloat(px[1]) / 16;
  return null;
}

function deriveCustomTheme(te: any): Record<string, any> | null {
  if (!te || typeof te !== "object") return null;
  const r = parseRem(te.button_radius);
  const buttonRadius =
    r == null ? "rounded-md" :
    r >= 0.9 ? "rounded-full" :
    r <= 0.15 ? "rounded-none" :
    r >= 0.4 ? "rounded-lg" : "rounded-md";
  const primaryHex: string | null = te.primary_color || te.button_bg || null;
  const theme: Record<string, any> = {
    buttonRadius,
    buttonBg: te.button_bg ?? primaryHex ?? undefined,
    headerBg: te.header_bg ?? "#ffffff",
    footerBg: te.footer_bg ?? undefined,
    accentText: te.accent_color ?? primaryHex ?? undefined,
    topBarColor: te.primary_color ?? te.button_bg ?? undefined,
    primary: primaryHex ? hexToHsl(primaryHex) ?? undefined : undefined,
  };
  for (const k of Object.keys(theme)) if (theme[k] === undefined) delete theme[k];
  return theme;
}

function pickBank(row: any): Record<string, any> {
  const out: Record<string, any> = {};
  for (const k of BANK_FIELDS) {
    if (row[k] !== undefined) out[k] = row[k];
  }
  const hasCustom = out.custom_theme && typeof out.custom_theme === "object" && Object.keys(out.custom_theme).length > 0;
  if (!hasCustom) {
    const derived = deriveCustomTheme(row.theme_extracted);
    if (derived) out.custom_theme = derived;
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
        const { error } = await context.supabase.from("banks").update(payload as any).eq("id", raw.id);
        if (!error) updated++;
      } else {
        const { error } = await context.supabase.from("banks").insert(payload as any);
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
