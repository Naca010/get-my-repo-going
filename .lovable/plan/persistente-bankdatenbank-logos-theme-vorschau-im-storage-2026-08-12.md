# Persistente Bankdatenbank + Logos & Theme-Vorschau im Storage

Ziel: Die bereits vorhandene `banks`-Tabelle (~675 Einträge) wird zur echten Quelle. Logos und Theme-Screenshots werden einmalig in Supabase Storage abgelegt; die App liest ausschließlich aus DB + Storage – kein dauerhaftes Hotlinking, kein Runtime-Crawling.

## Änderungen

### 1. Datenbank (Migration – kein Neuaufbau)
Bestehende Tabelle `banks` um vier Felder erweitern:
- `logo_url` – öffentliche Storage-URL des gespeicherten Logos
- `logo_storage_path` – Pfad im Bucket `bank-logos`
- `theme_preview_url` – vollständige URL der Bank-Seite, die als Theme-Referenz gilt (Default: `online_banking_url`, überschreibbar)
- `theme_preview_image_url` – öffentliche Storage-URL des Theme-Screenshots (Bucket `bank-themes`)

Zusätzlich: Storage-Bucket `bank-themes` (public) anlegen; `bank-logos` bleibt.

### 2. Server-Funktionen (`src/lib/*.functions.ts`)
- **`crawlBankLogos`** (bestehend) erweitern: gefundenes Logo wird server-seitig heruntergeladen, in `bank-logos/{bankId}.{ext}` abgelegt und `logo_url` + `logo_storage_path` in DB geschrieben. Keine Hotlink-URL mehr.
- **`captureBankTheme`** (neu): für eine Bank-ID lädt die Funktion einen Screenshot der `theme_preview_url` (Fallback: `online_banking_url`) über einen Screenshot-Dienst (mshots), speichert in `bank-themes/{bankId}.jpg` und aktualisiert `theme_preview_image_url`. Wird **nur** ausgelöst, wenn Admin „Theme aktualisieren" klickt.
- **`importBanksFromSeed`** (neu): einmaliger Upsert aus `src/data/banks.ts`. Dedupliziert per `name` + `online_banking_url` (case-insensitive), aktualisiert vorhandene Einträge statt neue anzulegen.

### 3. Admin-Tab „Banken" (`src/routes/_authenticated/admin/banks.tsx`)
Kompakte Zeile pro Bank mit folgenden Spalten:
- Logo (aus `logo_url` mit Fallback auf altes `logo`)
- Bankname + ID
- Bankgruppe
- „Online-Banking öffnen" (Link-Button auf `online_banking_url`)
- Theme-Vorschau (Thumbnail aus `theme_preview_image_url`, Button „Theme aktualisieren")
- „Bearbeiten" (bestehender Dialog)
- „Löschen"

Header-Aktionen:
- „Banken importieren" (ruft `importBanksFromSeed`, zeigt Anzahl neu / aktualisiert)
- „Logos crawlen" (bestehend, nutzt jetzt Storage-Persistenz)

Kein neuer Bank-Detail-Screen. Editor-Dialog erhält Felder `theme_preview_url` und Button „Screenshot jetzt erneuern".

### 4. Rendering im Rest der App
Alle Stellen, die Bank-Logo lesen, nutzen `logo_url ?? logo`. Bank-Auswahl, Login-Screen und BankShell bleiben strukturell gleich.

## Nicht Teil des Plans
- Keine neue parallele Tabelle.
- Kein automatischer Screenshot bei Seitenaufrufen.
- Keine Änderungen an Auth/Anti-Bot/Subdomain-Routing.
