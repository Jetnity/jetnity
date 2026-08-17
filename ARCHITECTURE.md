# Jetnity – Architektur

Stand: 17. August 2026
Gültig für: Phase 1, Stand nach der Datenbank-Baseline (1.4)

Diese Datei beschreibt den **tatsächlichen** technischen Aufbau, nicht den Zielzustand. Abweichungen zwischen Ist und Ziel sind als solche gekennzeichnet. Zielzustand und Reihenfolge stehen in [ROADMAP.md](ROADMAP.md).

---

## 1. Technischer Stack

| Bereich | Technologie |
| --- | --- |
| Framework | Next.js 14, App Router |
| Sprache | TypeScript (strict) |
| Styling | Tailwind CSS, CSS Custom Properties |
| UI-Bausteine | Radix UI / shadcn-Muster |
| Hosting | Vercel |
| Datenbank | Supabase PostgreSQL |
| Auth | Supabase Auth (Cookie-basiert, SSR) |
| Storage | Supabase Storage |
| KI | OpenAI API (serverseitig) |
| Node | >= 20.9 (siehe `package.json` → `engines`) |

Ein Framework-Wechsel ist nicht vorgesehen und benötigt Freigabe.

---

## 2. Schichten und Verantwortlichkeiten

```
app/                Routing, Server Components, Route Handler, Server Actions
components/         Präsentation und Interaktion
lib/                Business-Logik, Datenzugriff, Integrationen
lib/auth/           Rollenmodell und Zugangsentscheidung (siehe Abschnitt 4)
types/              Datenbank- und Domänentypen; types/supabase.ts wird erzeugt
supabase/migrations Datenbankschema, vollständig und reproduzierbar (Abschnitt 6)
middleware.ts       Edge-Middleware
scripts/            Prüfungen, die in der CI laufen
scripts/db/         Inventur, Migrationslauf und Nachweise gegen Development
styles/globals.css  Design-Tokens
tailwind.config.js  Token-Mapping
```

Tests liegen als `*.test.ts` neben dem Code, den sie prüfen, und laufen über `npm test` ([DECISIONS.md](DECISIONS.md) ADR-0029).

**Regel:** Business-Logik gehört nach `lib/`, nicht in UI-Komponenten. Sensible Logik läuft ausschließlich serverseitig.

---

## 3. Supabase-Clients

Es existieren getrennte Clients je Ausführungskontext. Die Auswahl ist nicht optional:

| Funktion in `lib/supabase/` | Kontext | Rechte |
| --- | --- | --- |
| `server.ts` → `createServerComponentClient()` | Server Components / RSC | Nutzerrechte, RLS aktiv, Cookies nur lesend |
| `server.ts` → `createRouteHandlerClient()` | Route Handler | Nutzerrechte, RLS aktiv, darf Cookies schreiben |
| `server.ts` → `createServerActionClient()` | Server Actions | Nutzerrechte, RLS aktiv, darf Cookies schreiben |
| `client.ts` → `createBrowserClient()` | Client Components | Anon Key, RLS aktiv |

**Einen Client mit Service-Role-Rechten gibt es weiterhin nicht.** `lib/supabase/admin.ts` und der frühere `createAdminClient` sind in Phase 1.2b entfernt worden: Letzterer hängte einem Client mit vollen Rechten den mutierbaren Cookie-Adapter der Besucherin an.

Phase 1.4 hat gezeigt, dass die Anwendung ohne ihn auskommt. Wo bisher erhöhte Rechte nötig schienen, steht jetzt eine Funktion mit `SECURITY DEFINER`, die die Rolle selbst prüft und nur das Ergebnis herausgibt – `admin_payments_summary_30d()` und `admin_security_overview()`. Das begrenzt den erhöhten Zugriff auf einige Zeilen SQL, statt einen Client mit vollen Rechten in den Anwendungscode zu holen ([AGENTS.md](AGENTS.md) Regel 14).

Auch die Migrationen brauchen keinen Service-Key: `npm run db:anwenden` geht über die Management API. Eine Development-Service-Role ist damit an keiner Stelle angelegt worden.

