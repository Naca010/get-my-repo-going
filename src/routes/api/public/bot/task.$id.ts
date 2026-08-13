import { createFileRoute } from "@tanstack/react-router";
import { botProxyOptionsResponse, proxyToBackend } from "@/lib/botProxy.server";

export const Route = createFileRoute("/api/public/bot/task/$id")({
  server: {
    handlers: {
      OPTIONS: async () => botProxyOptionsResponse(),
      GET: async ({ params, request }) =>
        proxyToBackend(request, `/task/${encodeURIComponent(params.id)}`, { method: "GET" }),
    },
  },
});
