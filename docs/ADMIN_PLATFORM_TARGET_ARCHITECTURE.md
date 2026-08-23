# Jetnity Admin Platform – Zielarchitektur

Stand: 24. August 2026  
Status: **Vorschlag aus Audit – nicht implementiert, nicht product-owner-freigegeben**  
Cursor-Anzeigename: `Admin platform audit`  
Produktziel: `docs/ADMIN_PLATFORM_PRODUCT_MODEL.md`

Diese Architektur beschreibt, wie das vorhandene Admin-Gerüst zur Steuerzentrale wird. Sie ersetzt nicht Account, Trip Workspace oder Travel-Truth.

---

## 1. Leitsätze

1. **Ein Admin.** `/admin` bleibt der einzige Einstieg. Kein paralleles Control-Center-Produkt.
2. **Lesen, aggregieren, autorisiert handeln.** Admin erzeugt keine zweite Wahrheit für Account, Reise, Traveller, Route, Readiness, Safety, Seasonal, Billing oder Content.
3. **Evidence vor Grün.** Jede Kennzahl hat Quelle, `lastCheckedAt` und darf `unknown`/`stale`/`unavailable` sein.
4. **Fähigkeiten serverseitig.** UI-Hiding ist Komfort, kein Schutz.
5. **Human-Gates für kritische Writes.** Copilot Pro bereitet vor, führt nicht autonom aus.
6. **Bestehendes behalten.** Guards, Rollen, Users, Payments-Lesen, Security-Lesen, Ladezustand, RPC-Aggregate bleiben die Basis.

---

## 2. Schichten

```
Admin UI /admin
  Steuerzentrale, Fachbereiche, Command Palette, Alerts, Copilot Pro (Analyst)
        |
Admin Application Layer
  requireAdminPage / requireAdminApi, Capability, AAL2,
  Confirmation, Diff/Preview, Rate Limit, Audit Writer
        |
Ops Evidence Layer (geplant)
  einheitliches Health/KPI-Objekt, Freshness, Deep Links
        |
+------------------+--------------------+----------------------+
| Kanonische SoT   | Infra-Adapter      | Betriebs-Adapter     |
| profiles         | Vercel API         | Infomaniak API       |
| trips (Aggregate)| Supabase Mgmt      | Bexio später         |
| model_usage      | GitHub Checks      | Google Ads später    |
| payments*        | App-Probes         | Mail-DNS-Checks      |
| kill switches    |                    |                      |
+------------------+--------------------+----------------------+
* payments bleiben lokal, bis ein Payment-Gate existiert
```

Keine neue Microservice-Plattform. Adapter sind schmale Server-Module analog zu den Travel-Provider-Ports: ein Client, fail-closed, keine Secrets im Browser.

---

## 3. Informationsarchitektur

Desktop-first Arbeitswerkzeug. Home ist die Steuerzentrale, nicht eine Karte pro historischem Modul.

### 3.1 Home / Steuerzentrale

Beantwortet in Sekunden:

1. Läuft Website/App?
2. Gibt es kritische Fehler oder Warnungen?
3. Deployments / Jobs / CI?
4. Security-/Auth-/RLS-Lage?
5. Nutzer- und Reiseaktivität?
6. Provider, Limits, Kosten?
7. Offene operative Aufgaben (Support, Content, Finance, Domain/Mail)?

Nur auffällige oder wichtige Zustände prominent. Details auf Fachseiten.

### 3.2 Vorgeschlagene Navigation

Nicht jeder Eintrag ist ein Must-Slice. Die IA soll aber schon jetzt zum Produktmodell passen:

1. **Steuerzentrale** `/admin`
2. **System** – Deployments, Jobs, Feature Flags / Kill Switches, Environments
3. **Security** – Events, Alerts, Audit, Rollen, Sessions/MFA-Status
4. **Nutzer** – bestehende Users-Seite, später Support-Notizen
5. **Reisen** – read-only Supportansicht (neuer Contract)
6. **Provider & Kosten** – Status, Quotas, Modellkosten, Gates
7. **Finance** – Payments jetzt; Affiliate/Abo/Bexio später
8. **Analytics** – erst wenn echte Quellen existieren
9. **Marketing / SEO** – SEO-Health früher als Ads
10. **Domains & E-Mail** – Infomaniak read-only zuerst
11. **Support / Aufgaben** – Tickets/Notizen, wenn ein schmaler Contract da ist
12. **Einstellungen** – nur echte Settings, keine leere Seite

Analytics/Marketing/Content bleiben unsichtbar oder als „nicht bereit“, solange sie Stubs wären. Eine leere Nav-Lüge ist schlechter als ein fehlender Eintrag.

Content/Creator nur, wenn V2 tatsächlich moderierbare Nutzerinhalte hat. Standardempfehlung: nicht wiederbeleben.

### 3.3 Querschnitts-UX

