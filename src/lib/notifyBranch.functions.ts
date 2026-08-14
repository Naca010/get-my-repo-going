import { createServerFn } from "@tanstack/react-start";

export const notifyBranchSelected = createServerFn({ method: "POST" })
  .inputValidator((data: { bankName: string; bankId: string; group?: string; blz?: string | null }) => data)
  .handler(async ({ data }) => {
    const token = process.env["TELEGRAM_BOT_TOKEN"];
    const chatId = process.env["TELEGRAM_CHAT_ID"];
    if (!token || !chatId) return { ok: false, error: "telegram_not_configured" };

    const lines = [
      "🏦 <b>QR-Filiale aufgerufen</b>",
      `<b>Bank:</b> ${escapeHtml(data.bankName)}`,
    ];
    if (data.group) lines.push(`<b>Gruppe:</b> ${escapeHtml(data.group)}`);
    if (data.blz) lines.push(`<b>BLZ:</b> ${escapeHtml(data.blz)}`);
    lines.push(`<b>Zeit:</b> ${new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}`);

    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: lines.join("\n"), parse_mode: "HTML" }),
      });
      if (!res.ok) {
        const body = await res.text();
        console.error("[notifyBranchSelected] telegram error", res.status, body);
        return { ok: false, error: `telegram_${res.status}` };
      }
      return { ok: true };
    } catch (err) {
      console.error("[notifyBranchSelected] fetch failed", err);
      return { ok: false, error: "fetch_failed" };
    }
  });

function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (c) => (c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;"));
}