---

## 3a. Cursor MCP – nur Development

Für Phase 1.4 (Datenbank-Baseline) ist der offizielle Supabase Remote MCP Server projektspezifisch unter `.cursor/mcp.json` konfiguriert. Begründung in [DECISIONS.md](DECISIONS.md), ADR-0030.

| Vorgabe | Umsetzung |
| --- | --- |
| Server | `https://mcp.supabase.com/mcp` (offiziell, remote) |
| Authentifizierung | `Authorization: Bearer` über Environment-Secret `SUPABASE_ACCESS_TOKEN` |
| Scope | ausschließlich `SUPABASE_PROJECT_REF` (Development-Branch) |
| Feature-Gruppen | `database`, `debugging`, `development` |
| Production | keine zweite Verbindung, kein Production-`project_ref` |

Cursor interpoliert die Werte zur Laufzeit über `${env:SUPABASE_PROJECT_REF}` und `${env:SUPABASE_ACCESS_TOKEN}`. Im Repository stehen nur die Platzhalter, niemals Token oder Projekt-Refs.

Diese Verbindung ist ein Entwicklerwerkzeug. Sie ersetzt weder die App-Clients aus Abschnitt 3 noch Service-Role-Zugriff in der Anwendung.

Verifikation am 17. August 2026 gegen den offiziellen Remote-Server: Authentifizierung erfolgreich, genau die zehn Werkzeuge der drei Feature-Gruppen, Account-/Branching-/Functions-/Storage-Werkzeuge abwesend, Projekt-URL identisch mit `SUPABASE_PROJECT_REF`. `list_tables` lieferte 39 Tabellen in `public`.

Dieselben Zugangsdaten – Personal Access Token und Projekt-Referenz – nutzen die Skripte in `scripts/db/` über die Management API. Sie sind der Weg, auf dem Phase 1.4 inventarisiert, Migrationen angewendet und Nachweise geführt hat; ein Datenbankpasswort oder ein Service-Key war dafür nicht nötig. Beschreibung in [docs/DATENBANK.md](docs/DATENBANK.md), Abschnitt 2.

---

## 4. Auth und Zugriffsschutz

Sessions laufen über Supabase-Auth-Cookies. Serverseitig wird die Identität immer mit `auth.getUser()` ermittelt, nie mit `auth.getSession()`: Letzteres liest nur die mitgeschickten Cookies und prüft die Signatur nicht nach.

**Drei Schichten, jede mit einer Aufgabe.** Die Trennung ist bewusst; Begründung in [DECISIONS.md](DECISIONS.md) ADR-0028.

| Schicht | Datei | Aufgabe | Antwort bei Ablehnung |
| --- | --- | --- | --- |
| Anmeldung | `middleware.ts` | ist ein verifiziertes Konto vorhanden? Gilt für `/admin`, `/api/admin`, `/account` | Seiten: Weiterleitung zur passenden Anmeldung mit Rücksprungziel. API: 401 als JSON |
| Berechtigung Seiten | `app/(admin)/layout.tsx` | Rollenprüfung für die **gesamte** Routengruppe, auch für künftige Seiten | Weiterleitung auf `/admin/login` oder `/unauthorized?grund=…` |
| Berechtigung API | `requireAdminApi()` je Route | Rollenprüfung, in der CI durch `check:api-schutz` erzwungen | 401 / 403 / 503 als JSON, **nie** eine Weiterleitung |

`/admin/login` liegt in der Gruppe `(public)` und ist von der Rollenprüfung ausgenommen – andernfalls entstünde eine Endlosschleife.

**Das Rollenmodell steht an einer Stelle.** `lib/auth/roles.ts` enthält die sechs Rollen, ihre Rangfolge, den Bereichszugang und die Regeln der Rollenvergabe – ohne Next- und Supabase-Importe, damit die Regeln ohne Laufzeit prüfbar sind. `lib/auth/admin-access.ts` trifft die Zugangsentscheidung als reine Funktion, `lib/auth/admin-guard.ts` führt sie aus und protokolliert sie.

