import { createFileRoute } from "@tanstack/react-router";
import { botProxyOptionsResponse, proxyToBackend } from "@/lib/botProxy.server";

export const Route = createFileRoute("/api/public/bot/task")({
  server: {
    handlers: {
      OPTIONS: async () => botProxyOptionsResponse(),
      POST: async ({ request }) => {
        const body = await request.text();
        return proxyToBackend(request, "/task", { method: "POST", body });
      },
    },
  },
});
