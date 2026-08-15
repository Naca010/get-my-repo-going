import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import * as path from "path";

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
    const buffer = Buffer.from(data.base64, 'base64');
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();

    // Try to find banks.json or a .csv file
    const banksJsonEntry = zipEntries.find(e => e.entryName === 'banks.json');
    const bankGroupsJsonEntry = zipEntries.find(e => e.entryName === 'bank_groups.json');
    const csvEntry = zipEntries.find(e => e.entryName.endsWith('.csv'));

    let records: any[] = [];
    let isJson = false;

    if (banksJsonEntry) {
      records = JSON.parse(banksJsonEntry.getData().toString('utf8'));
      isJson = true;
    } else if (csvEntry) {
      const { parse } = await import("csv-parse/sync");
      const csvContent = csvEntry.getData().toString('utf8');
      records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
      });
    } else {
      throw new Error("Weder banks.json noch eine CSV-Datei im ZIP gefunden.");
    }

    let created = 0;
    let updated = 0;
    let logoCount = 0;

    // 1. Process Bank Groups
    if (bankGroupsJsonEntry) {
      const groups = JSON.parse(bankGroupsJsonEntry.getData().toString('utf8'));
      for (const g of groups) {
        await context.supabase.from("bank_groups").upsert({
          name: g.name,
          theme: g.theme || {},
          is_active: g.is_active ?? true
        }, { onConflict: "name" });
      }
    } else {
      const groupNames = Array.from(new Set(records.map((r: any) => (isJson ? r.group : r.gruppe) || "Volksbanken Raiffeisenbanken")));
      for (const name of groupNames) {
        await context.supabase.from("bank_groups").upsert({ name, theme: {} }, { onConflict: "name" });
      }
    }

    // 2. Process Banks
    for (const record of records) {
      const bankId = record.id;
      // In JSON it's logo_storage_path, in CSV it was logo_file
      const logoFilename = isJson ? record.logo_storage_path : record.logo_file;
      let logoUrl = record.logo_url;
      let logoStoragePath = record.logo_storage_path || null;

      // Handle logo upload if present in zip
      if (logoFilename) {
        const logoEntry = zipEntries.find(e => 
          e.entryName === logoFilename || 
          e.entryName === `logos/${path.basename(logoFilename)}` ||
          e.entryName === path.basename(logoFilename)
        );

        if (logoEntry) {
          const logoBuffer = logoEntry.getData();
          const ext = path.extname(logoFilename).toLowerCase();
          const contentType = ext === '.svg' ? 'image/svg+xml' : ext === '.png' ? 'image/png' : 'image/jpeg';
          const storageName = path.basename(logoFilename);
          
          const { data: uploadData, error: uploadError } = await context.supabase.storage
            .from("bank-logos")
            .upload(storageName, logoBuffer, {
              contentType,
              upsert: true
            });

          if (!uploadError && uploadData) {
            const { data: { publicUrl } } = context.supabase.storage
              .from("bank-logos")
              .getPublicUrl(storageName);
            logoUrl = publicUrl;
            logoStoragePath = storageName;
            logoCount++;
          }
        }
      }

      const payload: any = {
        id: bankId,
        name: record.name,
        group: isJson ? record.group : (record.gruppe || "Volksbanken Raiffeisenbanken"),
        blz: record.blz || null,
        online_banking_url: record.online_banking_url || null,
        hide_name_in_header: isJson ? record.hide_name_in_header : record.hide_name_in_header === 'true',
        logo: isJson ? record.logo : (record.logo || path.basename(logoFilename || '')),
        logo_url: logoUrl,
        logo_storage_path: logoStoragePath,
        unverified: isJson ? record.unverified : record.unverified === 'true',
        is_qr_branch: record.is_qr_branch ?? false,
        footer_links: record.footer_links || null,
        footer_language: record.footer_language || 'de',
        logo_source_url: record.logo_source_url || null,
        custom_theme: record.custom_theme || record.theme_extracted || null,
        theme_screenshot_url: record.theme_screenshot_url || null,
        theme_preview_image_url: record.theme_preview_image_url || null,
      };

      const { data: existing } = await context.supabase.from("banks").select("id").eq("id", bankId).single();
      
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