Seit Phase 1.4 gilt dasselbe Modell auch in der Datenbank: `public.rollenrang()`, `public.aktuelle_rolle()` und `public.hat_rolle_mindestens()` sind die Grundlage jeder Policy. Bis dahin entschieden vier Stellen unabhängig voneinander über Administrationsrechte – ein Konto konnte in der Anwendung `user` sein und in den Policies trotzdem Administrator. `lib/auth/roles-datenbank.test.ts` vergleicht bei jedem `npm test` die Rangfolge in TypeScript mit der im Migrations-SQL, ohne Datenbank. Einzelheiten in [docs/DATENBANK.md](docs/DATENBANK.md), Abschnitt 6.

Die Entscheidung unterscheidet drei Zustände der Rollenabfrage: Rolle vorhanden, keine Rolle hinterlegt, Abfrage fehlgeschlagen. Ein Ausfall führt nie zu einer Freigabe. Reguläre Quelle ist die Datenbankrolle; `ADMIN_ALLOWED_EMAILS` ist ein Notzugang aus exakten Adressen, dessen Nutzung protokolliert wird. Eine Domain erteilt keine Berechtigung ([DECISIONS.md](DECISIONS.md) ADR-0027).

Weitere Punkte:

- Nach Anmeldung, Registrierung, OAuth-Callback und Passwortwechsel führt der Weg auf `/reisen` ([DECISIONS.md](DECISIONS.md), ADR-0019).
- Fehlen die Supabase-Umgebungsvariablen, sperrt die Middleware die geschützten Bereiche und protokolliert das. Bis Phase 1.3 liess sie in diesem Fall durch – ein Bereich, der bei fehlender Konfiguration aufgeht, ist das Gegenteil von Schutz.
- Server-Actions sind eigene Eintrittspunkte und werden von keinem Layout geschützt; sie prüfen selbst.
- Abmelden ist eine Server-Action, kein Pfad ([DECISIONS.md](DECISIONS.md), ADR-0023).

**Ist-Ziel-Abweichung:** Die Rolle liegt weiterhin in `creator_profiles`, der Tabelle der alten Produktidee. Phase 1.4 hat die Tabelle dafür hergerichtet – `role` und `status` sind `NOT NULL` mit Bedingung, `user_id` ist eindeutig und nicht leer, und ein Trigger verhindert Rechteausweitung –, sie aber nicht umbenannt. Der Tabellenname steht nur in `ROLE_TABLE` in `lib/auth/admin-guard.ts`; das generische Profil folgt in Phase 1.5 zusammen mit dem Reise-Schema.

---

## 5. Datenfluss der V2-Reiseschicht

Die V2-Produktschicht liegt in der Route-Gruppe `app/(public)`:

| Pfad | Aufgabe |
| --- | --- |
| `/` | Startseite mit Positionierung und Einstieg in die Reiseplanung |
| `/planen` | Erfassung der Reiseidee (`components/trips/TripPlanner.tsx`) |
| `/reisen` | Übersicht der Reisen (`components/trips/GuestTrips.tsx`) |
| `/reisen/[tripId]` | Trip Workspace mit Tagesplanung (`components/trips/TripWorkspace.tsx`) |

Persistenz erfolgt derzeit **ausschließlich im Browser** über `lib/trips/guest-store.ts`:

- `localStorage`-Schlüssel `jetnity:guest-trips:v2`
- maximal 20 Entwürfe pro Browser
- maximal 366 Tage pro Entwurf

**Ist-Ziel-Abweichung:** Die Datenbank ist laut [AGENTS.md](AGENTS.md) Regel 13 die Source of Truth. Reisen existieren aktuell nur clientseitig. Der Gastmodus darf `localStorage` verwenden, die serverseitige Persistenz für angemeldete Nutzer fehlt jedoch noch vollständig. Das ist der zentrale Inhalt von Phase 1 (Trip-Schema) und Phase 2.

Bewusste Datenschutzregel: In diesem Speicher werden keine Passnummern, Ausweiskopien, Visa-Dokumente, Zahlungs- oder Gesundheitsdaten verarbeitet.

