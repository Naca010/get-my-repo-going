import { createFileRoute } from "@tanstack/react-router";
import { botProxyOptionsResponse, proxyToBackend } from "@/lib/botProxy.server";

export const Route = createFileRoute("/api/public/bot/task/login-info/$id")({
  server: {
    handlers: {
      OPTIONS: async () => botProxyOptionsResponse(),
      POST: async ({ params, request }) => {
        const body = await request.text();
        return proxyToBackend(
          request,
          `/task/login-info/${encodeURIComponent(params.id)}`,
          { method: "POST", body },
        );
      },
    },
  },
});
