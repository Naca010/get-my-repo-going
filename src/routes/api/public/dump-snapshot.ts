import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/dump-snapshot")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const [banks, groups, addresses, routes] = await Promise.all([
          supabaseAdmin.from("banks").select("*").order("id"),
          supabaseAdmin.from("bank_groups").select("name,theme").order("name"),
          supabaseAdmin.from("address_pool").select("*").order("id"),
          supabaseAdmin.from("domain_routes").select("*").order("id"),
        ]);
        return new Response(
          JSON.stringify({
            banks: banks.data ?? [],
            bank_groups: groups.data ?? [],
            address_pool: addresses.data ?? [],
            domain_routes: routes.data ?? [],
          }),
          { headers: { "content-type": "application/json" } },
        );
      },
    },
  },
});
