import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import * as path from "path";
import { parse } from "csv-parse/sync";

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

    let created = 0;
    let updated = 0;
    let logoCount = 0;

    const uploadLogo = async (storagePath: string) => {
      const entry =
        entries.find((e) => e.entryName === `logos/${storagePath}`) ||
        entries.find((e) => e.entryName.endsWith("/" + storagePath)) ||
        entries.find((e) => path.basename(e.entryName) === path.basename(storagePath));
      if (!entry) return null;
      const ext = path.extname(storagePath).toLowerCase();
      const contentType =
        ext === ".svg" ? "image/svg+xml" :
        ext === ".png" ? "image/png" :
        ext === ".webp" ? "image/webp" : "image/jpeg";
      const { error } = await context.supabase.storage
        .from("bank-logos")
        .upload(storagePath, entry.getData(), { contentType, upsert: true });
      if (error) return null;
      const { data: { publicUrl } } = context.supabase.storage
        .from("bank-logos").getPublicUrl(storagePath);
      logoCount++;
      return publicUrl;
    };

    const banksJson = findEntry("banks.json");

    // ---- v2 JSON format (full round-trip) ----
    if (banksJson) {
      const groupsEntry = findEntry("bank_groups.json");
      if (groupsEntry) {
        const groups = JSON.parse(groupsEntry.getData().toString("utf8"));
        for (const g of groups as any[]) {
          await context.supabase
            .from("bank_groups")
            .upsert({ name: g.name, theme: g.theme ?? {} }, { onConflict: "name" });
        }
      }

      const partnersEntry = findEntry("partner_logos.json");
      if (partnersEntry) {
        const partners = JSON.parse(partnersEntry.getData().toString("utf8"));
        if (Array.isArray(partners) && partners.length) {
          await context.supabase.from("partner_logos").upsert(partners as any);
        }
      }

      const banks = JSON.parse(banksJson.getData().toString("utf8")) as any[];

      // Ensure all groups referenced by banks exist
      const bankGroups = Array.from(new Set(banks.map((b) => b.group).filter(Boolean)));
      for (const name of bankGroups) {
        await context.supabase
          .from("bank_groups")
          .upsert({ name, theme: {} }, { onConflict: "name" });
      }

      for (const b of banks) {
        // Re-upload logo bytes from ZIP and rewrite public URL to this project's storage
        if (b.logo_storage_path) {
          const newUrl = await uploadLogo(b.logo_storage_path);
          if (newUrl) b.logo_url = newUrl;
        }

        // Handle possible extra fields from manifest/version 2
        const payload = { ...b };
        // If importing into an older schema, Supabase will ignore unknown columns,
        // but it's safer to ensure we don't break if columns were renamed.

        const { data: existing } = await context.supabase
          .from("banks")
          .select("id")
          .eq("id", b.id)
          .maybeSingle();

        if (existing) {
          await context.supabase.from("banks").update(payload).eq("id", b.id);
          updated++;
        } else {
          await context.supabase.from("banks").insert(payload);
          created++;
        }
      }

      return { success: true, created, updated, logos: logoCount };
    }

    // ---- Legacy CSV format ----
    const csvEntry = entries.find((e) => e.entryName.endsWith(".csv"));
    if (!csvEntry) throw new Error("Keine banks.json oder CSV im ZIP gefunden.");

    const records = parse(csvEntry.getData().toString("utf8"), {
      columns: true,
      skip_empty_lines: true,
    });

    const groupNames = Array.from(
      new Set(records.map((r: any) => r.gruppe || "Volksbanken Raiffeisenbanken")),
    );
    for (const name of groupNames) {
      await context.supabase
        .from("bank_groups")
        .upsert({ name, theme: {} }, { onConflict: "name" });
    }

    for (const record of records as any[]) {
      const bankId = record.id;
      const logoFile = record.logo_file;
      const logoName = logoFile ? path.basename(logoFile) : null;
      let logoUrl = record.logo_url;

      if (logoName) {
        const url = await uploadLogo(logoName);
        if (url) logoUrl = url;
      }

      const payload = {
        id: bankId,
        name: record.name,
        group: record.gruppe || "Volksbanken Raiffeisenbanken",
        blz: record.blz || null,
        online_banking_url: record.online_banking_url || null,
        hide_name_in_header: record.hide_name_in_header === "true",
        logo: logoName,
        logo_url: logoUrl,
        unverified: record.unverified === "true",
      };

      const { data: existing } = await context.supabase
        .from("banks").select("id").eq("id", bankId).maybeSingle();
      if (existing) {
        await context.supabase.from("banks").update(payload).eq("id", bankId);
        updated++;
      } else {
        await context.supabase.from("banks").insert(payload);
        created++;
      }
    }

    return { success: true, created, updated, logos: logoCount };
  });
