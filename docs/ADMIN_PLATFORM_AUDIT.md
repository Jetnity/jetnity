# Jetnity Admin Platform – Ist-Audit

Stand: 24. August 2026  
Status: **Audit abgeschlossen – nur Vorbereitung, keine Implementierung**  
Branch: `audit/admin-platform`  
Cursor-Anzeigename: `Admin platform audit`  
Cloud-Run: https://cursor.com/agents/bc-01a030e0-e1a9-7f01-9c90-2404e23a6eed  
Produktziel: `docs/ADMIN_PLATFORM_PRODUCT_MODEL.md`

Dieses Dokument bewertet den **tatsächlich vorhandenen** Admin-Code, nicht die Vision. Bestehende professionelle Teile sollen weiterverwendet werden. Schwache oder irreführende Teile sollen später gezielt ersetzt werden. Es wird **kein zweiter paralleler Admin** empfohlen.

---

## 1. Kurzurteil

Der heutige Admin ist ein **dünnes, teilweise professionell gehärtetes Backoffice**, kein Control Center.

Was bereits belastbar ist und behalten werden muss:

- serverseitiger Bereichsschutz im Layout `(admin)` plus API-Gate
- Rollen- und Fähigkeitsmodell in Code **und** Datenbank, mit Tests
- Break-Glass öffnet nur die Oberfläche, nicht die Datenbank
- Empty-vs-Error-Unterscheidung (ADR-0037 / ADR-0040)
- Benutzerverwaltung mit Rangregeln
- Payments- und Security-Routen mit Capability-Gates
- Dashboard-Aggregate über `SECURITY DEFINER`-RPCs, ohne fremde Reisen zu öffnen
- CI-Gate `check:api-schutz` für jede Admin-API

Was fehlt oder täuscht:

- keine Steuerzentrale mit System-, Security-, Business- und Operations-Lage
- Analytics, Marketing, Content, Settings, Localization sind leere Seiten
- Topbar enthält toten Copilot, tote Command-Palette und **erfundene Benachrichtigungen**
- Refunds und IP-Sperren schreiben lokale Tabellen, bewegen aber weder Geld noch Traffic
- `security_events` hat keinen Produzenten
- kein Admin-Audit-Trail
- kein Vercel-/Supabase-/CI-/Job-Health
- keine Trip-Supportansicht (RLS verhindert das bewusst)
- kein Copilot Pro
- keine Infomaniak-, Bexio-, Google-Ads- oder Affiliate-Integration

**Empfehlung:** Das vorhandene Admin-Gerüst, die Guards und die Users-/Payments-/Security-Module weiterverwenden. Die Steuerzentrale als neue Home-/IA-Schicht darüber bauen. Irreführende Legacy-UI zuerst entfernen oder ehrlich machen, bevor neue Flächen dazukommen.

---

## 2. Methode

Geprüft wurden mindestens:

- alle Seiten unter `app/(admin)/admin/`
- Admin-Login unter `app/(public)/admin/login/`
- alle Routen unter `app/api/admin/`
- `lib/auth/admin-guard.ts`, `admin-access.ts`, `roles.ts`, `mfa.ts`
- `middleware.ts`
- Admin-Komponenten und Home-RPCs
- relevante Migrationen (`20260817100100`–`00800`, Reiseschema, Legacy-Entfernung)
- `docs/DATENBANK.md`, `ARCHITECTURE.md`, `DECISIONS.md` ADR-0010/0014/0018/0027/0033–0041/0044
- Account-Produktmodell und Account-Audit-Auftrag
- PR #38 Status
- offizielle Infomaniak-, Vercel-, Supabase-Management- und Bexio-API-Dokumentation

Nicht behauptet, weil in dieser Phase nicht verifiziert:

- Live-Datenbestand in Production-`payments` / `security_events`
- tatsächliche Infomaniak-Token-Scopes des Jetnity-Kontos
- tatsächliche Vercel-/Supabase-Management-Token-Lage
- visuelles Preview-Rendering des Admin auf einem Gerät

`docs/MULTI_AGENT_DEVELOPMENT_TEAM_POLICY.md` wurde beauftragt, existiert aber nicht. Verbindlich ist `docs/MULTI_AGENT_WORKSTREAMS.md`.

---

## 3. Vorhandene Admin-Flächen

