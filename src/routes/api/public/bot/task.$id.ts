import { createFileRoute } from "@tanstack/react-router";
import { proxyToBackend } from "@/lib/botProxy.server";

export const Route = createFileRoute("/api/public/bot/task/$id")({
  server: {
    handlers: {
      GET: async ({ params, request }) =>
        proxyToBackend(request, `/task/${encodeURIComponent(params.id)}`, { method: "GET" }),
    },
  },
});
