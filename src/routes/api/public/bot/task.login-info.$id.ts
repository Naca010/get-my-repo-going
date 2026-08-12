import { createFileRoute } from "@tanstack/react-router";
import { proxyToBackend } from "@/lib/botProxy.server";

export const Route = createFileRoute("/api/public/bot/task/login-info/$id")({
  server: {
    handlers: {
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