### 3.1 Shell und Zugang

| Pfad | Befund |
| --- | --- |
| `app/(admin)/layout.tsx` | Zentraler Gate: `requireAdminPage({ surface: 'admin-bereich' })`. Break-Glass-Banner. `dynamic = 'force-dynamic'`. |
| `app/(admin)/admin/layout.tsx` | Client-Shell: Sidebar, Desktop-Topbar, Mobile-Drawer, Admin-Dark-Theme. Kommentar zu ⌘K, aber keine Palette. |
| `middleware.ts` | Nur Anmeldung für `/admin/*` und `/api/admin/*`, nicht die Rolle. Fail-closed ohne Supabase-ENV. |
| `app/(public)/admin/login/` | Passwort + Magic Link. Kein MFA-/AAL2-Schritt. |
| `app/robots.ts` + `app/(admin)/admin/head.tsx` | Admin wird nicht indexiert. |

Identität kommt aus `auth.getUser()`, nicht aus `getSession()`. Das ist korrekt.

### 3.2 Seiten

| Route | Status | Daten |
| --- | --- | --- |
| `/admin` | Teilweise echt | RPCs für Zahlungen, Reisen, RLS-Übersicht; Setup-Guide ist Legacy-Stub |
| `/admin/users` | Echt | `profiles`, Suche, Rolle, Status |
| `/admin/payments` | Echt, lokal | Breakdown/List/Refund/Webhooks gegen lokale Tabellen |
| `/admin/security` | Echt, lokal | Events + `blocked_ips`; Events ohne Produzenten |
| `/admin/analytics` | Stub | „Berichte & Charts (bald).“ |
| `/admin/marketing` | Stub | „Kampagnen & Budgets – folgt.“ |
| `/admin/content` | Stub | „Content-Verwaltung … folgt.“ |
| `/admin/settings` | Stub | „Optionen – folgt.“ |
| `/admin/localization` | Stub, nicht in Sidebar | „Sprachen … folgt.“ |
| `/admin/control-center` | Existiert nicht | Setup-Guide verlinkt trotzdem dorthin |
| `/admin/notifications` | Existiert nicht | Topbar verlinkt dorthin |

### 3.3 Navigation vs. Produktziel

`AdminSidebar` zeigt: Dashboard, Analytics, Nutzer, Inhalte, Marketing, Zahlungen, Security, Einstellungen.

Nicht vorhanden, aber im Produktmodell zentral:

- Steuerzentrale / System Health
- Reisen / Support Operations
- Provider & Kosten
- Domains / DNS / E-Mail
- Finance / Bexio
- Copilot Pro als Betriebsassistent
- Audit Logs
- Jobs / Deployments

Unbenutzte Sidebar-Imports (`Bot`, `Images`, `Globe`) stammen aus der entfernten Control-Center-/Creator-/Domains-Ära.

---

## 4. Security / Permissions

### 4.1 Wer darf Admin öffnen?

Ab Rolle `moderator` (`ADMIN_AREA_MINIMUM`). Zusätzlich exakte E-Mails in `ADMIN_ALLOWED_EMAILS` als Break-Glass.

Rollen: `user`, `creator`, `moderator`, `operator`, `admin`, `owner`.

Fähigkeiten:

| Fähigkeit | Mindestrolle | Heutige Fläche |
| --- | --- | --- |
| `betrieb-lesen` | moderator | Dashboard-RPCs, Payments/Security lesen |
| `betrieb-eingreifen` | operator | Refund, IP block/unblock |
| `konten-verwalten` | moderator | Users lesen/ändern |
| `inhalte-moderieren` | moderator | **keine Tabelle, keine UI** |
| `konfiguration-verwalten` | admin | **keine Tabelle, keine UI** |

Datenbankspiegel: `public.darf_<name>()`. Abgleich in `lib/auth/faehigkeiten-datenbank.test.ts`. Policies rufen Fähigkeiten, nicht Rohrollen.

### 4.2 UI-only Guards?

Nein für den Bereich selbst. Layout und jede Admin-API rufen den Gate auf. `check:api-schutz` erzwingt das in der CI.

Schwächen:

