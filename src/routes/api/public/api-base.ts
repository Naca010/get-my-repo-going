import { createFileRoute } from "@tanstack/react-router";
import { resolveBackend } from "@/lib/botBackend.server";

export const Route = createFileRoute("/api/public/api-base")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // Allow client override of host via ?host=... so the frontend can
        // resolve using its own window.location.hostname rather than the
        // request Host header (which may be a Lovable preview host).
        const url = new URL(request.url);
        const hostOverride = url.searchParams.get("host");
        const req = hostOverride
          ? new Request(request.url, {
              headers: { ...Object.fromEntries(request.headers), host: hostOverride },
            })
          : request;
        const backend = await resolveBackend(req);
        if (!backend) {
          return Response.json(
            { error: "no_route", message: "Keine API-Konfiguration für diese Domain gefunden" },
            { status: 404, headers: { "Cache-Control": "no-store" } },
          );
        }
        return Response.json(
          { baseUrl: backend.baseUrl, label: backend.label },
          { headers: { "Cache-Control": "no-store" } },
        );
      },
    },
  },
});