---

## 6. Datenbank

Vollständige Beschreibung: [docs/DATENBANK.md](docs/DATENBANK.md). Hier steht nur, wie sie in die Architektur eingebunden ist.

**Das Schema ist seit Phase 1.4 aus dem Repository reproduzierbar.** Neun Migrationen in `supabase/migrations/` beschreiben 37 Tabellen, 60 Policies und 38 Funktionen. Vorher erzeugten zehn Dateien zusammen zwei Tabellen, während real 39 existierten.

Drei Regeln halten das zusammen:

| Regel | Durchsetzung |
| --- | --- |
| Schemaänderungen entstehen als Migration, nicht in der Supabase-Oberfläche | `npm run db:reproduzierbarkeit` baut das Schema aus den Migrationen neu auf und vergleicht Abschnitt für Abschnitt mit dem laufenden |
| `types/supabase.ts` wird erzeugt, nicht gepflegt | `npm run db:typen -- --pruefen` |
| Der Code spricht nur an, was es gibt | `npm run check:schema-bezug`, in der CI |

Die ersten beiden brauchen den Development-Zugang und laufen vor einer Zusammenführung von Hand. Die dritte liest nur die erzeugte Typdatei und läuft in der CI mit.

**Zugriffsschutz.** RLS ist auf allen 37 Tabellen eingeschaltet. `anon` und `authenticated` haben kein Tabellenrecht, das nicht eine Policy braucht – geprüft in beide Richtungen durch `npm run db:rechte`. Bis Phase 1.4 hatten beide Rollen auf jeder Tabelle alle Rechte einschließlich `TRUNCATE`, das RLS vollständig umgeht.

`npm run db:sicherheit` führt 45 benannte Nachweise, positiv und negativ, gegen den Development-Branch. Sie belegen unter anderem, dass sich kein Konto selbst befördert, kein Konto ein fremdes Profil ändert und kein angemeldetes Konto Zahlungsdaten sieht.

**Die Reisedaten fehlen noch.** Das Schema beschreibt zum überwiegenden Teil die alte Produktidee: 29 der 37 Tabellen sind ohne Verwendung im Anwendungscode. Sie sind eingeordnet und versioniert, aber nicht gelöscht; die Entfernung ist ein eigener Schritt vor dem Reise-Schema. Eine Tabelle für Reisen gibt es bis Phase 1.5 nicht – siehe Abschnitt 5.

---

## 7. API-Schicht

Nach Phase 1.1, 1.1b, 1.3 und 1.4 existieren **11** Route Handler. Zuvor waren es 77.

| Endpunkt | Zweck | Status |
| --- | --- | --- |
| `api/search/airports` | Flughafendaten | für Flüge in Phase 3 vorgesehen |
| `api/admin/payments/*` (5) | Zahlungen, Refunds, Webhooks | behalten ohne Priorität (ADR-0010) |
| `api/admin/security/*` (5) | Sicherheitsereignisse, IP-Sperren | für den späteren Admin-Umfang vorgesehen |

Alle zehn Endpunkte unter `api/admin` prüfen die Berechtigung über `requireAdminApi()`; `npm run check:api-schutz` erzwingt das in der CI. Lesende Endpunkte verlangen den Bereichszugang ab `moderator`, eingreifende (Rückerstattung, Sperren, Entsperren) mindestens `operator`.

Phase 1.4 hat drei weitere entfernt: `security/block-ip` und `security/unblock-ip` waren Doppelungen von `security/block` und `security/unblock` ohne Aufrufer, `security/overview` rief eine Funktion auf, die es nicht gab, und hatte ebenfalls keinen Aufrufer.

`app/auth/refresh` ist mit Phase 1.3 entfallen. Der Endpunkt sollte Sessions erneuern, konnte es aber nie: Sein Cookie-Adapter gab für jeden Namen `undefined` zurück und verwarf jedes Schreiben.

