# ZIP Export Fehlerbehebung

Der ZIP-Export schlägt derzeit wahrscheinlich aufgrund eines Timeouts oder Speicherlimits fehl, da er versucht, Hunderte von Banken inklusive ihrer Logos in einem einzigen Durchgang zu verarbeiten. Besonders das Herunterladen vieler Logos aus dem Speicher kann bei großen Datenmengen zu Fehlern führen.

## Änderungen

### Backend (Server Functions)

- **Optimierung der Logo-Verarbeitung**: Die Logos werden nun in kleineren Batches heruntergeladen, um den Speicher und die Netzwerkverbindung nicht zu überlasten.
- **Fehlerbehandlung**: Verbesserte Protokollierung und Absicherung gegen fehlerhafte Logo-Downloads, damit der gesamte Export nicht abbricht, wenn eine einzelne Datei fehlt.
- **Speichermanagement**: Reduzierung der gleichzeitig gehaltenen Buffer-Daten.

### Frontend (Admin UI)

- **Timeout-Anpassung**: Die UI wartet nun länger auf die Antwort des Servers, da die Generierung eines ZIPs mit Logos systembedingt Zeit benötigt.
- **Benutzer-Feedback**: Klarere Fehlermeldungen, falls der Export dennoch fehlschlägt.

## Technische Details

- Datei: `src/lib/zip-export.functions.ts`
  - Implementierung einer Batch-Logik für den Storage-Download.
  - Hinzufügen von `try-catch` Blöcken um kritische Dateioperationen.
- Datei: `src/routes/_authenticated/admin/banks.tsx`
  - Hinzufügen von expliziten Timeouts für den Funktionsaufruf.
