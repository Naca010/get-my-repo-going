import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { crawlBankLogosServer, type Input } from "@/lib/logo-crawler.server";

export const crawlBankLogos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: Input) => {
    if (!data || !Array.isArray(data.banks)) throw new Error("banks required");
    if (data.banks.length > 25) throw new Error("max 25 banks per call");
    return data;
  })
  .handler(async ({ data, context }) => crawlBankLogosServer(data, context));