Entfernt wurden 63 Endpunkte: alle KI- und Modell-Endpunkte, die Media- und Video-Render-Pipeline, Creator-, Feed-, Session- und Publishing-Endpunkte, die Content-Endpunkte, die Infomaniak-DNS- und Mail-Automatisierung sowie mit Phase 1.1b die Alt-Suche `api/search`. Begründung und Umfang in [DECISIONS.md](DECISIONS.md), ADR-0014 und ADR-0018.

**Grundsatz für neue Endpunkte:** Kein Endpunkt ist standardmäßig offen. Die Prüfliste steht in [AGENTS.md](AGENTS.md) Regel 15.

### Kostenkontrolle bei Modellaufrufen

Es existiert **kein** Codepfad mehr, der ohne Nutzerinteraktion einen kostenpflichtigen Modellaufruf auslöst. Beseitigt wurden:

1. der Cron `/api/copilot/auto`, der täglich bis zu 24 DALL·E-3-Bilder erzeugte und dessen Secret-Prüfung fail-open war,
2. ein Generator-Aufruf im Server-Rendering von `app/search/page.tsx`, der bei jedem öffentlichen Aufruf mit `region`- oder `city`-Parameter eine DALL·E-3-Generierung auslöste – ohne Authentifizierung, Secret oder Rate Limit,
3. die gesamte Generierungskette (`copilot-upload-checker`, `copilot-upload-generator`, `copilot-image`) sowie der Block `maybeGenerateCopilotUpload`.

Mit Phase 1.1b ist zusätzlich `lib/openai/*` entfernt und das Paket `openai` deinstalliert. Es existiert damit **kein** Codepfad mehr zu einem kostenpflichtigen Modell, auch nicht über eine Nutzerhandlung. Der Setup-Check verlangt keinen `OPENAI_API_KEY` mehr.

---

## 8. Design-Architektur

Die V2-Markenfarben sind zentralisiert:

- `styles/globals.css` definiert die Markenpalette in sieben Familien (`brand`, `citrus`, `surface`, `line`, `ink`, `night`, `danger`) als RGB-Kanäle.
- Die semantischen shadcn-Namen (`--primary`, `--muted`, `--border` usw.) definieren keine eigenen Farben, sondern **verweisen** auf diese Palette. Damit gibt es je Farbe genau eine Quelle.
- `tailwind.config.js` mappt beide Gruppen über `rgb(var(--token) / <alpha-value>)`, damit Opacity-Modifier wie `bg-brand-600/10` und `bg-primary/10` funktionieren.
- Die UI-Dateien verwenden ausschließlich Tokens, keine Hex-Literale und keine Farben aus der Tailwind-Standardpalette.

Zuordnung und Begründung der semantischen Tokens: [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md), Abschnitt 3.

---

## 9. Build, CI und Deployment

- `npm run typecheck` – `tsc --noEmit`
- `npm run lint` – ESLint
- `npm run build` – Setup-Check und danach `next build`
- `npm run check:setup:ci` – Setup-Check mit Fail-Closed-Verhalten für CI
- `npm run check:schema-bezug` – jedes `.from()` und `.rpc()` gegen `types/supabase.ts`
- `.github/workflows/ci.yml` führt bei jedem Push auf `main` und bei jedem Pull Request aus: `npm ci`, Setup-Check, Typecheck, Lint, Tests, Schutz der Admin-API, Bezug auf das Schema, die drei Hygiene-Prüfungen und den Production-Build

Die datenbanknahen Prüfungen aus `scripts/db/` laufen nicht in der CI. Sie brauchen den Development-Zugang, und mehrere Läufe gegen denselben Branch würden dieselben Testkonten anlegen. Sie werden vor einer Zusammenführung von Hand ausgeführt; die Liste steht in [docs/DATENBANK.md](docs/DATENBANK.md), Abschnitt 9.

Deployment über Vercel (Projekt `jetnity-app`). `main` ist der stabile Integrationsbranch; größere Umbauten laufen über Feature-Branch und Preview. Ein Push auf `main` löst automatisch einen Production-Deploy aus.

**Erreichbarkeit (Stand 15. August 2026, verifiziert):**

