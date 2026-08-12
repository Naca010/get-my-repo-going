import { createFileRoute } from "@tanstack/react-router";
import { proxyToBackend } from "@/lib/botProxy.server";

export const Route = createFileRoute("/api/public/bot/task")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.text();
        return proxyToBackend(request, "/task", { method: "POST", body });
      },
    },
  },
});
