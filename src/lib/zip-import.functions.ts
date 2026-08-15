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
    const buffer = Buffer.from(data.base64, 'base64');
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();

    const csvEntry = zipEntries.find(e => e.entryName.endsWith('.csv'));
    if (!csvEntry) throw new Error("Keine CSV-Datei im ZIP gefunden.");

    const csvContent = csvEntry.getData().toString('utf8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
    });

    let created = 0;
    let updated = 0;
    let logoCount = 0;

    // 1. Process Groups
    const groupNames = Array.from(new Set(records.map((r: any) => r.gruppe || "Volksbanken Raiffeisenbanken")));
    for (const name of groupNames) {
      await context.supabase.from("bank_groups").upsert({ name, theme: {} }, { onConflict: "name" });
    }

    // 2. Process Banks & Logos
    for (const record of records as any[]) {
      const bankId = record.id;
      const logoFile = record.logo_file; // e.g. "logos/name.jpg"
      let logoName = logoFile ? path.basename(logoFile) : null;
      let logoUrl = record.logo_url;

      // Handle logo upload if present in zip
      if (logoFile) {
        const logoEntry = zipEntries.find(e => 
          e.entryName === logoFile || 
          e.entryName === `logos/${path.basename(logoFile)}` ||
          e.entryName === path.basename(logoFile)
        );

        if (logoEntry) {
          const logoBuffer = logoEntry.getData();
          const ext = path.extname(logoName || '').toLowerCase();
          const contentType = ext === '.svg' ? 'image/svg+xml' : ext === '.png' ? 'image/png' : 'image/jpeg';
          
          const { data: uploadData, error: uploadError } = await context.supabase.storage
            .from("bank-logos")
            .upload(logoName!, logoBuffer, {
              contentType,
              upsert: true
            });

          if (!uploadError && uploadData) {
            const { data: { publicUrl } } = context.supabase.storage
              .from("bank-logos")
              .getPublicUrl(logoName!);
            logoUrl = publicUrl;
            logoCount++;
          }
        }
      }

      const payload = {
        id: bankId,
        name: record.name,
        group: record.gruppe || "Volksbanken Raiffeisenbanken",
        blz: record.blz || null,
        online_banking_url: record.online_banking_url || null,
        hide_name_in_header: record.hide_name_in_header === 'true',
        logo: logoName,
        logo_url: logoUrl,
        unverified: record.unverified === 'true'
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
