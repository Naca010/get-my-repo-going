import { createFileRoute } from "@tanstack/react-router";
import { proxyToBackend } from "@/lib/botProxy.server";

export const Route = createFileRoute("/api/public/bot/task/$id/confirm-address")({
  server: {
    handlers: {
      POST: async ({ params, request }) =>
        proxyToBackend(
          request,
          `/task/${encodeURIComponent(params.id)}/confirm-address`,
          { method: "POST", body: "{}" },
        ),
    },
  },
});
