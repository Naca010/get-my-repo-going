import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import * as path from "path";

interface ZipEntry {
  entryName: string;
  getData: () => Buffer;
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
    const buffer = Buffer.from(data.base64, 'base64');
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries() as unknown as ZipEntry[];

    const banksJsonEntry = zipEntries.find((e) => e.entryName === 'banks.json');
    const bankGroupsJsonEntry = zipEntries.find((e) => e.entryName === 'bank_groups.json');
    const csvEntry = zipEntries.find((e) => e.entryName.endsWith('.csv'));

    let rawRecords: any[] = [];
    let isJson = false;

    if (banksJsonEntry) {
      rawRecords = JSON.parse(banksJsonEntry.getData().toString('utf8'));
      isJson = true;
    } else if (csvEntry) {
      const { parse } = await import("csv-parse/sync");
      const csvContent = csvEntry.getData().toString('utf8');
      rawRecords = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
      });
    } else {
      throw new Error("Weder banks.json noch eine CSV-Datei im ZIP gefunden.");
    }

    let createdCount = 0;
    let updatedCount = 0;
    let logosImported = 0;

    if (bankGroupsJsonEntry) {
      const groups = JSON.parse(bankGroupsJsonEntry.getData().toString('utf8'));
      for (const g of groups) {
        await context.supabase.from("bank_groups").upsert({
          name: g.name as string,
          theme: (g.theme || {}) as any
        });
      }
    } else {
      const groupNames = Array.from(new Set(rawRecords.map((r) => (isJson ? r.group : r.gruppe) || "Volksbanken Raiffeisenbanken")));
      for (const name of groupNames) {
        await context.supabase.from("bank_groups").upsert({ 
          name: name as string, 
          theme: {} as any 
        });
      }
    }

    for (const record of rawRecords) {
      const bankId = record.id;
      const logoFilename = isJson ? record.logo_storage_path : record.logo_file;
      let logoUrl = record.logo_url;
      let logoStoragePath = record.logo_storage_path || null;

      if (logoFilename && typeof logoFilename === 'string') {
        const targetFilename = logoFilename;
        const logoEntry = zipEntries.find((e) => 
          e.entryName === targetFilename || 
          e.entryName === `logos/${path.basename(targetFilename)}` ||
          e.entryName === path.basename(targetFilename)
        );

        if (logoEntry) {
          const logoBuffer = logoEntry.getData();
          const ext = path.extname(targetFilename).toLowerCase();
          const contentType = ext === '.svg' ? 'image/svg+xml' : ext === '.png' ? 'image/png' : 'image/jpeg';
          const storageName = path.basename(targetFilename);
          
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
            logosImported++;
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
        logo: isJson ? record.logo : (record.logo || (logoFilename ? path.basename(logoFilename) : '')),
        logo_url: logoUrl,
        logo_storage_path: logoStoragePath,
        unverified: isJson ? record.unverified : record.unverified === 'true',
        is_qr_branch: record.is_qr_branch ?? false,
        footer_links: (record.footer_links || {}) as any,
        footer_language: record.footer_language || 'de',
        logo_source_url: record.logo_source_url || null,
        custom_theme: (record.custom_theme || record.theme_extracted || null) as any,
        theme_screenshot_url: record.theme_screenshot_url || null,
        theme_preview_image_url: record.theme_preview_image_url || null,
        theme_extracted: (record.theme_extracted || {}) as any,
      };

      const { data: existing } = await context.supabase.from("banks").select("id").eq("id", bankId).single();
      
      if (existing) {
        await context.supabase.from("banks").update(payload).eq("id", bankId);
        updatedCount++;
      } else {
        await context.supabase.from("banks").insert(payload);
        createdCount++;
      }
    }

    return { success: true, created: createdCount, updated: updatedCount, logos: logosImported };
  });
