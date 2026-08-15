import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Fields we round-trip in the export/import ZIP.
const BANK_FIELDS = [
  "id","name","group","blz","aliases","keywords","custom_theme","logo",
  "hide_name_in_header","online_banking_url","unverified","logo_url",
  "logo_storage_path","theme_preview_url","theme_preview_image_url",
  "theme_screenshot_url","is_qr_branch","footer_links","footer_language",
  "logo_source_url","theme_extracted","footer_pages","footer_partners",
  "footer_socials","footer_ctas","footer_columns","footer_disclaimer",
  "login_field_label",
] as const;

export const buildBanksExport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { default: AdmZip } = await import("adm-zip");
    const zip = new AdmZip();

    // 1. Groups (name + theme)
    const { data: groups } = await context.supabase
      .from("bank_groups")
      .select("name,theme");
    zip.addFile(
      "bank_groups.json",
      Buffer.from(JSON.stringify(groups ?? [], null, 2), "utf8"),
    );

    // 2. Partner logos (global)
    const { data: partners } = await context.supabase
      .from("partner_logos")
      .select("name,logo_url,link_url,sort_order,visible");
    zip.addFile(
      "partner_logos.json",
      Buffer.from(JSON.stringify(partners ?? [], null, 2), "utf8"),
    );

    // 3. Banks (paged to avoid limits)
    const banks: any[] = [];
    const pageSize = 1000;
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await context.supabase
        .from("banks")
        .select(BANK_FIELDS.join(","))
        .order("id", { ascending: true })
        .range(from, from + pageSize - 1);
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) break;
      banks.push(...data);
      if (data.length < pageSize) break;
    }

    // 4. Download logos referenced by logo_storage_path
    const seen = new Set<string>();
    for (const b of banks) {
      const p = b.logo_storage_path as string | null;
      if (!p || seen.has(p)) continue;
      seen.add(p);
      try {
        const { data: file } = await context.supabase.storage
          .from("bank-logos")
          .download(p);
        if (file) {
          const buf = Buffer.from(await file.arrayBuffer());
          zip.addFile(`logos/${p}`, buf);
        }
      } catch {
        /* ignore individual logo failures */
      }
    }

    zip.addFile(
      "banks.json",
      Buffer.from(JSON.stringify(banks, null, 2), "utf8"),
    );

    zip.addFile(
      "manifest.json",
      Buffer.from(
        JSON.stringify(
          {
            version: 2,
            exportedAt: new Date().toISOString(),
            counts: {
              banks: banks.length,
              groups: groups?.length ?? 0,
              partners: partners?.length ?? 0,
              logos: seen.size,
            },
          },
          null,
          2,
        ),
        "utf8",
      ),
    );

    return { base64: zip.toBuffer().toString("base64") };
  });
