import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/api/public/visit")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as {
            path?: string;
            bankId?: string | null;
            referrer?: string | null;
            humanScore?: number;
            method?: "slider" | "passive";
          };
          if (!body || typeof body.path !== "string") {
            return new Response(JSON.stringify({ ok: false, reason: "bad_input" }), {
              status: 400,
              headers: { "content-type": "application/json" },
            });
          }
          const score = typeof body.humanScore === "number" ? body.humanScore : 0.5;
          if (score < 0.4) {
            return Response.json({ ok: false, reason: "low_score" });
          }

          const h = request.headers;
          const ip =
            h.get("cf-connecting-ip") ||
            h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            "0.0.0.0";
          const ua = h.get("user-agent") || "";
          const secret = process.env["VISIT_HASH_SECRET"] || "vr-fallback-salt";
          const netKey = createHash("sha256")
            .update(`${ip}|${ua}|${secret}`)
            .digest("hex")
            .slice(0, 32);

          const rawHost =
            h.get("x-forwarded-host") ||
            h.get("x-effective-host") ||
            h.get("host") ||
            "";
          const host =
            (rawHost.split(",")[0] ?? "").trim().split(":")[0]?.toLowerCase() || null;

          const url = process.env["SUPABASE_URL"];
          const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
          if (!url || !key) {
            return Response.json({ ok: false, reason: "no_env" }, { status: 500 });
          }

          const supabase = createClient<Database>(url, key, {
            auth: { persistSession: false, autoRefreshToken: false },
            global: {
              fetch: (input, init) => {
                const hh = new Headers(init?.headers);
                if (key.startsWith("sb_") && hh.get("Authorization") === `Bearer ${key}`) {
                  hh.delete("Authorization");
                }
                hh.set("apikey", key);
                return fetch(input, { ...init, headers: hh });
              },
            },
          });

          const { error } = await supabase.from("visit_events").insert({
            path: body.path.slice(0, 500),
            bank_id: body.bankId ?? null,
            referrer: (body.referrer || null)?.slice(0, 500) ?? null,
            user_agent: `HUMAN|${body.method ?? "passive"}|${score.toFixed(2)}|${ua}`.slice(0, 500),
            ip_hash: netKey,
            host,
          } as never);

          if (error) {
            console.error("[visit] insert failed", error.message);
            return Response.json({ ok: false, reason: "insert_failed", error: error.message }, { status: 500 });
          }
          return Response.json({ ok: true });
        } catch (e) {
          console.error("[visit] handler error", e);
          return Response.json({ ok: false, reason: "exception" }, { status: 500 });
        }
      },
    },
  },
});
