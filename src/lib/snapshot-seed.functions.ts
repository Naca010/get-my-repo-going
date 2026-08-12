import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import banksSnapshot from "@/data/snapshot/banks.json";
import groupsSnapshot from "@/data/snapshot/bank_groups.json";
import addressSnapshot from "@/data/snapshot/address_pool.json";
import routesSnapshot from "@/data/snapshot/domain_routes.json";

/**
 * Restores all banks, groups, admin addresses and domain routes from the
 * committed JSON snapshot. Preserves hardcoded storage image URLs and
 * online-banking links so a fresh remix / workspace transfer keeps them.
 */
export const syncFromSnapshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    let groups = 0;
    for (const g of groupsSnapshot as Array<{ name: string; theme: any }>) {
      const { error } = await context.supabase
        .from("bank_groups")
        .upsert({ name: g.name, theme: g.theme }, { onConflict: "name" });
      if (!error) groups++;
    }

    let banks = 0;
    // Chunked upsert to keep payloads sane.
    const chunkSize = 100;
    const all = banksSnapshot as any[];
    for (let i = 0; i < all.length; i += chunkSize) {
      const chunk = all.slice(i, i + chunkSize).map((b) => ({
        id: b.id,
        name: b.name,
        group: b.group,
        blz: b.blz ?? null,
        aliases: b.aliases ?? null,
        keywords: b.keywords ?? null,
        custom_theme: b.custom_theme ?? null,
        logo: b.logo ?? null,
        hide_name_in_header: b.hide_name_in_header ?? false,
        online_banking_url: b.online_banking_url ?? null,
        unverified: b.unverified ?? false,
        logo_url: b.logo_url ?? null,
        logo_storage_path: b.logo_storage_path ?? null,
        theme_preview_url: b.theme_preview_url ?? null,
        theme_preview_image_url: b.theme_preview_image_url ?? null,
        theme_screenshot_url: b.theme_screenshot_url ?? null,
      }));
      const { error } = await context.supabase
        .from("banks")
        .upsert(chunk, { onConflict: "id" });
      if (!error) banks += chunk.length;
    }

    let addresses = 0;
    for (const a of addressSnapshot as any[]) {
      const { error } = await context.supabase
        .from("address_pool")
        .upsert(
          {
            id: a.id,
            zip: a.zip,
            city: a.city,
            street: a.street,
            domain: a.domain ?? "",
            note: a.note ?? null,
          },
          { onConflict: "id" },
        );
      if (!error) addresses++;
    }

    let routes = 0;
    for (const r of routesSnapshot as any[]) {
      const { error } = await context.supabase
        .from("domain_routes")
        .upsert(
          {
            id: r.id,
            domain: r.domain,
            api_host: r.api_host,
            api_port: r.api_port,
            bot_token: r.bot_token ?? null,
            is_default: r.is_default ?? false,
            label: r.label ?? null,
          },
          { onConflict: "id" },
        );
      if (!error) routes++;
    }

    return { groups, banks, addresses, routes };
  });
