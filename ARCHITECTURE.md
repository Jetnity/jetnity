# Jetnity – Architektur

Stand: 17. August 2026
Gültig für: Phase 1, Stand nach Einrichtung des Development-MCP

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
types/              Datenbank- und Domänentypen
supabase/migrations Datenbankschema (siehe Abschnitt 6 – aktuell unvollständig)
middleware.ts       Edge-Middleware
scripts/            Prüfungen, die in der CI laufen
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

**Einen Client mit Service-Role-Rechten gibt es derzeit nicht.** `lib/supabase/admin.ts` und der frühere `createAdminClient` sind in Phase 1.2b entfernt worden: Letzterer hängte einem Client mit vollen Rechten den mutierbaren Cookie-Adapter der Besucherin an. Ein solcher Zugang entsteht bewusst erst mit der Datenbank-Baseline in Phase 1.4 – ohne Sitzungsverwaltung und nur dort, wo Auth, Ownership und Eingabevalidierung im gleichen Codepfad geprüft werden ([AGENTS.md](AGENTS.md) Regel 14).

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

Diese Verbindung ist ein Entwicklerwerkzeug. Sie ersetzt weder die App-Clients aus Abschnitt 3 noch Service-Role-Zugriff in der Anwendung. Schemaänderungen über MCP sind erst nach explizitem Auftrag in Phase 1.4 zulässig.

Verifikation am 17. August 2026 gegen den offiziellen Remote-Server: Authentifizierung erfolgreich, genau die zehn Werkzeuge der drei Feature-Gruppen, Account-/Branching-/Functions-/Storage-Werkzeuge abwesend, Projekt-URL identisch mit `SUPABASE_PROJECT_REF`. `list_tables` lieferte 39 Tabellen in `public`. Es wurde keine Migration angewendet.

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

Die Entscheidung unterscheidet drei Zustände der Rollenabfrage: Rolle vorhanden, keine Rolle hinterlegt, Abfrage fehlgeschlagen. Ein Ausfall führt nie zu einer Freigabe. Reguläre Quelle ist die Datenbankrolle; `ADMIN_ALLOWED_EMAILS` ist ein Notzugang aus exakten Adressen, dessen Nutzung protokolliert wird. Eine Domain erteilt keine Berechtigung ([DECISIONS.md](DECISIONS.md) ADR-0027).

Weitere Punkte:

- Nach Anmeldung, Registrierung, OAuth-Callback und Passwortwechsel führt der Weg auf `/reisen` ([DECISIONS.md](DECISIONS.md), ADR-0019).
- Fehlen die Supabase-Umgebungsvariablen, sperrt die Middleware die geschützten Bereiche und protokolliert das. Bis Phase 1.3 liess sie in diesem Fall durch – ein Bereich, der bei fehlender Konfiguration aufgeht, ist das Gegenteil von Schutz.
- Server-Actions sind eigene Eintrittspunkte und werden von keinem Layout geschützt; sie prüfen selbst.
- Abmelden ist eine Server-Action, kein Pfad ([DECISIONS.md](DECISIONS.md), ADR-0023).

**Ist-Ziel-Abweichung:** Die Rolle liegt weiterhin in `creator_profiles`, der Tabelle der alten Produktidee. Der Tabellenname steht nur in `ROLE_TABLE` in `lib/auth/admin-guard.ts`; das generische Profil folgt mit der Datenbank-Baseline in Phase 1.4.

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

**Kritischer Ist-Zustand – keine belastbare Schema-Historie:**

- `supabase/migrations/` enthält 10 Dateien. Diese erzeugen lediglich zwei Tabellen (`creator_alert_rules`, `creator_alert_events`) sowie mehrere RPCs und Views aus der alten Creator-Analytics-Welt.
- Die generierten Typen in `types/supabase.ts` beschreiben dagegen **37 Tabellen**. Für den überwiegenden Teil des real existierenden Schemas gibt es also keine versionierte Migration.
- Eine Datei ist unversioniert benannt: `<timestamp>_realtime_creator_session_metrics.sql`.
- Es existieren **zwei konkurrierende Typdateien**: `types/supabase.ts` (37 Tabellen, von 11 Dateien importiert) und `types/supabase.types.ts` (3 Tabellen, von 3 Dateien importiert).

