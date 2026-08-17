import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/dump-snapshot")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const url = new URL(request.url);
        const page = Number(url.searchParams.get("p") ?? "0");
        const size = 150;
        const from = page * size;
        const to = from + size - 1;

        const banks = await supabaseAdmin.from("banks").select("*").range(from, to);
        let extras: any = {};
        if (page === 0) {
          const [groups, addresses, routes] = await Promise.all([
            supabaseAdmin.from("bank_groups").select("name,theme").order("name"),
            supabaseAdmin.from("address_pool").select("*").limit(2000),
            supabaseAdmin.from("domain_routes").select("*"),
          ]);
          extras = {
            bank_groups: groups.data ?? [],
            address_pool: addresses.data ?? [],
            domain_routes: routes.data ?? [],
          };
        }
        return new Response(
          JSON.stringify({
            page,
            banks: banks.data ?? [],
            banks_error: banks.error?.message ?? null,
            ...extras,
          }),
          { headers: { "content-type": "application/json" } },
        );
      },
    },
  },
});