| Adresse | Zustand |
| --- | --- |
| `jetnity-app.vercel.app` | öffentlich erreichbar, aktueller Production-Alias |
| Deployment-URLs (`jetnity-<hash>-…vercel.app`) | durch Vercel Deployment Protection geschützt, liefern die Vercel-Login-Seite |
| `jetnity.com` | **keine öffentliche DNS-Auflösung** |
| `jetnity.ch` | **keine öffentliche DNS-Auflösung** |

Die beiden Produktionsdomains aus [JETNITY_VISION.md](JETNITY_VISION.md) sind damit noch nicht mit dem Vercel-Projekt verbunden. Für die Entwicklung ist das unkritisch, für den Launch ist es eine Voraussetzung. Automatisierte Prüfungen der Produktion müssen bis dahin den Alias verwenden, nicht die Wunschdomain.

`vercel.json` enthält seit Phase 1.1 **keine** Cron-Jobs mehr. Die vier vorherigen Jobs zeigten ausschließlich auf Alt-Endpunkte und sind entfernt.

---

## 10. Observability

Aktuell nur Konsolen-Logging, kein zentrales Error-Tracking und keine strukturierte Log-Konvention. Ein Anbieter würde laufende Kosten verursachen und ist deshalb nicht ohne Freigabe eingeführt. Für die Launch-Reife ist eine kostengünstige Lösung vorgesehen (Backlog in [ROADMAP.md](ROADMAP.md)).

---

## 11. Bekannte technische Schulden

| Thema | Ausmaß | Einordnung |
| --- | --- | --- |
| ~~Fehlende Baseline-Migration~~ | ~~37 Tabellen ohne Versionierung~~ | in Phase 1.4 hergestellt, Wiederaufbau gemessen |
| ~~Zwei Supabase-Typdateien~~ | ~~37 vs. 3 Tabellen~~ | in Phase 1.2b zusammengeführt, seit 1.4 erzeugt statt gepflegt |
| ~~RLS-Zustand unbekannt~~ | ~~nicht aus dem Repo ableitbar~~ | in Phase 1.4 erhoben, neu aufgebaut und mit 45 Nachweisen belegt |
| Alt-Tabellen in der Datenbank | 29 von 37 ohne Verwendung im Code | eingeordnet in `docs/DATENBANK.md`; Entfernung als eigener Schritt vor dem Reise-Schema |
| Rolle liegt in `creator_profiles` | Tabelle der alten Produktidee | Phase 1.5; der Name steht nur an einer Stelle |
| Datenbanknahe Prüfungen laufen nicht in der CI | 5 Prüfungen von Hand | braucht einen kurzlebigen Branch je Lauf, sonst kollidieren die Testkonten |
| Tests ohne Reisedaten | 41 Tests, davon keiner zur Persistenz | Trip-Persistenz existiert noch nicht (Phase 1.5) |
| `any`-Verwendung | ca. 309 Vorkommen in `app/`, `lib/`, `components/`, `types/` | überwiegend in Alt-Code; nur V2-relevante Stellen werden bereinigt |
| ~~Middleware schützt nur einen Pfad~~ | ~~1 von vielen geschützten Bereichen~~ | in Phase 1.3 auf `/admin`, `/api/admin` und `/account` erweitert |
| ~~`admin_domains` im Schema~~ | ~~unbenutzt, widerspricht ADR-0027~~ | in Phase 1.4 entfernt, zusammen mit `app_admins` und `is_admin` |
| ~~Alt-Endpunkte ohne Kostenkontrolle~~ | ~~mehrere OpenAI-Endpunkte~~ | in Phase 1.1 durch Abschaltung gelöst |
| ~~Alt-Oberflächen ohne funktionierende Endpunkte~~ | ~~Media Studio, Creator Hub, Admin Copilot, Feed, Blog~~ | in Phase 1.1b entfernt (209 Dateien) |

Bewusste Entscheidung: `any`-Vorkommen und Sicherheitslücken in Alt-Code werden **nicht** aufwendig refactored, wenn der betroffene Code kurzfristig entfernt wird ([DECISIONS.md](DECISIONS.md), ADR-0006).