**Konsequenz:** Die Datenbank ist derzeit nicht reproduzierbar aufsetzbar. Eine vollständige Baseline-Migration und die Zusammenführung der Typdateien sind Voraussetzung für alles Weitere und in Phase 1 eingeplant.

RLS: Nur 2 der 10 Migrationen erwähnen Row Level Security. Der RLS-Zustand des produktiven Schemas ist aus dem Repository **nicht** nachvollziehbar und muss in Phase 1 erhoben, versioniert und getestet werden.

---

## 7. API-Schicht

Nach Phase 1.1, 1.1b und 1.3 existieren **14** Route Handler. Zuvor waren es 77.

| Endpunkt | Zweck | Status |
| --- | --- | --- |
| `api/search/airports` | Flughafendaten | für Flüge in Phase 3 vorgesehen |
| `api/admin/payments/*` (5) | Zahlungen, Refunds, Webhooks | behalten ohne Priorität (ADR-0010) |
| `api/admin/security/*` (8) | Sicherheitsereignisse, IP-Sperren | für den späteren Admin-Umfang vorgesehen |

Alle dreizehn Endpunkte unter `api/admin` prüfen die Berechtigung über `requireAdminApi()`; `npm run check:api-schutz` erzwingt das in der CI. Lesende Endpunkte verlangen den Bereichszugang ab `moderator`, eingreifende (Rückerstattung, Sperren, Entsperren) mindestens `operator`.

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
- `.github/workflows/ci.yml` führt bei jedem Push auf `main` und bei jedem Pull Request aus: `npm ci`, Setup-Check, Typecheck, Lint, Production-Build

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
| Fehlende Baseline-Migration | 37 Tabellen ohne Versionierung | Phase 1.4, blockierend – wartet auf den Development-Zugang |
| ~~Zwei Supabase-Typdateien~~ | ~~37 vs. 3 Tabellen~~ | in Phase 1.2b zusammengeführt |
| RLS-Zustand unbekannt | nicht aus dem Repo ableitbar | Phase 1.4, sicherheitsrelevant |
| Tests nur für Rollen und Berechtigungen | 34 Tests, ohne Datenbank | RLS- und Persistenztests brauchen den Zugang aus Phase 1.4 |
| `any`-Verwendung | ca. 309 Vorkommen in `app/`, `lib/`, `components/`, `types/` | überwiegend in Alt-Code; nur V2-relevante Stellen werden bereinigt |
| ~~Middleware schützt nur einen Pfad~~ | ~~1 von vielen geschützten Bereichen~~ | in Phase 1.3 auf `/admin`, `/api/admin` und `/account` erweitert |
| Rolle liegt in `creator_profiles` | Tabelle der alten Produktidee | Phase 1.4; der Name steht nur an einer Stelle |
| `admin_domains` im Schema | unbenutzt, widerspricht ADR-0027 | Phase 1.4, zu entfernen |
| ~~Alt-Endpunkte ohne Kostenkontrolle~~ | ~~mehrere OpenAI-Endpunkte~~ | in Phase 1.1 durch Abschaltung gelöst |
| ~~Alt-Oberflächen ohne funktionierende Endpunkte~~ | ~~Media Studio, Creator Hub, Admin Copilot, Feed, Blog~~ | in Phase 1.1b entfernt (209 Dateien) |
| Alt-Tabellen in der Datenbank | u. a. `creator_uploads`, `session_media`, `blog_posts` | Bereinigung mit der Baseline in Phase 1.4 |

Bewusste Entscheidung: `any`-Vorkommen und Sicherheitslücken in Alt-Code werden **nicht** aufwendig refactored, wenn der betroffene Code kurzfristig entfernt wird ([DECISIONS.md](DECISIONS.md), ADR-0006).