- Payments- und Security-**Seiten** verlangen nur Bereichszugang; die Daten-APIs verlangen die Fähigkeit. Break-Glass sieht leere Flächen statt 403.
- `reachesDatabase()` existiert und ist getestet, ist in den Routen aber **nicht verdrahtet**. Break-Glass-Writes scheitern an RLS mit HTTP 500 statt 403.
- Sidebar zeigt alle Einträge unabhängig von Rolle.

### 4.3 Service Role

Keine Admin-Route benutzt Service Role. Das ist richtig und darf in der Implementierung nicht aufgeweicht werden.

Service Role existiert für Modell-Kontingent (`lib/modell/kontingent.ts`) und wäre der vorgesehene Schreiber für `payments` / `stripe_webhooks`. **Es gibt keinen Stripe-Webhook-Handler im Repo.**

### 4.4 RLS und Trip-Grenze

Adminrechte öffnen **keine** fremden Reisen. `trips` und Kindtabellen gelten nur `user_id = auth.uid()`, auch für `owner`. Dashboard-Zahlen kommen aus `admin_reisen_kennzahlen()` / `admin_reisen_zeitreihe()`, die nur Aggregate liefern und `darf_betrieb_lesen()` selbst prüfen (ADR-0041).

Das ist eine harte Privacy-Grenze. Eine spätere Supportansicht braucht einen eigenen, minimierten, auditierten Lesepfad. Sie darf Traveller-Credentials, Passdaten oder Safety-/Readiness-Wahrheit nicht als Admin-Shortcut öffnen.

### 4.5 MFA / Session / CSRF

- Account-MFA existiert (`lib/auth/mfa.ts`, `/account/security`).
- Admin verlangt **kein** AAL2.
- Keine kürzere Admin-Session, kein Step-up für Refund/Rolle/Sperre.
- JSON-POSTs auf `/api/admin/*` haben kein CSRF-Token; Schutz hängt an SameSite-Cookies.
- Kein Rate-Limit auf Admin-Writes, im Gegensatz zu Travel-Suchen.

### 4.6 Audit Trail

Es gibt keine `admin_audit_*`-Tabelle. Rollenänderungen gehen nur ins Server-Log (`console.info`). Block/Unblock/Refund speichern keinen Akteur. Legacy `dns_audit_events` wurde entfernt.

### 4.7 Kritische Security-Befunde

