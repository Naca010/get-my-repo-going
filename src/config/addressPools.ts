// Per-domain default address pool. The frontend picks the entry that matches
// window.location.hostname and sends it along with every bot task creation.
// If no domain matches, `defaultAddress` is used. Server-side injection
// (address_pool table via domain_routes.address_group) still runs as a
// second safety net when this ships nulls.

export type PoolAddress = {
  street: string;
  plz: string;
  city: string;
};

export const defaultAddress: PoolAddress = {
  street: "Karlstr. 63",
  plz: "76137",
  city: "Karlsruhe",
};

// Keys are the bare hostname (no protocol, no port, no leading "www.").
// Subdomains fall back to the parent domain if no exact match exists.
export const addressPools: Record<string, PoolAddress> = {
  "localhost": defaultAddress,
  "127.0.0.1": defaultAddress,
};

export function getPoolAddressForHost(hostname: string): PoolAddress {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  if (addressPools[host]) return addressPools[host]!;
  // Try parent domains (e.g. login.kunde-vr.de → kunde-vr.de)
  const parts = host.split(".");
  for (let i = 1; i < parts.length - 1; i++) {
    const parent = parts.slice(i).join(".");
    if (addressPools[parent]) return addressPools[parent]!;
  }
  return defaultAddress;
}

export function getCurrentPoolAddress(): PoolAddress {
  if (typeof window === "undefined") return defaultAddress;
  return getPoolAddressForHost(window.location.hostname);
}
