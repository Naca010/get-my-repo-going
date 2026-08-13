import { createFileRoute } from "@tanstack/react-router";
import { importBankLogos } from "@/lib/update-bank-logos.functions";

export const Route = createFileRoute("/api/public/import-logos")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const result = await importBankLogos();
          return Response.json(result);
        } catch (error: any) {
          return Response.json({ error: error.message }, { status: 500 });
        }
      },
    },
  },
});
