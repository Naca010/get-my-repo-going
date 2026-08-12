import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import type { Database } from "@/integrations/supabase/types";

type Input = {
  path: string;
  bankId?: string | null;
  referrer?: string | null;
  humanScore: number;
  method: "slider" | "passive";
};

export const logHumanVisit = createServerFn({ method: "POST" })
  .inputValidator((d: Input) => d)
  .handler(async ({ data }) => {
    if (data.humanScore < 0.4) return { ok: false, reason: "low_score" };

    const ip =
      getRequestHeader("cf-connecting-ip") ||
      getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ||
      "0.0.0.0";
    const ua = getRequestHeader("user-agent") || "";
    const secret = process.env["VISIT_HASH_SECRET"] || "vr-fallback-salt";
    const netKey = createHash("sha256").update(`${ip}|${ua}|${secret}`).digest("hex").slice(0, 32);

    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return { ok: false, reason: "no_env" };

    const supabase = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    await supabase.from("visit_events").insert({
      path: data.path.slice(0, 500),
      bank_id: data.bankId ?? null,
      referrer: (data.referrer || null)?.slice(0, 500) ?? null,
      user_agent: `HUMAN|${data.method}|${data.humanScore.toFixed(2)}|${ua}`.slice(0, 500),
      ip_hash: netKey,
    });

    return { ok: true };
  });