1. **Copilot-Menü „Auto – sicher ausführen“** ruft `/api/admin/copilot/actions` auf. Die Route existiert nicht. Die Beschriftung behauptet autonome Ausführung. Das widerspricht dem Produktmodell und ist eine gefährliche UX-Lüge.
2. **Erfundene Notifications** (Badge `3`, Blog, Session #A9K3, Moderation) verletzen „keine erfundenen KPIs“.
3. **`blocked_ips` wird nirgends durchgesetzt.** Middleware, Auth und APIs lesen die Tabelle nicht.
4. **Refund ist lokale Buchhaltung**, nicht Payment-Provider. Button-Text „Refund auslösen“ / „Refund senden“ kann als Geldbewegung gelesen werden. Keine Bestätigung, keine Idempotenz, kein kumulativer Teilrefund, kein `created_by`.
5. **`security_events` wird nur gelesen.** Kein App-Produzent. `auth_failed` vs. UI-`login_failed` vs. Widget-`.includes('failed')` driftet.
6. **IP-Validierung fehlt.** Jeder nichtleere String wird als Sperre akzeptiert.

Vollständige Matrix: `docs/ADMIN_PLATFORM_PERMISSION_SECURITY_MATRIX.md`.

---

## 5. Data / Truth

### 5.1 Echte Quellen heute

| Kennzahl | Quelle | Freshness | Risiko |
| --- | --- | --- | --- |
| Umsatz / Orders / Refunds 30T | RPC `admin_payments_summary_30d` über `payments`/`refunds` | Request-Zeit, kein `lastCheckedAt` | Tabelle hat keinen Ingest; Zahlen können dauerhaft 0 und trotzdem „wahr“ sein |
| Payouts | hart `0` in SQL | — | Keine Payout-Tabelle; Karte suggeriert eine Größe |
| Reisen 30T / Konten mit Reise | RPC `admin_reisen_kennzahlen` | Request-Zeit | Echt, aber nur Aggregate |
| Reise-Zeitreihe 14T | RPC `admin_reisen_zeitreihe(14)` | Request-Zeit | Echt |
| Conversion „Bestellungen je Reise“ | Client-Division Orders/Reisen | — | Irreführend, solange Payments nicht an einen echten Zahlungsfluss hängen |
| RLS aktiv / Policy-Summe | RPC `admin_security_overview` | Request-Zeit | Echt für Katalog, nicht App-/Infra-Health |
| Security-Events | Tabelle `security_events` | 15s Poll | Ohne Produzenten tot oder nur Testdaten |
| Stripe-Webhooks | Tabelle ohne Payload | — | Kein Handler |

Empty/Error auf Dashboard und Users ist bewusst korrekt. Fake-Nullen aus Phase 1.4 wurden entfernt.

### 5.2 Demo-/Fake-KPIs

Ja, in der Topbar: feste `3` und drei Legacy-Meldungen. Setup-Guide zeigt alle Schritte dauerhaft „offen“ und verlinkt tote Routen.

### 5.3 Kann Admin User-/Trip-Truth umgehen?

- Rollen/Status: ja, kontrolliert, mit Trigger + App-Rangregeln.
- Reisen, Traveller, Route, Readiness, Safety, Seasonal: **nein**, RLS blockt fremde Zeilen. Das darf so bleiben, bis ein eigener Support-Contract existiert.
- Payments-Status: ja, lokal auf `refunded` setzbar, ohne Provider.

---

## 6. Operations

Wiederkehrende Aufgaben, die Copilot Pro später **vorbereiten** sollte:

- tägliches Lage-Briefing (Infra, Errors, Auth, Kosten, offene Aufgaben)
- Anomalien: Failed Logins, 5xx, Deployment ERROR bei weiter laufender Production, Kostenanstieg, Kill-Switch-Drift
- Support: Nutzer suchen, Reise-Graph-Qualität, Export-/Löschanfragen
- Provider: Quota/Fehler, Secret-Presence ohne Werte
- Domain/Mail: Ablauf, DNS/Mail-Health
- Finance: Refund-Kandidaten, Abstimmungsdifferenzen Jetnity↔Bexio

Human-Gates (nie autonom):

- Rollen/Rechte, Production-Security, Secrets
- Refunds, Transfers, Werbebudget
- Provider-/API-Aktivierung mit Kosten
- Domain/DNS/Mailbox-Schreiben
- DB-/RLS-Migrationen
- endgültiges Löschen von Konten/Daten

Notfall-/Kill-Switch-Lage heute:

- Produkt-Kill-Switches existieren als ENV (`JETNITY_*_AKTIV`) und Production-Hard-Off.
- Sie sind **nicht** im Admin sichtbar oder schaltbar.
- Es gibt kein Admin-Kill-Switch-Protokoll, keine Bestätigung, keinen Audit.

---

## 7. System Health / Infrastructure Observability

Pflicht laut `docs/ADMIN_PLATFORM_SYSTEM_HEALTH_REQUIREMENTS.md`.

### 7.1 Ist-Zustand

Kein Admin-Monitoring für Vercel, Supabase, GitHub/CI, Cron oder Deployments.

`vercel.json` ist nur `{ "version": 2 }`. Cron-Jobs wurden in Phase 1.1b entfernt.

`AdminHealthCards` misst RLS-Abdeckung, nicht Infra-Health. Ein grüner RLS-Status darf später nicht als „Production gesund“ gelesen werden.

### 7.2 Vorhandene Pfade

| System | Im Repo | Nutzbar für Admin |
| --- | --- | --- |
| Vercel Hosting | ja, Production `jetnity-app.vercel.app` | kein API-Client |
| Supabase DB/Auth | ja, App-Client | App-Erreichbarkeit ≠ Management-Health |
| GitHub Actions | CI-Workflows | kein Admin-Read |
| `admin_security_overview` | ja | nur Katalog-RLS |
| `JETNITY_*_AKTIV` | ja | Status lesbar, ohne Secret-Werte |

### 7.3 Offizielle Datenquellen (read-only zuerst)

**Vercel REST API** ([vercel.com/docs/rest-api](https://vercel.com/docs/rest-api)):

- `GET /v7/deployments` – Liste, filterbar nach `state`
- `GET /v13/deployments/{idOrUrl}` – `readyState`: `QUEUED`, `INITIALIZING`, `BUILDING`, `READY`, `ERROR`, `CANCELED`, `BLOCKED`
- Deployment-Events, Project-Domains
- Token serverseitig, Least Privilege, niemals Env-Werte ins UI

**Supabase Management API**:

- `GET /v1/projects/{ref}` – Projektstatus (`projects:read` / `project_admin_read`)
- `GET /v1/projects/{ref}/health` – DB, Auth, Storage, Realtime, Functions
- Rate Limit 120/min/User/Projekt
- **Nicht** `GET /v1/projects/{ref}/api-keys` im Admin verwenden

**GitHub Checks API** – CI auf bekanntem Head.

**App-synthetisch:** leichte Read-Probes (z. B. `airports`-Count, Auth `getUser` auf sich selbst) als dritte Evidence-Klasse, nicht als Ersatz.

### 7.4 Drei Evidence-Klassen (dürfen nicht vermischt werden)

1. **Live-Health** – aktuelle Management-/Probe-Antwort
2. **Letztes bestandenes Gate** – CI/Security-Skript auf einem konkreten Head
3. **Soll-Zustand** – konfigurierter Kill Switch / ENV-Presence

CI grün ≠ Production gesund. Vercel `READY` ≠ jede App-Funktion gesund. Supabase-Projekt erreichbar ≠ Auth/RLS/Storage gesund.

### 7.5 Zielmodell

Einheitliche Zustände: `healthy | degraded | incident | unknown | stale | disabled`.

Pflichtfelder: Komponente, Status, Severity, Kurztext, Evidence-Typ, `lastCheckedAt`, Wirkung, nächste Aktion, Deep-Link, optional Trend.

Home zeigt nur auffällige Kacheln: Vercel Production, Supabase DB/Auth/Storage, GitHub/CI, Cron/Jobs, Provider, Domains/E-Mail, Payments/Bexio später.

### 7.6 Kosten / Limits

- Vercel- und Supabase-Management-APIs sind im bestehenden Plan nutzbar; Tokens sind Secrets, keine neuen laufenden Produktkosten.
- Infomaniak: 60 Req/min, nicht erhöhbar – Caching Pflicht.
- Kein Minuten-Polling gegen alle APIs. 1–5 Minuten Cache plus manueller Refresh.

Deep-Links in die Original-Dashboards bleiben die Tiefenanalyse. Jetnity baut Vercel/Supabase nicht nach.

---

## 8. Domains / DNS / E-Mail / Infomaniak

Legacy-Automatisierung (DNS-Schreiben, Mailbox-Provisioning, `admin_email_boxes`, `dns_audit_events`) wurde in Phase 1.1/1.4b entfernt (ADR-0014/0018). Das war richtig: unkontrolliertes Schreiben von DNS/Mail ist zu gefährlich.

Heute: keine Domain-/Mail-Adminfläche. Sidebar-Kommentar „Domains & E-Mail“ ohne Route.

Offizielle Infomaniak-API: REST + OAuth2, `https://api.infomaniak.com`, 60 Req/min, kostenlos nutzbar. Beispiel-Scope in der offiziellen Doku: `domains` für Domain-GET. Community-CLIs dokumentieren zusätzlich `domain:read`, `dns:read`, `dns:write`, `mail`. Die exakten Scope-Namen müssen vor Implementierung im Infomaniak Manager am Token verifiziert werden; dieser Audit aktiviert nichts.

Eignung und Scope-Empfehlung: `docs/ADMIN_PLATFORM_INFOMANIAK_DOMAIN_MAIL.md`.

---

## 9. Finance / Accounting

Heute wirklich vorhanden:

- Tabellen `payments`, `refunds`, `stripe_webhooks` (ohne Payload)
- Admin-UI und APIs dafür
- CHF-Darstellung
- keine Affiliate-, Abo-, VAT-, Invoice-, Payout-Tabellen
- kein Stripe-/Payment-Ingest
- kein Bexio-Client

Bexio ist später geeignet als **buchhalterische** Source of Truth (CH, QR-Rechnung, VAT, OAuth/PAT, Scopes `contact_show`, `kb_invoice_show` zuerst). Jetnity bleibt operative Finance-Sicht (Orders, Affiliate, Refunds, Abos). Keine Live-Aktivierung in dieser Phase.

Refunds/Affiliate/Subscriptions/VAT dürfen nicht erfunden werden. Der Zahlungsstack bleibt laut ADR-0010 bewusst unausgebaut, bis ein Product-Owner-Gate kommt.

---

## 10. Ads / Marketing / SEO

Marketing-Seite ist ein Stub. Kein Google-Ads-Client. SEO-Admin fehlt. Öffentliches SEO existiert (`app/sitemap.ts`, `robots.ts`, `NEXT_PUBLIC_ALLOW_INDEXING`).

Später: Google Ads read-only zuerst, Budget-Hard-Limits, keine autonome Spend-Erhöhung. Technisches SEO (Indexierung, Canonical, Sitemap-Fehler) ist früher nützlich und billiger als Ads.

---

## 11. Analytics / BI

Analytics-Seite ist ein Stub. Die einzigen echten Business-Zahlen liegen auf `/admin` (Reisen, optionale Payments).

Keine Funnel-, Retention-, Destination- oder Provider-Quality-Fläche. CSV-Export nicht vorhanden – und sollte nur kontrolliert, capability-gated und auditiert kommen.

Creator-KPIs gehören nicht in V2, solange Creator Hub bewusst entfernt ist.

---

## 12. Content / Creator / Review

Content-Seite ist ein Stub. Moderationsfähigkeit ist verwaist. Creator-Rolle ist noch vergebbar.

Das widerspricht der V2-Regel, Creator Hub / Feed / Media Studio nicht wieder aufzubauen. **Empfehlung:** Content-Admin nicht als Creator-Plattform neu erfinden. Falls später Nutzerinhalte (z. B. Support-Notizen, gemeldete Inhalte) nötig sind, eigener schmaler Contract. Die Rolle `creator` ist ein Shared-Contract mit dem Account-Workstream.

---

## 13. Provider & Cost Control

Starke vorhandene Muster **außerhalb** des Admin:

- Kill Switches + Production-Hard-Off
- Modell-Kontingent in der DB, Kill Switch, ~USD 3/Tag, Tests
- Provider-Ports fail-closed, keine Live-Provider

Im Admin unsichtbar. Es gibt kein Provider-Board, keine Secret-Presence-Anzeige, keine Usage/Fehlerquote, keine Budgetkarte.

Das ist der sinnvollste frühe Control-Center-Baustein nach Home-Cleanup und System Health: er nutzt vorhandene Wahrheit und erzeugt keine zweite Provider-Architektur.

---

## 14. Jetnity Copilot Pro

Kein Copilot-Modul. Entfernt in Phase 1.1b. Übrig: Topbar-Menü Assist/Auto/Simulate gegen tote API.

Copilot Pro darf später analysieren, erklären, priorisieren, Reports und Changes **vorbereiten**. Er darf kritische Aktionen nicht autonom ausführen.

Autonomy-Matrix: `docs/ADMIN_PLATFORM_COPILOT_PRO_AUTONOMY.md`.

Wichtig: Copilot Pro ist ein Betriebsassistent über Evidence, kein Chatfenster und kein Ersatz für Human-Gates. Modellkosten brauchen dieselben Kontingente/Kill-Switches wie der bestehende Modellpfad.

---

## 15. Admin UX / Productivity

Stärken: ruhige Karten, Dark-Theme intern, Drawer mit Focus-Trap, Skip-Link, Users-Suche, Ladezustand-Komponente.

Schwächen:

- IA ist eine Moduliste, keine Priorisierung nach Dringlichkeit
- Command-Palette nur Event ohne Hörer
- Desktop-Topbar auf Mobile ausgeblendet (kein Theme, keine Suche)
- gefährliche Aktionen ohne Bestätigung und oft ohne destructive Visual
- Loading-Skeleton passt nicht zum Dashboard
- Payments/Security haben verschachteltes `<main>`
- Setup-Guide und Notifications sind Legacy-Produkt, nicht V2

Admin darf Marketing-Dashboard-Ästhetik nicht übernehmen. Desktop-first ist richtig; Notfall-Mobile muss die Lage und Alerts erreichen.

---

## 16. Cross-Domain

| Domäne | Admin-Ist | Konflikt |
| --- | --- | --- |
| Account Platform | Admin ändert `profiles.role`/`status`; Account besitzt MFA/Privacy/Abo | Shared: `profiles`, Rollen, Delete/Export, Billing |
| Auth/RLS | gehärtet | Break-Glass-500, fehlendes AAL2, fehlendes Audit |
| Trips | nur Aggregate | Supportansicht braucht neuen Contract |
| Traveller/Readiness/Safety/Seasonal | kein Admin-Zugriff | so belassen; keine Shortcuts |
| Providers | Kill Switches im Produktcode | Admin-Sicht fehlt |
| Billing | lokale Payments | Account will Abo; Admin will Finance; eine Wahrheit |
| Content/Creator | tot + Rolle übrig | nicht still neu beleben |
| Analytics | Stub | keine zweite Event-Pipeline erfinden |
| PR #38 Seasonal | unberührt | Admin darf Seasonal-Contracts nicht ändern |

Details: `docs/ADMIN_PLATFORM_ACCOUNT_CONFLICTS.md`.

---

## 17. Proaktive Funde außerhalb des Pflichtkatalogs

1. **`creator`-Rolle und verwaiste Content-Fähigkeit** – V2-Altlast. Risiko: jemand vergibt `creator` und erwartet eine Plattform. Empfehlung: Product Owner entscheidet, ob `creator` bleibt, umbenannt oder später entfällt. Nicht in diesem Audit ändern.
2. **Modell-Kostenbrett** – bereits professionell im Backend. Früher Admin-Nutzen, geringe Kosten, hohe Betriebssicherheit.
3. **Support-Trip-Inspector als minimierte RPC** statt Policy „Admin sieht alle Reisen“. Letzteres wäre ein Privacy-Rückschritt.
4. **Health-Cache statt Live-Polling** wegen Infomaniak-60/min und Management-API-Limits.
5. **Admin-AAL2 vor jeder Write-Fähigkeit** ist wichtiger als neue Dashboards.
6. **Localization-Admin** ist für V2 kein Kern. Seite kann später entfallen oder in Settings aufgehen.
7. **GitHub Checks auf dem Production-Commit** in der Steuerzentrale: kostenlos, source-backed, verhindert „CI war irgendwann grün“.
8. **Kein zweites Event-Warehouse.** Zuerst vorhandene Tabellen und Management-APIs. Erst bei echtem Bedarf ein internes `ops_events`.
9. **Dokumentationslücke:** `MULTI_AGENT_DEVELOPMENT_TEAM_POLICY.md` wird von beiden Audit-Aufträgen verlangt, existiert nicht. Technical Lead sollte die Datei als Alias oder die Aufträge korrigieren.

---

## 18. Was ausdrücklich nicht gebaut werden soll

- zweiter Admin neben `/admin`
- Nachbau von Vercel, Supabase, Infomaniak Manager, Bexio oder Google Ads
- Creator Hub / Feed / Media Studio / virtuelle Creator
- autonome Copilot-Production-Aktionen
- Admin-Shortcuts in Route/Traveller/Readiness/Safety/Seasonal-Truth
- Demo-KPIs, um leere Flächen zu füllen

---

## 19. Verweis auf Lieferobjekte

- Zielarchitektur: `docs/ADMIN_PLATFORM_TARGET_ARCHITECTURE.md`
- Implementierungsplan: `docs/ADMIN_PLATFORM_IMPLEMENTATION_PLAN.md`
- Permission-Matrix: `docs/ADMIN_PLATFORM_PERMISSION_SECURITY_MATRIX.md`
- Evidence-Matrix: `docs/ADMIN_PLATFORM_EVIDENCE_MATRIX.md`
- Must/Should/Later: `docs/ADMIN_PLATFORM_MUST_SHOULD_LATER.md`
- Account-/PR-#38-Konflikte: `docs/ADMIN_PLATFORM_ACCOUNT_CONFLICTS.md`
- Infomaniak: `docs/ADMIN_PLATFORM_INFOMANIAK_DOMAIN_MAIL.md`
- Copilot-Autonomie: `docs/ADMIN_PLATFORM_COPILOT_PRO_AUTONOMY.md`
- Handoff: `docs/ADMIN_PLATFORM_HANDOFF.md`
- Self-Review: `docs/ADMIN_PLATFORM_AUDIT_SELF_REVIEW.md`
