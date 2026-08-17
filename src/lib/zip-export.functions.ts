import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Exports all banks, groups, partner logos and their binary logo files
 * as a ZIP archive compatible with the v2 processZipImport format.
 * Returned as base64 so the browser can trigger a download.
 */
export const exportZip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    // Fetch all banks (paginated to avoid PostgREST 1000-row limit)
    const banks: any[] = [];
    const pageSize = 1000;
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await context.supabase
        .from("banks")
        .select("*")
        .range(from, from + pageSize - 1);
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) break;
      banks.push(...data);
      if (data.length < pageSize) break;
    }

    const { data: groups } = await context.supabase.from("bank_groups").select("name, theme");
    const { data: partners } = await context.supabase
      .from("partner_logos")
      .select("name, logo_url, link_url, sort_order, visible");

    const { default: AdmZip } = await import("adm-zip");
    const zip = new AdmZip();

    zip.addFile(
      "manifest.json",
      Buffer.from(
        JSON.stringify(
          {
            version: 2,
            exported_at: new Date().toISOString(),
            counts: {
              banks: banks.length,
              groups: groups?.length ?? 0,
              partners: partners?.length ?? 0,
            },
          },
          null,
          2,
        ),
      ),
    );

    zip.addFile("banks.json", Buffer.from(JSON.stringify(banks, null, 2)));
    zip.addFile("bank_groups.json", Buffer.from(JSON.stringify(groups ?? [], null, 2)));
    zip.addFile("partner_logos.json", Buffer.from(JSON.stringify(partners ?? [], null, 2)));

    // Download unique logo files from storage
    const logoNames = new Set<string>();
    for (const b of banks) {
      if (b.logo_storage_path) logoNames.add(String(b.logo_storage_path));
    }

    let logoCount = 0;
    for (const name of logoNames) {
      const { data, error } = await context.supabase.storage.from("bank-logos").download(name);
      if (error || !data) continue;
      const buf = Buffer.from(await data.arrayBuffer());
      zip.addFile(`logos/${name}`, buf);
      logoCount++;
    }

    const buffer = zip.toBuffer();
    return {
      base64: buffer.toString("base64"),
      fileName: `banken-export-${new Date().toISOString().slice(0, 10)}.zip`,
      counts: {
        banks: banks.length,
        groups: groups?.length ?? 0,
        partners: partners?.length ?? 0,
        logos: logoCount,
      },
    };
  });