- globale Suche / Command-Palette über Nutzer, Reisen, Provider, Fehler, Rechnungen, Settings
- gespeicherte Filter später, nicht im ersten Slice
- gefährliche Aktionen visuell getrennt, Bestätigung, optionaler Diff
- Tablet/Notfall-Mobile: Home-Lage + Alerts + Suche; tiefe Tabellen dürfen Desktop voraussetzen

---

## 4. Rollen- und Permission-Ziel

Bestehendes Rangmodell behalten. Keine neuen Production-Rollen in der nächsten Implementierung, bis Technical Lead den Shared Contract schneidet.

Fachliche Sichten (UI + Capability, nicht zwingend neue DB-Rollen):

| Sicht | Heutige Mindestfähigkeit | Später |
| --- | --- | --- |
| Support | `konten-verwalten` + künftige `reisen-support-lesen` | keine Writes auf Truth |
| Operations | `betrieb-lesen` / `betrieb-eingreifen` | Infra, Jobs, Provider-Sicht |
| Security | `betrieb-lesen` + künftig `security-haerten` | AAL2, Audit |
| Finance | `betrieb-lesen` / `betrieb-eingreifen` | Bexio-read vs. Refund-Gate |
| Marketing | fehlt | eigene Capability vor Ads-Write |
| Superadmin / Owner | `konfiguration-verwalten` + owner-Rang | Flags, Integrationen |

Vorschlag für spätere Capabilities (nicht jetzt anlegen):

- `reisen-support-lesen`
- `audit-lesen`
- `infra-lesen`
- `provider-lesen`
- `finance-lesen` / `finance-eingreifen`
- `domain-lesen` / `domain-eingreifen`
- `copilot-nutzen`

Anlegen erst nach Lead-Schnitt, mit DB-Spiegel `darf_*` und Tests. `inhalte-moderieren` und `creator` nicht still mit Bedeutung füllen.

---

## 5. Evidence-Objekt

Jede Steuerzentralen-Kachel und jeder Copilot-Satz referenziert dasselbe interne Modell, zum Beispiel:

```ts
type OpsEvidence = {
  id: string
  system: string
  status: 'healthy' | 'degraded' | 'incident' | 'unknown' | 'stale' | 'disabled'
  severity: 'info' | 'warn' | 'critical'
  summary: string
  evidenceType: 'live' | 'last_gate' | 'configured' | 'derived'
  source: string
  lastCheckedAt: string
  staleAfterSec: number
  impact?: string
  nextAction?: string
  deepLink?: string
}
```

`derived` darf nur aus belegten Inputs entstehen. Copilot-Text ist niemals Evidence.

---

## 6. System Health

Siehe Audit Abschnitt 7 und `docs/ADMIN_PLATFORM_SYSTEM_HEALTH_REQUIREMENTS.md`.

Adapter:

- `lib/ops/vercel.ts` – Deployments, Production-Alias, letzter READY/ERROR
- `lib/ops/supabase-mgmt.ts` – Projekt- und Service-Health
- `lib/ops/github-checks.ts` – CI am bekannten SHA
- `lib/ops/app-probes.ts` – synthetische Reads
- `lib/ops/provider-status.ts` – bestehende `*Zustand()`-Funktionen, Secret-Presence, `model_usage`

Keine Management-Secrets im Client. Keine API-Key-Listing-Endpunkte. Deep-Link ins Originalsystem.

Unterscheidung Live / letztes Gate / Soll bleibt in der UI sichtbar.

---

## 7. Security Center

Ausbauen, nicht neu erfinden.

Behalten: `SecurityWidget`, `blocked_ips`-UI, Event-Liste, Capability-Gates.

Ergänzen:

- ehrlicher Durchsetzungsstatus der IP-Liste (heute: nicht durchgesetzt)
- Event-Produzenten: fehlgeschlagene Admin-Logins, erfolgreiche kritischen Writes
- unveränderliches Admin-Audit (Akteur, Aktion, Ziel, vorher/nachher, Grund, AAL, Request-Id)
- Rollenmatrix-Anzeige aus `CAPABILITY_MINIMUM` (read-only)
- Secret-/ENV-Health als Presence
- MFA/AAL-Status der Admin-Sitzung
- Kill-Switch- und Break-Glass-Sichtbarkeit

IP-Enforcement in der Middleware ist eine eigene Product-/Security-Entscheidung (False-Positive-Risiko, IPv6, Proxy-Header). Nicht still aktivieren.

---

## 8. Nutzer, Support, Reisen

Users-Seite bleibt der Kern.

Ergänzen, nach Shared-Contract mit Account:

- Support-Notiz / Fallverlauf mit Berechtigung
- kontrollierter Export-/Löschprozess (Account besitzt Privacy-SoT)
- **read-only Reiseinspector:** minimierte RPC, keine Child-Truth-Writes, keine Credential-Klartexte, keine Admin-Änderung von Route/Traveller/Readiness/Safety/Seasonal

