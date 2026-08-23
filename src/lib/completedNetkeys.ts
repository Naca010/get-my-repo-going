// Tracks netkeys that already completed a full flow so the same user cannot
// re-run the process. Stored per-browser in localStorage.

const STORE_KEY = "completed_netkeys_v1";
const PENDING_PREFIX = "pending_netkey:";

function hashNetkey(netkey: string): string {
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
