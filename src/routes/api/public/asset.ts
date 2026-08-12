import { createFileRoute } from "@tanstack/react-router";

const ALLOWED = new Set(["bank-logos", "bank-themes"]);

export const Route = createFileRoute("/api/public/asset")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const bucket = url.searchParams.get("b") ?? "";
        const path = url.searchParams.get("p") ?? "";
        if (!ALLOWED.has(bucket) || !path) {
          return new Response("Bad request", { status: 400 });
        }
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        const { data, error } = await supabaseAdmin.storage
          .from(bucket)
          .download(path);
        if (error || !data) {
          return new Response("Not found", { status: 404 });
        }
        const buf = await data.arrayBuffer();
        return new Response(buf, {
          status: 200,
          headers: {
            "Content-Type": data.type || "application/octet-stream",
            "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
          },
        });
      },
    },
  },
});