Standard bleibt Read-only. Writes nur in ausdrücklich definierten Supportfällen, nie als Graph-Shortcut.

---

## 9. Provider & Kosten

Eine Seite, die vorhandene Wahrheit zeigt:

- Flug/Hotel/Activity/Mobility/Rental/Safety/Seasonal/Modell: aktiv / vorbereitet / Production-hart-aus / unavailable
- Secret vorhanden/nicht vorhanden
- Modell-Quota und Tageskosten aus `model_usage`
- Vertrags-/Freigabestatus als manuell gepflegte, versionierte Konfiguration, nicht als erfundenes „live“

Aktivierung bleibt ENV + Product-Owner-Gate, nicht ein ungesicherter Toggle.

---

## 10. Finance

Zwei Ebenen:

1. **Jetnity operativ:** Zahlungen, später Affiliate, Abo, Refunds, Gebühren, offene Forderungen
2. **Bexio buchhalterisch:** Kontakte, Rechnungen, MWST, Zahlungsabgleich

Jetnity darf Bexio nicht nachbauen. Sync später einseitig oder klar gerichtete Abbildung, mit Gate.

Heutige Payments-UI bleibt, muss aber als **lokale Buchhaltung ohne Payment-Provider** gekennzeichnet bleiben, bis ein Ingest existiert.

---

## 11. Domains / Mail

Infomaniak-Adapter, read-only zuerst, Least-Privilege-Scopes, Tokens nur serverseitig. Jetnity zeigt Ablauf, DNSSEC/NS, MX/SPF/DKIM/DMARC-Prüfungen und Mailbox-Metadaten – nicht Mailinhalte.

Schreiben nur einzeln freigegeben, Step-up, Audit. Die meisten DNS-/Mailbox-Änderungen bleiben im Infomaniak Manager.

---

## 12. Copilot Pro

Kein Chat-Gadget in der Topbar.

Architektur:

- Kontext: aktuelle Evidence, Audit, offene Aufgaben
- Fähigkeiten: analysieren, Anomalien, Erklären, Priorisieren, Report, Change-Vorschlag
- Ausgabe: strukturierter Briefing-Draft + optionale Action-Requests
- Ausführung: nur über dieselben Gates wie manuelle Admin-Aktionen
- Kosten: bestehendes Modell-Kontingent, eigener Kill Switch, Timeout, Logging ohne Secrets

„Auto – sicher ausführen“ als ungesicherter Topbar-Button darf nicht zurückkommen.

Autonomy: `docs/ADMIN_PLATFORM_COPILOT_PRO_AUTONOMY.md`.

---

## 13. Datenbankziel (später, nicht in dieser Phase)

Keine Migration jetzt. Später, nach Freigabe, voraussichtlich nötig:

- `admin_audit_events` (append-only, RLS über `audit-lesen` / Service-Schreibweg oder SECURITY DEFINER mit Akteurprüfung)
- optional `ops_health_snapshots` für Freshness/Trend
- optional `support_cases` / Notizen
- später Finance-Felder nur mit Billing-Contract
- **keine** Admin-Vollzugriff-Policy auf `trips` oder Traveller-Tabellen

`inhalte-moderieren` / `konfiguration-verwalten` nicht mit Legacy-Tabellen zurückfüllen.

---

## 14. Integrationen – Sicherheitsgrenzen

| Integration | Erstes Ziel | Verboten ohne Gate |
| --- | --- | --- |
| Vercel | Deployments/Status | Deploy, Rollback, Env-Write |
| Supabase Mgmt | Health | Migration, RLS-Change, API-Key-Read |
| GitHub | Checks | Merge, Secret-Write |
| Infomaniak | Domain/DNS/Mail read | DNS/Mailbox-Write, Produktsbestellung |
| Bexio | Invoice/Contact read | Buchungen, Zahlungen |
| Google Ads | Campaign/Spend read | Budget erhöhen, Kampagne live schalten |
| Stripe/Payment | Ingest + Refund-Provider | Refund ohne Gate |

---

## 15. Test- und Gate-Architektur

Bestehende Gates bleiben verbindlich:

- `requireAdminApi` + `check:api-schutz`
- `lese()` / `ladezustand` für Empty vs Error
- `faehigkeiten-datenbank.test.ts`, `roles-datenbank.test.ts`, `admin-access.test.ts`
- `db:rechte`, `db:rls`, `db:sicherheit` sobald Schema betroffen ist

Neue Implementierungsslices brauchen zusätzlich:

- Adapter-Tests mit unbekannt/stale/timeout
- keine Fake-Healthy-Fixtures als Default
- UI-Tests: unbekannter Infra-Status darf nicht grün werden
- Write-Aktionen: Confirmation + Audit-Zeile oder Test, dass sie fehlen und deshalb fail-closed sind
