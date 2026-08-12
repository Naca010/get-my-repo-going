import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Input = { bankId: string };

const MICROLINK_ENDPOINT = "https://api.microlink.io";

type MicrolinkResponse = {
  status: string;
  data?: {
    screenshot?: { url?: string; type?: string };
    logo?: { url?: string; type?: string };
    url?: string;
  };
  message?: string;
};

async function callMicrolink(url: string): Promise<MicrolinkResponse> {
  const params = new URLSearchParams({
    url,
    screenshot: "true",
    meta: "true",
    embed: "screenshot.url",
    "viewport.width": "1440",
    "viewport.height": "1000",
    "viewport.deviceScaleFactor": "1",
    "viewport.isMobile": "false",
    waitUntil: "networkidle0",
    timeout: "30000",
    device: "macbook-pro-13",
    type: "png",
    "screenshot.fullPage": "false",
  });
  // We ask for JSON (not embed) to get both screenshot + logo urls
  params.delete("embed");
  const res = await fetch(`${MICROLINK_ENDPOINT}/?${params.toString()}`, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Microlink ${res.status}: ${txt.slice(0, 200)}`);
  }
  return (await res.json()) as MicrolinkResponse;
}

async function downloadBinary(url: string): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength === 0) return null;
    return { bytes: buf, contentType: res.headers.get("content-type") || "application/octet-stream" };
  } catch {
    return null;
  }
}

function extFromContentType(ct: string, fallbackUrl?: string): string {
  const t = ct.toLowerCase();
  if (t.includes("svg")) return "svg";
  if (t.includes("webp")) return "webp";
  if (t.includes("png")) return "png";
  if (t.includes("jpeg") || t.includes("jpg")) return "jpg";
  if (t.includes("gif")) return "gif";
  if (t.includes("x-icon") || t.includes("vnd.microsoft.icon")) return "ico";
  if (fallbackUrl) {
    const u = (fallbackUrl.split("?")[0]?.split(".").pop() || "").toLowerCase();
    if (["svg", "png", "jpg", "jpeg", "webp", "gif", "ico"].includes(u)) return u.replace("jpeg", "jpg");
  }
  return "png";
}

export const captureBankTheme = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: Input) => {
    if (!data?.bankId) throw new Error("bankId required");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { data: bank, error: readErr } = await context.supabase
      .from("banks")
      .select("id, theme_preview_url, online_banking_url, logo_url")
      .eq("id", data.bankId)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!bank) throw new Error("Bank not found");

    const target = (bank as any).theme_preview_url || (bank as any).online_banking_url;
    if (!target) throw new Error("Keine Online-Banking-URL für diese Bank gesetzt");

    const ml = await callMicrolink(target);
    if (ml.status !== "success" || !ml.data?.screenshot?.url) {
      throw new Error(`Microlink: ${ml.message || ml.status || "kein Screenshot"}`);
    }

    // 1) Screenshot herunterladen und in bank-themes/{id}/theme.png ablegen
    const shot = await downloadBinary(ml.data.screenshot.url);
    if (!shot) throw new Error("Screenshot-Download fehlgeschlagen");

    const shotExt = extFromContentType(shot.contentType, ml.data.screenshot.url) || "png";
    const shotPath = `${data.bankId}/theme.${shotExt}`;
    const { error: upErr } = await context.supabase.storage
      .from("bank-themes")
      .upload(shotPath, shot.bytes, { contentType: shot.contentType || "image/png", upsert: true });
    if (upErr) throw new Error(upErr.message);
    const { data: shotPub } = context.supabase.storage.from("bank-themes").getPublicUrl(shotPath);
    const screenshotUrl = `${shotPub.publicUrl}?v=${Date.now()}`;

    // 2) Logo bevorzugt aus Microlink-DOM-Analyse übernehmen
    let logoUrl: string | null = null;
    let logoPath: string | null = null;
    if (ml.data.logo?.url) {
      const logoBin = await downloadBinary(ml.data.logo.url);
      if (logoBin && logoBin.bytes.byteLength > 0 && logoBin.bytes.byteLength < 5_000_000) {
        const logoExt = extFromContentType(logoBin.contentType, ml.data.logo.url);
        const path = `${data.bankId}/logo.${logoExt}`;
        const { error: logoErr } = await context.supabase.storage
          .from("bank-logos")
          .upload(path, logoBin.bytes, { contentType: logoBin.contentType, upsert: true });
        if (!logoErr) {
          const { data: logoPub } = context.supabase.storage.from("bank-logos").getPublicUrl(path);
          logoUrl = `${logoPub.publicUrl}?v=${Date.now()}`;
          logoPath = path;
        }
      }
    }

    const patch: Record<string, unknown> = {
      theme_screenshot_url: screenshotUrl,
      theme_preview_image_url: screenshotUrl,
      theme_last_checked_at: new Date().toISOString(),
    };
    if (logoUrl) {
      patch["logo_url"] = logoUrl;
      patch["logo_storage_path"] = logoPath;
    }

    const { error: updErr } = await context.supabase
      .from("banks")
      .update(patch as any)
      .eq("id", data.bankId);
    if (updErr) throw new Error(updErr.message);

    return { url: screenshotUrl, logoUrl };
  });
