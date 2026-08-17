import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/dump-snapshot")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const [banks, groups, addresses, routes] = await Promise.all([
          supabaseAdmin.from("banks").select("*").order("name").limit(2000),
          supabaseAdmin.from("bank_groups").select("name,theme").order("name"),
          supabaseAdmin.from("address_pool").select("*").limit(2000),
          supabaseAdmin.from("domain_routes").select("*"),
        ]);
        if (banks.error || groups.error || addresses.error || routes.error) {
          return new Response(
            JSON.stringify({
              banks_error: banks.error?.message,
              groups_error: groups.error?.message,
              addresses_error: addresses.error?.message,
              routes_error: routes.error?.message,
            }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }
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
